export interface CurrencyDefinition {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  position: 'before' | 'after';
  space: boolean;
  decimals: number;
}

export const POPULAR_CURRENCIES: CurrencyDefinition[] = [
  { code: 'EUR', symbol: '€', name: 'Euro (France, Europe)', flag: '🇪🇺', position: 'after', space: true, decimals: 2 },
  { code: 'USD', symbol: '$', name: 'Dollar US (États-Unis)', flag: '🇺🇸', position: 'before', space: false, decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'Livre Sterling (Royaume-Uni)', flag: '🇬🇧', position: 'before', space: false, decimals: 2 },
  { code: 'CAD', symbol: '$', name: 'Dollar Canadien (Canada)', flag: '🇨🇦', position: 'before', space: false, decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Franc Suisse (Suisse)', flag: '🇨🇭', position: 'after', space: true, decimals: 2 },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain (Maroc)', flag: '🇲🇦', position: 'after', space: true, decimals: 2 },
  { code: 'XOF', symbol: 'FCFA', name: 'Franc CFA (BCEAO / Afrique Ouest)', flag: '🌍', position: 'after', space: true, decimals: 0 },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonais (Japon)', flag: '🇯🇵', position: 'before', space: false, decimals: 0 },
  { code: 'AUD', symbol: '$', name: 'Dollar Australien (Australie)', flag: '🇦🇺', position: 'before', space: false, decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Real Brésilien (Brésil)', flag: '🇧🇷', position: 'before', space: true, decimals: 2 },
];

export function getCurrencySymbol(currencySetting?: string): string {
  if (!currencySetting) return '€';
  const match = currencySetting.match(/\(([^)]+)\)/);
  if (match) return match[1];
  const found = POPULAR_CURRENCIES.find(
    (c) =>
      c.code.toLowerCase() === currencySetting.trim().toLowerCase() ||
      c.symbol === currencySetting.trim() ||
      currencySetting.includes(c.code) ||
      currencySetting.includes(c.symbol)
  );
  if (found) return found.symbol;
  return currencySetting;
}

export function formatPrice(amount: number | undefined | null, currencySetting?: string): string {
  const val = Number(amount || 0);
  const cur = currencySetting || 'EUR (€)';
  const symbol = getCurrencySymbol(cur);
  const found = POPULAR_CURRENCIES.find(
    (c) => cur.includes(c.code) || cur.includes(c.symbol)
  );

  const decimals = found?.decimals ?? 2;
  const formattedNum = val.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (found && found.position === 'before') {
    return `${symbol}${found.space ? ' ' : ''}${formattedNum}`;
  }
  return `${formattedNum} ${symbol}`;
}
