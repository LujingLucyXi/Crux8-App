import type { Gym } from '@/seed/types';

/**
 * Gyms that can actually host a category of climbing. A top-rope call or
 * session lists only gyms with top-rope walls; lead (and the other roped
 * disciplines) only gyms with lead walls; bouldering only gyms with
 * bouldering. This keeps boulder-only gyms (SBP, Uplift, Bel-Red…) out of
 * roped lists and vice versa.
 */
export function gymsForCategory(gyms: Gym[], category: string): Gym[] {
  switch (category) {
    case 'top_rope':
      return gyms.filter((g) => g.disciplines.includes('top_rope'));
    case 'lead':
    case 'outdoor_sport':
    case 'trad':
    case 'multi_pitch':
      return gyms.filter((g) => g.disciplines.includes('lead'));
    case 'boulder':
    case 'outdoor_boulder':
      return gyms.filter((g) => g.disciplines.includes('boulder'));
    default:
      return gyms;
  }
}
