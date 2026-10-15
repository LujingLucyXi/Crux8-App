/**
 * Supabase data-access layer for the real backend: sessions, session_rsvps,
 * climb_calls, call_pairings, plus the public profile directory.
 *
 * Row <-> TS mappers translate DB rows into the app's Session / ClimbCall
 * shapes (src/seed/types.ts) so the UI keeps working unchanged. Column names
 * match the TS field names 1:1 (schema v2).
 *
 * All inserts set host_id / user_id explicitly — RLS requires
 * auth.uid() to match the owner column.
 */
import { supabase } from '@/lib/supabase';
import type {
  Session,
  ClimbCall,
  Category,
  Vibe,
  LocationType,
  HikeType,
  Invite,
  MateRequest,
} from '@/seed/types';

export interface DirectoryProfile {
  id: string;
  display_name: string;
  photo_url?: string | null;
  top_grade?: string | null;
  home_gym_id?: string | null;
}

/** DB row shapes (the supabase-js client is untyped; cast at the boundary). */
interface SessionRow {
  id: string;
  host_id: string;
  category: string | null;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string;
  started_at: string | null;
  finished_at: string | null;
  gym_id: string | null;
  area: string | null;
  route_id: string | null;
  hike_type: string | null;
  capacity: number | null;
  vibe: string | null;
  location_type: string | null;
  is_verified_only: boolean | null;
  requires_attestation: boolean | null;
  posted_by_group_id: string | null;
  note: string | null;
}

interface ClimbCallRow {
  id: string;
  user_id: string;
  title: string | null;
  looking_for: string | null;
  category: string | null;
  grade: string | null;
  location_type: string | null;
  gym_id: string | null;
  area: string | null;
  starts_at: string;
  ends_at: string;
  note: string | null;
  is_friend_only: boolean | null;
  status: string | null;
  weight_kg: number | string | null;
  capacity: number | null;
}

interface RsvpRow {
  session_id: string;
  user_id: string;
}

interface PairingRow {
  call_id: string;
  user_id: string;
}

/** Cast the untyped supabase-js payload at the boundary. */
function asRows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

function asRow<T>(data: unknown): T | null {
  return data !== null && typeof data === 'object' ? (data as T) : null;
}

function uniq(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function mapSessionRow(row: SessionRow, participantIds: string[]): Session {
  return {
    id: row.id,
    host_id: row.host_id,
    category: (row.category as Category | null) ?? 'boulder',
    title: row.title,
    subtitle: row.subtitle ?? '',
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    started_at: row.started_at ?? undefined,
    finished_at: row.finished_at ?? undefined,
    gym_id: row.gym_id ?? undefined,
    area: row.area ?? undefined,
    route_id: row.route_id ?? undefined,
    hike_type: (row.hike_type as HikeType | null) ?? undefined,
    // Participants are exactly the 'going' RSVPs — the host is upserted as
    // 'going' at creation. Do NOT force-add host_id here: a host who leaves
    // must actually leave (and an all-left session drops to 0 people and is
    // filtered out in the store).
    participant_ids: uniq(participantIds),
    capacity: row.capacity ?? 4,
    vibe: (row.vibe as Vibe | null) ?? 'social',
    location_type:
      (row.location_type as LocationType | null) ?? (row.gym_id ? 'indoor' : 'outdoor'),
    is_verified_only: row.is_verified_only ?? false,
    requires_attestation: row.requires_attestation ?? false,
    posted_by_group_id: row.posted_by_group_id ?? undefined,
    note: row.note ?? undefined,
  };
}

function mapCallRow(row: ClimbCallRow, participantIds: string[]): ClimbCall {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title ?? undefined,
    looking_for: (row.looking_for as ClimbCall['looking_for'] | null) ?? 'take_turns',
    category: (row.category as ClimbCall['category'] | null) ?? 'top_rope',
    grade: row.grade ?? '',
    location_type: (row.location_type as ClimbCall['location_type'] | null) ?? 'indoor',
    gym_id: row.gym_id ?? undefined,
    area: row.area ?? undefined,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    note: row.note ?? undefined,
    is_friend_only: row.is_friend_only ?? false,
    status: (row.status as ClimbCall['status'] | null) ?? 'live',
    weight_kg: row.weight_kg === null ? undefined : Number(row.weight_kg),
    capacity: row.capacity ?? 2,
    participant_ids: uniq([row.user_id, ...participantIds]),
  };
}

