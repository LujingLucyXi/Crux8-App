import { createClient } from '@supabase/supabase-js';
import type { Profile, Style, Activity } from '@/seed/types';
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
  preferred_styles?: string[] | null;
  about?: string | null;
  signature?: string | null;
  tags?: string[] | null;
  location?: string | null;
  activities?: string[] | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  onboarded?: boolean | null;
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
    preferred_styles: (row?.preferred_styles as Style[] | undefined) ?? ['top_rope', 'lead', 'outdoor_sport'],
    about: row?.about ?? '',
    signature: row?.signature ?? undefined,
    tags: row?.tags ?? undefined,
    location: row?.location ?? undefined,
    activities: (row?.activities as Activity[] | undefined) ?? undefined,
    onboarded: row?.onboarded ?? false,
    weight_kg: row?.weight_kg ?? undefined,
    height_cm: row?.height_cm ?? undefined,
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
  if (patch.preferred_styles !== undefined) row.preferred_styles = patch.preferred_styles;
  if (patch.about !== undefined) row.about = patch.about;
  if (patch.signature !== undefined) row.signature = patch.signature;
  if (patch.tags !== undefined) row.tags = patch.tags;
  if (patch.location !== undefined) row.location = patch.location;
  if (patch.activities !== undefined) row.activities = patch.activities;
  if (patch.weight_kg !== undefined) row.weight_kg = patch.weight_kg;
  if (patch.height_cm !== undefined) row.height_cm = patch.height_cm;
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
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
