import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  NavArrowLeft,
  Plus,
  Trash,
  Check,
  Xmark,
  Refresh,
  StarSolid,
  ChatBubble,
} from 'iconoir-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { NewSessionSheet } from '@/components/sheets/NewSessionSheet';
import { useAppStore } from '@/store/useAppStore';
import type { AvatarConfig } from '@/lib/avatar';

type PersonLite = { id: string; display_name: string; avatar?: AvatarConfig; photo_url?: string };

export function GroupManage() {
  const { groupId } = useParams<{ groupId: string }>();
  const nav = useNavigate();
  const groups = useAppStore((s) => s.groups);
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.me);
  const approve = useAppStore((s) => s.approveJoinRequest);
  const decline = useAppStore((s) => s.declineJoinRequest);
  const addAdmin = useAppStore((s) => s.addGroupAdmin);
  const removeAdmin = useAppStore((s) => s.removeGroupAdmin);
  const removeMember = useAppStore((s) => s.removeGroupMember);
  const updateGroup = useAppStore((s) => s.updateGroup);
  const openGroupChat = useAppStore((s) => s.openGroupChat);

  const group = groups.find((g) => g.id === groupId);
  const [eventOpen, setEventOpen] = useState(false);
  const [name, setName] = useState(group?.name ?? '');
  const [tagline, setTagline] = useState(group?.tagline ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [questions, setQuestions] = useState<string[]>(group?.survey_questions ?? []);
  const [newQ, setNewQ] = useState('');

  if (!group || !me) {
    return (
      <div className="pt-10 text-center">
        <p className="text-sm text-ink-500">Group not found.</p>
      </div>
    );
  }

  const myId = me.id ?? 'me';
  const isAdmin = group.admin_ids.includes(myId) || group.admin_ids.includes('me');
  if (!isAdmin) {
    return (
      <div className="pt-10 text-center px-6">
        <p className="text-sm text-ink-500">Only admins can manage this crew.</p>
        <button onClick={() => nav(`/community/${group.id}`)} className="mt-3 text-teal-600 text-sm font-medium">
          Back to group
        </button>
      </div>
    );
  }

  const person = (id: string): PersonLite =>
    id === 'me'
      ? { id: 'me', display_name: me.display_name ?? 'You', avatar: me.avatar, photo_url: me.photo_url }
      : users.find((u) => u.id === id) ?? { id, display_name: id };

  const isOwner = (id: string) => group.owner_id === id || (group.owner_id === undefined && id === group.admin_ids[0]);
  const pending = group.pending ?? [];
  const members = (group.member_ids ?? []).filter((id) => !group.admin_ids.includes(id));

  const saveProfile = () => {
    updateGroup(group.id, { name, tagline, description });
    toast.success('Group profile updated');
  };
  const shuffle = (field: 'cover_url' | 'avatar_url') => {
    const seed = Math.random().toString(36).slice(2, 8);
    const url =
      field === 'cover_url'
        ? `https://picsum.photos/seed/${seed}/800/400`
        : `https://picsum.photos/seed/${seed}/200/200`;
    updateGroup(group.id, { [field]: url });
  };
  const addQuestion = () => {
    if (!newQ.trim()) return;
    const next = [...questions, newQ.trim()];
    setQuestions(next);
    updateGroup(group.id, { survey_questions: next });
    setNewQ('');
  };
  const removeQuestion = (i: number) => {
    const next = questions.filter((_, idx) => idx !== i);
    setQuestions(next);
    updateGroup(group.id, { survey_questions: next });
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-500 mb-2 px-1">{title}</h2>
      <div className="rounded-2xl bg-white border border-ink-100 p-4">{children}</div>
    </section>
  );

  const input =
    'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-teal-500';

  return (
    <div className="pb-10">
      <div className="flex items-center gap-2 pt-2 pb-1">
        <button onClick={() => nav(`/community/${group.id}`)} aria-label="Back" className="p-1">
          <NavArrowLeft width={20} height={20} className="text-ink-900" />
        </button>
        <h1 className="text-lg font-semibold text-ink-900">Manage crew</h1>
      </div>

      {/* ── Join requests ── */}
      <Section title={`Join requests${pending.length ? ` · ${pending.length}` : ''}`}>
        {pending.length === 0 ? (
          <p className="text-sm text-ink-500">No pending requests right now.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((r) => {
              const p = person(r.user_id);
              return (
                <div key={r.user_id} className="rounded-xl bg-paper-50 border border-ink-100 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar photoUrl={p.photo_url} config={p.avatar} seed={p.id} alt={p.display_name} size={32} fallback={p.display_name} />
                    <span className="text-sm font-medium text-ink-900">{p.display_name}</span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {(group.survey_questions ?? []).map((q, i) => (
                      <div key={i} className="text-xs">
                        <p className="text-ink-500">{q}</p>
                        <p className="text-ink-800">{r.answers[i] || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        approve(group.id, r.user_id);
                        toast.success(`${p.display_name} approved`);
                      }}
                    >
                      <Check width={15} height={15} /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        decline(group.id, r.user_id);
                        toast(`${p.display_name} declined`);
                      }}
                    >
                      <Xmark width={15} height={15} /> Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Admins ── */}
      <Section title="Admins">
        <div className="flex flex-col gap-2">
          {group.admin_ids.map((id) => {
            const p = person(id);
            return (
              <div key={id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar photoUrl={p.photo_url} config={p.avatar} seed={p.id} alt={p.display_name} size={30} fallback={p.display_name} />
                  <span className="text-sm text-ink-900 truncate">{p.display_name}</span>
                  {isOwner(id) && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                      <StarSolid width={11} height={11} /> Owner
                    </span>
                  )}
                </div>
                {!isOwner(id) && (
                  <button
                    onClick={() => removeAdmin(group.id, id)}
                    className="text-xs font-medium text-ink-500 hover:text-red-600"
                  >
                    Remove admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Members ── */}
      <Section title={`Members · ${group.member_count.toLocaleString()}`}>
        {members.length === 0 ? (
          <p className="text-sm text-ink-500">No non-admin members loaded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((id) => {
              const p = person(id);
              return (
                <div key={id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar photoUrl={p.photo_url} config={p.avatar} seed={p.id} alt={p.display_name} size={30} fallback={p.display_name} />
                    <span className="text-sm text-ink-900 truncate">{p.display_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        addAdmin(group.id, id);
                        toast.success(`${p.display_name} is now an admin`);
                      }}
                      className="text-xs font-medium text-teal-600"
                    >
                      Make admin
                    </button>
                    <button
                      onClick={() => removeMember(group.id, id)}
                      aria-label="Remove member"
                      className="text-ink-400 hover:text-red-600"
                    >
                      <Trash width={15} height={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Join settings ── */}
      <Section title="Who can join">
        <div className="flex gap-2">
          {(['open', 'request'] as const).map((policy) => {
            const active = (group.join_policy ?? 'open') === policy;
            return (
              <button
                key={policy}
                onClick={() => updateGroup(group.id, { join_policy: policy })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-left ${
                  active ? 'border-teal-500 bg-teal-50' : 'border-ink-200 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-ink-900">{policy === 'open' ? 'Open' : 'Request to join'}</p>
                <p className="text-[11px] text-ink-500 mt-0.5">
                  {policy === 'open' ? 'Anyone can join instantly' : 'Admins review each request'}
                </p>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-semibold text-ink-500 mt-4 mb-2">Join request survey</p>
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl bg-paper-50 border border-ink-100 px-3 py-2">
              <span className="text-sm text-ink-800 flex-1">{q}</span>
              <button onClick={() => removeQuestion(i)} aria-label="Remove question" className="text-ink-400 hover:text-red-600">
                <Trash width={14} height={14} />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
              placeholder="Add a question…"
              className={input}
            />
            <Button size="sm" variant="outline" onClick={addQuestion}>
              <Plus width={15} height={15} />
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Group profile ── */}
      <Section title="Group profile">
        <div className="flex items-center gap-3">
          <img src={group.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover border border-ink-100" />
          <div className="flex flex-col gap-1.5">
            <button onClick={() => shuffle('avatar_url')} className="inline-flex items-center gap-1 text-xs font-medium text-teal-600">
              <Refresh width={13} height={13} /> Shuffle logo
            </button>
            <button onClick={() => shuffle('cover_url')} className="inline-flex items-center gap-1 text-xs font-medium text-teal-600">
              <Refresh width={13} height={13} /> Shuffle banner
            </button>
          </div>
        </div>
        <img src={group.cover_url} alt="" className="mt-3 w-full h-24 rounded-xl object-cover border border-ink-100" />

        <div className="mt-4 flex flex-col gap-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Tagline</span>
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={`${input} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${input} mt-1 resize-none`} />
          </label>
          <Button size="sm" onClick={saveProfile}>Save profile</Button>
        </div>
      </Section>

      {/* ── Actions ── */}
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="outline" onClick={() => setEventOpen(true)}>
          <Plus width={16} height={16} /> Post event as {group.name}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            openGroupChat(group.id);
            nav(`/chat/session/${group.id}`);
          }}
        >
          <ChatBubble width={16} height={16} /> Open group chat
        </Button>
      </div>

      <NewSessionSheet open={eventOpen} onOpenChange={setEventOpen} defaultGroupId={group.id} />
    </div>
  );
}
