/**
 * Extensible Alert Engine
 * 
 * Strict Principle:
 * - Deterministic, non-spammy alerts backed by concrete numbers and evidence.
 * - Manages acknowledgment, resolution, and severity levels.
 */

import { Alert, AlertType, AlertSeverity } from '../../types/index.ts';
import { queryAll, runCommand } from '../../db/database.ts';
import { logger } from '../logger.ts';

export class AlertService {
  public async getAlerts(onlyActive = true): Promise<Alert[]> {
    try {
      const sql = onlyActive 
        ? 'SELECT * FROM alerts WHERE status = "ACTIVE" ORDER BY timestamp DESC LIMIT 50'
        : 'SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 100';
      const rows = await queryAll<any>(sql);
      return rows.map(r => ({
        id: r.id,
        type: r.type as AlertType,
        severity: r.severity as AlertSeverity,
        timestamp: r.timestamp,
        affectedAsset: r.affected_asset,
        affectedSector: r.affected_sector,
        reason: r.reason,
        supportingMetrics: r.supporting_metrics_json ? JSON.parse(r.supporting_metrics_json) : {},
        source: r.source,
        status: r.status,
        isAcknowledged: Boolean(r.is_acknowledged),
        acknowledgedAt: r.acknowledged_at
      }));
    } catch (err: any) {
      logger.error('AlertService', 'Error fetching alerts', err);
      return [];
    }
  }

  public async createAlert(alertData: Omit<Alert, 'id' | 'status' | 'isAcknowledged'>): Promise<Alert> {
    const alert: Alert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'ACTIVE',
      isAcknowledged: false,
      ...alertData
    };

    await runCommand(
      `INSERT INTO alerts (id, type, severity, timestamp, affected_asset, affected_sector, reason, supporting_metrics_json, source, status, is_acknowledged)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alert.id, alert.type, alert.severity, alert.timestamp, alert.affectedAsset, alert.affectedSector,
        alert.reason, JSON.stringify(alert.supportingMetrics), alert.source, alert.status, 0
      ]
    );

    logger.info('AlertService', `Generated [${alert.severity}] alert for ${alert.affectedAsset || 'MARKET'}: ${alert.reason}`);
    return alert;
  }

  public async acknowledgeAlert(id: string): Promise<void> {
    const now = new Date().toISOString();
    await runCommand(
      'UPDATE alerts SET is_acknowledged = 1, acknowledged_at = ? WHERE id = ?',
      [now, id]
    );
  }

  public async dismissAlert(id: string): Promise<void> {
    await runCommand(
      'UPDATE alerts SET status = "DISMISSED" WHERE id = ?',
      [id]
    );
  }
}

export const alertService = new AlertService();
