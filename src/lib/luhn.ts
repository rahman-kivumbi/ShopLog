/**
 * Luhn Algorithm for 15-digit IMEI Validation and Calculation
 * Used for Phones and GSM devices.
 */

export function isValidLuhn(imei: string): boolean {
  const sanitized = imei.replace(/\D/g, '');
  if (sanitized.length !== 15) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < sanitized.length; i++) {
    let digit = parseInt(sanitized.charAt(i), 10);
    // Double every second digit starting from the second digit (0-indexed: index 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Calculates the 15th Luhn check digit for a 14-digit TAC+Serial string
 */
export function calculateLuhnCheckDigit(fourteenDigits: string): number {
  const sanitized = fourteenDigits.replace(/\D/g, '').slice(0, 14);
  if (sanitized.length < 14) return 0;

  let sum = 0;
  for (let i = 0; i < sanitized.length; i++) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Formats a 15-digit IMEI into human readable blocks: 35XXXX-XX-XXXXXX-X
 */
export function formatImei(imei: string): string {
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) return imei;
  return `${digits.slice(0, 8)} ${digits.slice(8, 14)} ${digits.slice(14)}`;
}

/**
 * Generate a valid dummy IMEI for testing or demo products
 */
export function generateValidDemoImei(prefix = '35894109'): string {
  let base = prefix;
  while (base.length < 14) {
    base += Math.floor(Math.random() * 10).toString();
  }
  const check = calculateLuhnCheckDigit(base);
  return base + check.toString();
}
