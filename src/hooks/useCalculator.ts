// src/hooks/useCalculator.ts

import { useState, useCallback } from 'react';
import {
  CalculatorState,
  INITIAL_CALCULATOR_STATE,
  Operator,
  calculateOperation,
  formatDisplayNumber,
  safeDivide,
} from '../utils/calculator';

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(INITIAL_CALCULATOR_STATE);

  const inputDigit = useCallback((digit: string) => {
    setState((prev) => {
      if (prev.error) {
        return {
          ...INITIAL_CALCULATOR_STATE,
          displayValue: digit,
          isNewInput: false,
        };
      }

      if (prev.isNewInput) {
        return {
          ...prev,
          displayValue: digit,
          isNewInput: false,
        };
      }

      if (prev.displayValue === '0') {
        return {
          ...prev,
          displayValue: digit,
        };
      }

      // Limit to 12 digits
      const digitsOnly = prev.displayValue.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 12) {
        return prev;
      }

      return {
        ...prev,
        displayValue: prev.displayValue + digit,
      };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.isNewInput) {
        return {
          ...prev,
          displayValue: '0.',
          isNewInput: false,
          error: null,
        };
      }

      if (prev.displayValue.includes('.')) {
        return prev;
      }

      return {
        ...prev,
        displayValue: prev.displayValue + '.',
      };
    });
  }, []);

  const inputOperator = useCallback((op: Operator) => {
    setState((prev) => {
      if (prev.error) return prev;

      const currentNum = parseFloat(prev.displayValue);

      // Operator overwrite when no number has been entered yet
      if (prev.isNewInput && prev.pendingOperator !== null && prev.previousValue !== null) {
        return {
          ...prev,
          pendingOperator: op,
          expressionHistory: `${formatDisplayNumber(String(prev.previousValue))} ${op}`,
        };
      }

      // Intermediate chaining calculation (e.g. 5 + 3 + )
      if (prev.previousValue !== null && prev.pendingOperator !== null && !prev.isNewInput) {
        try {
          const intermediate = calculateOperation(prev.previousValue, currentNum, prev.pendingOperator);
          return {
            displayValue: String(intermediate),
            previousValue: intermediate,
            pendingOperator: op,
            expressionHistory: `${formatDisplayNumber(String(intermediate))} ${op}`,
            isNewInput: true,
            error: null,
          };
        } catch {
          return {
            ...prev,
            error: '0除算エラー',
            displayValue: '0',
            previousValue: null,
            pendingOperator: null,
            isNewInput: true,
          };
        }
      }

      // First operator in sequence
      return {
        ...prev,
        previousValue: currentNum,
        pendingOperator: op,
        expressionHistory: `${formatDisplayNumber(prev.displayValue)} ${op}`,
        isNewInput: true,
      };
    });
  }, []);

  const calculate = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.pendingOperator === null || prev.previousValue === null) {
        return prev;
      }

      const currentNum = parseFloat(prev.displayValue);
      try {
        const result = calculateOperation(prev.previousValue, currentNum, prev.pendingOperator);
        return {
          displayValue: String(result),
          previousValue: null,
          pendingOperator: null,
          expressionHistory: `${formatDisplayNumber(String(prev.previousValue))} ${prev.pendingOperator} ${formatDisplayNumber(prev.displayValue)} =`,
          isNewInput: true,
          error: null,
        };
      } catch {
        return {
          ...prev,
          error: '0除算エラー',
          displayValue: '0',
          previousValue: null,
          pendingOperator: null,
          expressionHistory: `${formatDisplayNumber(String(prev.previousValue))} ${prev.pendingOperator} 0 =`,
          isNewInput: true,
        };
      }
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(INITIAL_CALCULATOR_STATE);
  }, []);

  const deleteDigit = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.isNewInput) return prev;

      if (prev.displayValue.length <= 1) {
        return {
          ...prev,
          displayValue: '0',
          isNewInput: true,
        };
      }

      const nextVal = prev.displayValue.slice(0, -1);
      if (nextVal === '' || nextVal === '-') {
        return {
          ...prev,
          displayValue: '0',
          isNewInput: true,
        };
      }

      return {
        ...prev,
        displayValue: nextVal,
      };
    });
  }, []);

  const toggleSign = useCallback(() => {
    setState((prev) => {
      if (prev.error || prev.displayValue === '0') return prev;

      if (prev.displayValue.startsWith('-')) {
        return {
          ...prev,
          displayValue: prev.displayValue.slice(1),
        };
      } else {
        return {
          ...prev,
          displayValue: '-' + prev.displayValue,
        };
      }
    });
  }, []);

  const inputPercent = useCallback(() => {
    setState((prev) => {
      if (prev.error) return prev;
      const val = parseFloat(prev.displayValue);
      const result = safeDivide(val, 100);
      return {
        ...prev,
        displayValue: String(result),
        isNewInput: true,
      };
    });
  }, []);

  const getRawNumber = useCallback((): number => {
    if (state.error) return 0;
    const parsed = parseFloat(state.displayValue);
    return isNaN(parsed) ? 0 : parsed;
  }, [state.displayValue, state.error]);

  return {
    state,
    inputDigit,
    inputDecimal,
    inputOperator,
    calculate,
    clearAll,
    deleteDigit,
    toggleSign,
    inputPercent,
    getRawNumber,
  };
}
