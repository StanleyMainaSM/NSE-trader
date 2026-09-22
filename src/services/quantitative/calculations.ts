/**
 * Deterministic Financial Calculations Engine
 * 
 * Strict Principle:
 * - Deterministic, pure mathematical functions with zero stochastic randomness.
 * - Testable and free from look-ahead bias.
 * - Precision handling for Kenyan Shillings (KSh) and basis points.
 */

// ============================================================================
// 1. Price Calculations
// ============================================================================

/**
 * Calculates absolute KSh movement per share
 */
export function calculateKshMovement(currentPrice: number, referencePrice: number): number {
  if (isNaN(currentPrice) || isNaN(referencePrice)) return 0;
  return Number((currentPrice - referencePrice).toFixed(2));
}

/**
 * Calculates percentage return with zero-division safeguard
 */
export function calculatePercentageChange(currentPrice: number, referencePrice: number): number {
  if (!referencePrice || referencePrice <= 0 || isNaN(currentPrice)) return 0;
  return Number((((currentPrice - referencePrice) / referencePrice) * 100).toFixed(2));
}

/**
 * Calculates intraday absolute range (High - Low)
 */
export function calculateIntradayRange(high: number, low: number): number {
  if (isNaN(high) || isNaN(low) || high < low) return 0;
  return Number((high - low).toFixed(2));
}

/**
 * Calculates range as a percentage of the reference price
 */
export function calculateRangePct(high: number, low: number, referencePrice: number): number {
  if (!referencePrice || referencePrice <= 0 || isNaN(high) || isNaN(low)) return 0;
  return Number((((high - low) / referencePrice) * 100).toFixed(2));
}

/**
 * Calculates distance from day high in absolute KSh and %
 */
export function calculateDistanceFromHigh(high: number, currentPrice: number): { distanceKes: number; distancePct: number } {
  if (isNaN(high) || isNaN(currentPrice) || high <= 0) {
    return { distanceKes: 0, distancePct: 0 };
  }
  const distanceKes = Number((high - currentPrice).toFixed(2));
  const distancePct = Number(((distanceKes / high) * 100).toFixed(2));
  return { distanceKes, distancePct };
}

/**
 * Calculates distance from day low in absolute KSh and %
 */
export function calculateDistanceFromLow(low: number, currentPrice: number): { distanceKes: number; distancePct: number } {
  if (isNaN(low) || isNaN(currentPrice) || low <= 0) {
    return { distanceKes: 0, distancePct: 0 };
  }
  const distanceKes = Number((currentPrice - low).toFixed(2));
  const distancePct = Number(((distanceKes / low) * 100).toFixed(2));
  return { distanceKes, distancePct };
}

/**
 * Calculates total invested capital in KSh
 */
export function calculateInvestedValue(shares: number, averageEntryPrice: number): number {
  if (shares <= 0 || averageEntryPrice <= 0) return 0;
  return Number((shares * averageEntryPrice).toFixed(2));
}

/**
 * Calculates current market value in KSh
 */
export function calculateCurrentValue(shares: number, currentPrice: number): number {
  if (shares <= 0 || currentPrice <= 0) return 0;
  return Number((shares * currentPrice).toFixed(2));
}

/**
 * Calculates Gross Unrealized P/L in KSh and %
 */
export function calculateUnrealizedPl(shares: number, averageEntryPrice: number, currentPrice: number): {
  grossPlKes: number;
  plPct: number;
  kshMovementPerShare: number;
} {
  const invested = calculateInvestedValue(shares, averageEntryPrice);
  const current = calculateCurrentValue(shares, currentPrice);
  const grossPlKes = Number((current - invested).toFixed(2));
  const plPct = invested > 0 ? Number(((grossPlKes / invested) * 100).toFixed(2)) : 0;
  const kshMovementPerShare = calculateKshMovement(currentPrice, averageEntryPrice);

  return {
    grossPlKes,
    plPct,
    kshMovementPerShare
  };
}

/**
 * Maximum Favorable Excursion (MFE):
 * Best unrealized profit in KSh achieved at any point during the holding period
 */
