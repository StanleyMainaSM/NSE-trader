/**
 * Deterministic Financial Calculations Engine
 * 
 * Strict Principle:
 * - Deterministic, pure mathematical functions with zero stochastic randomness.
 * - Testable and free from look-ahead bias.
 * - Precision handling for Kenyan Shillings (KSh) and basis points.
 */

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
 * If current unrealized profit drops below peak profit, measures surrendered profit
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
  if (bars.length < 2) {
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
 * Calculates Relative Volume (RVOL)
 */
export function calculateRelativeVolume(currentVolume: number, averageVolume: number): number {
  if (!averageVolume || averageVolume <= 0) return 1.0;
  return Number((currentVolume / averageVolume).toFixed(2));
}

/**
 * Standard NSE Round-Trip Transaction Levies + Brokerage Commission
 * (CDSC levy, CMA levy, NSE levy, Investor Compensation Fund, VAT, Broker commission)
 * Defaults to 1.85% round-trip total (~1.2% buy + ~1.2% sell or ~1.85% standard net friction)
 */
export function calculateRoundTripTransactionCosts(
  considerationKes: number,
  ratePct = 1.85
): number {
  return Number((considerationKes * (ratePct / 100)).toFixed(2));
}
