/**
 * Nairobi Securities Exchange (NSE) Private Short-Term Trading Intelligence System
 * Core Data Models & Type Definitions
 * 
 * Strict Principle: Data Provenance, Distinguishing Observations vs Estimates vs Predictions.
 */

// ============================================================================
// Data Provenance & Quality Classifications
// ============================================================================

export type DataFreshness = 'LIVE' | 'DELAYED' | 'STALE' | 'UNAVAILABLE';

export type ObservationType = 
  | 'OBSERVED_FACT'        // Unmodified raw exchange trade / filing / published metric
  | 'CALCULATED_METRIC'    // Deterministic formula calculated from historical observations
  | 'ESTIMATE'             // Normalized or smoothed parameter
  | 'ASSUMPTION'           // User-defined or model baseline (e.g. slippage, transaction cost)
  | 'MODEL_PREDICTION';    // Statistical hypothesis with verifiable outcome condition

export type ProvenanceType = ObservationType;

export type ProviderStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNCONFIGURED' | 'DEMO_ONLY';

// ============================================================================
// Core Entities (Prompt Section 5)
// ============================================================================

export interface Exchange {
  id: string;
  code: string;           // 'NSE'
  name: string;           // 'Nairobi Securities Exchange'
  country: string;        // 'Kenya'
  currency: string;       // 'KES'
  timezone: string;       // 'Africa/Nairobi'
  tradingHoursStart: string; // '09:00:00'
  tradingHoursEnd: string;   // '15:00:00'
  settlementCycle: string;   // 'T+3' (historically moving to T+2)
  status: 'OPEN' | 'CLOSED' | 'PRE_OPEN' | 'HALTED';
  updatedAt: string;
}

export interface Sector {
  id: string;
  code: string;           // e.g. 'BANKING', 'TELECOM', 'MANUFACTURING', 'ENERGY', 'INSURANCE', 'INVESTMENT', 'COMMERCIAL', 'AGRICULTURAL'
  name: string;
  description: string;
  weightInIndexPct?: number;
  stockCount: number;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;           // e.g. 'SCOM', 'EQTY', 'KCB', 'EABL'
  isin: string;
  sectorId: string;
  sectorCode: string;
  incorporationCountry: string;
  fiscalYearEnd: string;
  sharesOutstanding: number;
  freeFloatPct?: number;
  websiteUrl?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  companyId: string;
  symbol: string;         // e.g. 'SCOM.NR' or 'SCOM'
  ticker: string;         // 'SCOM'
  lotSize: number;        // Typically 100 on NSE Main Investment Market
  priceTickSize: number;  // Typically 0.05 KSh for shares < 100 KSh
  isSuspended: boolean;
  listingSegment: 'MIMS' | 'AIMS' | 'FIMS' | 'GEMS'; // Main, Alternative, Fixed, Growth Enterprise
  marketCapKes: number;
  freeFloatShares?: number;
  currency: 'KES';
  dataSourceId: string;
  freshness: DataFreshness;
  lastUpdated: string;
}

