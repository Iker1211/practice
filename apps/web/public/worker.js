// SharedWorker para SQLite con sql.js
// Este archivo debe estar en /public para ser servido como JS

const DB_NAME = "myapp-sqlite";
const DB_STORE = "database";
const DB_KEY = "data";

const schemaSQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_deleted_at ON ideas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  content TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT DEFAULT NULL,
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_idea_id ON blocks(idea_id);
CREATE INDEX IF NOT EXISTS idx_blocks_deleted_at ON blocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_blocks_position ON blocks(idea_id, position);

CREATE TABLE IF NOT EXISTS associations (
  id TEXT PRIMARY KEY,
  idea_id_1 TEXT NOT NULL,
  idea_id_2 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL,
  FOREIGN KEY (idea_id_1) REFERENCES ideas(id),
  FOREIGN KEY (idea_id_2) REFERENCES ideas(id),
  CHECK (idea_id_1 != idea_id_2)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_association ON associations(idea_id_1, idea_id_2);
CREATE INDEX IF NOT EXISTS idx_associations_deleted_at ON associations(deleted_at);
`;

let db = null;
let SQL = null;

// ==========================================
// IndexedDB Persistence
// ==========================================

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const idb = event.target.result;
      if (!idb.objectStoreNames.contains(DB_STORE)) {
        idb.createObjectStore(DB_STORE);
      }
    };
  });
}

async function loadFromIndexedDB() {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const request = store.get(DB_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(data) {
  const idb = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const request = store.put(data, DB_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ==========================================
// Database Initialization
// ==========================================

async function initDatabase() {
  if (db) return db;

  console.log("[SQLite Worker] Loading sql.js...");

  // Cargar sql.js desde /public (local)
  if (!SQL) {
    importScripts("/sql-wasm.js");
    SQL = await initSqlJs({
      locateFile: (file) => `/${file}`
    });
  }

  const savedData = await loadFromIndexedDB();

  if (savedData) {
    db = new SQL.Database(savedData);
    console.log("[SQLite Worker] Database loaded from IndexedDB");
  } else {
    db = new SQL.Database();
    db.run(schemaSQL);

    // Seed de prueba
    const testId = crypto.randomUUID();
    const now = new Date().toISOString();
    db.run(`
      INSERT INTO ideas (id, title, created_at, updated_at, version)
      VALUES ('${testId}', 'Idea seed (UUID: ${testId.slice(0, 8)}...)', '${now}', '${now}', 1)
    `);

    console.log("[SQLite Worker] New database created");
    console.log("[SQLite Worker] Seed UUID:", testId);
  }

  return db;
}

async function persistDatabase() {
  if (!db) return;
  const data = db.export();
  await saveToIndexedDB(data);
  console.log("[SQLite Worker] Database persisted");
}

// ==========================================
// SharedWorker Connection Handler
// ==========================================

const connections = [];

self.onconnect = (event) => {
  const port = event.ports[0];
  connections.push(port);

  console.log("[SQLite Worker] New connection, total:", connections.length);

  port.onmessage = async (e) => {
    const { query, params, id } = e.data;

    try {
      const database = await initDatabase();
      const isSelect = query.trim().toUpperCase().startsWith("SELECT");

      if (isSelect) {
        const stmt = database.prepare(query);
        if (params?.length) stmt.bind(params);

        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();

        port.postMessage({ success: true, result: results, id });
      } else {
        database.run(query, params);
        await persistDatabase();
        const changes = database.getRowsModified();
        port.postMessage({ success: true, result: { changes }, id });

        // Notificar a otras conexiones que hubo cambios
        connections.forEach((p) => {
          if (p !== port) {
            p.postMessage({ type: "db-changed" });
          }
        });
      }
    } catch (error) {
      console.error("[SQLite Worker] Error:", error);
      port.postMessage({
        success: false,
        error: error.message || "Unknown error",
        id
      });
    }
  };

  port.start();
};
