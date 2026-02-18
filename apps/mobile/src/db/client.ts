// apps/mobile/src/db/client.ts
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import type { DatabaseAdapter } from '@myapp/lib/db/adapter';
import { schemaSQL } from '@myapp/lib/db/schema';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let db: SQLiteDBConnection | null = null;

async function initDatabase(): Promise<SQLiteDBConnection> {
  if (db) return db;

  const platform = Capacitor.getPlatform();
  
  // Para web durante desarrollo
  if (platform === 'web') {
    await customElements.whenDefined('jeep-sqlite');
    await sqlite.initWebStore();
  }

  db = await sqlite.createConnection('myapp', false, 'no-encryption', 1, false);
  await db.open();
  await db.execute(schemaSQL);
  
  return db;
}

export class CapacitorDatabaseAdapter implements DatabaseAdapter {
  async execute<T = any>(query: string, params: any[] = []): Promise<T> {
    const database = await initDatabase();
    const isSelect = query.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const result = await database.query(query, params);
      return result.values as T;
    } else {
      const result = await database.run(query, params);
      return { changes: result.changes?.changes ?? 0 } as T;
    }
  }
}