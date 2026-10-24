/** Background jobs (SLA alerts, session cleanup) — Node.js runtime only. */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}