export interface MarketIndex {
  id: string;
  symbol: string;         // 'NASI', 'NSE20', 'NSE25', 'NSE10'
  name: string;
  value: number;
  changeKes: number;
  changePct: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  turnoverKes: number;
  timestamp: string;
  provenance: ObservationType;
  freshness: DataFreshness;
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '1d' | '1w';

export interface PriceBar {
  id: string;
  stockId: string;
  symbol: string;
  timeframe: TimeFrame;
  timestamp: string;      // ISO string in EAT (UTC+3)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnoverKes: number;
  tradesCount?: number;
  vwap?: number;
  isCompleted: boolean;
  dataSourceId: string;
  provenance: ObservationType;
  freshness: DataFreshness;
}

export interface IntradayPrice {
  id: string;
  stockId: string;
  symbol: string;
  price: number;
  changeKes: number;
  changePct: number;
  bidPrice?: number;
  bidQuantity?: number;
  askPrice?: number;
  askQuantity?: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  dayVolume: number;
  dayTurnoverKes: number;
  lastTradeTimestamp: string;
  sourceTimestamp: string;
  ingestionTimestamp: string;
  freshness: DataFreshness;
  dataSourceId: string;
  provenance: ObservationType;
}

export interface VolumeData {
  id: string;
  stockId: string;
  symbol: string;
  timestamp: string;
  volume: number;
  turnoverKes: number;
  averageVolume20d: number;
  relativeVolume: number; // Volume / AvgVolume
  volumeSurgeScore: number; // 0 - 100
  institutionalParticipationScore?: number;
}

export interface MarketBreadth {
  id: string;
  timestamp: string;
  totalTradedStocks: number;
  advancingStocks: number;
  decliningStocks: number;
  unchangedStocks: number;
  advanceDeclineRatio: number;
  totalMarketTurnoverKes: number;
  totalMarketVolume: number;
  dealsCount?: number;
  new52WeekHighs: number;
  new52WeekLows: number;
  breadthThrustIndex?: number;
  freshness: DataFreshness;
  dataSourceId: string;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  ordersCount: number;
}

export interface OrderBookSnapshot {
  id: string;
  stockId: string;
  symbol: string;
  timestamp: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spreadKes: number;
  spreadBps: number;
  bidDepthTotal: number;
  askDepthTotal: number;
  orderBookImbalanceRatio: number; // (bids - asks) / (bids + asks)
  hasLegitimateSource: boolean;
  dataSourceId: string;
}

export interface FundamentalSnapshot {
  id: string;
  stockId: string;
  symbol: string;
  asOfDate: string;
  peRatio?: number;
  pbRatio?: number;
  dividendYieldPct?: number;
  epsKes?: number;
  bpsKes?: number;
  roePct?: number;
  debtToEquity?: number;
  currency: 'KES';
  isAudited: boolean;
  sourceFilingId?: string;
  updatedAt: string;
}

export interface FinancialStatement {
  id: string;
  companyId: string;
  fiscalYear: number;
  period: 'FY' | 'HY' | 'Q1' | 'Q3';
  filingDate: string;
  revenueKes: number;
  operatingProfitKes: number;
  profitAfterTaxKes: number;
  totalAssetsKes: number;
  totalLiabilitiesKes: number;
  equityKes: number;
  cashKes: number;
  auditorOpinion?: string;
  pdfUrl?: string;
  dataSourceId: string;
}

export interface CorporateAction {
  id: string;
  companyId: string;
  symbol: string;
  actionType: 'DIVIDEND' | 'RIGHTS_ISSUE' | 'BONUS_ISSUE' | 'STOCK_SPLIT' | 'REVERSE_SPLIT' | 'SHARE_BUYBACK';
  announcementDate: string;
  bookClosureDate?: string;
  recordDate?: string;
  paymentDate?: string;
  details: string;
  ratioOrAmountKes: number;
  status: 'ANNOUNCED' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';
  dataSourceId: string;
}

export interface DividendEvent {
  id: string;
  companyId: string;
  symbol: string;
  fiscalPeriod: string;
  type: 'INTERIM' | 'FINAL' | 'SPECIAL';
  dividendPerShareKes: number;
  announcementDate: string;
  bookClosureDate: string;
  paymentDate: string;
  withholdingTaxPct: number; // 5% for resident individuals, 15% for non-residents
  dataSourceId: string;
}

// ============================================================================
// News, Events & Sector Impact Models (Prompt Section 12 & 13)
// ============================================================================

export type NewsImpactCategory = 
  | 'INFORMATION'
  | 'LOW_IMPACT'
  | 'RELEVANT'
  | 'POTENTIALLY_MARKET_MOVING'
  | 'HIGH_IMPORTANCE';

export type EventTransmissionDirection = 'POSITIVE' | 'NEGATIVE' | 'MIXED' | 'NEUTRAL' | 'UNCERTAIN';

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  fullContent?: string;
  sourceName: string;     // 'CBK', 'CMA', 'National Treasury', 'NSE', 'Business Daily', 'Standard', 'Company Disclosure'
  sourceAuthorityType?: string;
  sourceUrl?: string;
  publishedAt: string;
  ingestedAt: string;
  classification: NewsImpactCategory;
  rawTags: string[];
  mentionedSymbols: string[];
  mentionedSectors: string[];
  isVerifiedFact: boolean;
  dataSourceId: string;
  freshness?: DataFreshness;
  provenance?: ObservationType;
}

