// src/utils/splitBill.ts

export type RoundingUnit = 1 | 100 | 500 | 1000;

export interface SplitBillResult {
  totalAmount: number;
  headcount: number;
  roundingUnit: RoundingUnit;
  perPerson: number;
  totalCollected: number;
  surplus: number;
  shareText: string;
}

export function calculateSplitBill(
  totalAmount: number,
  headcount: number,
  roundingUnit: RoundingUnit = 100
): SplitBillResult {
  const safeCount = !Number.isFinite(headcount) || headcount < 1 ? 1 : Math.floor(headcount);
  const safeTotal = !Number.isFinite(totalAmount) || totalAmount < 0 ? 0 : Math.floor(totalAmount);
  const validUnits: RoundingUnit[] = [1, 100, 500, 1000];
  const safeUnit: RoundingUnit = validUnits.includes(roundingUnit) ? roundingUnit : 100;

  if (safeTotal === 0) {
    return {
      totalAmount: 0,
      headcount: safeCount,
      roundingUnit: safeUnit,
      perPerson: 0,
      totalCollected: 0,
      surplus: 0,
      shareText: '',
    };
  }

  const rawPerPerson = safeTotal / safeCount;
  const perPerson = Math.ceil(rawPerPerson / safeUnit) * safeUnit;
  const totalCollected = perPerson * safeCount;
  const surplus = totalCollected - safeTotal;

  const shareText = `【Co-Driver 割り勘清算】\n` +
    `合計: ¥${safeTotal.toLocaleString()} (${safeCount}人)\n` +
    `1人あたり: ¥${perPerson.toLocaleString()}\n` +
    `(回収計: ¥${totalCollected.toLocaleString()} / お釣り: +¥${surplus.toLocaleString()})`;

  return {
    totalAmount: safeTotal,
    headcount: safeCount,
    roundingUnit: safeUnit,
    perPerson,
    totalCollected,
    surplus,
    shareText,
  };
}
