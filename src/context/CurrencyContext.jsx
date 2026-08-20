import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { DEFAULT_COUNTRY, findCountryConfig, countryCurrencyConfig } from '../utils/countryCurrency';

const STORAGE_KEY = 'bmh_currency_pref';
// frankfurter.app now 301-redirects to frankfurter.dev's versioned API; the redirect response
// itself has no CORS header, so the browser blocks it before ever reaching the real endpoint.
// Call the new host/path directly.
const RATES_URL = 'https://api.frankfurter.dev/v1/latest?from=USD';
const RATES_REFRESH_MS = 60 * 60 * 1000;
const GEO_TIMEOUT_MS = 6000;
const FETCH_TIMEOUT_MS = 5000;

const CurrencyContext = createContext(null);

const readStoredPreference = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.country && findCountryConfig(parsed.country) ? parsed : null;
  } catch {
    return null;
  }
};

const persistPreference = (country, currency) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ country, currency }));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — the switch still works for this session.
  }
};

const fetchWithTimeout = async (url, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

const getBrowserPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation unsupported'));
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: GEO_TIMEOUT_MS,
      maximumAge: 5 * 60 * 1000,
    });
  });

const resolveCountryViaGeolocation = async () => {
  const position = await getBrowserPosition();
  const { latitude, longitude } = position.coords;
  const data = await fetchWithTimeout(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  return data?.countryCode || null;
};

const resolveCountryViaIp = async () => {
  const data = await fetchWithTimeout('https://ipapi.co/json/');
  return data?.country_code || data?.country || null;
};

// Geolocation -> IP lookup -> hardcoded default. Never blocks the app waiting on any of these.
const resolveDefaultCountry = async () => {
  try {
    const code = await resolveCountryViaGeolocation();
    if (code && findCountryConfig(code)) return code;
  } catch {
    // Permission denied, timed out, or unsupported — fall through to IP lookup.
  }

  try {
    const code = await resolveCountryViaIp();
    if (code && findCountryConfig(code)) return code;
  } catch {
    // Offline, blocked, or rate-limited — fall through to the hardcoded default.
  }

  return DEFAULT_COUNTRY;
};

const formatWithIntl = (value, currencyCode) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'symbol',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${Number(value).toFixed(2)} ${currencyCode}`;
  }
};

export const CurrencyProvider = ({ children }) => {
  const [stored] = useState(readStoredPreference);
  const initialConfig = (stored && findCountryConfig(stored.country)) || findCountryConfig(DEFAULT_COUNTRY);

  const [country, setCountryState] = useState(initialConfig.code);
  const [currency, setCurrencyState] = useState(initialConfig.currency);
  const [symbol, setSymbolState] = useState(initialConfig.symbol);
  const [rates, setRates] = useState(null);
  const [countryResolved, setCountryResolved] = useState(Boolean(stored));
  const [ratesAttempted, setRatesAttempted] = useState(false);
  const ratesRef = useRef(null);
  const countryRef = useRef(initialConfig.code);

  const applyCountryConfig = useCallback((requestedConfig, notifyOnFallback = true) => {
    if (!requestedConfig) return;

    const activeRates = ratesRef.current;
    const rateUnavailable = activeRates
      && requestedConfig.currency !== 'USD'
      && !Object.prototype.hasOwnProperty.call(activeRates, requestedConfig.currency);
    const nextConfig = rateUnavailable ? findCountryConfig('US') : requestedConfig;

    countryRef.current = nextConfig.code;
    setCountryState(nextConfig.code);
    setCurrencyState(nextConfig.currency);
    setSymbolState(nextConfig.symbol);
    persistPreference(nextConfig.code, nextConfig.currency);

    if (rateUnavailable && notifyOnFallback) {
      toast.error(`Exchange rates for ${requestedConfig.currency} are unavailable. Prices have been switched to USD.`, {
        id: 'currency-rate-fallback',
        duration: 4000,
      });
    }
  }, []);

  useEffect(() => {
    if (stored) return undefined;

    let cancelled = false;
    const resolve = async () => {
      const code = await resolveDefaultCountry();
      if (cancelled) return;
      const config = findCountryConfig(code) || initialConfig;
      applyCountryConfig(config);
      setCountryResolved(true);
    };

    resolve();
    return () => { cancelled = true; };
  }, [applyCountryConfig, initialConfig, stored]);

  useEffect(() => {
    let cancelled = false;

    const loadRates = async () => {
      try {
        const data = await fetchWithTimeout(RATES_URL, 8000);
        if (cancelled) return;
        const nextRates = { USD: 1, ...(data?.rates || {}) };
        ratesRef.current = nextRates;
        setRates(nextRates);

        const activeConfig = findCountryConfig(countryRef.current) || initialConfig;
        applyCountryConfig(activeConfig);
      } catch {
        // Keep whatever rates we already have (or null) — convert()/format() degrade gracefully.
      } finally {
        if (!cancelled) setRatesAttempted(true);
      }
    };

    loadRates();
    const interval = setInterval(loadRates, RATES_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [applyCountryConfig, initialConfig]);

  const setCountry = (countryCode) => {
    const config = findCountryConfig(countryCode);
    if (!config) return;
    applyCountryConfig(config);
  };

  // Normalize an incoming currency identifier (ISO code or a symbol) into an ISO code we can use with the rates lookup.
  const normalizeCurrencyCode = (input) => {
    if (!input) return null;
    const asStr = String(input).trim();
    // Already looks like ISO (3 letters)
    if (/^[A-Za-z]{3}$/.test(asStr)) return asStr.toUpperCase();
    // Try matching known entries by currency code or symbol
    const byCurrency = countryCurrencyConfig.find((c) => c.currency === asStr.toUpperCase());
    if (byCurrency) return byCurrency.currency;
    const bySymbol = countryCurrencyConfig.find((c) => c.symbol === asStr || c.currency === asStr);
    if (bySymbol) return bySymbol.currency;
    // Last-resort: if value is a common symbol like '$' or '£', map to USD/GBP heuristically
    if (asStr === '$' || asStr === 'USD' || asStr.toUpperCase() === 'US$') return 'USD';
    if (asStr === '£' || asStr.toUpperCase() === 'GBP') return 'GBP';
    if (asStr === '€' || asStr.toUpperCase() === 'EUR') return 'EUR';
    return asStr.toUpperCase();
  };

  const convert = (amount, fromCurrency) => {
    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) return null;
    const sourceRaw = fromCurrency || currency;
    const source = normalizeCurrencyCode(sourceRaw);
    const target = normalizeCurrencyCode(currency);
    if (!source || !target) return null;
    if (source === target) return numericAmount;
    if (!rates || !(source in rates) || !(target in rates)) return null;
    const usd = numericAmount / rates[source];
    return usd * rates[target];
  };

  const format = (amount, fromCurrency) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—';
    const numericAmount = Number(amount);
    const sourceRaw = fromCurrency || currency;
    const source = normalizeCurrencyCode(sourceRaw) || sourceRaw;
    const converted = convert(numericAmount, sourceRaw);
    if (converted === null) {
      // Can't convert (rates not loaded yet, or an unrecognized currency code) — show the
      // original amount honestly labeled in its own currency rather than mislabeling it.
      return formatWithIntl(numericAmount, source);
    }
    return formatWithIntl(converted, normalizeCurrencyCode(currency) || currency);
  };

  const loading = !countryResolved || !ratesAttempted;

  const value = useMemo(
    () => ({ country, currency, symbol, setCountry, rates, convert, format, loading }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [country, currency, symbol, rates, loading],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrencyContext = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;
