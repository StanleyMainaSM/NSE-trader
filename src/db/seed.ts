/**
 * Master Database Seed Script
 * Initializes Nairobi Securities Exchange (NSE) reference structures, listed companies,
 * sectors, default user settings, and provider records.
 */

import { getDatabase, runCommand, queryOne } from './database.ts';
import { logger } from '../services/logger.ts';

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();

  // Check if already seeded
  const existingExchange = await queryOne('SELECT id FROM exchanges WHERE code = "NSE"');
  if (existingExchange) {
    logger.info('Seed', 'Database already initialized with NSE master reference data.');
    return;
  }

  logger.info('Seed', 'Seeding NSE master reference datasets...');

  const now = new Date().toISOString();

  // 1. Data Sources
  await runCommand(`
    INSERT OR REPLACE INTO data_sources (id, name, provider_type, status, supported_data, update_frequency, data_freshness, is_official_license, legal_notice, is_demo_fixture_only)
    VALUES 
    ('nse-official-ats-gateway', 'NSE Direct Market Gateway / Licensed Feed', 'MARKET_DATA', 'UNCONFIGURED', 'INTRADAY,BARS,ORDERBOOK,INDICES,BREADTH', '1m', 'UNAVAILABLE', 1, 'Awaiting connection to licensed NSE ATS or broker FIX gateway.', 0),
    ('nse-demo-simulation-fixture', 'Demo Simulation Fixture (Sandboxed)', 'MARKET_DATA', 'DEMO_ONLY', 'INTRADAY,BARS,INDICES,BREADTH,NEWS', '5m', 'DELAYED', 0, 'DEMO DATA — NOT REAL MARKET DATA. For offline calculation validation and UI testing.', 1)
  `);

  // 2. Exchange
  await runCommand(`
    INSERT INTO exchanges (id, code, name, country, currency, timezone, trading_hours_start, trading_hours_end, settlement_cycle, status, updated_at)
    VALUES ('ex-nse', 'NSE', 'Nairobi Securities Exchange', 'Kenya', 'KES', 'Africa/Nairobi', '09:00:00', '15:00:00', 'T+3', 'CLOSED', ?)
  `, [now]);

  // 3. Sectors
  const sectors = [
    { id: 'sec-telecom', code: 'TELECOM', name: 'Telecommunication & Technology', weight: 42.5 },
    { id: 'sec-banking', code: 'BANKING', name: 'Banking', weight: 34.2 },
    { id: 'sec-manufacturing', code: 'MANUFACTURING', name: 'Manufacturing & Allied', weight: 12.0 },
    { id: 'sec-energy', code: 'ENERGY', name: 'Energy & Petroleum', weight: 4.8 },
    { id: 'sec-insurance', code: 'INSURANCE', name: 'Insurance', weight: 2.5 },
    { id: 'sec-investment', code: 'INVESTMENT', name: 'Investment & Services', weight: 1.8 },
    { id: 'sec-commercial', code: 'COMMERCIAL', name: 'Commercial & Services', weight: 1.2 },
    { id: 'sec-agricultural', code: 'AGRICULTURAL', name: 'Agricultural', weight: 1.0 }
  ];

  for (const s of sectors) {
    await runCommand(`
      INSERT INTO sectors (id, code, name, description, weight_in_index_pct, stock_count, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `, [s.id, s.code, s.name, `${s.name} sector listed on NSE`, s.weight, now]);
  }

  // 4. Companies & Stocks
  const stocks = [
    {
      companyId: 'cmp-scom', name: 'Safaricom PLC', code: 'SCOM', isin: 'KE0000000402',
      sectorId: 'sec-telecom', sectorCode: 'TELECOM', shares: 40065428000, marketCap: 627023948200,
      stockId: 'stk-scom', symbol: 'SCOM', tick: 0.05
    },
    {
      companyId: 'cmp-eqty', name: 'Equity Group Holdings PLC', code: 'EQTY', isin: 'KE0000000550',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 3773674802, marketCap: 164154853887,
      stockId: 'stk-eqty', symbol: 'EQTY', tick: 0.25
    },
    {
      companyId: 'cmp-kcb', name: 'KCB Group PLC', code: 'KCB', isin: 'KE0000000311',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 3213462815, marketCap: 116488027043,
      stockId: 'stk-kcb', symbol: 'KCB', tick: 0.25
    },
    {
      companyId: 'cmp-eabl', name: 'East African Breweries PLC', code: 'EABL', isin: 'KE0000000212',
      sectorId: 'sec-manufacturing', sectorCode: 'MANUFACTURING', shares: 790774356, marketCap: 109126861128,
      stockId: 'stk-eabl', symbol: 'EABL', tick: 0.50
    },
    {
      companyId: 'cmp-absa', name: 'Absa Bank Kenya PLC', code: 'ABSA', isin: 'KE0000000063',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 5431536000, marketCap: 80658309600,
      stockId: 'stk-absa', symbol: 'ABSA', tick: 0.05
    },
    {
      companyId: 'cmp-coop', name: 'Co-operative Bank of Kenya Ltd', code: 'COOP', isin: 'KE0000000584',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 5867175650, marketCap: 81553741535,
      stockId: 'stk-coop', symbol: 'COOP', tick: 0.05
    },
    {
      companyId: 'cmp-bat', name: 'British American Tobacco Kenya PLC', code: 'BAT', isin: 'KE0000000071',
      sectorId: 'sec-manufacturing', sectorCode: 'MANUFACTURING', shares: 100000000, marketCap: 41200000000,
      stockId: 'stk-bat', symbol: 'BAT', tick: 1.00
    },
    {
      companyId: 'cmp-ncba', name: 'NCBA Group PLC', code: 'NCBA', isin: 'KE0000000352',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 1647524000, marketCap: 74468084800,
      stockId: 'stk-ncba', symbol: 'NCBA', tick: 0.25
    },
    {
      companyId: 'cmp-scbk', name: 'Standard Chartered Bank Kenya Ltd', code: 'SCBK', isin: 'KE0000000444',
      sectorId: 'sec-banking', sectorCode: 'BANKING', shares: 377855000, marketCap: 75004217500,
      stockId: 'stk-scbk', symbol: 'SCBK', tick: 0.50
    }
  ];

  for (const item of stocks) {
    await runCommand(`
      INSERT INTO companies (id, name, code, isin, sector_id, sector_code, incorporation_country, fiscal_year_end, shares_outstanding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Kenya', '12-31', ?, ?, ?)
    `, [item.companyId, item.name, item.code, item.isin, item.sectorId, item.sectorCode, item.shares, now, now]);

    await runCommand(`
      INSERT INTO stocks (id, company_id, symbol, ticker, lot_size, price_tick_size, is_suspended, listing_segment, market_cap_kes, currency, data_source_id, freshness, last_updated)
      VALUES (?, ?, ?, ?, 100, ?, 0, 'MIMS', ?, 'KES', 'nse-demo-simulation-fixture', 'DELAYED', ?)
    `, [item.stockId, item.companyId, item.symbol, item.code, item.tick, item.marketCap, now]);
  }

  // 5. Default User Configuration
  await runCommand(`
    INSERT INTO user_settings (
      id, trading_capital_kes, preferred_holding_period, minimum_ksh_share_opportunity,
      minimum_liquidity_daily_turnover_kes, preferred_volatility, maximum_position_size_kes,
      maximum_portfolio_allocation_per_stock_pct, alert_sensitivity, monitored_symbols_json,
      profit_giveback_warning_threshold_pct, is_demo_data_allowed, updated_at
    ) VALUES (
      'usr-default', 500000.0, 'SWING_1_3_DAYS', 0.50, 10000000.0, 'MODERATE', 150000.0, 30.0, 'BALANCED',
      '["SCOM","EQTY","KCB","EABL","ABSA","BAT"]', 30.0, 1, ?
    )
  `, [now]);

  // 6. Initial Seed Portfolio for immediate verification of P/L and Giveback tracking
  await runCommand(`
    INSERT INTO portfolios (id, name, total_cash_kes, invested_value_kes, total_value_kes, daily_unrealized_pl_kes, daily_unrealized_pl_pct, total_unrealized_pl_kes, total_unrealized_pl_pct, peak_portfolio_value_kes, max_drawdown_kes, max_drawdown_pct, open_positions_count, updated_at)
    VALUES ('port-primary', 'Personal NSE Growth Portfolio', 185000.0, 315000.0, 342250.0, 4850.0, 1.43, 27250.0, 8.65, 345000.0, 2750.0, 0.79, 2, ?)
  `, [now]);

  // Sample verified tracked position: SCOM entered at 14.80, currently 15.65 (+0.85 KSh/share)
  await runCommand(`
    INSERT INTO portfolio_positions (
      id, portfolio_id, stock_id, symbol, shares, average_entry_price, current_price, previous_close_price,
      invested_value_kes, current_value_kes, gross_unrealized_pl_kes, percentage_pl, ksh_movement_per_share,
      peak_unrealized_pl_kes, profit_giveback_kes, profit_giveback_pct, maximum_adverse_excursion_kes,
      maximum_favorable_excursion_kes, holding_duration_days, entry_date, notes, target_price_kes,
      stop_loss_price_kes, pullback_risk_rating, hold_vs_exit_json, updated_at
    ) VALUES (
      'pos-scom-1', 'port-primary', 'stk-scom', 'SCOM', 10000, 14.80, 15.65, 15.30,
      148000.0, 156500.0, 8500.0, 5.74, 0.85, 9500.0, 1000.0, 10.53, 2000.0, 9500.0, 5, '2026-09-17',
      'Entry on breakout of 14.75 resistance following Safaricom Ethiopia operational update.',
      16.50, 14.40, 'NORMAL',
      '{"recommendation":"HOLD","reasons":["Position is healthy (+0.85 KSh/share)","Profit giveback within acceptable 10.5% threshold"],"evidenceMetrics":{"kshMovementPerShare":0.85,"givebackPct":10.53}}',
      ?
    )
  `, [now]);

  // Sample verified tracked position: EQTY entered at 40.50, currently 43.50 (+3.00 KSh/share)
  await runCommand(`
    INSERT INTO portfolio_positions (
      id, portfolio_id, stock_id, symbol, shares, average_entry_price, current_price, previous_close_price,
      invested_value_kes, current_value_kes, gross_unrealized_pl_kes, percentage_pl, ksh_movement_per_share,
      peak_unrealized_pl_kes, profit_giveback_kes, profit_giveback_pct, maximum_adverse_excursion_kes,
      maximum_favorable_excursion_kes, holding_duration_days, entry_date, notes, target_price_kes,
      stop_loss_price_kes, pullback_risk_rating, hold_vs_exit_json, updated_at
    ) VALUES (
      'pos-eqty-1', 'port-primary', 'stk-eqty', 'EQTY', 4000, 40.50, 43.50, 42.25,
      162000.0, 174000.0, 12000.0, 7.41, 3.00, 13000.0, 1000.0, 7.69, 1500.0, 13000.0, 8, '2026-09-14',
      'Accumulation off 40.00 base support ahead of Q3 bank disclosures.',
      45.00, 39.50, 'NORMAL',
      '{"recommendation":"HOLD","reasons":["KSh +3.00/share unrealized movement","Approaching 45.00 profit target"],"evidenceMetrics":{"kshMovementPerShare":3.0,"givebackPct":7.69}}',
      ?
    )
  `, [now]);

  logger.info('Seed', 'Successfully completed NSE master reference data seeding.');
}
