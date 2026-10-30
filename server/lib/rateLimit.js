const ipHits = new Map();

/**
 * In-memory sliding window rate limiter
 * @param {string} ip 
 * @param {string} endpoint 
 * @param {number} maxPerMinute 
 * @returns {boolean} allowed
 */
export function checkRateLimit(ip = '127.0.0.1', endpoint = 'general', maxPerMinute = 10) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const key = `${ip}:${endpoint}`;

  let timestamps = ipHits.get(key) || [];
  // Evict timestamps older than 1 minute
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxPerMinute) {
    ipHits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  ipHits.set(key, timestamps);
  return true;
}

