/**
 * A lightweight mock Supabase client that stores data in-memory
 * and persists to localStorage.  The query-builder API mirrors
 * the real @supabase/supabase-js patterns used in this project.
 */

import { getInitialMockData, MOCK_AUTH_USER, MOCK_SESSION } from './mockData';

// ─── Store (in-memory + localStorage) ────────────────────────
const STORAGE_KEY = 'mock-supabase-db';
const MOCK_DB_VERSION = 'v5-squads-2026-02-23'; // bump to force re-seed with squad assignments
const VERSION_KEY = 'mock-supabase-db-version';

class MockStore {
  private data: Record<string, any[]>;

  constructor() {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && storedVersion === MOCK_DB_VERSION) {
        this.data = JSON.parse(stored);
      } else {
        this.data = getInitialMockData();
        localStorage.setItem(VERSION_KEY, MOCK_DB_VERSION);
        this.persist();
      }
    } catch {
      this.data = getInitialMockData();
      this.persist();
    }
  }

  getTable(name: string): any[] {
    return [...(this.data[name] || [])];
  }

  addRecords(table: string, records: any[]) {
    if (!this.data[table]) this.data[table] = [];
    this.data[table].push(...records);
    this.persist();
  }

  updateRecords(table: string, updated: any[]) {
    if (!this.data[table]) return;
    const map = new Map(updated.map(r => [r.id, r]));
    this.data[table] = this.data[table].map(r => map.get(r.id) ?? r);
    this.persist();
  }

  deleteRecords(table: string, ids: string[]) {
    if (!this.data[table]) return;
    const idSet = new Set(ids);
    this.data[table] = this.data[table].filter(r => !idSet.has(r.id));
    this.persist();
  }

  /** Wipe all data and re-seed */
  reset() {
    this.data = getInitialMockData();
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // quota exceeded – ignore
    }
  }
}

const store = new MockStore();

// ─── Query Builder ───────────────────────────────────────────

class MockQueryBuilder {
  private _table: string;
  private _operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private _filters: Array<(r: any) => boolean> = [];
  private _orderCol: string | null = null;
  private _orderAsc = true;
  private _limitN: number | null = null;
  private _isSingle = false;
  private _returnData = true;
  private _payload: any = null;
  private _joins: Array<{ table: string; fkCol: string; alias: string }> = [];

  constructor(table: string) {
    this._table = table;
  }

  /**
   * Derive the likely FK column name from a related table name.
   * e.g. "crm_tags" → "tag_id", "profiles" → "profile_id"
   */
  private static deriveFk(relatedTable: string): string {
    let base = relatedTable;
    // Strip common prefixes
    for (const prefix of ['crm_', 'approval_']) {
      if (base.startsWith(prefix)) {
        base = base.slice(prefix.length);
        break;
      }
    }
    // Singularize (remove trailing 's')
    if (base.endsWith('ies')) {
      base = base.slice(0, -3) + 'y';
    } else if (base.endsWith('ses')) {
      base = base.slice(0, -2);
    } else if (base.endsWith('s')) {
      base = base.slice(0, -1);
    }
    return `${base}_id`;
  }

  // ── Operation starters ──

  select(_columns?: string) {
    if (this._operation === 'insert' || this._operation === 'update' || this._operation === 'upsert') {
      // chained after insert/update → just mark that data should be returned
      this._returnData = true;
    } else {
      this._operation = 'select';
      this._returnData = true;
    }

    // Parse relational/join patterns: "table_name (col1, col2, ...)" or "table_name!hint (col1, ...)"
    if (_columns) {
      const joinRegex = /(\w+)(?:!\w+)?\s*\(\s*([^)]*)\)/g;
      let match: RegExpExecArray | null;
      while ((match = joinRegex.exec(_columns)) !== null) {
        const relatedTable = match[1];
        const fkCol = MockQueryBuilder.deriveFk(relatedTable);
        this._joins.push({ table: relatedTable, fkCol, alias: relatedTable });
      }
    }

