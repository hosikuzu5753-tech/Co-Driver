// src/utils/calculator.ts

export type Operator = '+' | '-' | '×' | '÷';

export interface CalculatorState {
  displayValue: string;
  previousValue: number | null;
  pendingOperator: Operator | null;
  expressionHistory: string;
  isNewInput: boolean;
  error: string | null;
}

/**
 * IEEE 754 floating point precision sanitization
 */
export function sanitizeFloat(value: number, precision: number = 14): number {
  if (!Number.isFinite(value)) return value;
  if (Number.isSafeInteger(value)) return value;
  return parseFloat(value.toPrecision(precision));
}

export function safeAdd(a: number, b: number): number {
  return sanitizeFloat(a + b);
}

export function safeSubtract(a: number, b: number): number {
  return sanitizeFloat(a - b);
}

export function safeMultiply(a: number, b: number): number {
  return sanitizeFloat(a * b);
}

export function safeDivide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('DIV_BY_ZERO');
  }
  return sanitizeFloat(a / b);
}

export function calculateOperation(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+':
      return safeAdd(a, b);
    case '-':
      return safeSubtract(a, b);
    case '×':
      return safeMultiply(a, b);
    case '÷':
      return safeDivide(a, b);
  }
}

/**
 * Formats a string with 3-digit comma grouping while preserving decimal points during typing
 */
export function formatDisplayNumber(rawString: string): string {
  if (rawString === '' || rawString === '-') return rawString;

  const isNegative = rawString.startsWith('-');
  const unsigned = isNegative ? rawString.slice(1) : rawString;

  const parts = unsigned.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts.length > 1 ? parts[1] : null;

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  let result = (isNegative ? '-' : '') + formattedInteger;
  if (decimalPart !== null) {
    result += '.' + decimalPart;
  }
  return result;
}

export const INITIAL_CALCULATOR_STATE: CalculatorState = {
  displayValue: '0',
  previousValue: null,
  pendingOperator: null,
  expressionHistory: '',
  isNewInput: true,
  error: null,
};
