export function calcBackoff(attempt, baseDelayMs = 1000, maxDelayMs = 30000) {
  const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  const jitter = Math.random() * 500;
  return Math.round(exponential + jitter);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}