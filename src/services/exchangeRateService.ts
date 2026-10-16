/**
 * Exchange Rate Service for Delta Travel & Tour
 * Fetches real-time USD to ETB exchange rate with in-memory caching, automatic hourly background refresh, and fallback support.
 *
 * LOGGING: Silenced to keep stderr.log readable. Only a single init line logs on boot.
 */

export interface ExchangeRateData {
  rate: number;
  updatedAt: string;
  source: string;
  isFallback: boolean;
}

interface CachedRate extends ExchangeRateData {
  fetchedAtMs: number;
}

let cachedRateData: CachedRate | null = null;
let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Fetches a fresh exchange rate from the configured API or falls back if request fails.
 * Errors are swallowed silently — the fallback rate is used without logging.
 */
async function fetchFreshExchangeRate(): Promise<ExchangeRateData> {
  const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.budjet.org/fiat/USD/ETB';
  const fallbackRate = parseFloat(process.env.EXCHANGE_RATE_FALLBACK || '159.98');
  const nowMs = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }

    const data = await res.json();
    let rate: number | null = null;
    let source = 'budjet.org';

    if (typeof data?.rate === 'number') {
      rate = data.rate;
    } else if (typeof data?.data?.rate === 'number') {
      rate = data.data.rate;
    } else if (typeof data?.rates?.ETB === 'number') {
      rate = data.rates.ETB;
      source = 'exchangerate-api.com';
    } else if (typeof data?.result?.ETB === 'number') {
      rate = data.result.ETB;
    }

    if (!rate || typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
      throw new Error('invalid rate');
    }

    const formattedRate = Math.round(rate * 100) / 100;
    const isoNow = new Date().toISOString();

    cachedRateData = {
      rate: formattedRate,
      updatedAt: isoNow,
      source,
      isFallback: false,
      fetchedAtMs: nowMs,
    };

    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback,
    };
  } catch {
    // Silent fallback — no logging
    const isoNow = new Date().toISOString();
    cachedRateData = {
      rate: fallbackRate,
      updatedAt: isoNow,
      source: 'fallback',
      isFallback: true,
      fetchedAtMs: nowMs,
    };

    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback,
    };
  }
}

/**
 * Sets an admin override exchange rate manually.
 */
export function setAdminOverrideRate(rate: number): ExchangeRateData {
  const isoNow = new Date().toISOString();
  cachedRateData = {
    rate: Math.round(rate * 100) / 100,
    updatedAt: isoNow,
    source: 'admin_override',
    isFallback: false,
    fetchedAtMs: Date.now(),
  };

  return {
    rate: cachedRateData.rate,
    updatedAt: cachedRateData.updatedAt,
    source: cachedRateData.source,
    isFallback: cachedRateData.isFallback,
  };
}

/**
 * Returns current exchange rate data from memory cache or fetches fresh if cache expired/empty.
 */
export async function getExchangeRate(forceRefresh = false): Promise<ExchangeRateData> {
  const cacheDurationMs = parseInt(process.env.EXCHANGE_RATE_CACHE_DURATION || '3600', 10) * 1000;
  const nowMs = Date.now();

  if (!forceRefresh && cachedRateData && nowMs - cachedRateData.fetchedAtMs < cacheDurationMs) {
    return {
      rate: cachedRateData.rate,
      updatedAt: cachedRateData.updatedAt,
      source: cachedRateData.source,
      isFallback: cachedRateData.isFallback,
    };
  }

  return await fetchFreshExchangeRate();
}

/**
 * Initializes the Exchange Rate Service on server boot.
 * Fetches initial rate and sets up hourly automatic refresh background timer.
 */
export function initExchangeRateService(): void {
  const cacheDurationSeconds = parseInt(process.env.EXCHANGE_RATE_CACHE_DURATION || '3600', 10);
  const cacheDurationMs = cacheDurationSeconds * 1000;

  // One-time init log — useful to confirm the service started
  console.log(`[ExchangeRateService] Initialized (refresh every ${cacheDurationSeconds}s)`);

  // Initial fetch on server start
  getExchangeRate(true).catch(() => {
    // silent
  });

  // Set up periodic automatic background refresh every hour
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  refreshTimer = setInterval(async () => {
    try {
      await getExchangeRate(true);
    } catch {
      // silent
    }
  }, cacheDurationMs);
}