    return this;
  }

  insert(data: any) {
    this._operation = 'insert';
    this._payload = data;
    this._returnData = false;
    return this;
  }

  update(data: any) {
    this._operation = 'update';
    this._payload = data;
    this._returnData = false;
    return this;
  }

  upsert(data: any) {
    this._operation = 'upsert';
    this._payload = data;
    this._returnData = false;
    return this;
  }

  delete() {
    this._operation = 'delete';
    this._returnData = false;
    return this;
  }

  // ── Filters ──

  eq(col: string, val: any) {
    this._filters.push(r => r[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this._filters.push(r => r[col] !== val);
    return this;
  }

  in(col: string, vals: any[]) {
    this._filters.push(r => vals.includes(r[col]));
    return this;
  }

  or(filterStr: string) {
    const conditions = filterStr.split(',');
    const fns = conditions.map(cond => {
      const match = cond.match(/^(\w+)\.(\w+)\.(.+)$/);
      if (!match) return () => true;
      const [, col, op, val] = match;
      switch (op) {
        case 'eq': return (r: any) => String(r[col]) === val;
        case 'neq': return (r: any) => String(r[col]) !== val;
        case 'gt': return (r: any) => r[col] > val;
        case 'gte': return (r: any) => r[col] >= val;
        case 'lt': return (r: any) => r[col] < val;
        case 'lte': return (r: any) => r[col] <= val;
        case 'is': return (r: any) => val === 'null' ? r[col] == null : r[col] == val;
        default: return () => true;
      }
    });
    this._filters.push(r => fns.some(fn => fn(r)));
    return this;
  }

  gte(col: string, val: any) {
    this._filters.push(r => r[col] >= val);
    return this;
  }

  lte(col: string, val: any) {
    this._filters.push(r => r[col] <= val);
    return this;
  }

  gt(col: string, val: any) {
    this._filters.push(r => r[col] > val);
    return this;
  }

  lt(col: string, val: any) {
    this._filters.push(r => r[col] < val);
    return this;
  }

  like(col: string, pattern: string) {
    const regex = new RegExp('^' + pattern.replace(/%/g, '.*') + '$', 'i');
    this._filters.push(r => regex.test(String(r[col] ?? '')));
    return this;
  }

  ilike(col: string, pattern: string) {
    return this.like(col, pattern);
  }

  is(col: string, val: any) {
    this._filters.push(r => (val === null ? r[col] == null : r[col] === val));
    return this;
  }

  contains(col: string, val: any) {
    this._filters.push(r => {
      const v = r[col];
      if (Array.isArray(v)) return Array.isArray(val) ? val.every((i: any) => v.includes(i)) : v.includes(val);
      return false;
    });
    return this;
  }

  not(col: string, op: string, val: any) {
    if (op === 'eq') this._filters.push(r => r[col] !== val);
    else if (op === 'is') this._filters.push(r => (val === null ? r[col] != null : r[col] !== val));
    return this;
  }

  // ── Modifiers ──

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderCol = col;
    this._orderAsc = opts?.ascending !== false;
    return this;
  }

  limit(n: number) {
    this._limitN = n;
    return this;
  }

  range(_from: number, _to: number) {
    // simplistic range support
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  maybeSingle() {
    this._isSingle = true;
    return this;
  }

  // ── Thenable (makes await work) ──

  then<T1 = { data: any; error: any }, T2 = never>(
    onfulfilled?: ((v: { data: any; error: any }) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((e: any) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  // ── Execution ──

  private applyFilters(records: any[]): any[] {
    return this._filters.reduce((acc, fn) => acc.filter(fn), records);
  }

  private applyOrder(records: any[]): any[] {
    if (!this._orderCol) return records;
    const col = this._orderCol;
    const asc = this._orderAsc;
    return [...records].sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av == null && bv == null) return 0;
      if (av == null) return asc ? -1 : 1;
      if (bv == null) return asc ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av;
      return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }

  private execute(): { data: any; error: any; count?: number } {
    try {
      switch (this._operation) {
        case 'select': {
          let rows = this.applyFilters(store.getTable(this._table));
          rows = this.applyOrder(rows);
          if (this._limitN != null) rows = rows.slice(0, this._limitN);

          // Resolve relational joins
          if (this._joins.length > 0) {
            rows = rows.map(row => {
              const enriched = { ...row };
              for (const join of this._joins) {
                const fkValue = row[join.fkCol];
                if (fkValue != null) {
                  const relatedRows = store.getTable(join.table);
                  const related = relatedRows.find(r => r.id === fkValue);
                  enriched[join.alias] = related ?? null;
                } else {
                  enriched[join.alias] = null;
                }
              }
              return enriched;
            });
          }

          if (this._isSingle) {
            return rows.length > 0
              ? { data: rows[0], error: null }
              : { data: null, error: { code: 'PGRST116', message: 'Row not found' } };
          }
          return { data: rows, error: null, count: rows.length };
        }

        case 'insert': {
          const items = Array.isArray(this._payload) ? this._payload : [this._payload];
          const inserted = items.map(item => ({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item,
          }));
          store.addRecords(this._table, inserted);
          if (this._returnData) {
            return this._isSingle
              ? { data: inserted[0], error: null }
              : { data: inserted, error: null };
          }
          return { data: null, error: null };
        }

        case 'update': {
          const rows = this.applyFilters(store.getTable(this._table));
          const updated = rows.map(r => ({
            ...r,
            ...this._payload,
            updated_at: new Date().toISOString(),
          }));
          store.updateRecords(this._table, updated);
          if (this._returnData) {
            return this._isSingle
              ? { data: updated[0] ?? null, error: null }
              : { data: updated, error: null };
          }
          return { data: null, error: null };
        }

        case 'upsert': {
          const items = Array.isArray(this._payload) ? this._payload : [this._payload];
          const existing = store.getTable(this._table);
          const existingIds = new Set(existing.map(r => r.id));
          const toInsert: any[] = [];
          const toUpdate: any[] = [];

          items.forEach(item => {
            if (item.id && existingIds.has(item.id)) {
              toUpdate.push({ ...existing.find(r => r.id === item.id), ...item, updated_at: new Date().toISOString() });
            } else {
              toInsert.push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...item });
            }
          });

          if (toUpdate.length) store.updateRecords(this._table, toUpdate);
          if (toInsert.length) store.addRecords(this._table, toInsert);

          const all = [...toUpdate, ...toInsert];
          if (this._returnData) {
            return this._isSingle ? { data: all[0] ?? null, error: null } : { data: all, error: null };
          }
          return { data: null, error: null };
        }

        case 'delete': {
          const rows = this.applyFilters(store.getTable(this._table));
          store.deleteRecords(this._table, rows.map(r => r.id));
          return { data: null, error: null };
        }

        default:
          return { data: null, error: null };
      }
    } catch (err: any) {
      console.error('[MockSupabase] Error executing query:', err);
      return { data: null, error: { message: err.message || 'Unknown mock error' } };
    }
  }
}

// ─── Mock Channel (no-op real-time) ──────────────────────────

class MockChannel {
  on(_event: string, _opts: any, _callback?: any) {
    return this;
  }
  subscribe() {
    return this;
  }
  unsubscribe() {
    return this;
  }
}

// ─── Mock Auth ───────────────────────────────────────────────

const authListeners = new Set<(event: string, session: any) => void>();

const mockAuth = {
  getSession: () => Promise.resolve({ data: { session: MOCK_SESSION }, error: null }),
  getUser: () => Promise.resolve({ data: { user: MOCK_AUTH_USER }, error: null }),
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    authListeners.add(callback);
    // Fire initial event async to match real Supabase behaviour
    setTimeout(() => callback('INITIAL_SESSION', MOCK_SESSION), 0);
    return {
      data: {
        subscription: {
          id: 'mock-sub',
          unsubscribe: () => { authListeners.delete(callback); },
        },
      },
    };
  },
  signInWithPassword: (_creds: { email: string; password: string }) =>
    Promise.resolve({ data: { session: MOCK_SESSION, user: MOCK_AUTH_USER }, error: null }),
  signUp: (_creds: { email: string; password: string }) =>
    Promise.resolve({ data: { session: MOCK_SESSION, user: MOCK_AUTH_USER }, error: null }),
  signOut: (_opts?: any) => {
    // No-op in demo
    return Promise.resolve({ error: null });
  },
  updateUser: (_attrs: any) => Promise.resolve({ data: { user: MOCK_AUTH_USER }, error: null }),
  resetPasswordForEmail: (_email: string) => Promise.resolve({ data: {}, error: null }),
};

