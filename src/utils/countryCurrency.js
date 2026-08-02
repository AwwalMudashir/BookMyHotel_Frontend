// Purpose: Static country -> currency config used by the global currency switcher.
// Covers the regions BookMyHotel branches operate in (UK/Europe, Middle East, Asia) plus a broad default list.
export const countryCurrencyConfig = [
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: 'SR', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: 'QR', flag: '🇶🇦' },
  { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', currency: 'EUR', symbol: '€', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', currency: 'EUR', symbol: '€', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', symbol: '€', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', currency: 'NOK', symbol: 'kr', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', symbol: 'kr', flag: '🇩🇰' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', symbol: '₺', flag: '🇹🇷' },
  { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
  { code: 'CN', name: 'China', currency: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', currency: 'THB', symbol: '฿', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', symbol: '₩', flag: '🇰🇷' },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', symbol: 'MX$', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R', flag: '🇿🇦' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£', flag: '🇪🇬' },
];

// BookMyHotel is headquartered in Dubai — when geolocation, IP lookup, and stored
// preference all come up empty, defaulting to the company's home market (UAE/AED) is
// more brand-appropriate than an arbitrary fallback.
export const DEFAULT_COUNTRY = 'AE';

export const findCountryConfig = (countryCode) =>
  countryCurrencyConfig.find((entry) => entry.code === String(countryCode || '').toUpperCase()) || null;

export default countryCurrencyConfig;
