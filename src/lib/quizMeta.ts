// Quiz content, one-time copy from crux8-play (2026-10-09):
//   games/climber-personality/results.ts   → 15 archetypes
//   games/climber-personality/dimensions.ts → 6 DNA axes (order = claim URL `d` order)
//   lib/houses.ts                           → 5 houses
// If the quiz copy changes (names, taglines, houses), re-sync this file manually.
// Static (not fetched) so the /claim screen renders instantly from the
// self-contained claim URL with zero backend calls.

export interface QuizArchetype {
  id: string;
  emoji: string;
  name_en: string;
  name_zh: string;
  tagline_en: string;
  tagline_zh: string;
  house_id: string;
}

export interface QuizHouse {
  id: string;
  name: string;
  slogan_en: string;
  slogan_zh: string;
  emoji: string;
  color: string;
}

export interface DnaAxisMeta {
  key: string;
  label_en: string;
  label_zh: string;
  emoji: string;
}

export const DNA_AXES: DnaAxisMeta[] = [
  { key: 'power', label_en: 'POWER', label_zh: '力量', emoji: '💪' },
  { key: 'beta', label_en: 'BETA', label_zh: '技术', emoji: '🧠' },
  { key: 'social', label_en: 'SOCIAL', label_zh: '社交', emoji: '🤝' },
  { key: 'adventure', label_en: 'ADVENTURE', label_zh: '冒险', emoji: '🧭' },
  { key: 'chill', label_en: 'CHILL', label_zh: '佛系', emoji: '🧘' },
  { key: 'stoke', label_en: 'STOKE', label_zh: '热情', emoji: '🔥' },
];

export const QUIZ_HOUSES: QuizHouse[] = [
  { id: 'hype', name: 'Hype House', slogan_en: 'Where the party is, we are.', slogan_zh: '哪里有派对，哪里就有我们。', emoji: '🎉', color: '#FF8A5C' },
  { id: 'send', name: 'Send House', slogan_en: "We don't go home till we top out.", slogan_zh: '不登顶，不回家。', emoji: '🧗', color: '#FF6B6B' },
  { id: 'zen', name: 'Zen House', slogan_en: 'Climb the mind.', slogan_zh: '爬的是心境。', emoji: '🍃', color: '#6FCF97' },
  { id: 'beta', name: 'Beta House', slogan_en: 'Read it first, then send.', slogan_zh: '先看懂，再出手。', emoji: '🧪', color: '#4EA8DE' },
  { id: 'wild', name: 'Wild House', slogan_en: 'Rules are made to be broken.', slogan_zh: '规则就是用来打破的。', emoji: '🤙', color: '#F4B942' },
];

export const QUIZ_ARCHETYPES: QuizArchetype[] = [
  { id: 'send-machine', emoji: '🔥', name_en: 'THE SEND MACHINE', name_zh: '冲线狂魔', tagline_en: "You don't climb. You SEND.", tagline_zh: '你不是在爬，你是在冲线。', house_id: 'send' },
  { id: 'social-butterfly', emoji: '🦋', name_en: 'THE SOCIAL BUTTERFLY', name_zh: '社交蝴蝶', tagline_en: 'Here for the climbs. Staying for the group chat.', tagline_zh: '为爬线而来，为群聊而留。', house_id: 'hype' },
  { id: 'beta-scientist', emoji: '🧪', name_en: 'THE BETA SCIENTIST', name_zh: '技术流科学家', tagline_en: "You don't fall. You gather data.", tagline_zh: '你不是掉了，你是在收集数据。', house_id: 'beta' },
  { id: 'wildcard', emoji: '🃏', name_en: 'THE WILDCARD', name_zh: '百变玩家', tagline_en: "Gym, crag, comp, random Tuesday mission — you're in.", tagline_zh: '岩馆、野外、比赛、周二突发行程 — 你都在。', house_id: 'wild' },
  { id: 'dirtbag', emoji: '🚐', name_en: 'THE DIRTBAG', name_zh: '攀岩浪人', tagline_en: 'No plan. No wifi. Full send.', tagline_zh: '没计划，没 wifi，全力冲。', house_id: 'wild' },
  { id: 'gym-rat', emoji: '🐀', name_en: 'THE GYM RAT', name_zh: '岩馆常驻', tagline_en: 'Your second home has a bouldering wall.', tagline_zh: '你的第二个家有一面抱石墙。', house_id: 'beta' },
  { id: 'zen-master', emoji: '🧘', name_en: 'THE ZEN MASTER', name_zh: '禅意大师', tagline_en: 'Falling is just flying with extra steps.', tagline_zh: '脱落只是多了几步的飞行。', house_id: 'zen' },
  { id: 'hype-beast', emoji: '📣', name_en: 'THE HYPE BEAST', name_zh: '气氛制造机', tagline_en: "COME ON!! YOU'VE GOT THIS!! (to a total stranger)", tagline_zh: '冲啊！！你可以的！！（对着陌生人喊）', house_id: 'hype' },
  { id: 'project-slayer', emoji: '🎯', name_en: 'THE PROJECT SLAYER', name_zh: '项目终结者', tagline_en: 'One project. Six months. Zero regrets.', tagline_zh: '一条项目，磕半年，绝不后悔。', house_id: 'send' },
  { id: 'flow-state', emoji: '🌊', name_en: 'THE FLOW STATE', name_zh: '心流大师', tagline_en: 'No beta. Just vibes.', tagline_zh: '不看 beta，只凭感觉。', house_id: 'zen' },
  { id: 'sensei', emoji: '🥋', name_en: 'THE SENSEI', name_zh: '攀岩老师傅', tagline_en: "You'd rather give beta than send in silence.", tagline_zh: '比起默默冲线，你更爱给 beta。', house_id: 'beta' },
  { id: 'chiller', emoji: '😎', name_en: 'THE CHILLER', name_zh: '佛系岩友', tagline_en: 'Climbing: a great excuse to lie on the mat.', tagline_zh: '攀岩：躺垫子的完美借口。', house_id: 'zen' },
  { id: 'competitor', emoji: '🏆', name_en: 'THE COMPETITOR', name_zh: '卷王', tagline_en: "You keep score even when no one's keeping score.", tagline_zh: '没人计分，你也在心里记分。', house_id: 'send' },
  { id: 'flex-lord', emoji: '😤', name_en: 'THE FLEX LORD', name_zh: '嘉豪', tagline_en: 'Every send needs an audience (and a slow-mo).', tagline_zh: '每次冲线都得有观众（还得慢动作）。', house_id: 'wild' },
  { id: 'heartbreaker', emoji: '💘', name_en: 'THE HEARTBREAKER', name_zh: '渣派攀岩人', tagline_en: 'A new belay crush every single week.', tagline_zh: '每周换一个心动保护对象。', house_id: 'hype' },
];

export function getArchetype(id: string | null | undefined): QuizArchetype | null {
  if (!id) return null;
  return QUIZ_ARCHETYPES.find((a) => a.id === id) ?? null;
}

export function getHouse(id: string | null | undefined): QuizHouse | null {
  if (!id) return null;
  return QUIZ_HOUSES.find((h) => h.id === id) ?? null;
}

export function getHouseForArchetype(archetypeId: string): QuizHouse {
  const arch = getArchetype(archetypeId);
  return getHouse(arch?.house_id) ?? QUIZ_HOUSES[0];
}