// ─── Mock Functions ──────────────────────────────────────────

const mockFunctions = {
  invoke: (fnName: string, _options?: any) => {
    console.warn(`[MockSupabase] Edge function "${fnName}" called in demo mode – returning mock response.`);
    return Promise.resolve({
      data: { message: `Função "${fnName}" indisponível no modo demo.`, error: 'DEMO_MODE' },
      error: null,
    });
  },
};

// ─── Mock Storage ────────────────────────────────────────────

const mockStorage = {
  from: (_bucket: string) => ({
    upload: (_path: string, _file: any) =>
      Promise.resolve({ data: { path: `mock/${_path}` }, error: null }),
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `/mock-storage/${path}` },
    }),
    download: (_path: string) =>
      Promise.resolve({ data: new Blob(), error: null }),
    remove: (_paths: string[]) =>
      Promise.resolve({ data: null, error: null }),
    list: (_path?: string) =>
      Promise.resolve({ data: [], error: null }),
  }),
};

// ─── Mock RPC ────────────────────────────────────────────────

function mockRpc(fnName: string, _params?: any) {
  // For permission checks, always grant access (admin user)
  if (fnName === 'user_has_module_permission') {
    return Promise.resolve({ data: true, error: null });
  }
  // Approval client page: return job data by share token
  if (fnName === 'get_approval_job_public') {
    try {
      const { getJobByShareToken } = require('@/services/approvalDataService');
      const token = _params?._token;
      if (token) {
        const job = getJobByShareToken(token);
        return Promise.resolve({ data: job ? [job] : [], error: null });
      }
    } catch (e) {
      console.warn('[MockRPC] get_approval_job_public error:', e);
    }
    return Promise.resolve({ data: [], error: null });
  }
  return Promise.resolve({ data: null, error: null });
}

// ─── Main mock client ────────────────────────────────────────

export const mockSupabase = {
  from: (table: string) => new MockQueryBuilder(table),
  auth: mockAuth,
  functions: mockFunctions,
  storage: mockStorage,
  channel: (_name: string) => new MockChannel(),
  removeChannel: (_channel: any) => {},
  rpc: mockRpc,
};

/** Reset the mock database to its initial state */
export function resetMockDatabase() {
  store.reset();
}
