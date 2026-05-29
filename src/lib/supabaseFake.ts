// In-memory + localStorage-backed Supabase mock for E2E tests.
// Activated when VITE_E2E === '1'. Supports the subset of methods the app uses.

type Row = Record<string, unknown>;

interface State {
  tables: Record<string, Row[]>;
}

interface FakeSession {
  user: { id: string; email: string };
  access_token: string;
}

type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT';
type AuthListener = (event: AuthEvent, session: FakeSession | null) => void;

interface Filter {
  op: 'eq' | 'gte' | 'lte';
  col: string;
  val: unknown;
}

interface MutationFilter {
  col: string;
  val: unknown;
}

interface UpsertOpts {
  onConflict?: string;
}

const STORAGE_KEY = 'e2e_supabase_state';
const SESSION_KEY = 'e2e_supabase_session';

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { tables: {} };
  } catch {
    return { tables: {} };
  }
}
function saveState(s: State): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}
function loadSession(): FakeSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function saveSession(s: FakeSession | null): void {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

let listeners: AuthListener[] = [];

function emitAuth(event: AuthEvent, session: FakeSession | null): void {
  listeners.forEach((cb) => cb(event, session));
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function ensureTable(state: State, name: string): Row[] {
  if (!state.tables[name]) state.tables[name] = [];
  return state.tables[name];
}

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((row) =>
    filters.every((f) => {
      if (f.op === 'eq') return row[f.col] === f.val;
      if (f.op === 'gte') return String(row[f.col]) >= String(f.val);
      if (f.op === 'lte') return String(row[f.col]) <= String(f.val);
      return true;
    })
  );
}

interface QueryBuilder {
  select(): QueryBuilder;
  eq(col: string, val: unknown): QueryBuilder;
  gte(col: string, val: unknown): QueryBuilder;
  lte(col: string, val: unknown): QueryBuilder;
  order(col: string, opts?: { ascending?: boolean }): QueryBuilder;
  limit(n: number): QueryBuilder;
  maybeSingle(): Promise<{ data: Row | null; error: null }>;
  single(): Promise<{ data: Row | null; error: { code: string } | null }>;
  then(resolve: (r: { data: Row[]; error: null }) => void, reject?: (r: { data: null; error: unknown }) => void): void;
}

function createQuery(tableName: string): QueryBuilder {
  const state = loadState();
  const table = ensureTable(state, tableName);
  const filters: Filter[] = [];
  let orderCol: string | null = null;
  let orderAsc = true;
  let limitN: number | null = null;

  const exec = (): Row[] => {
    let rows = applyFilters([...table], filters);
    if (orderCol) {
      const col = orderCol;
      rows.sort((a, b) => {
        const av = a[col], bv = b[col];
        if (av === bv) return 0;
        return ((av as number | string) > (bv as number | string) ? 1 : -1) * (orderAsc ? 1 : -1);
      });
    }
    if (limitN != null) rows = rows.slice(0, limitN);
    return rows;
  };

  const builder: QueryBuilder = {
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
      try { resolve({ data: exec(), error: null }); }
      catch (e) { reject?.({ data: null, error: e }); }
    },
  };
  return builder;
}

type MutationKind = 'insert' | 'upsert' | 'update' | 'delete';

interface MutationBuilder {
  select(): MutationBuilder;
  eq(col: string, val: unknown): MutationBuilder;
  single(): Promise<{ data: Row | null; error: null }>;
  then(resolve: (r: { data: Row[]; error: null }) => void): void;
}

function createMutation(
  tableName: string,
  kind: MutationKind,
  payload?: Row | Row[],
  opts?: UpsertOpts,
): MutationBuilder {
  const state = loadState();
  const table = ensureTable(state, tableName);
  let returned: Row[] = [];

  if (kind === 'insert' && payload) {
    const rows = Array.isArray(payload) ? payload : [payload];
    rows.forEach((r) => {
      const row: Row = { id: r['id'] || uuid(), created_at: new Date().toISOString(), ...r };
      table.push(row);
      returned.push(row);
    });
    saveState(state);
  } else if (kind === 'upsert' && payload) {
    const rows = Array.isArray(payload) ? payload : [payload];
    const conflictCols = (opts?.onConflict || 'id').split(',').map((s) => s.trim());
    rows.forEach((r) => {
      const idx = table.findIndex((row) => conflictCols.every((c) => row[c] === r[c]));
      if (idx >= 0) {
        const existing = table[idx];
        if (existing) {
          table[idx] = { ...existing, ...r };
          returned.push(table[idx]!);
        }
      } else {
        const row: Row = { id: r['id'] || uuid(), created_at: new Date().toISOString(), ...r };
        table.push(row);
        returned.push(row);
      }
    });
    saveState(state);
  }

  const filters: MutationFilter[] = [];
  const builder: MutationBuilder = {
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
      } else if (kind === 'update' && payload) {
        const matches = table.filter((r) => filters.every((f) => r[f.col] === f.val));
        const update = payload as Row;
        matches.forEach((m) => Object.assign(m, update));
        saveState(state);
        returned = matches;
      }
      resolve({ data: returned, error: null });
    },
  };
  return builder;
}

interface FromBuilder {
  select(): QueryBuilder;
  insert(payload: Row | Row[]): MutationBuilder;
  upsert(payload: Row | Row[], opts?: UpsertOpts): MutationBuilder;
  update(payload: Row): MutationBuilder;
  delete(): MutationBuilder;
}

function createFromBuilder(tableName: string): FromBuilder {
  return {
    select() { return createQuery(tableName); },
    insert(payload) { return createMutation(tableName, 'insert', payload); },
    upsert(payload, opts) { return createMutation(tableName, 'upsert', payload, opts); },
    update(payload) { return createMutation(tableName, 'update', payload); },
    delete() { return createMutation(tableName, 'delete'); },
  };
}

interface AuthOpts {
  email: string;
  password: string;
}

interface Subscription {
  data: { subscription: { unsubscribe: () => void } };
}

export const supabaseFake = {
  auth: {
    async getSession(): Promise<{ data: { session: FakeSession | null }; error: null }> {
      return { data: { session: loadSession() }, error: null };
    },
    onAuthStateChange(cb: AuthListener): Subscription {
      listeners.push(cb);
      return { data: { subscription: { unsubscribe: () => { listeners = listeners.filter((l) => l !== cb); } } } };
    },
    async signUp({ email, password }: AuthOpts) {
      if (!email || !password) return { data: null, error: { message: 'Email and password required' } };
      const session: FakeSession = { user: { id: uuid(), email }, access_token: 'fake' };
      saveSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithPassword({ email, password }: AuthOpts) {
      if (!email || !password) return { data: null, error: { message: 'Invalid login credentials' } };
      if (password === 'wrongpass') return { data: null, error: { message: 'Invalid login credentials' } };
      const session: FakeSession = { user: { id: 'e2e-user-1', email }, access_token: 'fake' };
      saveSession(session);
      emitAuth('SIGNED_IN', session);
      return { data: { user: session.user, session }, error: null };
    },
    async signInWithOAuth() {
      const session: FakeSession = { user: { id: 'e2e-user-1', email: 'oauth@example.com' }, access_token: 'fake' };
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
  from(tableName: string): FromBuilder {
    return createFromBuilder(tableName);
  },
};
