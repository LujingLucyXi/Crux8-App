import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { totalSendXp, type SendLog } from '@/lib/rewards';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BOULDER_GRADES = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10+'];
const ROPE_GRADES = ['5.8', '5.9', '5.10a', '5.10c', '5.11a', '5.11c', '5.12a', '5.12c', '5.13+'];

const STYLES: { v: SendLog['style']; label: string; hint: string }[] = [
  { v: 'onsight', label: 'Onsight', hint: 'First try, no beta' },
  { v: 'flash', label: 'Flash', hint: 'First try, with beta' },
  { v: 'redpoint', label: 'Redpoint', hint: 'After working it' },
  { v: 'send', label: 'Send', hint: 'Just got it' },
];

/** Record a send — the core hero moment. Fires a celebration + awards XP. */
export function LogSendSheet({ open, onOpenChange }: Props) {
  const logSend = useAppStore((s) => s.logSend);
  const [discipline, setDiscipline] = useState<SendLog['discipline']>('boulder');
  const [grade, setGrade] = useState('V4');
  const [style, setStyle] = useState<SendLog['style']>('send');
  const [note, setNote] = useState('');

  const grades = discipline === 'boulder' ? BOULDER_GRADES : ROPE_GRADES;

  const submit = () => {
    logSend({ grade, discipline, style, note: note.trim() || undefined });
    setNote('');
    onOpenChange(false);
  };

  const setDisc = (d: SendLog['discipline']) => {
    setDiscipline(d);
    setGrade(d === 'boulder' ? 'V4' : '5.10c');
  };

  const xpPreview = totalSendXp(grade, style);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Log a send 🔥">
        <div className="flex flex-col gap-5">
          {/* Discipline */}
          <div className="flex gap-2">
            {(['boulder', 'rope'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDisc(d)}
                className={cn(
                  'flex-1 rounded-xl border py-2.5 text-sm font-bold capitalize transition',
                  discipline === d ? 'bg-brand-gradient text-white border-transparent shadow-brand' : 'bg-white text-ink-600 border-ink-100',
                )}
              >
                {d === 'rope' ? 'Rope' : 'Boulder'}
              </button>
            ))}
          </div>

          {/* Grade */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Grade</p>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-bold transition',
                    grade === g ? 'bg-ink-900 text-white border-ink-900' : 'bg-white text-ink-700 border-ink-100 hover:border-brand-400',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">How'd it go?</p>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setStyle(s.v)}
                  className={cn(
                    'rounded-xl border p-2.5 text-left transition',
                    style === s.v ? 'bg-brand-100 border-brand-400' : 'bg-white border-ink-100 hover:border-brand-400',
                  )}
                >
                  <p className="text-sm font-bold text-ink-900">{s.label}</p>
                  <p className="text-[11px] text-ink-500">{s.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Note (optional)</p>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Finally stuck the crux dyno" />
          </div>

          <Button variant="punch" size="lg" className="w-full" onClick={submit}>
            Log it · +{xpPreview} XP 🔥
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
