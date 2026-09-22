/**
 * Master Data Quality, Ingestion Tracking & Latency SLA Service
 * 
 * Architectural Mandates:
 * 1. Tracks every data ingestion across all feeds with attempt/accept/reject counters.
 * 2. Schema validation engine: detects invalid prices, inverted extremes, crossed books, 
 *    schema violations, and missing fields before quantitative ingestion.
 * 3. Data latency metrics: tracks network fetch latency, source-to-terminal feed delay, 
 *    rolling p50/p95 percentiles, and SLA breaches.
 * 4. Ensures all data displayed across the system is strictly tagged with its 
 *    source freshness status (LIVE, DELAYED, STALE, UNAVAILABLE).
 */

import {
  PriceBar,
  IntradayPrice,
  MarketIndex,
  MarketBreadth,
  NewsArticle,
  FundamentalSnapshot,
  DataQualityRecord,
  IngestionEvent,
  LatencyMetricSummary,
  DataQualitySummary,
  FreshnessMeta,
  DataFreshness,
  ProvenanceType,
  ProviderStatus
} from '../../types/index.ts';
import { runCommand } from '../../db/database.ts';
import { logger } from '../logger.ts';

interface LatencySample {
  fetchLatencyMs: number;
  feedDelayMs?: number;
  timestamp: number;
}

export class DataQualityService {
  private inMemoryIssues: DataQualityRecord[] = [];
  private ingestionHistory: IngestionEvent[] = [];
  private latencySamplesBySource: Map<string, LatencySample[]> = new Map();
  private sourceMetadata: Map<string, { name: string; slaThresholdMs: number }> = new Map();

  // Aggregate counters
  private totalIngestionsCount = 0;
  private totalRecordsAttempted = 0;
  private totalRecordsAccepted = 0;
  private totalRecordsRejected = 0;
  private lastIngestionTimestamp?: string;

  constructor() {
    // Default known source configs
    this.sourceMetadata.set('nse-official-ats-gateway', {
      name: 'NSE Official Direct ATS / FIX Gateway',
      slaThresholdMs: 1500
    });
    this.sourceMetadata.set('nse-demo-simulation-fixture', {
      name: 'NSE Demo Simulation Fixture (Sandboxed)',
      slaThresholdMs: 3000
    });
    this.sourceMetadata.set('cma-regulatory-feed', {
      name: 'CMA Regulatory Filings Gateway',
      slaThresholdMs: 10000
    });
  }

  // ==========================================================================
  // 1. Schema Validation Engine
  // ==========================================================================