export interface ExternalEvent {
  id: string;
  title: string;
  category: 'CBK_POLICY' | 'TAX_REGULATORY' | 'MACRO_ECONOMIC' | 'EXCHANGE_RATE' | 'COMMODITY' | 'GLOBAL_MARKETS' | 'POLITICAL';
  description: string;
  eventDate: string;
  sourceAuthority: string; // e.g. 'Central Bank of Kenya (CBK)', 'Kenya Revenue Authority (KRA)'
  transmissionMechanism: string; // e.g. "CBR benchmark hike -> rises commercial bank cost of funding -> asset repricing"
  potentialPressure: EventTransmissionDirection;
  confidenceScore: number; // 0.0 - 1.0
  isFact: boolean;
  interpretationNotes?: string;
  observedMarketReaction?: string;
  updatedAt: string;
}

export interface EventImpact {
  id: string;
  eventId: string;
  affectedTargetType: 'COMPANY' | 'SECTOR' | 'INDEX';
  targetId: string;
  targetSymbolOrCode: string;
  potentialPressure: EventTransmissionDirection;
  estimatedMagnitudePctMin?: number;
  estimatedMagnitudePctMax?: number;
  evidence: string;
  confidence: number;
  observedReactionKes?: number;
  observedReactionPct?: number;
  reactionWindowSessions?: number;
  provenance: ObservationType;
}

// ============================================================================
// Quantitative Snapshots & Regime States (Prompt Section 8 & 9)
// ============================================================================

export type MarketRegimeType = 
  | 'NORMAL'
  | 'EARLY_WEAKNESS'
  | 'RISK_RISING'
  | 'BROAD_SELLING'
  | 'EXTREME_SELLING'
  | 'STABILIZATION'
  | 'RECOVERY'
  | 'STRONG_MARKET';

export type StockRegimeType = 
  | 'HIGH_VOLATILITY'
  | 'ELEVATED_VOLATILITY'
  | 'NORMAL'
  | 'LOW_VOLATILITY'
  | 'CONSOLIDATION'
  | 'BREAKOUT'
  | 'BREAKDOWN'
  | 'RECOVERY';

export interface SectorSnapshot {
  id: string;
  sectorId: string;
  sectorCode: string;
  sectorName: string;
  timestamp: string;
  turnoverKes: number;
  turnoverSharePct: number;
  advancingCount: number;
  decliningCount: number;
  weightedPerformancePct: number;
  averageVolumeRatio: number;
  regime: MarketRegimeType;
  leadingSymbol?: string;
  laggingSymbol?: string;
}

export interface TechnicalSnapshot {
  id: string;
  stockId: string;
  symbol: string;
  timestamp: string;
  timeframe: string;
  lastPriceKes: number;
  changeKes: number;
  changePct: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema9?: number;
  ema21?: number;
  rsi14?: number;
  macd?: {
    line: number;
    signal: number;
    histogram: number;
  };
  atr14Kes: number;       // In absolute KSh per share
  atr14Pct: number;       // As % of current share price
  pullbackDepthKes: number;
  pullbackDepthPct: number;
  distanceFrom20dSmaPct: number;
  supportLevelKes?: number;
  resistanceLevelKes?: number;
  provenance: ObservationType;
}

export interface VolatilitySnapshot {
  id: string;
  stockId: string;
  symbol: string;
  timestamp: string;
  historicalVolatility20d: number;
  averageTrueRangeKes: number;
  normalizedAtrPct: number;
  volatilityExpansionRatio: number; // Current ATR / 60d ATR
  isAmacLikeCharacteristics: boolean; // Meaningful absolute KSh swings per share relative to transaction friction
  typicalDailyRangeKes: number;
  freshness: DataFreshness;
}

