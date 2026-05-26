// In-memory + localStorage-backed Supabase mock for E2E tests.
// Activated when VITE_E2E === '1'. Supports the subset of methods the app uses:
//   - auth.signInWithPassword / signUp / signOut / getSession / onAuthStateChange / resetPasswordForEmail / signInWithOAuth
//   - from(table).select().eq().order().limit().maybeSingle().single()
//   - from(table).insert(...).select().single()
//   - from(table).update(...).eq()
//   - from(table).upsert(..., { onConflict })
//   - from(table).delete().eq()

const STORAGE_KEY = 'e2e_supabase_state';
const SESSION_KEY = 'e2e_supabase_session';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { tables: {} };
  } catch {
    return { tables: {} };
  }
}
function saveState(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}
function saveSession(s) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

let listeners = [];

function emitAuth(event, session) {
  listeners.forEach((cb) => cb(event, session));
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureTable(state, name) {
  if (!state.tables[name]) state.tables[name] = [];
  return state.tables[name];
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every((f) => {
      if (f.op === 'eq') return row[f.col] === f.val;
      if (f.op === 'gte') return String(row[f.col]) >= String(f.val);
      if (f.op === 'lte') return String(row[f.col]) <= String(f.val);
      return true;
    })
  );
}

function createQuery(tableName) {
  const state = loadState();
  const table = ensureTable(state, tableName);
  const filters = [];
  let orderCol = null;
  let orderAsc = true;
  let limitN = null;

  const exec = () => {
    let rows = applyFilters([...table], filters);
    if (orderCol) {
      rows.sort((a, b) => {
        const av = a[orderCol], bv = b[orderCol];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (orderAsc ? 1 : -1);
      });
    }
    if (limitN != null) rows = rows.slice(0, limitN);
    return rows;
  };

  const builder = {
    select() { return builder; },
    eq(col, val) { filters.push({ op: 'eq', col, val }); return builder; },
    gte(col, val) { filters.push({ op: 'gte', col, val }); return builder; },
    lte(col, val) { filters.push({ op: 'lte', col, val }); return builder; },
    order(col, opts = {}) { orderCol = col; orderAsc = opts.ascending !== false; return builder; },
    limit(n) { limitN = n; return builder; },
    maybeSingle() { const r = exec(); return Promise.resolve({ data: r[0] ?? null, error: null }); },
    single() {
      const r = exec();
      if (!r[0]) return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
      return Promise.resolve({ data: r[0], error: null });
    },
    then(resolve, reject) {
      try { resolve({ data: exec(), error: null }); } catch (e) { reject({ data: null, error: e }); }
    },
  };
  return builder;
}

function createMutation(tableName, kind, payload, opts) {
  const state = loadState();
  const table = ensureTable(state, tableName);
  let returned = [];

  if (kind === 'insert') {
    const rows = Array.isArray(payload) ? payload : [payload];
    rows.forEach((r) => {
      const row = { id: r.id || uuid(), created_at: new Date().toISOString(), ...r };
      table.push(row);
      returned.push(row);
    });
    saveState(state);
  } else if (kind === 'upsert') {
    const rows = Array.isArray(payload) ? payload : [payload];
    const conflictCols = (opts?.onConflict || 'id').split(',').map((s) => s.trim());
    rows.forEach((r) => {
      const idx = table.findIndex((row) => conflictCols.every((c) => row[c] === r[c]));
      if (idx >= 0) {
        table[idx] = { ...table[idx], ...r };
        returned.push(table[idx]);
      } else {
        const row = { id: r.id || uuid(), created_at: new Date().toISOString(), ...r };
        table.push(row);
        returned.push(row);
      }
    });
    saveState(state);
  }

  const filters = [];
  const builder = {
    select() { return builder; },
    eq(col, val) {
      if (kind === 'delete' || kind === 'update') filters.push({ col, val });
      return builder;
    },
    single() { return Promise.resolve({ data: returned[0] ?? null, error: null }); },
    then(resolve) {
      if (kind === 'delete') {
        const next = table.filter((r) => !filters.every((f) => r[f.col] === f.val));
        state.tables[tableName] = next;
        saveState(state);
      } else if (kind === 'update') {
        const matches = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        matches.forEach((m) => Object.assign(m, payload));
        saveState(state);
        returned = matches;
      }
      resolve({ data: returned, error: null });
    },
  };
  return builder;
}

function createFromBuilder(tableName) {
  return {
    select() { return createQuery(tableName); },
    insert(payload) { return createMutation(tableName, 'insert', payload); },
    upsert(payload, opts) { return createMutation(tableName, 'upsert', payload, opts); },
    update(payload) { return createMutation(tableName, 'update', payload); },
    delete() { return createMutation(tableName, 'delete'); },
  };
}

export const supabaseFake = {
  auth: {
    async getSession() {
      return { data: { session: loadSession() }, error: null };
    },
    onAuthStateChange(cb) {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe: () => { listeners = listeners.filter((l) => l !== cb); } } } };
    },
    async signUp({ email, password }) {
      if (!email || !password) return { data: null, error: { message: 'Email and password required' } };
      const session = { user: { id: uuid(), email }, access_token: 'fake' };
      saveSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithPassword({ email, password }) {
      if (!email || !password) return { data: null, error: { message: 'Invalid login credentials' } };
      if (password === 'wrongpass') return { data: null, error: { message: 'Invalid login credentials' } };
      const session = { user: { id: 'e2e-user-1', email }, access_token: 'fake' };
      saveSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithOAuth() {
      const session = { user: { id: 'e2e-user-1', email: 'oauth@example.com' }, access_token: 'fake' };
      saveSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { url: '/' }, error: null };
    },
    async signOut() {
      saveSession(null);
      emitAuth('SIGNED_OUT', null);
      return { error: null };
    },
    async resetPasswordForEmail() {
      return { data: {}, error: null };
    },
  },
  from(tableName) {
    return createFromBuilder(tableName);
  },
};