export function calculateMfe(shares: number, entryPrice: number, highestPriceSinceEntry: number): number {
  if (shares <= 0 || entryPrice <= 0 || highestPriceSinceEntry <= entryPrice) return 0;
  return Number(((highestPriceSinceEntry - entryPrice) * shares).toFixed(2));
}

/**
 * Maximum Adverse Excursion (MAE):
 * Worst unrealized loss in KSh experienced at any point during the holding period
 */
export function calculateMae(shares: number, entryPrice: number, lowestPriceSinceEntry: number): number {
  if (shares <= 0 || entryPrice <= 0 || lowestPriceSinceEntry >= entryPrice) return 0;
  return Number(((entryPrice - lowestPriceSinceEntry) * shares).toFixed(2));
}

/**
 * Calculates Profit Giveback from peak profit
 */
export function calculateProfitGiveback(peakUnrealizedPlKes: number, currentUnrealizedPlKes: number): {
  givebackKes: number;
  givebackPct: number;
  isGivingBack: boolean;
} {
  if (peakUnrealizedPlKes <= 0) {
    return { givebackKes: 0, givebackPct: 0, isGivingBack: false };
  }

  const givebackKes = Math.max(0, Number((peakUnrealizedPlKes - currentUnrealizedPlKes).toFixed(2)));
  const givebackPct = Number(((givebackKes / peakUnrealizedPlKes) * 100).toFixed(2));

  return {
    givebackKes,
    givebackPct,
    isGivingBack: givebackKes > 0
  };
}

// ============================================================================
// 2. Moving Averages
// ============================================================================

/**
 * Calculates Simple Moving Average (SMA) of the last N values
 */
export function calculateSma(values: number[], period: number): number | null {
  if (!values || values.length < period || period <= 0) {
    return null;
  }
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return Number((sum / period).toFixed(4));
}

/**
 * Calculates full SMA series
 */
export function calculateSmaSeries(values: number[], period: number): (number | null)[] {
  if (!values || period <= 0) return [];
  const result: (number | null)[] = [];
  let rollingSum = 0;

  for (let i = 0; i < values.length; i++) {
    rollingSum += values[i];
    if (i >= period) {
      rollingSum -= values[i - period];
    }
    if (i >= period - 1) {
      result.push(Number((rollingSum / period).toFixed(4)));
    } else {
      result.push(null);
    }
  }
  return result;
}

/**
 * Calculates Exponential Moving Average (EMA) of values
 */
export function calculateEma(values: number[], period: number): number | null {
  const series = calculateEmaSeries(values, period);
  return series.length > 0 ? series[series.length - 1] : null;
}

/**
 * Calculates full EMA series
 */
export function calculateEmaSeries(values: number[], period: number): (number | null)[] {
  if (!values || values.length < period || period <= 0) {
    return values ? values.map(() => null) : [];
  }

  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  // Initial SMA for first EMA seed
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
    if (i < period - 1) {
      result.push(null);
    }
  }
  let currentEma = sum / period;
  result.push(Number(currentEma.toFixed(4)));

  for (let i = period; i < values.length; i++) {
    currentEma = values[i] * k + currentEma * (1 - k);
    result.push(Number(currentEma.toFixed(4)));
  }

  return result;
}

/**
 * Calculates standard technical moving averages:
 * SMA 5, 10, 20, 50, 100, 200, EMA 9, 21
 */
export function calculateMovingAverages(closes: number[]): {
  sma5: number | null;
  sma10: number | null;
  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma200: number | null;
  ema9: number | null;
  ema21: number | null;
} {
  return {
    sma5: calculateSma(closes, 5),
    sma10: calculateSma(closes, 10),
    sma20: calculateSma(closes, 20),
    sma50: calculateSma(closes, 50),
    sma100: calculateSma(closes, 100),
    sma200: calculateSma(closes, 200),
    ema9: calculateEma(closes, 9),
    ema21: calculateEma(closes, 21)
  };
}

// ============================================================================
// 3. Momentum Oscillators & Indicators
// ============================================================================

/**
 * Calculates Relative Strength Index (RSI) using Wilder's smoothing
 */
