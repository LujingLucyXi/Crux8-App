import { createClient } from '@supabase/supabase-js';
import type { Profile, Style, Activity, QuizDna } from '@/seed/types';
import { DNA_AXES } from '@/lib/quizMeta';
import { avatarFromSeed } from '@/lib/avatar';

const SUPABASE_URL = 'https://njthgcbvmlavhwvcwqqx.supabase.co';
// Public publishable key for the Crux8_Climber_DNA project. This is the same
// key shipped in the quiz's public client bundle at play.crux8.app — it is
// public by design. Row Level Security policies on each table protect the data.
const SUPABASE_ANON_KEY = 'sb_publishable_AYHfOM5EnLaH6dpiTp5Lsg_ev8elpft';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Shape of a row in the `profiles` table (subset we read). */
export interface ProfileRow {
  id: string;
  email?: string | null;
  display_name?: string | null;
  pronouns?: string | null;
  dob?: string | null;
  avatar?: Profile['avatar'] | null;
  photo_url?: string | null;
  home_gym_id?: string | null;
  top_grade?: string | null;
  boulder_grade?: string | null;
  preferred_styles?: string[] | null;
  about?: string | null;
  signature?: string | null;
  tags?: string[] | null;
  location?: string | null;
  activities?: string[] | null;
  hike_distance?: string | null;
  hike_pace?: string | null;
  quiz_result_type?: string | null;
  quiz_dna?: unknown | null;
  quiz_house_id?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  onboarded?: boolean | null;
  /** Personal invite code (e.g. CLIMB-8K42). Present after the 2026-10-15-invite-code migration. */
  invite_code?: string | null;
  /** App-level email-ownership proof (Discord-style, 2026-10-16 migration). */
  email_verified?: boolean | null;
  /** Public belay verification statuses: {top_rope: 'self_attested'|'verified', ...} */
  verifications?: Record<string, string> | null;
}

/**
 * Normalize the stored `quiz_dna` jsonb into QuizDna. Tolerates missing or
 * partial data — axes fall back to the canonical DNA_AXES metadata.
 */
export function normalizeQuizDna(raw: unknown): QuizDna | undefined {
  if (!Array.isArray(raw)) return undefined;
  const axes: QuizDna = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const key = typeof rec.key === 'string' ? rec.key : '';
    const meta = DNA_AXES.find((a) => a.key === key);
    const value = Number(rec.value);
    if (!key || !Number.isFinite(value)) continue;
    axes.push({
      key,
      label: typeof rec.label === 'string' ? rec.label : (meta?.label_en ?? key.toUpperCase()),
      emoji: typeof rec.emoji === 'string' ? rec.emoji : (meta?.emoji ?? ''),
      value: Math.max(0, Math.min(100, Math.round(value))),
    });
  }
  return axes.length ? axes : undefined;
}

/**
 * Build the local `me` Profile from an auth user + their `profiles` row.
 * A brand-new user only has a bare row (id + email, created by the DB trigger),
 * so UI-required fields fall back to the same defaults the old mock signup used.
 * These defaults stay local — they are only written to the DB once the user
 * completes onboarding (or edits their profile).
 */
export function profileRowToProfile(userId: string, email: string, row: ProfileRow | null): Profile {
  const fallbackName = email.split('@')[0] || 'Climber';
  return {
    id: userId,
    display_name: row?.display_name ?? fallbackName,
    pronouns: row?.pronouns ?? undefined,
    dob: row?.dob ?? undefined,
    avatar: row?.avatar ?? avatarFromSeed(fallbackName),
    photo_url: row?.photo_url ?? undefined,
    home_gym_id: row?.home_gym_id ?? 'gym_vertical_world',
    top_grade: row?.top_grade ?? '5.10c',
    boulder_grade: row?.boulder_grade ?? undefined,
    preferred_styles: (row?.preferred_styles as Style[] | undefined) ?? ['top_rope', 'lead', 'outdoor_sport'],
    about: row?.about ?? '',
    signature: row?.signature ?? undefined,
    tags: row?.tags ?? undefined,
    location: row?.location ?? undefined,
    activities: (row?.activities as Activity[] | undefined) ?? undefined,
    hike_distance: row?.hike_distance ?? undefined,
    hike_pace: row?.hike_pace ?? undefined,
    quiz_result_type: row?.quiz_result_type ?? undefined,
    quiz_dna: normalizeQuizDna(row?.quiz_dna),
    quiz_house_id: row?.quiz_house_id ?? undefined,
    onboarded: row?.onboarded ?? false,
    weight_kg: row?.weight_kg ?? undefined,
    height_cm: row?.height_cm ?? undefined,
    invite_code: row?.invite_code ?? undefined,
    email: email ?? undefined,
    email_verified: row?.email_verified ?? undefined,
  };
}

