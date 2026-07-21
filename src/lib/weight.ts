/**
 * Belay weight-safety helper.
 *
 * Rule of thumb (per AMGA and most gym-safety guides): a partner is
 * "weight-safe" when the mass difference is within ~30% of the heavier
 * partner. Larger climbers can catch smaller belayers, and vice versa,
 * only with assisted-braking devices and additional care.
 *
 * We deliberately keep the threshold conservative — showing a "weight-safe"
 * chip is a claim; showing nothing is neutral. Never show "unsafe".
 */
const RATIO_THRESHOLD = 0.30;

export function isWeightSafe(myWeightKg?: number, otherWeightKg?: number): boolean {
  if (!myWeightKg || !otherWeightKg) return false;
  const diff = Math.abs(myWeightKg - otherWeightKg);
  const heavier = Math.max(myWeightKg, otherWeightKg);
  return diff / heavier <= RATIO_THRESHOLD;
}

export function kgToLbs(kg?: number): number | undefined {
  if (kg === undefined) return undefined;
  return Math.round(kg * 2.20462);
}

export function lbsToKg(lbs?: number): number | undefined {
  if (lbs === undefined) return undefined;
  return Math.round(lbs / 2.20462);
}

export function cmToFtIn(cm?: number): string | undefined {
  if (!cm) return undefined;
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′${inch}″`;
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * 2.54);
}
