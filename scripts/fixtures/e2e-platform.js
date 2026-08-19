import { platformContract } from '../../src/platform/contracts.js';

const STORAGE_KEY = 'lexia_m28c_progress_v1';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seedLetters() {
  const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return Array.from({ length: 26 }, (_, index) => {
    const letter = String.fromCharCode(65 + index);
    return {
      id: `e2e-letter-${letter}`,
      child_name: 'Jogador',
      letter,
      stability: 10,
      difficulty: 3,
      interval: 30,
      repetitions: 5,
      next_review: future,
      total_attempts: 5,
      correct_attempts: 5,
      streak: 5,
      last_grade: 4,
      stars_earned: 2,
      level: 1,
    };
  });
}

function readProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = seedLetters();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function writeProgress(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function nextId(records) {
  return `e2e-progress-${records.length + 1}`;
}

const progress = {
  async list() {
    return clone(readProgress());
  },
  async create(data) {
    const records = readProgress();
    const created = { id: nextId(records), ...clone(data) };
    records.push(created);
    writeProgress(records);
    return clone(created);
  },
  async update(id, data) {
    const records = readProgress();
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error(`E2E progress record not found: ${id}`);
    records[index] = { ...records[index], ...clone(data), id };
    writeProgress(records);
    return clone(records[index]);
  },
  async remove(id) {
    const records = readProgress().filter((record) => record.id !== id);
    writeProgress(records);
    return null;
  },
  async clearAll() {
    writeProgress([]);
    return [];
  },
};

export const lexiaPlatform = {
  provider: 'e2e-memory',
  progress,
  auth: {
    async me() { return { id: 'e2e-user', email: 'e2e@lexia.invalid' }; },
    async logout() { return null; },
    async redirectToLogin() { return null; },
    async getPublicSettings() { return { id: 'e2e', public_settings: {} }; },
    hasAccessToken() { return false; },
    async signInWithPassword() { return { user: { id: 'e2e-user' } }; },
    async signUp() { return { user: { id: 'e2e-user' } }; },
    async requestPasswordReset() { return null; },
  },
  storage: {
    async uploadFile() { return { file_url: 'data:image/png;base64,e2e' }; },
  },
  ai: {
    async invoke() { return { score: 95, grade: 4, feedback: 'Muito bem!', recognized_as: 'A' }; },
  },
  email: {
    async send() { return { ok: true }; },
  },
};

export const activePlatformProvider = lexiaPlatform.provider;
export const platformReadiness = { ready: true, missing: [] };
export { platformContract };
