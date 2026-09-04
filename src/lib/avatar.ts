/**
 * CruxMate punk-rock avatar system.
 *
 * Fully custom layered SVG — no external service, no network calls, no
 * per-user image storage. Every avatar is a deterministic function of an
 * AvatarConfig object stored on the profile.
 *
 * Aesthetic: DIY punk / climbing-gym crust. Bold flat shapes, thick outlines,
 * neon hair, piercings, tattoos, bandanas. Deliberately gender-ambiguous.
 */

export type SkinTone = 'porcelain' | 'sand' | 'honey' | 'clay' | 'umber' | 'espresso';
export type HairStyle =
  | 'mohawk'
  | 'liberty'      // liberty spikes
  | 'shaved'
  | 'undercut'
  | 'bangs'
  | 'buzz'
  | 'topknot'
  | 'locs'
  | 'curtain'
  | 'bald'
  // longer / softer silhouettes — still punk, just not all buzzed
  | 'long'
  | 'halfshave'    // long one side, shaved the other
  | 'bob'
  | 'wavy'
  | 'pigtails'
  | 'spacebuns'
  | 'ponytail'
  | 'braids';
export type HairColor =
  | 'jet'
  | 'bleach'
  | 'toxic'        // toxic green
  | 'ultraviolet'  // purple
  | 'hazard'       // orange
  | 'cherry'       // red
  | 'cyan'
  | 'bubblegum';   // pink
export type Eyes = 'sharp' | 'tired' | 'wink' | 'shades' | 'stoked' | 'deadpan';
export type Accessory = 'none' | 'nosering' | 'gauges' | 'hoops' | 'bandana' | 'beanie' | 'chalkdust' | 'shades';
export type Backdrop = 'ink' | 'teal' | 'gold' | 'coral' | 'sky' | 'slate';

export interface AvatarConfig {
  skin: SkinTone;
  hair: HairStyle;
  hairColor: HairColor;
  eyes: Eyes;
  accessory: Accessory;
  backdrop: Backdrop;
}

export const SKIN_HEX: Record<SkinTone, string> = {
  porcelain: '#F4D9C6',
  sand: '#EAC29B',
  honey: '#D9A273',
  clay: '#B87A52',
  umber: '#8B5A3C',
  espresso: '#5E3A26',
};

export const HAIR_HEX: Record<HairColor, string> = {
  jet: '#1A1A1E',
  bleach: '#F2E8C9',
  toxic: '#8FE04C',
  ultraviolet: '#9B5DE5',
  hazard: '#FF8C42',
  cherry: '#E03A48',
  cyan: '#3DD9E0',
  bubblegum: '#FF6FB5',
};

export const BACKDROP_HEX: Record<Backdrop, string> = {
  ink: '#0F2D3A',
  teal: '#2C7A7B',
  gold: '#F4B942',
  coral: '#FF6B6B',
  sky: '#C7D9EB',
  slate: '#4B6472',
};

export const SKIN_TONES: SkinTone[] = ['porcelain', 'sand', 'honey', 'clay', 'umber', 'espresso'];
export const HAIR_STYLES: HairStyle[] = [
  'mohawk', 'liberty', 'halfshave', 'undercut', 'shaved', 'buzz',
  'long', 'wavy', 'bob', 'bangs', 'curtain',
  'pigtails', 'spacebuns', 'ponytail', 'braids', 'topknot', 'locs', 'bald',
];
export const HAIR_COLORS: HairColor[] = [
  'jet', 'bleach', 'toxic', 'ultraviolet', 'hazard', 'cherry', 'cyan', 'bubblegum',
];
// 'shades' is intentionally NOT here — it moved to accessories (below).
export const EYES_OPTS: Eyes[] = ['sharp', 'tired', 'wink', 'stoked', 'deadpan'];
export const ACCESSORIES: Accessory[] = ['none', 'nosering', 'gauges', 'hoops', 'bandana', 'beanie', 'chalkdust', 'shades'];
export const BACKDROPS: Backdrop[] = ['ink', 'teal', 'gold', 'coral', 'sky', 'slate'];

export const HAIR_STYLE_LABEL: Record<HairStyle, string> = {
  mohawk: 'Mohawk',
  liberty: 'Liberty spikes',
  shaved: 'Shaved sides',
  undercut: 'Undercut',
  bangs: 'Blunt bangs',
  buzz: 'Buzz cut',
  topknot: 'Top knot',
  locs: 'Locs',
  curtain: 'Curtains',
  bald: 'Bald',
  long: 'Long',
  halfshave: 'Half-shave',
  bob: 'Bob',
  wavy: 'Wavy',
  pigtails: 'Pigtails',
  spacebuns: 'Space buns',
  ponytail: 'Ponytail',
  braids: 'Braids',
};

export const EYES_LABEL: Record<Eyes, string> = {
  sharp: 'Sharp',
  tired: 'Tired',
  wink: 'Wink',
  shades: 'Shades',
  stoked: 'Stoked',
  deadpan: 'Deadpan',
};

export const ACCESSORY_LABEL: Record<Accessory, string> = {
  none: 'None',
  nosering: 'Nose ring',
  gauges: 'Ear gauges',
  hoops: 'Hoop earrings',
  bandana: 'Bandana',
  beanie: 'Beanie',
  chalkdust: 'Chalk dust',
  shades: 'Shades',
};

export const HAIR_COLOR_LABEL: Record<HairColor, string> = {
  jet: 'Jet black',
  bleach: 'Bleached',
  toxic: 'Toxic green',
  ultraviolet: 'Ultraviolet',
  hazard: 'Hazard orange',
  cherry: 'Cherry red',
  cyan: 'Cyan',
  bubblegum: 'Bubblegum',
};

/** Cheap deterministic string hash → 32-bit int. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministically derive a full avatar config from any seed string. */
export function avatarFromSeed(seed: string): AvatarConfig {
  const h = hash(seed);
  const pick = <T,>(arr: T[], salt: number): T => arr[(h >> salt) % arr.length];
  return {
    skin: pick(SKIN_TONES, 0),
    hair: pick(HAIR_STYLES, 3),
    hairColor: pick(HAIR_COLORS, 7),
    eyes: pick(EYES_OPTS, 11),
    accessory: pick(ACCESSORIES, 15),
    backdrop: pick(BACKDROPS, 19),
  };
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 'sand',
  hair: 'mohawk',
  hairColor: 'toxic',
  eyes: 'sharp',
  accessory: 'nosering',
  backdrop: 'ink',
};
