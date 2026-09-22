-- Nairobi Securities Exchange (NSE) Trading Intelligence System
-- SQLite Master Relational Schema
-- Preserves source timestamps, exact foreign keys, and indexes for temporal market data.

CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    status TEXT NOT NULL,
    supported_data TEXT NOT NULL,
    update_frequency TEXT NOT NULL,
    last_successful_update TEXT,
    last_error TEXT,
    source_timestamp TEXT,
    data_freshness TEXT NOT NULL,
    is_official_license INTEGER NOT NULL DEFAULT 0,
    legal_notice TEXT NOT NULL,
    is_demo_fixture_only INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exchanges (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    currency TEXT NOT NULL,
    timezone TEXT NOT NULL,
    trading_hours_start TEXT NOT NULL,
    trading_hours_end TEXT NOT NULL,
    settlement_cycle TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sectors (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    weight_in_index_pct REAL,
    stock_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    isin TEXT NOT NULL,
    sector_id TEXT NOT NULL,
    sector_code TEXT NOT NULL,
    incorporation_country TEXT NOT NULL,
    fiscal_year_end TEXT NOT NULL,
    shares_outstanding REAL NOT NULL,
    free_float_pct REAL,
    website_url TEXT,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(sector_id) REFERENCES sectors(id)
);

CREATE TABLE IF NOT EXISTS stocks (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    symbol TEXT NOT NULL UNIQUE,
    ticker TEXT NOT NULL,
    lot_size INTEGER NOT NULL DEFAULT 100,
    price_tick_size REAL NOT NULL DEFAULT 0.05,
    is_suspended INTEGER NOT NULL DEFAULT 0,
    listing_segment TEXT NOT NULL DEFAULT 'MIMS',
    market_cap_kes REAL NOT NULL DEFAULT 0,
    free_float_shares REAL,
    currency TEXT NOT NULL DEFAULT 'KES',
    data_source_id TEXT NOT NULL,
    freshness TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    FOREIGN KEY(company_id) REFERENCES companies(id),
    FOREIGN KEY(data_source_id) REFERENCES data_sources(id)
);

CREATE TABLE IF NOT EXISTS market_indices (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    change_kes REAL NOT NULL,
    change_pct REAL NOT NULL,
    previous_close REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    volume REAL NOT NULL,
    turnover_kes REAL NOT NULL,
    timestamp TEXT NOT NULL,
    provenance TEXT NOT NULL,
    freshness TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_indices_symbol_ts ON market_indices(symbol, timestamp);

CREATE TABLE IF NOT EXISTS price_bars (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    open REAL NOT NULL,
    high REAL NOT NULL,
    low REAL NOT NULL,
    close REAL NOT NULL,
    volume REAL NOT NULL,
    turnover_kes REAL NOT NULL,
    trades_count INTEGER,
    vwap REAL,
    is_completed INTEGER NOT NULL DEFAULT 1,
    data_source_id TEXT NOT NULL,
    provenance TEXT NOT NULL,
    freshness TEXT NOT NULL,
    FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
CREATE INDEX IF NOT EXISTS idx_price_bars_sym_tf_ts ON price_bars(symbol, timeframe, timestamp);

CREATE TABLE IF NOT EXISTS intraday_prices (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price REAL NOT NULL,
    change_kes REAL NOT NULL,
    change_pct REAL NOT NULL,
    bid_price REAL,
    bid_quantity REAL,
    ask_price REAL,
    ask_quantity REAL,
    day_open REAL NOT NULL,
    day_high REAL NOT NULL,
    day_low REAL NOT NULL,
    day_volume REAL NOT NULL,
    day_turnover_kes REAL NOT NULL,
    last_trade_timestamp TEXT NOT NULL,
    source_timestamp TEXT NOT NULL,
    ingestion_timestamp TEXT NOT NULL,
    freshness TEXT NOT NULL,
    data_source_id TEXT NOT NULL,
    provenance TEXT NOT NULL,
    FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
CREATE INDEX IF NOT EXISTS idx_intraday_symbol_ts ON intraday_prices(symbol, source_timestamp);

CREATE TABLE IF NOT EXISTS market_breadth (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    total_traded_stocks INTEGER NOT NULL,
    advancing_stocks INTEGER NOT NULL,
    declining_stocks INTEGER NOT NULL,
    unchanged_stocks INTEGER NOT NULL,
    advance_decline_ratio REAL NOT NULL,
    total_market_turnover_kes REAL NOT NULL,
    total_market_volume REAL NOT NULL,
    new_52_week_highs INTEGER NOT NULL,
    new_52_week_lows INTEGER NOT NULL,
    breadth_thrust_index REAL,
    freshness TEXT NOT NULL,
    data_source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_book_snapshots (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    bids_json TEXT NOT NULL,
    asks_json TEXT NOT NULL,
    spread_kes REAL NOT NULL,
    spread_bps REAL NOT NULL,
    bid_depth_total REAL NOT NULL,
    ask_depth_total REAL NOT NULL,
    imbalance_ratio REAL NOT NULL,
    has_legitimate_source INTEGER NOT NULL,
    data_source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fundamental_snapshots (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    as_of_date TEXT NOT NULL,
    pe_ratio REAL,
    pb_ratio REAL,
    dividend_yield_pct REAL,
    eps_kes REAL,
    bps_kes REAL,
    roe_pct REAL,
    debt_to_equity REAL,
    currency TEXT NOT NULL DEFAULT 'KES',
    is_audited INTEGER NOT NULL DEFAULT 1,
    source_filing_id TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(stock_id) REFERENCES stocks(id)
);

CREATE TABLE IF NOT EXISTS financial_statements (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    period TEXT NOT NULL,
    filing_date TEXT NOT NULL,
    revenue_kes REAL NOT NULL,
    operating_profit_kes REAL NOT NULL,
    profit_after_tax_kes REAL NOT NULL,
    total_assets_kes REAL NOT NULL,
    total_liabilities_kes REAL NOT NULL,
    equity_kes REAL NOT NULL,
    cash_kes REAL NOT NULL,
    auditor_opinion TEXT,
    pdf_url TEXT,
    data_source_id TEXT NOT NULL,
    FOREIGN KEY(company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS corporate_actions (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    action_type TEXT NOT NULL,
    announcement_date TEXT NOT NULL,
    book_closure_date TEXT,
    record_date TEXT,
    payment_date TEXT,
    details TEXT NOT NULL,
    ratio_or_amount_kes REAL NOT NULL,
    status TEXT NOT NULL,
    data_source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dividend_events (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    fiscal_period TEXT NOT NULL,
    type TEXT NOT NULL,
    dividend_per_share_kes REAL NOT NULL,
    announcement_date TEXT NOT NULL,
    book_closure_date TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    withholding_tax_pct REAL NOT NULL DEFAULT 5.0,
    data_source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    headline TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_content TEXT,
    source_name TEXT NOT NULL,
    source_url TEXT,
    published_at TEXT NOT NULL,
    ingested_at TEXT NOT NULL,
    classification TEXT NOT NULL,
    raw_tags_json TEXT NOT NULL,
    mentioned_symbols_json TEXT NOT NULL,
    mentioned_sectors_json TEXT NOT NULL,
    is_verified_fact INTEGER NOT NULL DEFAULT 0,
    data_source_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS external_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    event_date TEXT NOT NULL,
    source_authority TEXT NOT NULL,
    transmission_mechanism TEXT NOT NULL,
    potential_pressure TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    is_fact INTEGER NOT NULL,
    interpretation_notes TEXT,
    observed_market_reaction TEXT,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_impacts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    affected_target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_symbol_or_code TEXT NOT NULL,
    potential_pressure TEXT NOT NULL,
    estimated_magnitude_pct_min REAL,
    estimated_magnitude_pct_max REAL,
    evidence TEXT NOT NULL,
    confidence REAL NOT NULL,
    observed_reaction_kes REAL,
    observed_reaction_pct REAL,
    reaction_window_sessions INTEGER,
    provenance TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES external_events(id)
);

CREATE TABLE IF NOT EXISTS sector_snapshots (
    id TEXT PRIMARY KEY,
    sector_id TEXT NOT NULL,
    sector_code TEXT NOT NULL,
    sector_name TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    turnover_kes REAL NOT NULL,
    turnover_share_pct REAL NOT NULL,
    advancing_count INTEGER NOT NULL,
    declining_count INTEGER NOT NULL,
    weighted_performance_pct REAL NOT NULL,
    average_volume_ratio REAL NOT NULL,
    regime TEXT NOT NULL,
    leading_symbol TEXT,
    lagging_symbol TEXT
);

CREATE TABLE IF NOT EXISTS technical_snapshots (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    last_price_kes REAL NOT NULL,
    change_kes REAL NOT NULL,
    change_pct REAL NOT NULL,
    sma20 REAL,
    sma50 REAL,
    sma200 REAL,
    ema9 REAL,
    ema21 REAL,
    rsi14 REAL,
    macd_json TEXT,
    atr14_kes REAL NOT NULL,
    atr14_pct REAL NOT NULL,
    pullback_depth_kes REAL NOT NULL,
    pullback_depth_pct REAL NOT NULL,
    distance_from_20d_sma_pct REAL NOT NULL,
    support_level_kes REAL,
    resistance_level_kes REAL,
    provenance TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS volatility_snapshots (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    historical_volatility_20d REAL NOT NULL,
    average_true_range_kes REAL NOT NULL,
    normalized_atr_pct REAL NOT NULL,
    volatility_expansion_ratio REAL NOT NULL,
    is_amac_like_characteristics INTEGER NOT NULL,
    typical_daily_range_kes REAL NOT NULL,
    freshness TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS market_regimes (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    state TEXT NOT NULL,
    confidence REAL NOT NULL,
    evidence_json TEXT NOT NULL,
    key_drivers_json TEXT NOT NULL,
    why_state_changed TEXT,
    previous_state TEXT,
    provenance TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stock_regimes (
    id TEXT PRIMARY KEY,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    state TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    atr_kes REAL NOT NULL,
    relative_volume REAL NOT NULL,
    range_compression_score REAL NOT NULL,
    breakout_distance_kes REAL,
    is_normal_pullback INTEGER NOT NULL,
    pullback_benchmark_atr_multiple REAL,
    why_state_changed TEXT,
    provenance TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
    id TEXT PRIMARY KEY,
    asset_symbol TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    setup_name TEXT NOT NULL,
    setup_criteria TEXT NOT NULL,
    prediction_horizon_sessions INTEGER NOT NULL,
    target_condition TEXT NOT NULL,
    adverse_condition TEXT NOT NULL,
    target_gain_pct REAL NOT NULL,
    adverse_risk_pct REAL NOT NULL,
    target_gain_kes REAL NOT NULL,
    adverse_risk_kes REAL NOT NULL,
    calculated_probability REAL NOT NULL,
    historical_sample_size INTEGER NOT NULL,
    confidence_interval_json TEXT,
    model_version TEXT NOT NULL,
    is_empirical INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL,
    outcome_verified_at TEXT,
    realized_gain_kes REAL,
    realized_gain_pct REAL,
    holding_sessions_actual INTEGER
);

CREATE TABLE IF NOT EXISTS prediction_outcomes (
    prediction_id TEXT PRIMARY KEY,
    evaluated_at TEXT NOT NULL,
    actual_result TEXT NOT NULL,
    realized_mfe_kes REAL NOT NULL,
    realized_mae_kes REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY(prediction_id) REFERENCES predictions(id)
);

CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    affected_asset TEXT,
    affected_sector TEXT,
    reason TEXT NOT NULL,
    supporting_metrics_json TEXT NOT NULL,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    is_acknowledged INTEGER NOT NULL DEFAULT 0,
    acknowledged_at TEXT
);

CREATE TABLE IF NOT EXISTS portfolios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    total_cash_kes REAL NOT NULL,
    invested_value_kes REAL NOT NULL,
    total_value_kes REAL NOT NULL,
    daily_unrealized_pl_kes REAL NOT NULL,
    daily_unrealized_pl_pct REAL NOT NULL,
    total_unrealized_pl_kes REAL NOT NULL,
    total_unrealized_pl_pct REAL NOT NULL,
    peak_portfolio_value_kes REAL NOT NULL,
    max_drawdown_kes REAL NOT NULL,
    max_drawdown_pct REAL NOT NULL,
    open_positions_count INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_positions (
    id TEXT PRIMARY KEY,
    portfolio_id TEXT NOT NULL,
    stock_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    shares REAL NOT NULL,
    average_entry_price REAL NOT NULL,
    current_price REAL NOT NULL,
    previous_close_price REAL NOT NULL,
    invested_value_kes REAL NOT NULL,
    current_value_kes REAL NOT NULL,
    gross_unrealized_pl_kes REAL NOT NULL,
    percentage_pl REAL NOT NULL,
    ksh_movement_per_share REAL NOT NULL,
    peak_unrealized_pl_kes REAL NOT NULL,
    profit_giveback_kes REAL NOT NULL,
    profit_giveback_pct REAL NOT NULL,
    maximum_adverse_excursion_kes REAL NOT NULL,
    maximum_favorable_excursion_kes REAL NOT NULL,
    holding_duration_days INTEGER NOT NULL,
    entry_date TEXT NOT NULL,
    notes TEXT,
    target_price_kes REAL,
    stop_loss_price_kes REAL,
    pullback_risk_rating TEXT NOT NULL,
    hold_vs_exit_json TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(portfolio_id) REFERENCES portfolios(id)
);

CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    position_id TEXT,
    symbol TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    shares REAL NOT NULL,
    price_per_share REAL NOT NULL,
    total_consideration_kes REAL NOT NULL,
    broker_fee_kes REAL NOT NULL,
    nse_cma_levies_kes REAL NOT NULL,
    total_cost_kes REAL NOT NULL,
    executed_at TEXT NOT NULL,
    execution_mode TEXT NOT NULL DEFAULT 'MANUAL_RECORDED',
    order_reference TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS trading_journal_entries (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    symbol TEXT,
    trade_id TEXT,
    title TEXT NOT NULL,
    setup_rationale TEXT NOT NULL,
    mental_state TEXT NOT NULL,
    adherence_to_plan INTEGER NOT NULL,
    market_regime_at_time TEXT NOT NULL,
    stock_regime_at_time TEXT NOT NULL,
    post_trade_review TEXT,
    lessons_learned TEXT
);

CREATE TABLE IF NOT EXISTS backtest_runs (
    id TEXT PRIMARY KEY,
    strategy_name TEXT NOT NULL,
    test_period_start TEXT NOT NULL,
    test_period_end TEXT NOT NULL,
    train_split_pct REAL NOT NULL,
    walk_forward_steps INTEGER NOT NULL,
    assumed_slippage_bps REAL NOT NULL,
    assumed_round_trip_commission_pct REAL NOT NULL,
    total_trades INTEGER NOT NULL,
    win_rate_pct REAL NOT NULL,
    profit_factor REAL NOT NULL,
    sharpe_ratio REAL NOT NULL,
    max_drawdown_pct REAL NOT NULL,
    expectancy_kes_per_trade REAL NOT NULL,
    has_look_ahead_bias_safeguards INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_quality_records (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_key TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    details TEXT NOT NULL,
    rejected INTEGER NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    trading_capital_kes REAL NOT NULL,
    preferred_holding_period TEXT NOT NULL,
    minimum_ksh_share_opportunity REAL NOT NULL,
    minimum_liquidity_daily_turnover_kes REAL NOT NULL,
    preferred_volatility TEXT NOT NULL,
    maximum_position_size_kes REAL NOT NULL,
    maximum_portfolio_allocation_per_stock_pct REAL NOT NULL,
    alert_sensitivity TEXT NOT NULL,
    monitored_symbols_json TEXT NOT NULL,
    profit_giveback_warning_threshold_pct REAL NOT NULL,
    is_demo_data_allowed INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_events (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    records_attempted INTEGER NOT NULL,
    records_accepted INTEGER NOT NULL,
    records_rejected INTEGER NOT NULL,
    fetch_latency_ms REAL NOT NULL,
    feed_delay_ms REAL,
    source_timestamp TEXT,
    ingested_at TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_ingestion_src_type ON ingestion_events(source_id, entity_type, ingested_at);

CREATE TABLE IF NOT EXISTS data_latency_metrics (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    fetch_latency_ms REAL NOT NULL,
    feed_delay_ms REAL,
    recorded_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_latency_src_time ON data_latency_metrics(source_id, recorded_at);

