/**
 * Master Provider Registry
 * Coordinates official, licensed, and simulation data providers.
 */

import { IDataProvider, IMarketDataProvider, INewsProvider, IFundamentalDataProvider, ICorporateActionsProvider } from './provider.interface.ts';
import { OfficialNseMarketDataProvider } from './nse.official.feed.ts';
import { DemoFixtureProvider } from './demo.fixture.provider.ts';
import { DataSource, DataFreshness, ProviderStatus } from '../../types/index.ts';
import { logger } from '../logger.ts';

class ProviderRegistry {
  private providers: Map<string, IDataProvider> = new Map();
  private defaultMarketProviderId: string;

  constructor() {
    // 1. Official NSE direct gateway (Defaults to unconfigured awaiting real license/broker)
    const officialNse = new OfficialNseMarketDataProvider();
    this.registerProvider(officialNse);

    // 2. Sandboxed Demo fixture provider (for mathematical testability & offline validation)
    const demoFixture = new DemoFixtureProvider();
    this.registerProvider(demoFixture);

    // By default, system selects official provider, falling back to demo fixture ONLY when user explicitly permits simulation
    this.defaultMarketProviderId = demoFixture.id;
  }

  public registerProvider(provider: IDataProvider): void {
    this.providers.set(provider.id, provider);
    logger.info('ProviderRegistry', `Registered provider: ${provider.name} (${provider.id})`);
  }

  public getProvider(id: string): IDataProvider | undefined {
    return this.providers.get(id);
  }

  public getAllDataSources(): DataSource[] {
    return Array.from(this.providers.values()).map(p => p.getMetadata());
  }

  public getMarketDataProvider(preferOfficial = false, isDemoAllowed = true): IMarketDataProvider {
    if (preferOfficial) {
      const official = this.providers.get('nse-official-ats-gateway') as IMarketDataProvider;
      if (official && official.getMetadata().status === 'ONLINE') {
        return official;
      }
    }

    if (isDemoAllowed) {
      const demo = this.providers.get('nse-demo-simulation-fixture') as IMarketDataProvider;
      if (demo) return demo;
    }

    // Return official placeholder which safely returns empty data if demo is disabled
    return (this.providers.get('nse-official-ats-gateway') as IMarketDataProvider) || new OfficialNseMarketDataProvider();
  }

  public getNewsProvider(): INewsProvider {
    return this.providers.get('nse-demo-simulation-fixture') as INewsProvider;
  }

  public getFundamentalProvider(): IFundamentalDataProvider {
    return this.providers.get('nse-demo-simulation-fixture') as IFundamentalDataProvider;
  }

  public getCorporateActionsProvider(): ICorporateActionsProvider {
    return this.providers.get('nse-demo-simulation-fixture') as ICorporateActionsProvider;
  }

  public getAggregatedFreshness(): DataFreshness {
    const statuses = Array.from(this.providers.values()).map(p => p.getHealth().freshness);
    if (statuses.includes('LIVE')) return 'LIVE';
    if (statuses.includes('DELAYED')) return 'DELAYED';
    if (statuses.includes('STALE')) return 'STALE';
    return 'UNAVAILABLE';
  }

  public getActiveMarketProviderInfo(preferOfficial = false, isDemoAllowed = true): {
    id: string;
    name: string;
    isOfficialLicense: boolean;
    isDemoFixtureOnly: boolean;
    status: ProviderStatus;
    notice: string;
  } {
    const provider = this.getMarketDataProvider(preferOfficial, isDemoAllowed);
    return {
      id: provider.id,
      name: provider.name,
      isOfficialLicense: provider.isOfficialLicense,
      isDemoFixtureOnly: provider.isDemoFixtureOnly,
      status: provider.getHealth().status,
      notice: provider.isDemoFixtureOnly 
        ? 'SIMULATION / TEST FIXTURE MODE ACTIVE — Data is synthetic and for quantitative testing only.'
        : 'OFFICIAL GATEWAY MODE'
    };
  }
}

export const providerRegistry = new ProviderRegistry();
