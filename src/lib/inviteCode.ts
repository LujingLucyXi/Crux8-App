/**
 * Personal invite codes — the "add me" identity behind
 * crux8.app/add/:code and the code printed on the share card.
 *
 * Format: PREFIX-XXXX, e.g. LUCY-8K42.
 * - PREFIX: first word of the display name, letters only, uppercase,
 *   max 6 chars ('CLIMBER' when nothing usable remains).
 * - XXXX: 4 chars from an unambiguous alphabet — no 0/O, 1/I/L.
 *
 * Real users get one random code, generated once and persisted on their
 * profile row (see `ensureInviteCode` in the store). Seed (NPC) users use
 * a deterministic code derived from their id — stable across devices
 * without any storage, so their cards work before any DB migration.
 */

/** Unambiguous alphabet: no 0/O, 1/I/L (31 glyphs). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidInviteCode(code: string): boolean {
  return /^[A-Z]{1,6}-[A-HJKMNP-Z2-9]{4}$/.test(code);
}

/** 'Lucy Xi' → 'LUCY'; '李静' → 'CLIMBR'. */
export function inviteCodePrefix(displayName: string): string {
  const first = (displayName.split(/\s+/)[0] ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  // 'CLIMBER' is 7 chars — the fallback must fit the 6-char cap so every
  // generated code passes isValidInviteCode.
  return first.slice(0, 6) || 'CLIMBR';
}

function randomSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** FNV-1a 32-bit hash — deterministic per-user suffix for seed users. */
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function hashSuffix(id: string): string {
  let h = hash32(id);
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length);
  }
  return out;
}

/** Random code for real users — generated once, then persisted on the profile. */
export function randomInviteCode(displayName: string): string {
  return `${inviteCodePrefix(displayName)}-${randomSuffix()}`;
}

/** Deterministic code for seed users — stable across devices, no storage. */
export function seedInviteCode(userId: string, displayName: string): string {
  return `${inviteCodePrefix(displayName)}-${hashSuffix(userId)}`;
}

/** The public add link encoded by the QR code. */
export function inviteLink(code: string): string {
  return `https://crux8.app/add/${code}`;
}