export interface MarketRegime {
  id: string;
  timestamp: string;
  state: MarketRegimeType;
  confidence: number;      // 0 - 100 based on weight of concurring evidence
  evidence: {
    indexMomentumScore: number;      // -100 to +100
    advanceDeclineScore: number;     // -100 to +100
    turnoverTrendScore: number;      // -100 to +100
    largeCapBreadthScore: number;    // -100 to +100
    sectorBreadthScore: number;      // -100 to +100
    volatilityRiskScore: number;     // 0 to 100
    recoveryStrengthScore: number;   // 0 to 100
  };
  keyDrivers: string[];
  whyStateChanged?: string;
  previousState?: MarketRegimeType;
  provenance: ObservationType;
  freshness?: DataFreshness;
}

export interface StockRegime {
  id: string;
  stockId: string;
  symbol: string;
  timestamp: string;
  state: StockRegimeType;
  reasoning: string;
  atrKes: number;
  relativeVolume: number;
  rangeCompressionScore: number;
  breakoutDistanceKes?: number;
  isNormalPullback: boolean;
  pullbackBenchmarkAtrMultiple?: number;
  whyStateChanged?: string;
  provenance: ObservationType;
}

// ============================================================================
// Statistical Predictions, Backtesting & Probabilities (Section 14 & 15)
// ============================================================================

export interface Prediction {
  id: string;
  assetSymbol: string;
  timestamp: string;
  setupName: string;
  setupCriteria: string;
  predictionHorizonSessions: number;
  targetCondition: string;        // e.g. "+5.0% or +1.50 KSh before -3.0% or -0.90 KSh"
  adverseCondition: string;       // Stop threshold
  targetGainPct: number;
  adverseRiskPct: number;
  targetGainKes: number;
  adverseRiskKes: number;
  calculatedProbability: number;  // 0.0 - 1.0 (from defined historical sample)
  historicalSampleSize: number;   // n count
  confidenceInterval95Pct?: [number, number];
  modelVersion: string;
  isEmpirical: boolean;          // true = calculated from historical sample, false = forbidden
  status: 'PENDING' | 'HIT_TARGET' | 'HIT_ADVERSE' | 'EXPIRED_TIME' | 'INVALIDATED';
  isDemoFixture?: boolean;
  statusNotice?: string;
  outcomeVerifiedAt?: string;
  realizedGainKes?: number;
  realizedGainPct?: number;
  holdingSessionsActual?: number;
}

export interface PredictionOutcome {
  predictionId: string;
  evaluatedAt: string;
  actualResult: 'WIN' | 'LOSS' | 'SCRATCH' | 'IN_PROGRESS';
  realizedMfeKes: number;
  realizedMaeKes: number;
  notes: string;
}

export interface BacktestRun {
  id: string;
  strategyName: string;
  testPeriodStart: string;
  testPeriodEnd: string;
  trainSplitPct: number;
  walkForwardSteps: number;
  assumedSlippageBps: number;
  assumedRoundTripCommissionPct: number; // Standard NSE ~1.85% total
  totalTrades: number;
  winRatePct: number;
  profitFactor: number;
  sharpeRatio?: number;
  maxDrawdownPct: number;
  expectancyKesPerTrade: number;
  hasLookAheadBiasSafeguards: boolean;
  createdAt: string;
}

export interface BacktestResult {
  runId: string;
  metricSummary: Record<string, number>;
  equityCurve: { date: string; equityKes: number; drawdownPct: number }[];
  tradeLog: {
    symbol: string;
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    shares: number;
    grossPlKes: number;
    feesKes: number;
    netPlKes: number;
    returnPct: number;
    exitReason: string;
  }[];
}

export interface ModelPerformance {
  modelVersion: string;
  strategyOrEngine: string;
  sampleCount: number;
  brierScore: number;            // Calibration metric
  accuracyPct: number;
  predictedVsActualByBucket: { bucketRange: string; predictedProb: number; actualHitRate: number }[];
  lastUpdated: string;
}

// ============================================================================
// Portfolio, Positions, Trades & Journal (Prompt Section 10)
// ============================================================================

export interface Portfolio {
  id: string;
  name: string;
  totalCashKes: number;
  investedValueKes: number;
  totalValueKes: number;
  dailyUnrealizedPlKes: number;
  dailyUnrealizedPlPct: number;
  totalUnrealizedPlKes: number;
  totalUnrealizedPlPct: number;
  peakPortfolioValueKes: number;
  maxDrawdownKes: number;
  maxDrawdownPct: number;
  openPositionsCount: number;
  updatedAt: string;
}

