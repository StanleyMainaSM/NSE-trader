/**
 * Data Quality Service & Freshness Governance Test Suite
 * Validates ingestion tracking, schema failure logging, latency metrics, and freshness tagging.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DataQualityService } from '../services/validation/data-quality.service.ts';
import { IntradayPrice, PriceBar, MarketIndex, MarketBreadth, NewsArticle } from '../types/index.ts';

describe('DataQualityService - Ingestion Tracking', () => {
  let dq: DataQualityService;

  beforeEach(() => {
    dq = new DataQualityService();
  });

  it('records successful ingestion batches and updates statistics', () => {
    const event = dq.recordIngestion({
      sourceId: 'nse-demo-simulation-fixture',
      sourceName: 'Demo Simulation Fixture',
      entityType: 'INTRADAY_PRICE',
      recordsAttempted: 50,
      recordsAccepted: 48,
      recordsRejected: 2,
      fetchLatencyMs: 45,
      sourceTimestamp: new Date().toISOString(),
      status: 'PARTIAL'
    });

    expect(event.id).toBeDefined();
    expect(event.recordsAttempted).toBe(50);
    expect(event.recordsAccepted).toBe(48);
    expect(event.recordsRejected).toBe(2);

    const summary = dq.getDataQualitySummary('LIVE', true);
    expect(summary.totalIngestions).toBe(1);
    expect(summary.totalRecordsAttempted).toBe(50);
    expect(summary.totalRecordsAccepted).toBe(48);
    expect(summary.totalRecordsRejected).toBe(2);
    expect(summary.schemaValidationPassRatePct).toBe(96.0);
    expect(summary.recentIngestions.length).toBe(1);
  });
});

describe('DataQualityService - Schema Validation Failures', () => {
  let dq: DataQualityService;

  beforeEach(() => {
    dq = new DataQualityService();
  });

  it('detects and logs schema violations in market indices', () => {
    const invalidIndex: MarketIndex = {
      id: 'idx-test',
      symbol: 'TEST',
      name: 'Test Index',
      value: -100, // Invalid negative value!
      changeKes: 0,
      changePct: 0,
      previousClose: 100,
      high: 90,
      low: 95, // Inverted high/low!
      volume: 1000,
      turnoverKes: 10000,
      timestamp: new Date().toISOString(),
      provenance: 'ESTIMATE',
      freshness: 'LIVE'
    };

    const res = dq.validateMarketIndex(invalidIndex, 'test-source');
    expect(res.isValid).toBe(false);
    expect(res.issues.length).toBeGreaterThan(0);

    const recentIssues = dq.getRecentIssues(10);
    expect(recentIssues.some(i => i.entityType === 'MARKET_INDEX' && i.issueType === 'IMPOSSIBLE_PRICE')).toBe(true);
    expect(recentIssues.some(i => i.issueType === 'INVERTED_HIGH_LOW')).toBe(true);
  });

  it('detects negative volume and counts in market breadth', () => {
    const invalidBreadth: MarketBreadth = {
      id: 'breadth-test',
      timestamp: new Date().toISOString(),
      advancingStocks: -2, // Negative advancers!
      decliningStocks: 10,
      unchangedStocks: 5,
      totalTradedStocks: 13,
      advanceDeclineRatio: 0.2,
      totalMarketVolume: -5000,
      totalMarketTurnoverKes: -100000, // Negative turnover!
      new52WeekHighs: 0,
      new52WeekLows: 0,
      dataSourceId: 'test-source',
      freshness: 'LIVE'
    };

    const res = dq.validateMarketBreadth(invalidBreadth, 'test-source');
    expect(res.isValid).toBe(false);

    const issues = dq.getRecentIssues(5);
    expect(issues.some(i => i.entityType === 'MARKET_BREADTH')).toBe(true);
  });

  it('detects malformed news headlines', () => {
    const badNews: NewsArticle = {
      id: 'news-1',
      headline: 'Hi', // too short (< 5 chars)
      summary: 'Some summary',
      publishedAt: new Date().toISOString(),
      ingestedAt: new Date().toISOString(),
      sourceName: '', // empty source!
      sourceUrl: 'https://example.com',
      classification: 'INFORMATION',
      mentionedSymbols: ['SCOM'],
      mentionedSectors: [],
      rawTags: [],
      isVerifiedFact: true,
      dataSourceId: 'news-source',
      provenance: 'OBSERVED_FACT',
      freshness: 'LIVE'
    };

    const res = dq.validateNewsArticle(badNews, 'news-source');
    expect(res.isValid).toBe(false);
  });
});

describe('DataQualityService - Latency Metrics & SLA Breaches', () => {
  let dq: DataQualityService;

  beforeEach(() => {
    dq = new DataQualityService();
  });

  it('computes rolling latency statistics and percentile calculations', () => {
    const sourceId = 'nse-official-ats-gateway';
    const sourceName = 'NSE Official Direct ATS / FIX Gateway';

    // Record sample latencies
    dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 30);
    dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 40);
    dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 50);
    dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 60);
    const summary = dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 70);

    expect(summary.sampleCount).toBe(5);
    expect(summary.minFetchLatencyMs).toBe(30);
    expect(summary.maxFetchLatencyMs).toBe(70);
    expect(summary.avgFetchLatencyMs).toBe(50);
    expect(summary.p50FetchLatencyMs).toBe(50);
    expect(summary.isSlaBreached).toBe(false);
  });

  it('detects latency SLA breach when fetch exceeds threshold', () => {
    const sourceId = 'nse-official-ats-gateway';
    const sourceName = 'NSE Official Direct ATS / FIX Gateway';

    // Threshold for official is 1500ms
    const summary = dq.recordLatency(sourceId, sourceName, 'INTRADAY_PRICE', 2800);

    expect(summary.isSlaBreached).toBe(true);
    const issues = dq.getRecentIssues(5);
    expect(issues.some(i => i.issueType === 'LATENCY_BREACH')).toBe(true);
  });
});

describe('DataQualityService - Freshness Tagging & Governance', () => {
  let dq: DataQualityService;

  beforeEach(() => {
    dq = new DataQualityService();
  });

  it('correctly classifies data freshness based on age thresholds', () => {
    const now = Date.now();
    const twoMinutesAgo = new Date(now - 2 * 60 * 1000).toISOString();
    const twentyMinutesAgo = new Date(now - 20 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now - 120 * 60 * 1000).toISOString();

    expect(dq.evaluateFreshness(twoMinutesAgo, undefined, 'ONLINE')).toBe('LIVE');
    expect(dq.evaluateFreshness(twentyMinutesAgo, undefined, 'ONLINE')).toBe('DELAYED');
    expect(dq.evaluateFreshness(twoHoursAgo, undefined, 'ONLINE')).toBe('STALE');
    expect(dq.evaluateFreshness(twoMinutesAgo, undefined, 'OFFLINE')).toBe('UNAVAILABLE');
    expect(dq.evaluateFreshness(undefined, undefined, 'ONLINE')).toBe('UNAVAILABLE');
  });

  it('tags entities with complete provenance and freshness metadata', () => {
    const rawQuote = {
      symbol: 'SCOM',
      price: 15.65,
      dayVolume: 1200000
    };

    const tagged = dq.tagEntityWithFreshness(rawQuote, {
      sourceId: 'nse-demo-simulation-fixture',
      sourceTimestamp: new Date().toISOString(),
      isDemoFixture: true,
      fetchLatencyMs: 38
    });

    expect(tagged.symbol).toBe('SCOM');
    expect(tagged.freshness).toBe('LIVE');
    expect(tagged.dataQualityStatus).toBe('VALID');
    expect(tagged.provenance).toBe('ESTIMATE');
    expect(tagged.isDemoFixture).toBe(true);
    expect(tagged.fetchLatencyMs).toBe(38);
  });
});