/** Sessions ending in the last 7 days or later, with their 'going' RSVPs. */
export async function fetchSessions(): Promise<Session[]> {
  const cutoff = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gt('ends_at', cutoff)
    .order('starts_at', { ascending: true });
  if (error) throw new Error(`fetchSessions: ${error.message}`);
  const rows = asRows<SessionRow>(data);

  const bySession = new Map<string, string[]>();
  if (rows.length > 0) {
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('session_rsvps')
      .select('session_id,user_id')
      .in(
        'session_id',
        rows.map((r) => r.id),
      )
      .eq('status', 'going');
    if (rsvpError) throw new Error(`fetchSessions rsvps: ${rsvpError.message}`);
    for (const r of asRows<RsvpRow>(rsvpData)) {
      const arr = bySession.get(r.session_id) ?? [];
      arr.push(r.user_id);
      bySession.set(r.session_id, arr);
    }
  }
  return rows.map((r) => mapSessionRow(r, bySession.get(r.id) ?? []));
}

/** Insert a session; the host is auto-RSVP'd as 'going'. */
export async function createSession(
  input: Omit<Session, 'id' | 'participant_ids'>,
): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      host_id: input.host_id,
      category: input.category,
      title: input.title,
      subtitle: input.subtitle,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      gym_id: input.gym_id ?? null,
      area: input.area ?? null,
      route_id: input.route_id ?? null,
      hike_type: input.hike_type ?? null,
      capacity: input.capacity,
      vibe: input.vibe,
      location_type: input.location_type,
      is_verified_only: input.is_verified_only,
      requires_attestation: input.requires_attestation,
      posted_by_group_id: input.posted_by_group_id ?? null,
      note: input.note ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(`createSession: ${error.message}`);
  const row = asRow<SessionRow>(data);
  if (!row) throw new Error('createSession: no row returned');
  const { error: rsvpError } = await supabase.from('session_rsvps').upsert(
    { session_id: row.id, user_id: input.host_id, status: 'going' },
    { onConflict: 'session_id,user_id' },
  );
  if (rsvpError) throw new Error(`createSession rsvp: ${rsvpError.message}`);
  return mapSessionRow(row, [input.host_id]);
}

/** Host-only: update a session's editable fields. */
export async function updateSession(
  id: string,
  patch: Partial<Pick<Session, 'title' | 'subtitle' | 'starts_at' | 'ends_at' | 'gym_id' | 'area' | 'route_id' | 'capacity' | 'vibe' | 'note' | 'is_verified_only'>>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.subtitle !== undefined) row.subtitle = patch.subtitle;
  if (patch.starts_at !== undefined) row.starts_at = patch.starts_at;
  if (patch.ends_at !== undefined) row.ends_at = patch.ends_at;
  if (patch.gym_id !== undefined) row.gym_id = patch.gym_id;
  if (patch.area !== undefined) row.area = patch.area;
  if (patch.route_id !== undefined) row.route_id = patch.route_id;
  if (patch.capacity !== undefined) row.capacity = patch.capacity;
  if (patch.vibe !== undefined) row.vibe = patch.vibe;
  if (patch.note !== undefined) row.note = patch.note ?? null;
  if (patch.is_verified_only !== undefined) row.is_verified_only = patch.is_verified_only;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('sessions').update(row).eq('id', id);
  if (error) throw new Error(`updateSession: ${error.message}`);
}

/**
 * Stamp a session started/finished via the set_session_lifecycle RPC
 * (any participant may call it; first stamp wins server-side).
 * Returns false when the RPC isn't available yet (SQL not run) — callers
 * keep the local stamp as the fallback, so nothing breaks pre-migration.
 */
