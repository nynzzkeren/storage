import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const dbPath = path.join(os.tmpdir(), 'db.json');

async function ensureDb() {
  try {
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    try {
      await fs.access(dbPath);
    } catch {
      await fs.writeFile(dbPath, JSON.stringify({ files: [], profiles: {} }));
    }
  } catch (err) {
    console.error('Failed to initialize database', err);
  }
}

async function getDb() {
  await ensureDb();
  const data = await fs.readFile(dbPath, 'utf8');
  const parsed = JSON.parse(data);
  if (!parsed.profiles) parsed.profiles = {};
  return parsed;
}

async function saveDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function getFiles() {
  const db = await getDb();
  return db.files;
}

export async function getProfile(email) {
  const db = await getDb();
  return db.profiles[email] || { isSetupComplete: false, theme: '#0a0a0a', storageName: '', profilePic: '', musicLink: '' };
}

export async function updateProfile(email, profileData) {
  const db = await getDb();
  db.profiles[email] = { ...db.profiles[email], ...profileData };
  await saveDb(db);
  return db.profiles[email];
}


export async function addFile(file) {
  const db = await getDb();
  db.files.push(file);
  await saveDb(db);
}

export async function updateFileStatus(id, newStatus) {
  const db = await getDb();
  const index = db.files.findIndex(f => f.id === id);
  if (index !== -1) {
    db.files[index].status = newStatus;
    await saveDb(db);
    return db.files[index];
  }
  return null;
}

export async function getFile(id) {
  const db = await getDb();
  return db.files.find(f => f.id === id);
}
