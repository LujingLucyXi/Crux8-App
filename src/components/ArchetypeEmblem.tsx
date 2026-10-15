import { useState } from 'react';
import { getArchetype } from '@/lib/quizMeta';

/**
 * Climb DNA identity art: the gold medallion emblem for an archetype
 * (public/emblems/<archetype_id>.webp). The legacy emoji glyph survives
 * only as a fallback when no archetype resolves or the image fails.
 */
export function ArchetypeEmblem({
  archetypeId,
  className = 'h-16 w-16',
  fallbackClassName = 'text-4xl',
}: {
  archetypeId: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const arch = getArchetype(archetypeId);
  if (!arch || failed) {
    return <span className={fallbackClassName}>{arch?.emoji ?? '🧬'}</span>;
  }
  return (
    <img
      src={`/emblems/${arch.id}.webp`}
      alt={arch.name_en}
      className={`${className} rounded-full object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
