import { openDB } from 'idb';

const DB_NAME = 'repertory-grid-coach';
const DB_VERSION = 1;

export const db = await openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('sessions')) {
      const store = db.createObjectStore('sessions', { keyPath: 'id' });
      store.createIndex('createdAt', 'createdAt');
    }
  },
});

export async function saveSession(session) {
  return db.put('sessions', { ...session, _synced: new Date().toISOString() });
}

export async function loadAllSessions() {
  const sessions = await db.getAll('sessions');
  return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function loadSession(id) {
  return db.get('sessions', id);
}

export async function deleteSession(id) {
  return db.delete('sessions', id);
}