export interface PortfolioPosition {
  id: string;
  portfolioId: string;
  stockId: string;
  symbol: string;
  shares: number;
  averageEntryPrice: number;
  currentPrice: number;
  previousClosePrice: number;
  investedValueKes: number;      // shares * averageEntryPrice
  currentValueKes: number;       // shares * currentPrice
  grossUnrealizedPlKes: number;  // currentValueKes - investedValueKes
  percentagePl: number;          // ((currentPrice - entry) / entry) * 100
  kshMovementPerShare: number;   // currentPrice - averageEntryPrice
  peakUnrealizedPlKes: number;   // highest gross PL reached while open
  profitGivebackKes: number;     // peakUnrealizedPlKes - currentUnrealizedPlKes
  profitGivebackPct: number;     // (profitGivebackKes / peakUnrealizedPlKes) * 100 if peak > 0
  maximumAdverseExcursionKes: number; // worst unrealized loss during holding
  maximumFavorableExcursionKes: number;// best unrealized gain during holding
  holdingDurationDays: number;
  entryDate: string;
  notes?: string;
  targetPriceKes?: number;
  stopLossPriceKes?: number;
  pullbackRiskRating: 'LOW' | 'NORMAL' | 'ELEVATED' | 'HIGH_GIVEBACK_RISK';
  holdVsExitAssessment?: {
    recommendation: 'HOLD' | 'TRIM' | 'EXIT' | 'TIGHTEN_STOP';
    reasons: string[];
    evidenceMetrics: Record<string, number | string>;
  };
  freshness?: DataFreshness;
  provenance?: ObservationType;
  updatedAt: string;
}

export interface Trade {
  id: string;
  positionId?: string;
  symbol: string;
  tradeType: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  totalConsiderationKes: number;
  brokerFeeKes: number;
  nseCmaLeviesKes: number;
  totalCostKes: number;
  executedAt: string;
  executionMode: 'MANUAL_RECORDED';
  orderReference?: string;
  notes?: string;
}

export interface TradingJournalEntry {
  id: string;
  timestamp?: string;
  date?: string;
  symbol?: string;
  tradeId?: string;
  tradeType?: 'BUY' | 'SELL';
  title?: string;
  thesis?: string;
  setupRationale?: string;
  mentalState?: 'DISCIPLINED' | 'FOMO_TEMPTED' | 'HESITANT' | 'OVERCONFIDENT' | 'NEUTRAL';
  emotionalState?: 'DISCIPLINED' | 'CALM' | 'ANXIOUS' | 'FOMO' | 'REVENGE';
  adherenceToPlan?: boolean;
  followedPlan?: boolean;
  executionQualityRating?: number;
  marketRegimeAtTime?: MarketRegimeType;
  stockRegimeAtTime?: StockRegimeType;
  postTradeReview?: string;
  postTradeNotes?: string;
  lessonsLearned?: string;
}

// ============================================================================
// Alerts & Scanner Framework (Prompt Section 11 & 16)
// ============================================================================

export type AlertType = 
  | 'MARKET_RISK'
  | 'MARKET_RECOVERY'
  | 'STOCK_MOVEMENT'
  | 'STOCK_REGIME_CHANGE'
  | 'NEWS_EVENT'
  | 'EXTERNAL_RISK'
  | 'PORTFOLIO_RISK'
  | 'PROFIT_GIVEBACK'
  | 'OPPORTUNITY'
  | 'MISSED_OPPORTUNITY'
  | 'DATA_QUALITY';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  affectedAsset?: string;
  affectedSector?: string;
  reason: string;
  supportingMetrics: Record<string, number | string | boolean>;
  source: string;
  status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  isAcknowledged: boolean;
  acknowledgedAt?: string;
}

