import type { AvatarConfig } from '@/lib/avatar';
import type { NpcUser, Profile } from '@/seed/types';
import type { DirectoryProfile } from '@/lib/db';

export interface ResolvedUser {
  id: string;
  display_name: string;
  photo_url?: string | null;
  avatar?: AvatarConfig;
  top_grade?: string;
  boulder_grade?: string;
  home_gym_id?: string;
  about?: string;
  signature?: string;
  preferred_styles?: string[];
  quiz_result_type?: string;
  quiz_house_id?: string;
  location?: string;
}

/**
 * Resolve a user id to display info.
 * Priority: the signed-in user → NPC seed users (still referenced by
 * events/groups) → real profiles fetched from Supabase (`directory`).
 * Returns undefined only for truly unknown ids.
 */
export function resolveUser(
  id: string,
  me: Profile | null,
  users: NpcUser[],
  directory: Record<string, DirectoryProfile>,
): ResolvedUser | undefined {
  if (me && id === me.id) {
    return {
      id: me.id,
      display_name: me.display_name,
      photo_url: me.photo_url ?? null,
      avatar: me.avatar,
      top_grade: me.top_grade,
      boulder_grade: me.boulder_grade,
      home_gym_id: me.home_gym_id,
      about: me.about,
      signature: me.signature,
      preferred_styles: me.preferred_styles,
      quiz_result_type: me.quiz_result_type,
      quiz_house_id: me.quiz_house_id,
      location: me.location,
    };
  }
  const npc = users.find((u) => u.id === id);
  if (npc) {
    return {
      id: npc.id,
      display_name: npc.display_name,
      avatar: npc.avatar,
      top_grade: npc.top_grade,
    };
  }
  const dir = directory[id];
  if (dir) {
    return {
      id: dir.id,
      // Server rows can carry display_name NULL (accounts that never
      // finished onboarding) — never hand the UI a null name; the
      // owner's app heals the real name back on their next launch.
      display_name: dir.display_name?.trim() ? dir.display_name : 'Climber',
      photo_url: dir.photo_url ?? null,
      avatar: dir.avatar ?? undefined,
      top_grade: dir.top_grade ?? undefined,
      boulder_grade: dir.boulder_grade ?? undefined,
      home_gym_id: dir.home_gym_id ?? undefined,
      about: dir.about ?? undefined,
      signature: dir.signature ?? undefined,
      preferred_styles: dir.preferred_styles ?? undefined,
      quiz_result_type: dir.quiz_result_type ?? undefined,
      quiz_house_id: dir.quiz_house_id ?? undefined,
      location: dir.location ?? undefined,
    };
  }
  return undefined;
}