export async function setSessionLifecycle(
  id: string,
  patch: { started_at?: string; finished_at?: string },
): Promise<boolean> {
  const { error } = await supabase.rpc('set_session_lifecycle', {
    p_session_id: id,
    p_started_at: patch.started_at ?? null,
    p_finished_at: patch.finished_at ?? null,
  });
  return !error;
}

/* ── Belay verification (peer-confirmed) ─────────────────────────────── */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string): boolean => UUID_RE.test(id);

/** Write my public verification statuses ({cat: 'self_attested'|'verified'}). */
export async function setMyVerifications(
  userId: string,
  verifications: Record<string, string>,
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ verifications })
    .eq('id', userId);
  return !error;
}

/**
 * Sync one recap belay answer to the private belay_confirms table via RPC
 * (the server derives the skill from the session type and recomputes the
 * subject's peer-confirmed status). False pre-migration / for seed users.
 */
export async function submitBelayConfirmRemote(
  sessionId: string,
  subjectId: string,
  value: 'has_cert' | 'no_cert' | 'unsure',
): Promise<boolean> {
  if (!isUuid(sessionId) || !isUuid(subjectId)) return false;
  const { error } = await supabase.rpc('submit_belay_confirm', {
    p_session_id: sessionId,
    p_subject_id: subjectId,
    p_value: value,
  });
  return !error;
}

/**
 * Save a "gym not listed" suggestion for review. Insert-only table; the
 * review side reads it from the dashboard. False pre-migration / signed out.
 */
export async function submitGymSuggestion(
  name: string,
  city: string,
  note: string,
): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return false;
  const { error } = await supabase.from('gym_suggestions').insert({
    name,
    city: city || null,
    note: note || null,
    suggested_by: uid,
  });
  return !error;
}

/** Public verification statuses for a batch of real users (directory). */
export async function fetchPublicVerifications(
  ids: string[],
): Promise<Record<string, Record<string, string>>> {
  const uuids = ids.filter(isUuid);
  if (uuids.length === 0) return {};
  const { data, error } = await supabase.rpc('get_public_verifications', {
    p_ids: uuids,
  });
  if (error || !Array.isArray(data)) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const row of data as Array<{ id: string; verifications: unknown }>) {
    if (row?.id && row.verifications && typeof row.verifications === 'object') {
      out[row.id] = row.verifications as Record<string, string>;
    }
  }
  return out;
}

/** Distinct partners who confirmed 'has_cert', per category, for one user. */
export async function fetchBelayConfirmCounts(
  userId: string,
): Promise<Record<string, number>> {
  if (!isUuid(userId)) return {};
  const { data, error } = await supabase.rpc('get_belay_confirm_counts', {
    p_subject: userId,
  });
  if (error || !data || typeof data !== 'object') return {};
  return data as Record<string, number>;
}