export function calculateRsi(closes: number[], period = 14): number | null {
  if (!closes || closes.length < period + 1 || period <= 0) {
    return null;
  }

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  if (avgGain === 0) return 0;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

/**
 * Calculates Moving Average Convergence Divergence (MACD)
 * Standard (12, 26, 9)
 */
export function calculateMacd(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9
): { macdLine: number; signalLine: number; histogram: number } | null {
  if (!closes || closes.length < slow + signal) {
    return null;
  }

  const fastEmaSeries = calculateEmaSeries(closes, fast);
  const slowEmaSeries = calculateEmaSeries(closes, slow);

  const macdSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const fastVal = fastEmaSeries[i];
    const slowVal = slowEmaSeries[i];
    if (fastVal !== null && slowVal !== null) {
      macdSeries.push(fastVal - slowVal);
    }
  }

  if (macdSeries.length < signal) {
    return null;
  }

  const signalEma = calculateEma(macdSeries, signal);
  if (signalEma === null) return null;

  const currentMacd = macdSeries[macdSeries.length - 1];
  const histogram = currentMacd - signalEma;

  return {
    macdLine: Number(currentMacd.toFixed(4)),
    signalLine: Number(signalEma.toFixed(4)),
    histogram: Number(histogram.toFixed(4))
  };
}

/**
 * Calculates Rate of Change (ROC) over N periods
 */
export function calculateRoc(closes: number[], period = 10): number | null {
  if (!closes || closes.length <= period || period <= 0) return null;
  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - period];
  if (past <= 0) return null;
  return Number((((current - past) / past) * 100).toFixed(2));
}

// ============================================================================
// 4. Volatility Calculations
// ============================================================================

/**
 * Calculates True Range (TR) for a single session
 */
export function calculateTrueRange(
  currentHigh: number,
  currentLow: number,
  previousClose?: number
): number {
  if (previousClose === undefined || previousClose <= 0) {
    return Number(Math.max(0, currentHigh - currentLow).toFixed(4));
  }
  const range1 = currentHigh - currentLow;
  const range2 = Math.abs(currentHigh - previousClose);
  const range3 = Math.abs(currentLow - previousClose);
  return Number(Math.max(range1, range2, range3).toFixed(4));
}

/**
 * Calculates Average True Range (ATR) in absolute KSh and as % of price
 */
export function calculateAtr(
  bars: { high: number; low: number; close: number }[],
  period = 14
): { atrKes: number; normalizedAtrPct: number } {
  if (!bars || bars.length < 2 || period <= 0) {
    return { atrKes: 0, normalizedAtrPct: 0 };
  }

  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const tr = calculateTrueRange(bars[i].high, bars[i].low, bars[i - 1].close);
    trs.push(tr);
  }

  const calculationSlice = trs.slice(-period);
  if (calculationSlice.length === 0) return { atrKes: 0, normalizedAtrPct: 0 };

  const sumTr = calculationSlice.reduce((acc, val) => acc + val, 0);
  const atrKes = Number((sumTr / calculationSlice.length).toFixed(2));

  const currentPrice = bars[bars.length - 1].close;
  const normalizedAtrPct = currentPrice > 0 ? Number(((atrKes / currentPrice) * 100).toFixed(2)) : 0;

  return { atrKes, normalizedAtrPct };
}

/**
 * Calculates Historical Volatility (annualized standard deviation of log returns)
 * Default: 252 trading days per year
 */
export function calculateHistoricalVolatility(
  closes: number[],
  period = 20,
  annualized = true
): number | null {
  if (!closes || closes.length < period + 1 || period < 2) return null;

  const logReturns: number[] = [];
  const slice = closes.slice(-(period + 1));
  for (let i = 1; i < slice.length; i++) {
    if (slice[i - 1] <= 0 || slice[i] <= 0) return null;
    logReturns.push(Math.log(slice[i] / slice[i - 1]));
  }

  const mean = logReturns.reduce((acc, val) => acc + val, 0) / logReturns.length;
  const variance = logReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (logReturns.length - 1);
  const stdDev = Math.sqrt(variance);

  const factor = annualized ? Math.sqrt(252) : 1;
  return Number((stdDev * factor * 100).toFixed(2));
}

/**
 * Calculates rolling volatility ratio: short-term ATR / long-term ATR
 */
