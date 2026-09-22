/**
 * Master Relational Database Layer
 * Uses SQL.js (SQLite WebAssembly) backed by disk persistence.
 * Guarantees zero reliance on browser localStorage and supports large historical datasets.
 */

import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlDatabase, QueryExecResult } from 'sql.js';
import { logger } from '../services/logger.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nse_intelligence.sqlite');
const SCHEMA_FILE = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');

let dbInstance: SqlDatabase | null = null;
let initPromise: Promise<SqlDatabase> | null = null;

export async function getDatabase(): Promise<SqlDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const SQL = await initSqlJs();

      if (fs.existsSync(DB_FILE)) {
        const fileBuffer = fs.readFileSync(DB_FILE);
        dbInstance = new SQL.Database(fileBuffer);
        logger.info('Database', `Loaded existing SQLite database from ${DB_FILE}`);
      } else {
        dbInstance = new SQL.Database();
        logger.info('Database', `Created fresh SQLite database at ${DB_FILE}`);
      }

      // Run Schema migrations
      if (fs.existsSync(SCHEMA_FILE)) {
        const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
        dbInstance.run(schemaSql);
        saveDatabase();
        logger.info('Database', 'Schema DDL migration completed successfully.');
      }

      return dbInstance;
    } catch (err: any) {
      logger.error('Database', 'Failed to initialize SQLite database', err);
      throw err;
    }
  })();

  return initPromise;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err: any) {
    logger.error('Database', 'Error persisting SQLite database to disk', err);
  }
}

/**
 * Executes a parameterised query and returns an array of objects
 */
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

/**
 * Returns a single row or null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Runs a SQL command (INSERT, UPDATE, DELETE) and persists to disk
 */
export async function runCommand(sql: string, params: any[] = []): Promise<void> {
  const db = await getDatabase();
  db.run(sql, params);
  saveDatabase();
}

/**
 * Executes multiple raw statements (e.g. scripts)
 */
export async function execScript(sql: string): Promise<QueryExecResult[]> {
  const db = await getDatabase();
  const result = db.exec(sql);
  saveDatabase();
  return result;
}