/**
 * Convert a partial Profile patch into a `profiles`-table update payload.
 * Only defined values are included; the id/RLS scoping happens at the call site.
 */
export function profilePatchToRow(patch: Partial<Profile>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.display_name !== undefined) row.display_name = patch.display_name;
  if (patch.pronouns !== undefined) row.pronouns = patch.pronouns;
  if (patch.dob !== undefined) row.dob = patch.dob;
  if (patch.avatar !== undefined) row.avatar = patch.avatar;
  if (patch.photo_url !== undefined) row.photo_url = patch.photo_url;
  if (patch.home_gym_id !== undefined) row.home_gym_id = patch.home_gym_id;
  if (patch.top_grade !== undefined) row.top_grade = patch.top_grade;
  if (patch.boulder_grade !== undefined) row.boulder_grade = patch.boulder_grade;
  if (patch.preferred_styles !== undefined) row.preferred_styles = patch.preferred_styles;
  if (patch.about !== undefined) row.about = patch.about;
  if (patch.signature !== undefined) row.signature = patch.signature;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.activities !== undefined) row.activities = patch.activities;
  if (patch.hike_distance !== undefined) row.hike_distance = patch.hike_distance;
  if (patch.hike_pace !== undefined) row.hike_pace = patch.hike_pace;
  if (patch.quiz_result_type !== undefined) row.quiz_result_type = patch.quiz_result_type;
  if (patch.quiz_dna !== undefined) row.quiz_dna = patch.quiz_dna;
  if (patch.quiz_house_id !== undefined) row.quiz_house_id = patch.quiz_house_id;
  if (patch.weight_kg !== undefined) row.weight_kg = patch.weight_kg;
  if (patch.height_cm !== undefined) row.height_cm = patch.height_cm;
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
  // invite_code writes no-op gracefully when the column doesn't exist yet
  // (persistProfilePatch logs and keeps local state as source of truth).
  if (patch.invite_code !== undefined) row.invite_code = patch.invite_code;
  if (patch.email_verified !== undefined) row.email_verified = patch.email_verified;
  return row;
}

/** Fetch the caller's own profile row (RLS: own-read). Null when no row exists yet. */
export async function fetchMyProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

/** Plain-language message for an OTP send/verify failure. */
export function otpErrorMessage(error: { message?: string } | null | undefined, fallback: string): string {
  const msg = (error?.message ?? '').toLowerCase();
  if (!msg) return fallback;
  if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('after') && msg.includes('seconds')) {
    return 'Too many attempts — please wait a minute and try again.';
  }
  if (msg.includes('expired') || msg.includes('invalid')) {
    return 'That code is wrong or expired — check it and try again.';
  }
  if (msg.includes('email') && msg.includes('invalid')) {
    return "That email doesn't look right — check it and try again.";
  }
  if (msg.includes('disabled') || msg.includes('not enabled')) {
    return 'Email login is not enabled yet — please try again later.';
  }
  return error?.message ?? fallback;
}

/** Plain-language message for an email+password auth failure. */
export function passwordErrorMessage(error: { message?: string } | null | undefined, fallback: string): string {
  const msg = (error?.message ?? '').toLowerCase();
  if (!msg) return fallback;
  if (msg.includes('invalid login credentials')) {
    return 'Wrong email or password — check both and try again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email first — check your inbox for the link.';
  }
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already in use')) {
    return 'This email already has an account — try signing in instead.';
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('weak'))) {
    return 'Password must be at least 6 characters.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Too many attempts — please wait a minute and try again.';
  }
  return error?.message ?? fallback;
}