export type LiquidityClassification = 
  | 'VERY_LIQUID' 
  | 'LIQUID' 
  | 'MODERATE' 
  | 'THIN' 
  | 'VERY_THIN' 
  | 'UNAVAILABLE'
  | 'HIGH_LIQUIDITY'
  | 'MODERATE_LIQUIDITY'
  | 'LOW_LIQUIDITY'
  | 'ILLIQUID';

export interface LiquidityMetrics {
  dailyTurnoverKes: number;
  avg20DayTurnoverKes: number;
  turnoverRatio: number;
  relativeVolume: number;
  tradeCount?: number;
  avgTradeSizeKes?: number;
  spreadKes?: number;
  spreadBps?: number;
  daysToLiquidate: number;
  classification: LiquidityClassification;
  warningNote?: string;
}

export interface TradingCalendar {
  isMarketOpen: boolean;
  sessionPhase: 'PRE_OPEN' | 'CONTINUOUS_TRADING' | 'CLOSING_AUCTION' | 'CLOSED';
  nextOpen: string;
  nextClose: string;
  exchangeCode: string;
}

export type SetupType = 
  | 'BREAKOUT'
  | 'MOMENTUM_ACCELERATION'
  | 'HEALTHY_PULLBACK'
  | 'RECOVERY'
  | 'REVERSAL_WATCH'
  | 'VOLATILITY_EXPANSION'
  | 'CONSOLIDATION'
  | 'BREAKDOWN_RISK'
  | 'EXTENDED_MOVE'
  | 'NO_TRADE';

export interface ScannerCriteria {
  minKshMovementPerShare?: number;
  minPercentageChange?: number;
  minRelativeVolume?: number;
  minDailyTurnoverKes?: number;
  volatilityMode?: 'ANY' | 'ELEVATED_ONLY' | 'AMAC_LIKE_ONLY';
  regimesAllowed?: StockRegimeType[];
  allowBreakouts?: boolean;
  allowPullbacks?: boolean;
  allowRecoveries?: boolean;
  allowNoTrade?: boolean;
}

export interface ScannerCandidate {
  stockId: string;
  symbol: string;
  name: string;
  sector: string;
  currentPriceKes: number;
  changeKes: number;
  changePct: number;
  dailyVolume: number;
  dailyTurnoverKes: number;
  relativeVolume: number;
  atrKes: number;
  normalizedAtrPct: number;
  currentRegime: StockRegimeType;
  opportunityType: SetupType | 'RECOVERY_BOUNCE' | 'UNUSUAL_VOLUME';
  opportunityScore: number; // 0 - 100
  contextualRationale: string;
  riskNote: string;
  
  // Extended quantitative metrics
  kshMovementPerShare: number;
  percentageChange: number;
  affordableShares: number;
  grossOpportunityKes: number;
  estimatedTransactionCostsKes: number;
  estimatedNetOpportunityKes: number;
  netOpportunityKes?: number;
  netOpportunityPct?: number;
  estimatedRoundTripCostKes?: number;
  estimatedSlippageBps?: number;
  breakEvenPriceKes?: number;
  exitTurnoverRatio?: number;
  liquidityClassification: LiquidityClassification;
  supportLevelKes?: number;
  resistanceLevelKes?: number;
  distanceToSupportPct?: number;
  distanceToResistancePct?: number;
  pullbackDepthAtrMultiple?: number;
  scoreComponents?: {
    kshOpportunity: number;
    momentum: number;
    relativeVolume: number;
    volatilityExpansion: number;
    liquidity: number;
    priceStructure: number;
    penalties: number;
  };
  riskFlags: string[];
  isNoTrade: boolean;
  noTradeReasons?: string[];
  noTradeReason?: string;
  isDemoFixture?: boolean;

  provenance: ObservationType;
  freshness: DataFreshness;
}

// ============================================================================
// Data Sources & Quality Records (Section 4 & 6)
// ============================================================================

export interface DataSource {
  id: string;
  name: string;
  providerType: 'MARKET_DATA' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS' | 'MACRO';
  status: ProviderStatus;
  supportedData: string[];
  updateFrequency: string;
  lastSuccessfulUpdate?: string;
  lastError?: string;
  sourceTimestamp?: string;
  dataFreshness: DataFreshness;
  isOfficialLicense: boolean;
  legalNotice: string;
  isDemoFixtureOnly: boolean;
}