/** going=true upserts a 'going' RSVP; going=false deletes the row. */
export async function setSessionRsvp(
  sessionId: string,
  userId: string,
  going: boolean,
): Promise<void> {
  if (going) {
    const { error } = await supabase.from('session_rsvps').upsert(
      { session_id: sessionId, user_id: userId, status: 'going' },
      { onConflict: 'session_id,user_id' },
    );
    if (error) throw new Error(`setSessionRsvp: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('session_rsvps')
      .delete()
      .eq('session_id', sessionId)
      .eq('user_id', userId);
    if (error) throw new Error(`setSessionRsvp: ${error.message}`);
  }
}

/** Live, not-yet-ended climb calls with their pairings. */
export async function fetchClimbCalls(): Promise<ClimbCall[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('climb_calls')
    .select('*')
    .eq('status', 'live')
    .gt('ends_at', now)
    .order('starts_at', { ascending: true });
  if (error) throw new Error(`fetchClimbCalls: ${error.message}`);
  const rows = asRows<ClimbCallRow>(data);

  const byCall = new Map<string, string[]>();
  if (rows.length > 0) {
    const { data: pairingData, error: pairingError } = await supabase
      .from('call_pairings')
      .select('call_id,user_id')
      .in(
        'call_id',
        rows.map((r) => r.id),
      )
      .in('status', ['requested', 'confirmed']);
    if (pairingError) throw new Error(`fetchClimbCalls pairings: ${pairingError.message}`);
    for (const p of asRows<PairingRow>(pairingData)) {
      const arr = byCall.get(p.call_id) ?? [];
      arr.push(p.user_id);
      byCall.set(p.call_id, arr);
    }
  }
  return rows.map((r) => mapCallRow(r, byCall.get(r.id) ?? []));
}

/** Insert a climb call as 'live'; the caller is the first participant. */
export async function createClimbCall(
  input: Omit<ClimbCall, 'id' | 'participant_ids' | 'status'>,
): Promise<ClimbCall> {
  const { data, error } = await supabase
    .from('climb_calls')
    .insert({
      user_id: input.user_id,
      title: input.title ?? null,
      looking_for: input.looking_for,
      category: input.category,
      grade: input.grade,
      location_type: input.location_type,
      gym_id: input.gym_id ?? null,
      area: input.area ?? null,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      note: input.note ?? null,
      is_friend_only: input.is_friend_only,
      status: 'live',
      weight_kg: input.weight_kg ?? null,
      capacity: input.capacity,
    })
    .select()
    .single();
  if (error) throw new Error(`createClimbCall: ${error.message}`);
  const row = asRow<ClimbCallRow>(data);
  if (!row) throw new Error('createClimbCall: no row returned');
  // The host is the first participant — write their pairing too, so the
  // server-side participant list is complete for every client (fetches
  // build participants from pairings). Best-effort: never block creation.
  try {
    await supabase.from('call_pairings').upsert(
      { call_id: row.id, user_id: input.user_id, status: 'confirmed' },
      { onConflict: 'call_id,user_id' },
    );
  } catch {
    /* host pairing is belt-and-braces; mapCallRow unions the host anyway */
  }
  return mapCallRow(row, [input.user_id]);
}

export interface ClimbCallPatch {
  title?: string | null;
  looking_for?: ClimbCall['looking_for'];
  category?: ClimbCall['category'];
  grade?: string;
  gym_id?: string | null;
  area?: string | null;
  starts_at?: string;
  ends_at?: string;
  note?: string | null;
  capacity?: number;
  status?: ClimbCall['status'];
}

/**
 * Update the signed-in host's own climb call. True when a row actually
 * changed (RLS silently filters out rows the user may not update, which
 * surfaces as an empty result). False for seed/uuid-less calls.
 */
export async function updateClimbCallRemote(
  id: string,
  patch: ClimbCallPatch,
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { data, error } = await supabase
    .from('climb_calls')
    .update(patch)
    .eq('id', id)
    .select('id');
  return !error && Array.isArray(data) && data.length > 0;
}

/** paired=true upserts a 'requested' pairing; paired=false deletes the row. */
export async function setCallPairing(
  callId: string,
  userId: string,
  paired: boolean,
): Promise<void> {
  if (paired) {
    const { error } = await supabase.from('call_pairings').upsert(
      { call_id: callId, user_id: userId, status: 'requested' },
      { onConflict: 'call_id,user_id' },
    );
    if (error) throw new Error(`setCallPairing: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('call_pairings')
      .delete()
      .eq('call_id', callId)
      .eq('user_id', userId);
    if (error) throw new Error(`setCallPairing: ${error.message}`);
  }
}

/** Public profile directory entries for display names / photos. No-op on []. */
export async function fetchDirectoryProfiles(ids: string[]): Promise<DirectoryProfile[]> {
  // Directory ids are profile UUIDs — seed/demo ids (e.g. 'cruxy') resolve
  // locally and must never reach the uuid-typed view (the cast would fail
  // the whole batch).
  const unique = uniq(ids).filter((id) => isUuid(id));
  if (unique.length === 0) return [];
  // directory_profiles is a security-definer view over public.profiles exposing
  // only the columns shown next to other users' names (weight/height stay private).
  const { data, error } = await supabase
    .from('directory_profiles')
    .select('id,display_name,photo_url,top_grade,home_gym_id')
    .in('id', unique);
  if (error) throw new Error(`fetchDirectoryProfiles: ${error.message}`);
  return asRows<DirectoryProfile>(data);
}

/**
 * Resolve a personal invite code (e.g. CLIMB-8K42) to a public profile.
 *
 * Best-effort by design: the `invite_code` column exists on `profiles`
 * (and the directory_profiles view) only after the 2026-10-15-invite-code
 * migration. When the column is missing PostgREST rejects the select —
 * callers catch the null and fall back to the local people list
 * (seed users carry deterministic codes and always resolve locally).
 */
export async function fetchProfileByInviteCode(
  code: string,
): Promise<(DirectoryProfile & { invite_code?: string | null }) | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{1,6}-[A-HJKMNP-Z2-9]{4}$/.test(normalized)) return null;
  try {
    const { data, error } = await supabase
      .from('directory_profiles')
      .select('id,display_name,photo_url,top_grade,home_gym_id,invite_code')
      .eq('invite_code', normalized)
      .maybeSingle();
    if (error || !data) return null;
    const rows = asRows<DirectoryProfile & { invite_code?: string | null }>([data]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Invites (public.invites): personal call/session invites that reach the
// invitee's device. Create is an upsert (re-inviting resets to pending);
// answers are status updates by the invitee.

export async function createInviteRemote(
  kind: 'call' | 'session',
  targetId: string,
  fromId: string,
  toId: string,
): Promise<void> {
  const { error } = await supabase
    .from('invites')
    .upsert(
      { kind, target_id: targetId, from_id: fromId, to_id: toId, status: 'pending' },
      { onConflict: 'kind,target_id,to_id' },
    );
  if (error) throw new Error(`createInviteRemote: ${error.message}`);
}

export async function fetchMyInvites(userId: string): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('id,kind,target_id,from_id,to_id,status,created_at')
    .eq('to_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`fetchMyInvites: ${error.message}`);
  return asRows<Invite>(data);
}

export async function setInviteStatusRemote(
  id: string,
  status: 'accepted' | 'denied',
): Promise<void> {
  const { error } = await supabase.from('invites').update({ status }).eq('id', id);
  if (error) throw new Error(`setInviteStatusRemote: ${error.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cruxmate requests (public.cruxmate_requests): person-to-person add requests.
// The sender inserts with a client-generated id (so optimistic local rows
// and remote rows share the id); the recipient reads and answers.
// Best-effort by design: the table exists only after the
// 2026-10-15-cruxmate-requests migration. When it's missing the calls below
// throw and callers fall back to local-only rows (same-device works).

export async function createMateRequestRemote(row: {
  id: string;
  from_id: string;
  to_id: string;
}): Promise<void> {
  const { error } = await supabase
    .from('cruxmate_requests')
    .insert({ id: row.id, from_id: row.from_id, to_id: row.to_id, status: 'pending' });
  if (error) throw new Error(`createMateRequestRemote: ${error.message}`);
}

export async function fetchMyMateRequests(userId: string): Promise<MateRequest[]> {
  const { data, error } = await supabase
    .from('cruxmate_requests')
    .select('id,from_id,to_id,status,created_at')
    .or(`to_id.eq.${userId},from_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`fetchMyMateRequests: ${error.message}`);
  return asRows<MateRequest>(data);
}

export async function setMateRequestStatusRemote(
  id: string,
  status: 'accepted' | 'denied',
): Promise<void> {
  const { error } = await supabase.from('cruxmate_requests').update({ status }).eq('id', id);
  if (error) throw new Error(`setMateRequestStatusRemote: ${error.message}`);
}

export async function deleteMateRequestRemote(id: string): Promise<void> {
  const { error } = await supabase.from('cruxmate_requests').delete().eq('id', id);
  if (error) throw new Error(`deleteMateRequestRemote: ${error.message}`);
}
