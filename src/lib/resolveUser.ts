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
      display_name: dir.display_name,
      photo_url: dir.photo_url ?? null,
      top_grade: dir.top_grade ?? undefined,
      boulder_grade: dir.boulder_grade ?? undefined,
    };
  }
  return undefined;
}
