// Workers Env バインディング。wrangler.toml の bindings に対応。
export interface Env {
  DB: D1Database;
  GTO_CACHE: KVNamespace;
  TABLE: DurableObjectNamespace;
  // secrets / env
  JWT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FRONTEND_URL?: string; // 認証後リダイレクト先（Pages の本番 URL）
}
