import type { Category } from '@/seed/types';

export interface GearList {
  required: string[];
  recommended: string[];
}

export function gearFor(category: Category): GearList {
  switch (category) {
    case 'top_rope':
      return {
        required: ['Harness', 'Climbing shoes', 'Belay device', 'Locking carabiner', 'Chalk bag'],
        recommended: ['Tape', 'Water', 'Snacks'],
      };
    case 'lead':
      return {
        required: [
          'Harness',
          'Climbing shoes',
          'Belay device (assisted-braking recommended)',
          'Locking carabiner',
          'Chalk',
        ],
        recommended: ['Tape', 'Sling'],
      };
    case 'boulder':
      return {
        required: ['Climbing shoes', 'Chalk bag'],
        recommended: ['Tape', 'Brush', 'Water'],
      };
    case 'outdoor_sport':
      return {
        required: [
          'Harness',
          'Climbing shoes',
          'Belay device',
          '2× Locking carabiners',
          'Chalk',
          'Helmet',
          'Rope (unless host provides)',
        ],
        recommended: ['12 quickdraws', 'Sling', 'PAS', 'Water', 'Snacks', 'Sun protection'],
      };
    case 'trad':
    case 'multi_pitch':
      return {
        required: [
          'Harness',
          'Climbing shoes',
          'Belay device',
          '2× Locking carabiners',
          'Chalk',
          'Helmet',
          'Full rack (cams + nuts)',
          'Slings',
          'Prusik',
          'Half rope OR double rope',
        ],
        recommended: ['Nut tool', 'Tape', 'Extra webbing', 'PAS'],
      };
    case 'outdoor_boulder':
      return {
        required: ['Climbing shoes', 'Chalk', 'Crash pad', 'Brush'],
        recommended: ['Additional pads', 'Tape', 'Sunscreen', 'Water'],
      };
    case 'event':
    default:
      return { required: [], recommended: [] };
  }
}
