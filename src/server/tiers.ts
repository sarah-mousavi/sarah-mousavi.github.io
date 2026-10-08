/* Tiers are earned by attending sessions, never by amount spent.
   Rewarding spend in healthcare incentivises treatment volume; attendance
   tracks engagement with the work instead. */

export type Tier = 'bronze' | 'silver' | 'gold';

export const TIERS: { id: Tier; label: string; from: number; perks: string[] }[] = [
  {
    id: 'bronze',
    label: 'برنز',
    from: 0,
    perks: ['کتابخانهٔ پایه: یک تحلیل کتاب و دو ویدیو آموزشی', 'یادآوری جلسات'],
  },
  {
    id: 'silver',
    label: 'نقره‌ای',
    from: 6,
    perks: ['چهار ویدیو آموزشی', 'کاربرگ‌های بین‌جلسه‌ای', 'همهٔ مزایای برنز'],
  },
  {
    id: 'gold',
    label: 'طلایی',
    from: 15,
    perks: ['کتابخانهٔ کامل', 'محتوای اختصاصی دوره‌ها', 'همهٔ مزایای نقره‌ای'],
  },
];

const ORDER: Tier[] = ['bronze', 'silver', 'gold'];

export function tierFor(sessions: number): Tier {
  return [...TIERS].reverse().find((t) => sessions >= t.from)!.id;
}

export function meets(userTier: Tier, required: Tier): boolean {
  return ORDER.indexOf(userTier) >= ORDER.indexOf(required);
}

export function nextTier(sessions: number) {
  const current = tierFor(sessions);
  const next = TIERS[ORDER.indexOf(current) + 1];
  return next ? { ...next, remaining: next.from - sessions } : null;
}

export const tierLabel = (t: Tier) => TIERS.find((x) => x.id === t)!.label;