export function calculateVolatilityExpansionRatio(
  bars: { high: number; low: number; close: number }[],
  shortPeriod = 14,
  longPeriod = 60
): number {
  if (!bars || bars.length < shortPeriod) return 1.0;
  const shortAtr = calculateAtr(bars, shortPeriod).atrKes;
  const longAtr = calculateAtr(bars, Math.min(longPeriod, bars.length - 1)).atrKes;
  if (longAtr <= 0) return 1.0;
  return Number((shortAtr / longAtr).toFixed(2));
}

// ============================================================================
// 5. Volume & Liquidity Calculations
// ============================================================================

/**
 * Calculates average volume over N periods
 */
export function calculateAverageVolume(bars: { volume: number }[], period: number): number {
  if (!bars || bars.length === 0 || period <= 0) return 0;
  const slice = bars.slice(-period);
  const sum = slice.reduce((acc, b) => acc + b.volume, 0);
  return Math.round(sum / slice.length);
}

/**
 * Calculates Relative Volume (RVOL)
 */
export function calculateRelativeVolume(currentVolume: number, averageVolume: number): number {
  if (!averageVolume || averageVolume <= 0 || isNaN(currentVolume)) return 1.0;
  return Number((currentVolume / averageVolume).toFixed(2));
}

/**
 * Calculates volume acceleration (5-day average volume vs 20-day average volume)
 */
export function calculateVolumeAcceleration(bars: { volume: number }[]): number {
  if (!bars || bars.length < 5) return 1.0;
  const vol5 = calculateAverageVolume(bars, 5);
  const vol20 = calculateAverageVolume(bars, Math.min(20, bars.length));
  if (vol20 <= 0) return 1.0;
  return Number((vol5 / vol20).toFixed(2));
}

/**
 * Calculates turnover acceleration (5-day turnover vs 20-day turnover)
 */
export function calculateTurnoverAcceleration(bars: { turnoverKes: number }[]): number {
  if (!bars || bars.length < 5) return 1.0;
  const slice5 = bars.slice(-5);
  const sum5 = slice5.reduce((acc, b) => acc + b.turnoverKes, 0) / 5;
  const slice20 = bars.slice(-Math.min(20, bars.length));
  const sum20 = slice20.reduce((acc, b) => acc + b.turnoverKes, 0) / slice20.length;
  if (sum20 <= 0) return 1.0;
  return Number((sum5 / sum20).toFixed(2));
}

// ============================================================================
// 6. Price Structure, Support & Resistance
// ============================================================================

/**
 * Calculates recent highest high and lowest low over N periods
 */
export function calculateRecentHighLow(
  bars: { high: number; low: number }[],
  period = 20
): { high: number; low: number } {
  if (!bars || bars.length === 0) return { high: 0, low: 0 };
  const slice = bars.slice(-period);
  const high = Math.max(...slice.map(b => b.high));
  const low = Math.min(...slice.map(b => b.low));
  return {
    high: Number(high.toFixed(2)),
    low: Number(low.toFixed(2))
  };
}

/**
 * Detects swing pivot support and resistance levels
 */
export function calculateSupportResistanceLevels(
  bars: { high: number; low: number; close: number }[],
  currentPrice?: number
): {
  supportCandidates: number[];
  resistanceCandidates: number[];
  primarySupport: number | null;
  primaryResistance: number | null;
} {
  if (!bars || bars.length < 5) {
    return { supportCandidates: [], resistanceCandidates: [], primarySupport: null, primaryResistance: null };
  }

  const supports: number[] = [];
  const resistances: number[] = [];
  const refPrice = currentPrice ?? bars[bars.length - 1].close;

  // Local pivot detection: high[i] > high[i-1] && high[i] > high[i+1]
  for (let i = 2; i < bars.length - 2; i++) {
    const b = bars[i];
    const prev1 = bars[i - 1];
    const prev2 = bars[i - 2];
    const next1 = bars[i + 1];
    const next2 = bars[i + 2];

    if (b.high >= prev1.high && b.high >= prev2.high && b.high >= next1.high && b.high >= next2.high) {
      resistances.push(Number(b.high.toFixed(2)));
    }
    if (b.low <= prev1.low && b.low <= prev2.low && b.low <= next1.low && b.low <= next2.low) {
      supports.push(Number(b.low.toFixed(2)));
    }
  }

  // Deduplicate within 0.5% tolerance
  const uniqueSupports = deduplicateLevels(supports);
  const uniqueResistances = deduplicateLevels(resistances);

  // Find nearest support strictly below current price and nearest resistance strictly above current price
  const validSupports = uniqueSupports.filter(s => s < refPrice).sort((a, b) => b - a);
  const validResistances = uniqueResistances.filter(r => r > refPrice).sort((a, b) => a - b);

  return {
    supportCandidates: uniqueSupports,
    resistanceCandidates: uniqueResistances,
    primarySupport: validSupports.length > 0 ? validSupports[0] : null,
    primaryResistance: validResistances.length > 0 ? validResistances[0] : null
  };
}

