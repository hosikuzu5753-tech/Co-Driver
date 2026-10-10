// src/components/modals/CalculatorModal.tsx

import React, { useState } from 'react';
import { X, Copy, Check, Users, Calculator as CalcIcon } from 'lucide-react';
import { useCalculator } from '../../hooks/useCalculator';
import { formatDisplayNumber } from '../../utils/calculator';
import { calculateSplitBill, RoundingUnit } from '../../utils/splitBill';

export interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
  const {
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
  } = useCalculator();

  // Split bill helper state
  const [headcount, setHeadcount] = useState<number>(4);
  const [roundingUnit, setRoundingUnit] = useState<RoundingUnit>(100);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTotal = getRawNumber();
  const splitResult = calculateSplitBill(currentTotal, headcount, roundingUnit);

  const handleCopyLine = async () => {
    try {
      if (navigator.clipboard && splitResult.shareText) {
        await navigator.clipboard.writeText(splitResult.shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="calculator-modal"
    >
      <div className="modal-dialog calc-dialog">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <CalcIcon size={22} color="var(--cd-amber-primary)" />
            <span>車載大型電卓 (In-Car Calculator)</span>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            title="閉じる"
            data-testid="btn-close-calc-modal"
          >
            <X size={22} />
          </button>
        </div>

        {/* Display */}
        <div className="calc-display-panel" data-testid="calc-display">
          <div className="calc-history" data-testid="calc-history">
            {state.expressionHistory || '\u00A0'}
          </div>
          <div
            className={`calc-main-value ${state.error ? 'error' : ''}`}
            data-testid="calc-main-value"
          >
            {state.error ? state.error : formatDisplayNumber(state.displayValue)}
          </div>
        </div>

        {/* Large Keypad Grid (64-72px pitch) */}
        <div className="calc-grid" data-testid="calc-keypad">
          {/* Row 1 */}
          <button
            type="button"
            className="calc-key calc-key-clear"
            onClick={clearAll}
            data-testid="btn-calc-ac"
          >
            AC
          </button>
          <button
            type="button"
            className="calc-key calc-key-clear"
            onClick={deleteDigit}
            data-testid="btn-calc-del"
          >
            DEL
          </button>
          <button
            type="button"
            className="calc-key calc-key-fn"
            onClick={inputPercent}
            data-testid="btn-calc-percent"
          >
            %
          </button>
          <button
            type="button"
            className="calc-key calc-key-op"
            onClick={() => inputOperator('÷')}
            data-testid="btn-calc-divide"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('7')}
            data-testid="btn-calc-7"
          >
            7
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('8')}
            data-testid="btn-calc-8"
          >
            8
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('9')}
            data-testid="btn-calc-9"
          >
            9
          </button>
          <button
            type="button"
            className="calc-key calc-key-op"
            onClick={() => inputOperator('×')}
            data-testid="btn-calc-multiply"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('4')}
            data-testid="btn-calc-4"
          >
            4
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('5')}
            data-testid="btn-calc-5"
          >
            5
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('6')}
            data-testid="btn-calc-6"
          >
            6
          </button>
          <button
            type="button"
            className="calc-key calc-key-op"
            onClick={() => inputOperator('-')}
            data-testid="btn-calc-minus"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('1')}
            data-testid="btn-calc-1"
          >
            1
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('2')}
            data-testid="btn-calc-2"
          >
            2
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('3')}
            data-testid="btn-calc-3"
          >
            3
          </button>
          <button
            type="button"
            className="calc-key calc-key-op"
            onClick={() => inputOperator('+')}
            data-testid="btn-calc-plus"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            type="button"
            className="calc-key calc-key-fn"
            onClick={toggleSign}
            data-testid="btn-calc-sign"
          >
            +/-
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={() => inputDigit('0')}
            data-testid="btn-calc-0"
          >
            0
          </button>
          <button
            type="button"
            className="calc-key"
            onClick={inputDecimal}
            data-testid="btn-calc-dot"
          >
            .
          </button>
          <button
            type="button"
            className="calc-key calc-key-equals"
            onClick={calculate}
            data-testid="btn-calc-equals"
          >
            =
          </button>
        </div>

        {/* Bill Splitting Helper Drawer */}
        <div className="split-bill-section" data-testid="split-bill-section">
          <div className="split-bill-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={18} color="var(--cd-amber-primary)" />
              <span>割り勘計算 (Split Bill)</span>
            </span>

            {/* Stepper for headcount */}
            <div className="split-stepper">
              <button
                type="button"
                className="split-step-btn"
                onClick={() => setHeadcount(Math.max(2, headcount - 1))}
                data-testid="btn-split-minus"
              >
                -
              </button>
              <span
                style={{
                  minWidth: '50px',
                  textAlign: 'center',
                  fontFamily: 'var(--cd-font-mono)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'var(--cd-amber-bright)',
                }}
                data-testid="split-headcount-label"
              >
                {headcount} 人
              </span>
              <button
                type="button"
                className="split-step-btn"
                onClick={() => setHeadcount(Math.min(12, headcount + 1))}
                data-testid="btn-split-plus"
              >
                +
              </button>
            </div>
          </div>

          {/* Rounding unit selector */}
          <div className="split-unit-chips">
            {([1, 100, 500, 1000] as RoundingUnit[]).map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setRoundingUnit(unit)}
                className={`split-chip ${roundingUnit === unit ? 'active' : ''}`}
                data-testid={`btn-split-unit-${unit}`}
              >
                {unit === 1 ? '1円単位' : `${unit}円単位`}
              </button>
            ))}
          </div>

          {/* Result card */}
          <div className="split-result-card" data-testid="split-result-card">
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--cd-text-muted)' }}>
                1人あたりのお支払い（切り上げ）
              </div>
              <div className="split-per-person" data-testid="split-per-person-text">
                ¥{splitResult.perPerson.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--cd-text-dim)' }}>
                回収計: ¥{splitResult.totalCollected.toLocaleString()}
                {splitResult.surplus > 0 && ` (お釣り: +¥${splitResult.surplus.toLocaleString()})`}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLine}
              className="split-copy-btn"
              title="LINE送信用テキストをクリップボードにコピー"
              data-testid="btn-copy-split"
            >
              {copied ? (
                <>
                  <Check size={16} color="var(--cd-status-connected)" />
                  <span style={{ color: 'var(--cd-status-connected)' }}>コピー完了</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>LINE用にコピー</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
