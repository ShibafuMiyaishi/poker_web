// Workers Env バインディング。wrangler.toml の bindings に対応。
export interface Env {
  DB: D1Database;
  GTO_CACHE: KVNamespace;
  TABLE: DurableObjectNamespace;
  // Phase 2 で実装する secret
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
