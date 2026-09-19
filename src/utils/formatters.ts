export function formatCurrency(amount: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toISOString().replace('T', ' ').substring(0, 19);
  } catch {
    return dateString;
  }
}

export function formatProcessingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours} hours, ${remainingMins} min`;
}

export function generateRandomId(prefix: string = '', length: number = 6): string {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return prefix ? `${prefix}${result}` : result;
}

export function generateWalletNumber(): string {
  return '010' + Math.floor(10000000 + Math.random() * 90000000).toString();
}

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateHash(length: number = 24): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < length; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}
