import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currencyCode: string = 'USD') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '$0.00';

  const locales: Record<string, string> = { 
    ARS: 'es-AR', MXN: 'es-MX', USD: 'en-US', EUR: 'es-ES', 
    CLP: 'es-CL', COP: 'es-CO', UYU: 'es-UY', BRL: 'pt-BR'
  };
  const locale = locales[currencyCode] || 'en-US';

  const zeroDecimalCurrencies = ['ARS', 'CLP', 'COP', 'PYG', 'JPY'];
  const hasDecimals = !zeroDecimalCurrencies.includes(currencyCode);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0
  }).format(value);
}
