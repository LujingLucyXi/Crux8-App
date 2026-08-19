import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface CelebrationConfig {
  emoji: string;
  title: string;
  subtitle: string;
  /** Ring / confetti accent colors. */
  colors: string[];
}

interface Props {
  show: CelebrationConfig | null;
  onDone: () => void;
  sound?: boolean;
}

/**
 * A "hero moment" overlay: haptic + optional sound + a spring-in medallion and
 * a confetti burst. Deliberately self-contained so it can be dropped on any
 * action (send logged, match locked, streak hit) or thrown away wholesale.
 */
export function Celebration({ show, onDone, sound }: Props) {
  // Haptic + sound fire on each new celebration.
  useEffect(() => {
    if (!show) return;
    navigator.vibrate?.([0, 35, 40, 60]);
    if (sound) playPop(show.colors.length);
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [show, sound, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          {/* dim + soft radial glow */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 42%, ${show.colors[0]}33, rgba(6,4,20,0.62))`,
            }}
          />
          <Confetti colors={show.colors} />

          {/* Medallion */}
          <motion.div
            className="relative flex flex-col items-center text-center px-8"
            initial={{ scale: 0.4, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 16, mass: 0.7 }}
          >
            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl"
              style={{
                background: `conic-gradient(from 210deg, ${show.colors.join(', ')}, ${show.colors[0]})`,
              }}
              animate={{ rotate: [0, 8, -6, 0] }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 500, damping: 12 }}
              >
                {show.emoji}
              </motion.span>
            </motion.div>
            <motion.h2
              className="mt-5 text-3xl font-extrabold text-white tracking-tight"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.14 }}
            >
              {show.title}
            </motion.h2>
            <motion.p
              className="mt-1.5 text-sm font-medium text-white/80"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {show.subtitle}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Confetti({ colors }: { colors: string[] }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 620,
        y: -(160 + Math.random() * 320),
        rot: Math.random() * 720 - 360,
        delay: Math.random() * 0.12,
        size: 7 + Math.random() * 9,
        color: colors[i % colors.length],
        round: Math.random() > 0.5,
      })),
    [colors],
  );
  return (
    <div className="absolute left-1/2 top-[46%]">
      {bits.map((b) => (
        <motion.div
          key={b.id}
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            borderRadius: b.round ? '9999px' : '2px',
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: b.y, rotate: b.rot, opacity: 0 }}
          transition={{ duration: 1.1 + Math.random() * 0.5, delay: b.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// Tiny WebAudio "success" arpeggio — no asset files, easy to mute.
function playPop(steps: number) {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.slice(0, Math.max(3, Math.min(4, steps))).forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio unavailable — ignore */
  }
}