export type DataSourceConfig = DataSource;

export interface DataQualityRecord {
  id: string;
  sourceId: string;
  checkedAt: string;
  entityType: string;
  entityKey: string;
  issueType: 'MISSING_VALUES' | 'DUPLICATE_RECORD' | 'IMPOSSIBLE_PRICE' | 'NEGATIVE_VOLUME' | 'INVERTED_HIGH_LOW' | 'STALE_DATA' | 'ABNORMAL_GAP' | 'SPLIT_UNADJUSTED' | 'SCHEMA_VIOLATION' | 'TYPE_MISMATCH' | 'LATENCY_BREACH' | 'RANGE_ERROR';
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  details: string;
  rejected: boolean;
  resolved: boolean;
  entityId?: string;
  message?: string;
  timestamp?: string;
  isResolved?: boolean;
}

export type DataQualityIssue = DataQualityRecord;

export interface IngestionEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  entityType: 'INTRADAY_PRICE' | 'PRICE_BAR' | 'MARKET_INDEX' | 'MARKET_BREADTH' | 'NEWS' | 'FUNDAMENTALS' | 'CORPORATE_ACTIONS';
  recordsAttempted: number;
  recordsAccepted: number;
  recordsRejected: number;
  fetchLatencyMs: number;
  feedDelayMs?: number;
  sourceTimestamp?: string;
  ingestedAt: string;
  timestamp?: string;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errorMessage?: string;
}

export interface LatencyMetricSummary {
  sourceId: string;
  sourceName: string;
  entityType?: string;
  sampleCount: number;
  currentFetchLatencyMs: number;
  avgFetchLatencyMs: number;
  minFetchLatencyMs: number;
  maxFetchLatencyMs: number;
  p50FetchLatencyMs: number;
  p95FetchLatencyMs: number;
  currentFeedDelayMs?: number;
  avgFeedDelayMs?: number;
  slaThresholdMs: number;
  isSlaBreached: boolean;
  lastUpdated: string;
}

export interface DataQualitySummary {
  systemFreshness: DataFreshness;
  totalIngestions: number;
  totalRecordsAttempted: number;
  totalRecordsAccepted: number;
  totalRecordsRejected: number;
  schemaValidationPassRatePct: number;
  activeIssuesCount: number;
  criticalIssuesCount: number;
  recentIssues: DataQualityRecord[];
  recentIngestions: IngestionEvent[];
  latencies: LatencyMetricSummary[];
  latencySummaries?: LatencyMetricSummary[];
  avgLatencyMs?: number;
  isSlaBreached?: boolean;
  lastIngestionAt?: string;
  isDemoFixtureActive: boolean;
}

export interface FreshnessMeta {
  freshness: DataFreshness;
  sourceTimestamp: string;
  sourceId: string;
  dataQualityStatus: 'VALID' | 'DEGRADED' | 'UNVERIFIED';
  provenance: ProvenanceType;
  isDemoFixture: boolean;
  fetchLatencyMs?: number;
  feedDelayMs?: number;
}

// ============================================================================
// User Configuration (Prompt Section 18)
// ============================================================================

export interface UserSettings {
  id: string;
  tradingCapitalKes: number;
  preferredHoldingPeriod: 'INTRADAY' | 'SWING_1_3_DAYS' | 'SWING_1_2_WEEKS' | 'POSITIONAL';
  minimumKshShareOpportunity: number; // e.g. minimum 0.50 KSh movement worth trading
  minimumLiquidityDailyTurnoverKes: number; // e.g. 1,000,000 KSh to ensure exitability
  preferredVolatility: 'LOW' | 'MODERATE' | 'HIGH_VOLATILITY';
  maximumPositionSizeKes: number;
  maximumPortfolioAllocationPerStockPct: number;
  alertSensitivity: 'LOW' | 'BALANCED' | 'HIGH';
  monitoredSymbols: string[];
  profitGivebackWarningThresholdPct: number; // Alert if 30% of peak profit is surrendered
  isDemoDataAllowed: boolean; // Must be explicitly toggled by user for simulation/testing
  updatedAt: string;
}