function deduplicateLevels(levels: number[], tolerancePct = 0.5): number[] {
  const sorted = [...levels].sort((a, b) => a - b);
  const result: number[] = [];
  for (const lvl of sorted) {
    if (result.length === 0) {
      result.push(lvl);
    } else {
      const last = result[result.length - 1];
      const diffPct = Math.abs((lvl - last) / last) * 100;
      if (diffPct > tolerancePct) {
        result.push(lvl);
      }
    }
  }
  return result;
}

/**
 * Calculates pullback metrics relative to recent peak and ATR
 */
export function calculatePullbackMetrics(
  currentPrice: number,
  bars: { high: number; low: number; close: number }[],
  atrKes: number,
  lookbackPeriod = 10
): {
  highestPrice: number;
  pullbackKes: number;
  pullbackPct: number;
  pullbackAtrMultiple: number;
  isNormalPullback: boolean;
  isDeepPullback: boolean;
  isBreakdown: boolean;
} {
  if (!bars || bars.length === 0 || currentPrice <= 0) {
    return {
      highestPrice: currentPrice,
      pullbackKes: 0,
      pullbackPct: 0,
      pullbackAtrMultiple: 0,
      isNormalPullback: false,
      isDeepPullback: false,
      isBreakdown: false
    };
  }

  const slice = bars.slice(-lookbackPeriod);
  const highestPrice = Math.max(...slice.map(b => b.high), currentPrice);
  const pullbackKes = Math.max(0, Number((highestPrice - currentPrice).toFixed(2)));
  const pullbackPct = highestPrice > 0 ? Number(((pullbackKes / highestPrice) * 100).toFixed(2)) : 0;
  const pullbackAtrMultiple = atrKes > 0 ? Number((pullbackKes / atrKes).toFixed(2)) : 0;

  // Normal pullback <= 1.5x ATR; Deep pullback 1.5x - 2.5x ATR; Breakdown > 2.5x ATR
  const isNormalPullback = pullbackAtrMultiple > 0 && pullbackAtrMultiple <= 1.5;
  const isDeepPullback = pullbackAtrMultiple > 1.5 && pullbackAtrMultiple <= 2.5;
  const isBreakdown = pullbackAtrMultiple > 2.5;

  return {
    highestPrice: Number(highestPrice.toFixed(2)),
    pullbackKes,
    pullbackPct,
    pullbackAtrMultiple,
    isNormalPullback,
    isDeepPullback,
    isBreakdown
  };
}

/**
 * Calculates breakout distance from resistance
 */
export function calculateBreakoutDistance(
  currentPrice: number,
  resistanceLevel: number
): { breakoutKes: number; breakoutPct: number; isBreakout: boolean } {
  if (resistanceLevel <= 0 || currentPrice <= 0) {
    return { breakoutKes: 0, breakoutPct: 0, isBreakout: false };
  }

  const breakoutKes = Number((currentPrice - resistanceLevel).toFixed(2));
  const breakoutPct = Number(((breakoutKes / resistanceLevel) * 100).toFixed(2));
  const isBreakout = breakoutKes > 0;

  return {
    breakoutKes,
    breakoutPct,
    isBreakout
  };
}

/**
 * Standard NSE Round-Trip Transaction Levies + Brokerage Commission (Legacy helper)
 */
export function calculateRoundTripTransactionCosts(
  considerationKes: number,
  ratePct = 1.85
): number {
  return Number((considerationKes * (ratePct / 100)).toFixed(2));
}
