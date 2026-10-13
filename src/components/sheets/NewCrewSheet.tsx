import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Sheet, SheetContent } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea } from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import type { GroupCategory } from '@/seed/types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES: { value: GroupCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'boulder', label: 'Boulder' },
  { value: 'beginner', label: 'Beginners' },
  { value: 'identity', label: 'Identity' },
  { value: 'trad', label: 'Trad' },
  { value: 'alpine', label: 'Alpine' },
];

export function NewCrewSheet({ open, onOpenChange }: Props) {
  const nav = useNavigate();
  const createGroup = useAppStore((s) => s.createGroup);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<GroupCategory>('general');
  const [description, setDescription] = useState('');
  const [joinPolicy, setJoinPolicy] = useState<'open' | 'request'>('open');
  const [questions, setQuestions] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setTagline('');
    setCategory('general');
    setDescription('');
    setJoinPolicy('open');
    setQuestions('');
    setError('');
  };

  const submit = () => {
    if (name.trim().length < 3) {
      setError('Give your crew a name (at least 3 characters).');
      return;
    }
    const id = createGroup({
      name,
      tagline: tagline || 'A new climbing crew 🧗',
      category,
      description,
      join_policy: joinPolicy,
      survey_questions:
        joinPolicy === 'request'
          ? questions
              .split('\n')
              .map((q) => q.trim())
              .filter(Boolean)
          : undefined,
    });
    if (!id) {
      setError('Something went wrong — please try again.');
      return;
    }
    toast('Crew created 🎉', { description: 'Invite partners from the crew page.' });
    reset();
    onOpenChange(false);
    nav(`/community/${id}`);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent title="Start a crew">
        <div className="flex flex-col gap-4 mt-2">
          <div>
            <Label>Crew name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dawn Patrol Crushers"
              maxLength={48}
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="One line about your crew"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    category === c.value
                      ? 'bg-brand-600 text-[#161310] border-brand-600'
                      : 'bg-paper-100 text-ink-700 border-ink-100',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>About (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this crew about? Who should join?"
              rows={3}
              maxLength={280}
            />
          </div>
          <div>
            <Label>Who can join?</Label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setJoinPolicy('open')}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  joinPolicy === 'open'
                    ? 'bg-brand-600 text-[#161310] border-brand-600'
                    : 'bg-paper-100 text-ink-700 border-ink-100',
                )}
              >
                Open
                <span className="block text-xs font-normal opacity-70 mt-0.5">
                  Anyone can join instantly
                </span>
              </button>
              <button
                onClick={() => setJoinPolicy('request')}
                className={cn(
                  'flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  joinPolicy === 'request'
                    ? 'bg-brand-600 text-[#161310] border-brand-600'
                    : 'bg-paper-100 text-ink-700 border-ink-100',
                )}
              >
                By request
                <span className="block text-xs font-normal opacity-70 mt-0.5">
                  You approve new members
                </span>
              </button>
            </div>
          </div>
          {joinPolicy === 'request' && (
            <div>
              <Label>Join questions <span className="text-ink-400 font-normal">(one per line, optional)</span></Label>
              <Textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder={'How long have you been climbing?\nWhat are you looking for in this crew?'}
                rows={3}
                maxLength={500}
              />
            </div>
          )}
          {error && <p className="text-sm text-coral-600">{error}</p>}
          <Button onClick={submit} className="w-full mt-2">
            Create crew
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
