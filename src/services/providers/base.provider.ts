/**
 * Base Data Provider Implementation
 */

import { DataSource, DataFreshness, ProviderStatus } from '../../types/index.ts';
import { IDataProvider, ProviderHealth } from './provider.interface.ts';
import { logger } from '../logger.ts';
import { dataQualityService } from '../validation/data-quality.service.ts';

export abstract class BaseDataProvider implements IDataProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly providerType: 'MARKET_DATA' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS' | 'MACRO';
  abstract readonly updateFrequencyMinutes: number;
  abstract readonly isOfficialLicense: boolean;
  abstract readonly isDemoFixtureOnly: boolean;

  protected status: ProviderStatus = 'UNCONFIGURED';
  protected lastSuccessfulSync?: string;
  protected lastAttempt?: string;
  protected lastError?: string;
  protected latencyMs?: number;
  protected recordsIngested: number = 0;
  protected legalNotice: string = '';
  protected supportedData: string[] = [];

  public getMetadata(): DataSource {
    return {
      id: this.id,
      name: this.name,
      providerType: this.providerType,
      status: this.status,
      supportedData: this.supportedData,
      updateFrequency: `${this.updateFrequencyMinutes}m`,
      lastSuccessfulUpdate: this.lastSuccessfulSync,
      lastError: this.lastError,
      sourceTimestamp: this.lastSuccessfulSync,
      dataFreshness: this.evaluateFreshness(),
      isOfficialLicense: this.isOfficialLicense,
      legalNotice: this.legalNotice,
      isDemoFixtureOnly: this.isDemoFixtureOnly
    };
  }

  public getHealth(): ProviderHealth {
    return {
      sourceId: this.id,
      sourceName: this.name,
      status: this.status,
      freshness: this.evaluateFreshness(),
      lastSuccessfulSync: this.lastSuccessfulSync,
      lastAttempt: this.lastAttempt,
      lastError: this.lastError,
      latencyMs: this.latencyMs,
      recordsIngested: this.recordsIngested
    };
  }

  public evaluateFreshness(): DataFreshness {
    if (this.status === 'OFFLINE' || this.status === 'UNCONFIGURED') {
      return 'UNAVAILABLE';
    }
    if (!this.lastSuccessfulSync) {
      return 'UNAVAILABLE';
    }

    const elapsedMinutes = (Date.now() - new Date(this.lastSuccessfulSync).getTime()) / (1000 * 60);

    if (elapsedMinutes <= 5) {
      return 'LIVE';
    } else if (elapsedMinutes <= 30) {
      return 'DELAYED';
    } else {
      return 'STALE';
    }
  }

  public abstract testConnection(): Promise<{ ok: boolean; message: string }>;

  protected recordSuccess(
    recordsCount: number,
    latencyMs: number,
    entityType: 'INTRADAY_PRICE' | 'PRICE_BAR' | 'MARKET_INDEX' | 'MARKET_BREADTH' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS' = 'INTRADAY_PRICE',
    sourceTimestamp?: string
  ): void {
    this.status = this.isDemoFixtureOnly ? 'DEMO_ONLY' : 'ONLINE';
    this.lastSuccessfulSync = new Date().toISOString();
    this.lastAttempt = this.lastSuccessfulSync;
    this.lastError = undefined;
    this.recordsIngested += recordsCount;
    this.latencyMs = latencyMs;
    logger.debug(this.name, `Successfully ingested ${recordsCount} records in ${latencyMs}ms`);

    dataQualityService.recordIngestion({
      sourceId: this.id,
      sourceName: this.name,
      entityType,
      recordsAttempted: recordsCount,
      recordsAccepted: recordsCount,
      recordsRejected: 0,
      fetchLatencyMs: latencyMs,
      sourceTimestamp: sourceTimestamp || this.lastSuccessfulSync,
      status: 'SUCCESS'
    });
  }

  protected recordFailure(
    error: Error | string,
    entityType: 'INTRADAY_PRICE' | 'PRICE_BAR' | 'MARKET_INDEX' | 'MARKET_BREADTH' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS' = 'INTRADAY_PRICE'
  ): void {
    const errorMsg = typeof error === 'string' ? error : error.message;
    this.status = 'DEGRADED';
    this.lastAttempt = new Date().toISOString();
    this.lastError = errorMsg;
    logger.warn(this.name, `Provider error: ${errorMsg}`);

    dataQualityService.recordIngestion({
      sourceId: this.id,
      sourceName: this.name,
      entityType,
      recordsAttempted: 0,
      recordsAccepted: 0,
      recordsRejected: 0,
      fetchLatencyMs: 0,
      status: 'FAILED',
      errorMessage: errorMsg
    });
  }
}
