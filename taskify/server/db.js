// One shared connection pool for the whole app.
// A Pool reuses open connections instead of opening a new one per request.
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  // Every value falls back to a local default so the app also runs
  // outside Docker (db port 5432 is published to the host for this reason).
  // In Docker, compose sets PGHOST=db etc. via environment variables.
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "taskify",
  password: process.env.PGPASSWORD ?? "taskify",
  database: process.env.PGDATABASE ?? "taskify",
});

// CRASH-PREVENTION: connection-level errors (DB shutting down, network drop)
// arrive as an EVENT on the pool, not as a rejected query promise — no
// try/catch in a route can see them. Without this listener Node treats the
// 'error' event as uncaught and kills the process. Swallow it here instead:
// the pool discards the broken connection and the next query opens a fresh
// one automatically.
pool.on('error', (err) => {
  console.error('DB pool error (connection dropped):', err.message);
});
