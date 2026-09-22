/**
 * Stock Deep Drill-Down Modal
 * Comprehensive single-asset analysis: OHLCV bars across multi-timeframes,
 * order book depth, liquidity tier & slippage profiling, regime state, and fundamentals.
 */

import React, { useEffect, useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Info, 
  FileText, 
  Layers, 
  Coins, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { TimeFrame, LiquidityClassification } from '../types/index.ts';

interface StockDrilldownModalProps {
  symbol: string;
  onClose: () => void;
}

export const StockDrilldownModal: React.FC<StockDrilldownModalProps> = ({
  symbol,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeFrame>('1d');
  const [timeframeBars, setTimeframeBars] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState<any>(null);
  const [liquidity, setLiquidity] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      setLoading(true);
      try {
        const [stockRes, obRes, liqRes] = await Promise.all([
          fetch(`/api/stocks/${symbol}`),
          fetch(`/api/market/orderbook/${symbol}`).then(r => r.ok ? r.json() : null),
          fetch(`/api/market/liquidity/${symbol}`).then(r => r.ok ? r.json() : null)
        ]);

        if (stockRes.ok) {
          const json = await stockRes.json();
          if (isMounted) {
            setData(json);
            setTimeframeBars(json.bars || []);
          }
        }
        if (isMounted) {
          if (obRes?.orderBook) setOrderBook(obRes.orderBook);
          if (liqRes?.liquidityMetrics) setLiquidity(liqRes.liquidityMetrics);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadDetail();
    return () => { isMounted = false; };
  }, [symbol]);

  // Load specific timeframe bars when timeframe button is clicked
  const handleTimeframeChange = async (tf: TimeFrame) => {
    setTimeframe(tf);
    try {
      const res = await fetch(`/api/market/bars/${symbol}?timeframe=${tf}&limit=30`);
      if (res.ok) {
        const json = await res.json();
        setTimeframeBars(json.bars || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getLiquidityBadge = (tier?: LiquidityClassification) => {
    switch (tier) {
      case 'HIGH_LIQUIDITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">TIER-1 HIGH</span>;
      case 'MODERATE_LIQUIDITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">TIER-2 MODERATE</span>;
      case 'LOW_LIQUIDITY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">TIER-3 THIN</span>;
      case 'ILLIQUID':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">ILLIQUID / UNTRADABLE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-y-auto font-mono text-xs">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
              {symbol}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100">{data?.stock?.name || symbol}</h2>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                  {data?.stock?.sector_code || 'NSE'}
                </span>
                {data?.isDemoFixture && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                    DEMO FIXTURE
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">ISIN: {data?.stock?.isin || '--'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Loading asset intelligence...</div>
        ) : (
          <div className="p-4 space-y-4">
            
            {/* Price Banner */}
            <div className="p-3 bg-slate-950/80 rounded border border-slate-800 flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">CURRENT TRADE PRICE</span>
                <div className="text-2xl font-bold text-slate-100">
                  {data?.quote ? data.quote.price.toFixed(2) : '--'} KSh
                </div>
                <div className={`text-xs font-semibold ${((data?.quote?.changeKes || 0) >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((data?.quote?.changeKes || 0) >= 0) ? '+' : ''}{data?.quote?.changeKes.toFixed(2)} KSh ({data?.quote?.changePct.toFixed(2)}%)
                </div>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">SESSION VOLUME</span>
                  <span className="text-sm font-bold text-slate-200">
                    {data?.quote ? data.quote.dayVolume.toLocaleString() : '--'} shs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">SESSION TURNOVER</span>
                  <span className="text-sm font-bold text-slate-200">
                    {data?.quote ? `KSh ${(data.quote.dayTurnoverKes / 1000000).toFixed(2)}M` : '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">DAY RANGE</span>
                  <span className="text-sm font-bold text-slate-200">
                    {data?.quote?.dayLow.toFixed(2)} – {data?.quote?.dayHigh.toFixed(2)} KSh
                  </span>
                </div>
              </div>
            </div>

            {/* Liquidity Profile & Execution Reality */}
            {liquidity && (
              <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase">Liquidity Profile & Slippage Guard</span>
                  </div>
                  {getLiquidityBadge(liquidity.classification)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">EST. SLIPPAGE</span>
                    <span className="text-slate-200 font-bold">{liquidity.estimatedSlippageBps} bps</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">BID-ASK SPREAD</span>
                    <span className="text-slate-200 font-bold">{liquidity.spreadKes.toFixed(2)} KSh ({liquidity.spreadPct.toFixed(2)}%)</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">SAFE POSITION CAP</span>
                    <span className="text-slate-200 font-bold">KSh {(liquidity.maxSafePositionKes / 1000).toFixed(0)}K</span>
                    <span className="text-[9px] text-slate-500 block">&le;5% daily turnover</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">TRADABILITY STATUS</span>
                    <span className={liquidity.isTradable ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {liquidity.isTradable ? 'Sufficient Liquidity' : 'Illiquid Caution'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Stock Regime Diagnosis */}
            {data?.regime && (
              <div className="p-3.5 bg-slate-950/60 rounded border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 uppercase">Stock Volatility Regime</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    STATE: {data.regime.state}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{data.regime.reasoning}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">ATR (14D)</span>
                    <span className="text-slate-200 font-bold">{data.regime.atrKes.toFixed(2)} KSh</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">RELATIVE VOLUME</span>
                    <span className="text-slate-200 font-bold">{data.regime.relativeVolume}x</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">PULLBACK STATUS</span>
                    <span className={data.regime.isNormalPullback ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {data.regime.isNormalPullback ? 'Normal (<=1.5x ATR)' : 'Elevated Breakdown'}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded">
                    <span className="block text-[10px] text-slate-500">PULLBACK MULTIPLE</span>
                    <span className="text-slate-200 font-bold">{data.regime.pullbackBenchmarkAtrMultiple}x ATR</span>
                  </div>
                </div>
              </div>
            )}

            {/* Level-2 Order Book Depth (if available) */}
            {orderBook && (orderBook.bids?.length > 0 || orderBook.asks?.length > 0) && (
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase text-slate-300">Level-2 Order Book Depth</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Spread: KSh {orderBook.spreadKes.toFixed(2)} ({orderBook.spreadPct.toFixed(2)}%)</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {/* Bids */}
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 block mb-1">BIDS (BUY DEPTH)</span>
                    <table className="w-full text-left">
                      <thead className="text-[9px] text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="py-1">Orders</th>
                          <th className="py-1 text-right">Volume</th>
                          <th className="py-1 text-right">Price (KES)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-[11px]">
                        {orderBook.bids.slice(0, 5).map((b: any, i: number) => (
                          <tr key={i}>
                            <td className="py-1 text-slate-500">{b.orderCount}</td>
                            <td className="py-1 text-right text-slate-300">{b.volume.toLocaleString()}</td>
                            <td className="py-1 text-right font-bold text-emerald-400">{b.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Asks */}
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 block mb-1">ASKS (SELL DEPTH)</span>
                    <table className="w-full text-left">
                      <thead className="text-[9px] text-slate-500 border-b border-slate-800">
                        <tr>
                          <th className="py-1">Price (KES)</th>
                          <th className="py-1 text-right">Volume</th>
                          <th className="py-1 text-right">Orders</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-[11px]">
                        {orderBook.asks.slice(0, 5).map((a: any, i: number) => (
                          <tr key={i}>
                            <td className="py-1 font-bold text-rose-400">{a.price.toFixed(2)}</td>
                            <td className="py-1 text-right text-slate-300">{a.volume.toLocaleString()}</td>
                            <td className="py-1 text-right text-slate-500">{a.orderCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Historical Bars with Multi-Timeframe Selector */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-slate-300">
                  Historical Price Bars ({timeframe})
                </span>
                <div className="flex items-center gap-1">
                  {(['1m', '5m', '15m', '1h', '1d', '1w'] as TimeFrame[]).map(tf => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeChange(tf)}
                      className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                        timeframe === tf
                          ? 'bg-slate-700 text-emerald-400 font-bold border border-slate-600'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Date / Time</th>
                      <th className="py-2 px-2 text-right">Open</th>
                      <th className="py-2 px-2 text-right">High</th>
                      <th className="py-2 px-2 text-right">Low</th>
                      <th className="py-2 px-2 text-right">Close</th>
                      <th className="py-2 px-3 text-right">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {timeframeBars.slice(-15).reverse().map((b: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-slate-300">
                          {b.timestamp.includes('T') ? b.timestamp.replace('T', ' ').slice(0, 16) : b.timestamp}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-400">{b.open.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-slate-400">{b.high.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right text-slate-400">{b.low.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-bold text-slate-200">{b.close.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{b.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Fundamental Disclosures */}
            {data?.fundamentals && (
              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase text-slate-300 block">Reported Fundamentals</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">P/E RATIO</span>
                    <span className="text-slate-200 font-bold">{data.fundamentals.peRatio || '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">PRICE / BOOK</span>
                    <span className="text-slate-200 font-bold">{data.fundamentals.priceToBook || '--'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">DIVIDEND YIELD</span>
                    <span className="text-emerald-400 font-bold">
                      {data.fundamentals.dividendYieldPct ? `${data.fundamentals.dividendYieldPct}%` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">DIVIDEND PER SHARE</span>
                    <span className="text-slate-200 font-bold">
                      {data.fundamentals.dividendPerShareKes ? `${data.fundamentals.dividendPerShareKes} KSh` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Linked Intelligence Articles */}
            {data?.articles && data.articles.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase text-slate-300">Company News & Filings</span>
                <div className="space-y-2">
                  {data.articles.map((a: any) => (
                    <div key={a.id} className="p-2.5 bg-slate-950/50 rounded border border-slate-800/80">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{a.sourceName}</span>
                        <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-0.5">{a.headline}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{a.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