  /**
   * Validates an intraday trade quote
   */
  public validateIntradayPrice(quote: IntradayPrice): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!quote.symbol || quote.symbol.trim() === '') {
      issues.push('Missing symbol');
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol || 'UNKNOWN',
        issueType: 'MISSING_VALUES',
        severity: 'CRITICAL',
        details: 'Symbol is null or empty in intraday price quote',
        rejected: true
      });
    }

    if (quote.price <= 0) {
      issues.push(`Impossible trade price: ${quote.price} KSh (must be > 0)`);
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol,
        issueType: 'IMPOSSIBLE_PRICE',
        severity: 'CRITICAL',
        details: `Price is ${quote.price} KSh`,
        rejected: true
      });
    }

    if (quote.dayVolume < 0) {
      issues.push(`Negative volume: ${quote.dayVolume}`);
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol,
        issueType: 'NEGATIVE_VOLUME',
        severity: 'CRITICAL',
        details: `Day volume is negative: ${quote.dayVolume}`,
        rejected: true
      });
    }

    if (quote.dayHigh < quote.dayLow) {
      issues.push(`Inverted day extremes: High ${quote.dayHigh} < Low ${quote.dayLow}`);
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol,
        issueType: 'INVERTED_HIGH_LOW',
        severity: 'ERROR',
        details: `High (${quote.dayHigh}) is less than Low (${quote.dayLow})`,
        rejected: true
      });
    }

    if (quote.bidPrice && quote.askPrice && quote.bidPrice > quote.askPrice) {
      issues.push(`Crossed book detected: Bid ${quote.bidPrice} > Ask ${quote.askPrice}`);
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol,
        issueType: 'ABNORMAL_GAP',
        severity: 'WARNING',
        details: `Bid ${quote.bidPrice} > Ask ${quote.askPrice}`,
        rejected: false
      });
    }

    const tradeTime = new Date(quote.lastTradeTimestamp).getTime();
    const tenMinutesInFuture = Date.now() + 10 * 60 * 1000;
    if (tradeTime > tenMinutesInFuture) {
      issues.push(`Future trade timestamp: ${quote.lastTradeTimestamp}`);
      this.recordIssue({
        sourceId: quote.dataSourceId || 'unknown',
        entityType: 'INTRADAY_PRICE',
        entityKey: quote.symbol,
        issueType: 'STALE_DATA',
        severity: 'ERROR',
        details: `Timestamp is in the future: ${quote.lastTradeTimestamp}`,
        rejected: true
      });
    }

    const isFatal = issues.some(i => 
      i.includes('CRITICAL') || 
      i.includes('Impossible') || 
      i.includes('Negative') ||
      i.includes('Missing symbol') ||
      i.includes('Inverted')
    );

    return {
      isValid: !isFatal,
      issues
    };
  }

  /**
   * Validates a historical or live OHLCV price bar
   */
  public validatePriceBar(bar: PriceBar): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
      issues.push('Zero or negative price in OHLC bar');
      this.recordIssue({
        sourceId: bar.dataSourceId || 'unknown',
        entityType: 'PRICE_BAR',
        entityKey: `${bar.symbol}_${bar.timestamp}`,
        issueType: 'IMPOSSIBLE_PRICE',
        severity: 'CRITICAL',
        details: `O:${bar.open} H:${bar.high} L:${bar.low} C:${bar.close}`,
        rejected: true
      });
    }

    if (bar.high < bar.low) {
      issues.push(`High (${bar.high}) < Low (${bar.low})`);
      this.recordIssue({
        sourceId: bar.dataSourceId || 'unknown',
        entityType: 'PRICE_BAR',
        entityKey: `${bar.symbol}_${bar.timestamp}`,
        issueType: 'INVERTED_HIGH_LOW',
        severity: 'CRITICAL',
        details: `High (${bar.high}) < Low (${bar.low})`,
        rejected: true
      });
    }

    if (bar.open > bar.high || bar.open < bar.low) {
      issues.push(`Open (${bar.open}) outside [${bar.low}, ${bar.high}]`);
      this.recordIssue({
        sourceId: bar.dataSourceId || 'unknown',
        entityType: 'PRICE_BAR',
        entityKey: `${bar.symbol}_${bar.timestamp}`,
        issueType: 'IMPOSSIBLE_PRICE',
        severity: 'ERROR',
        details: `Open price (${bar.open}) out of range [${bar.low}, ${bar.high}]`,
        rejected: true
      });
    }

    if (bar.close > bar.high || bar.close < bar.low) {
      issues.push(`Close (${bar.close}) outside [${bar.low}, ${bar.high}]`);
      this.recordIssue({
        sourceId: bar.dataSourceId || 'unknown',
        entityType: 'PRICE_BAR',
        entityKey: `${bar.symbol}_${bar.timestamp}`,
        issueType: 'IMPOSSIBLE_PRICE',
        severity: 'ERROR',
        details: `Close price (${bar.close}) out of range [${bar.low}, ${bar.high}]`,
        rejected: true
      });
    }

    if (bar.volume < 0) {
      issues.push(`Negative volume: ${bar.volume}`);
      this.recordIssue({
        sourceId: bar.dataSourceId || 'unknown',
        entityType: 'PRICE_BAR',
        entityKey: `${bar.symbol}_${bar.timestamp}`,
        issueType: 'NEGATIVE_VOLUME',
        severity: 'CRITICAL',
        details: `Negative volume in bar: ${bar.volume}`,
        rejected: true
      });
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validates a market benchmark index
   */
  public validateMarketIndex(index: MarketIndex, sourceId = 'unknown'): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!index.symbol || !index.name) {
      issues.push('Missing index identifier or name');
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_INDEX',
        entityKey: index.symbol || 'UNKNOWN',
        issueType: 'MISSING_VALUES',
        severity: 'CRITICAL',
        details: 'Symbol or name is missing',
        rejected: true
      });
    }

    if (index.value <= 0) {
      issues.push(`Non-positive index value: ${index.value}`);
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_INDEX',
        entityKey: index.symbol,
        issueType: 'IMPOSSIBLE_PRICE',
        severity: 'CRITICAL',
        details: `Index value must be > 0, received ${index.value}`,
        rejected: true
      });
    }

    if (index.high && index.low && index.high < index.low) {
      issues.push(`Index high (${index.high}) < low (${index.low})`);
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_INDEX',
        entityKey: index.symbol,
        issueType: 'INVERTED_HIGH_LOW',
        severity: 'ERROR',
        details: `High ${index.high} < Low ${index.low}`,
        rejected: true
      });
    }

    if (Math.abs(index.changePct) > 50) {
      issues.push(`Abnormal index move detected: ${index.changePct}%`);
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_INDEX',
        entityKey: index.symbol,
        issueType: 'ABNORMAL_GAP',
        severity: 'WARNING',
        details: `Move of ${index.changePct}% exceeds typical single-day threshold`,
        rejected: false
      });
    }

    return {
      isValid: issues.filter(i => i.includes('CRITICAL') || i.includes('Non-positive')).length === 0,
      issues
    };
  }

  /**
   * Validates market breadth aggregate data
   */
  public validateMarketBreadth(breadth: MarketBreadth, sourceId = 'unknown'): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (breadth.advancingStocks < 0 || breadth.decliningStocks < 0 || breadth.unchangedStocks < 0) {
      issues.push('Negative stock count in advance/decline stats');
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_BREADTH',
        entityKey: 'NSE_BREADTH',
        issueType: 'RANGE_ERROR',
        severity: 'CRITICAL',
        details: `Adv: ${breadth.advancingStocks}, Dec: ${breadth.decliningStocks}, Unch: ${breadth.unchangedStocks}`,
        rejected: true
      });
    }

    if (breadth.totalMarketTurnoverKes < 0) {
      issues.push('Negative market turnover');
      this.recordIssue({
        sourceId,
        entityType: 'MARKET_BREADTH',
        entityKey: 'NSE_BREADTH',
        issueType: 'NEGATIVE_VOLUME',
        severity: 'CRITICAL',
        details: `Turnover is ${breadth.totalMarketTurnoverKes} KSh`,
        rejected: true
      });
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validates a news article schema
   */
  public validateNewsArticle(article: NewsArticle, sourceId = 'unknown'): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!article.headline || article.headline.trim().length < 5) {
      issues.push('News headline is empty or unreasonably short');
      this.recordIssue({
        sourceId,
        entityType: 'NEWS',
        entityKey: article.id || 'UNKNOWN',
        issueType: 'SCHEMA_VIOLATION',
        severity: 'ERROR',
        details: 'Headline missing or too short',
        rejected: true
      });
    }

    if (!article.sourceName) {
      issues.push('News source attribution is missing');
      this.recordIssue({
        sourceId,
        entityType: 'NEWS',
        entityKey: article.id,
        issueType: 'MISSING_VALUES',
        severity: 'WARNING',
        details: 'Missing source publication name',
        rejected: false
      });
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // ==========================================================================
  // 2. Ingestion Tracking
  // ==========================================================================

  /**
   * Records an ingestion batch attempt, tracking acceptance, rejection, and timing
   */
  public recordIngestion(eventData: Omit<IngestionEvent, 'id' | 'ingestedAt'>): IngestionEvent {
    const event: IngestionEvent = {
      id: `ing-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ingestedAt: new Date().toISOString(),
      ...eventData
    };

    this.ingestionHistory.unshift(event);
    if (this.ingestionHistory.length > 200) {
      this.ingestionHistory.pop();
    }

    // Update aggregate counters
    this.totalIngestionsCount++;
    this.totalRecordsAttempted += event.recordsAttempted;
    this.totalRecordsAccepted += event.recordsAccepted;
    this.totalRecordsRejected += event.recordsRejected;
    this.lastIngestionTimestamp = event.ingestedAt;

    // Record latency metrics
    this.recordLatency(
      event.sourceId,
      event.sourceName,
      event.entityType,
      event.fetchLatencyMs,
      event.sourceTimestamp
    );

    // Persist to database asynchronously
    runCommand(
      `INSERT INTO ingestion_events (id, source_id, source_name, entity_type, records_attempted, records_accepted, records_rejected, fetch_latency_ms, feed_delay_ms, source_timestamp, ingested_at, status, error_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.sourceId,
        event.sourceName,
        event.entityType,
        event.recordsAttempted,
        event.recordsAccepted,
        event.recordsRejected,
        event.fetchLatencyMs,
        event.feedDelayMs || null,
        event.sourceTimestamp || null,
        event.ingestedAt,
        event.status,
        event.errorMessage || null
      ]
    ).catch(err => {
      logger.debug('DataQuality', 'Asynchronous ingestion record save ignored', err);
    });

    logger.debug(
      'DataQuality',
      `[INGESTION] ${event.sourceName} - ${event.entityType}: ${event.recordsAccepted}/${event.recordsAttempted} accepted in ${event.fetchLatencyMs}ms (${event.status})`
    );

    return event;
  }

  public getRecentIngestions(limit = 30): IngestionEvent[] {
    return this.ingestionHistory.slice(0, limit);
  }

  // ==========================================================================
  // 3. Data Latency Metrics
  // ==========================================================================

  /**
   * Tracks fetch latency and feed delay, computing rolling metrics and checking SLAs
   */
  public recordLatency(
    sourceId: string,
    sourceName: string,
    entityType: string,
    fetchLatencyMs: number,
    sourceTimestamp?: string
  ): LatencyMetricSummary {
    let feedDelayMs: number | undefined = undefined;
    if (sourceTimestamp) {
      const sourceTime = new Date(sourceTimestamp).getTime();
      if (!isNaN(sourceTime)) {
        feedDelayMs = Math.max(0, Date.now() - sourceTime);
      }
    }

    if (!this.latencySamplesBySource.has(sourceId)) {
      this.latencySamplesBySource.set(sourceId, []);
    }

    const samples = this.latencySamplesBySource.get(sourceId)!;
    samples.unshift({
      fetchLatencyMs,
      feedDelayMs,
      timestamp: Date.now()
    });

    if (samples.length > 50) {
      samples.pop();
    }

    // Keep source metadata updated
    if (!this.sourceMetadata.has(sourceId)) {
      this.sourceMetadata.set(sourceId, {
        name: sourceName,
        slaThresholdMs: 2500
      });
    }

    const config = this.sourceMetadata.get(sourceId)!;
    const isBreached = fetchLatencyMs > config.slaThresholdMs;

    if (isBreached) {
      this.recordIssue({
        sourceId,
        entityType,
        entityKey: `${sourceId}_latency`,
        issueType: 'LATENCY_BREACH',
        severity: 'WARNING',
        details: `Fetch latency of ${fetchLatencyMs}ms exceeded SLA threshold of ${config.slaThresholdMs}ms`,
        rejected: false
      });
    }

    // Asynchronous db persistence
    runCommand(
      `INSERT INTO data_latency_metrics (id, source_id, entity_type, fetch_latency_ms, feed_delay_ms, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `lat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceId,
        entityType,
        fetchLatencyMs,
        feedDelayMs || null,
        new Date().toISOString()
      ]
    ).catch(() => {});

    return this.calculateLatencySummaryForSource(sourceId, entityType);
  }

  private calculateLatencySummaryForSource(sourceId: string, entityType?: string): LatencyMetricSummary {
    const samples = this.latencySamplesBySource.get(sourceId) || [];
    const meta = this.sourceMetadata.get(sourceId) || {
      name: sourceId,
      slaThresholdMs: 2500
    };

    if (samples.length === 0) {
      return {
        sourceId,
        sourceName: meta.name,
        entityType,
        sampleCount: 0,
        currentFetchLatencyMs: 0,
        avgFetchLatencyMs: 0,
        minFetchLatencyMs: 0,
        maxFetchLatencyMs: 0,
        p50FetchLatencyMs: 0,
        p95FetchLatencyMs: 0,
        slaThresholdMs: meta.slaThresholdMs,
        isSlaBreached: false,
        lastUpdated: new Date().toISOString()
      };
    }

    const fetchValues = samples.map(s => s.fetchLatencyMs).sort((a, b) => a - b);
    const feedDelayValues = samples
      .filter(s => s.feedDelayMs !== undefined)
      .map(s => s.feedDelayMs!);

    const sumFetch = fetchValues.reduce((a, b) => a + b, 0);
    const avgFetch = Math.round(sumFetch / fetchValues.length);
    const minFetch = fetchValues[0];
    const maxFetch = fetchValues[fetchValues.length - 1];
    
    const p50Index = Math.floor(fetchValues.length * 0.5);
    const p95Index = Math.min(fetchValues.length - 1, Math.floor(fetchValues.length * 0.95));
    const p50Fetch = fetchValues[p50Index];
    const p95Fetch = fetchValues[p95Index];

    const currentSample = samples[0];
    const avgFeedDelay = feedDelayValues.length > 0
      ? Math.round(feedDelayValues.reduce((a, b) => a + b, 0) / feedDelayValues.length)
      : undefined;

    return {
      sourceId,
      sourceName: meta.name,
      entityType,
      sampleCount: samples.length,
      currentFetchLatencyMs: currentSample.fetchLatencyMs,
      avgFetchLatencyMs: avgFetch,
      minFetchLatencyMs: minFetch,
      maxFetchLatencyMs: maxFetch,
      p50FetchLatencyMs: p50Fetch,
      p95FetchLatencyMs: p95Fetch,
      currentFeedDelayMs: currentSample.feedDelayMs,
      avgFeedDelayMs: avgFeedDelay,
      slaThresholdMs: meta.slaThresholdMs,
      isSlaBreached: currentSample.fetchLatencyMs > meta.slaThresholdMs,
      lastUpdated: new Date(currentSample.timestamp).toISOString()
    };
  }

  public getAllLatencySummaries(): LatencyMetricSummary[] {
    const results: LatencyMetricSummary[] = [];
    for (const sourceId of this.sourceMetadata.keys()) {
      results.push(this.calculateLatencySummaryForSource(sourceId));
    }
    return results;
  }

  // ==========================================================================
  // 4. Source Freshness Tagging & Governance
  // ==========================================================================

  /**
   * Evaluates freshness status based on source age, latency, and provider state
   */
  public evaluateFreshness(
    sourceTimestamp?: string,
    lastSyncTimestamp?: string,
    providerStatus?: ProviderStatus,
    isOfficialLicense = false
  ): DataFreshness {
    if (providerStatus === 'OFFLINE' || providerStatus === 'UNCONFIGURED') {
      return 'UNAVAILABLE';
    }

    const timestampToCheck = sourceTimestamp || lastSyncTimestamp;
    if (!timestampToCheck) {
      return 'UNAVAILABLE';
    }

    const timeMs = new Date(timestampToCheck).getTime();
    if (isNaN(timeMs)) {
      return 'UNAVAILABLE';
    }

    const elapsedMinutes = (Date.now() - timeMs) / (1000 * 60);

    // Strict freshness boundaries
    if (elapsedMinutes <= 5) {
      return 'LIVE';
    } else if (elapsedMinutes <= 30) {
      return 'DELAYED';
    } else {
      return 'STALE';
    }
  }

  /**
   * Tags a payload entity with mandatory provenance, freshness, and quality indicators
   */
  public tagEntityWithFreshness<T extends object>(
    entity: T,
    options: {
      sourceId: string;
      sourceTimestamp?: string;
      isOfficialLicense?: boolean;
      isDemoFixture?: boolean;
      provenance?: ProvenanceType;
      fetchLatencyMs?: number;
      feedDelayMs?: number;
    }
  ): T & FreshnessMeta {
    const freshness = this.evaluateFreshness(
      options.sourceTimestamp,
      undefined,
      options.isDemoFixture ? 'DEMO_ONLY' : 'ONLINE',
      options.isOfficialLicense
    );

    const meta: FreshnessMeta = {
      freshness,
      sourceTimestamp: options.sourceTimestamp || new Date().toISOString(),
      sourceId: options.sourceId,
      dataQualityStatus: 'VALID',
      provenance: options.provenance || (options.isDemoFixture ? 'ESTIMATE' : 'OBSERVED_FACT'),
      isDemoFixture: Boolean(options.isDemoFixture),
      fetchLatencyMs: options.fetchLatencyMs,
      feedDelayMs: options.feedDelayMs
    };

    return {
      ...entity,
      ...meta
    };
  }

  /**
   * Tags an array of entities with freshness
   */
  public tagCollectionWithFreshness<T extends object>(
    entities: T[],
    options: {
      sourceId: string;
      sourceTimestamp?: string;
      isOfficialLicense?: boolean;
      isDemoFixture?: boolean;
      provenance?: ProvenanceType;
      fetchLatencyMs?: number;
    }
  ): (T & FreshnessMeta)[] {
    return entities.map(entity => this.tagEntityWithFreshness(entity, options));
  }

  // ==========================================================================
  // 5. Issue Tracking & Auditing
  // ==========================================================================

  public recordIssue(issue: Omit<DataQualityRecord, 'id' | 'checkedAt' | 'resolved'>): DataQualityRecord {
    const record: DataQualityRecord = {
      id: `dq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      checkedAt: new Date().toISOString(),
      resolved: false,
      ...issue
    };

    this.inMemoryIssues.unshift(record);
    if (this.inMemoryIssues.length > 500) {
      this.inMemoryIssues.pop();
    }

    logger.warn('DataQuality', `[${record.severity}] ${record.entityType} ${record.entityKey}: ${record.details}`);

    // Persist asynchronously to database
    runCommand(
      `INSERT INTO data_quality_records (id, source_id, checked_at, entity_type, entity_key, issue_type, severity, details, rejected, resolved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.sourceId,
        record.checkedAt,
        record.entityType,
        record.entityKey,
        record.issueType,
        record.severity,
        record.details,
        record.rejected ? 1 : 0,
        0
      ]
    ).catch(err => {
      logger.error('DataQuality', 'Failed to persist data quality record', err);
    });

    return record;
  }

  public getRecentIssues(limit = 50, filters?: { severity?: string; entityType?: string; resolved?: boolean }): DataQualityRecord[] {
    let filtered = this.inMemoryIssues;
    if (filters) {
      if (filters.severity) filtered = filtered.filter(i => i.severity === filters.severity);
      if (filters.entityType) filtered = filtered.filter(i => i.entityType === filters.entityType);
      if (filters.resolved !== undefined) filtered = filtered.filter(i => i.resolved === filters.resolved);
    }
    return filtered.slice(0, limit);
  }

  public resolveIssue(issueId: string): boolean {
    const issue = this.inMemoryIssues.find(i => i.id === issueId);
    if (issue) {
      issue.resolved = true;
      runCommand(`UPDATE data_quality_records SET resolved = 1 WHERE id = ?`, [issueId]).catch(() => {});
      return true;
    }
    return false;
  }

  // ==========================================================================
  // 6. Unified Data Quality Summary for Dashboard & Monitoring
  // ==========================================================================

  public getDataQualitySummary(systemFreshness: DataFreshness = 'LIVE', isDemoFixtureActive = true): DataQualitySummary {
    const totalAttempted = this.totalRecordsAttempted;
    const totalAccepted = this.totalRecordsAccepted;
    const passRate = totalAttempted > 0 
      ? Number(((totalAccepted / totalAttempted) * 100).toFixed(2)) 
      : 100.0;

    const activeIssues = this.inMemoryIssues.filter(i => !i.resolved);
    const criticalIssues = activeIssues.filter(i => i.severity === 'CRITICAL');

    return {
      systemFreshness,
      totalIngestions: this.totalIngestionsCount,
      totalRecordsAttempted: this.totalRecordsAttempted,
      totalRecordsAccepted: this.totalRecordsAccepted,
      totalRecordsRejected: this.totalRecordsRejected,
      schemaValidationPassRatePct: passRate,
      activeIssuesCount: activeIssues.length,
      criticalIssuesCount: criticalIssues.length,
      recentIssues: this.getRecentIssues(20),
      recentIngestions: this.getRecentIngestions(15),
      latencies: this.getAllLatencySummaries(),
      lastIngestionAt: this.lastIngestionTimestamp,
      isDemoFixtureActive
    };
  }
}

export const dataQualityService = new DataQualityService();
