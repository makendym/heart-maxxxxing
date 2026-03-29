export type PowerupType =
  | 'health-tip'
  | 'goal-progress'
  | 'loved-one'
  | 'achievement'
  | 'heart-fact'
  | 'celebration'

export interface Powerup {
  session: number
  type: PowerupType
  title: string
  content: string
  icon: string
}

/**
 * Rotation cycle: goal-progress leads, then the rest rotate.
 * 5-type cycle × 2 = 10 bricks + 1 goal-progress at 33 + celebration at 36 = 12 bricks.
 *
 * Session  3: Goal Progress    (brick 1)
 * Session  6: Health Tip       (brick 2)
 * Session  9: Loved One        (brick 3)
 * Session 12: Achievement      (brick 4)
 * Session 15: Heart Fact       (brick 5)
 * Session 18: Goal Progress    (brick 6)  ← cycle repeats
 * Session 21: Health Tip       (brick 7)
 * Session 24: Loved One        (brick 8)
 * Session 27: Achievement      (brick 9)
 * Session 30: Heart Fact       (brick 10)
 * Session 33: Goal Progress    (brick 11)
 * Session 36: Celebration      (brick 12)
 */
const ROTATION_CYCLE: Array<{ type: PowerupType; title: string; icon: string }> = [
  { type: 'goal-progress', title: 'Goal Progress', icon: 'target' },
  { type: 'health-tip',    title: 'Health Tip',    icon: 'leaf' },
  { type: 'loved-one',     title: 'Message from a Loved One', icon: 'envelope' },
  { type: 'achievement',   title: 'Achievement Unlocked', icon: 'star' },
  { type: 'heart-fact',    title: 'Heart Fact',    icon: 'heartbeat' },
]

const CELEBRATION = { type: 'celebration' as PowerupType, title: 'YOU DID IT!', icon: 'crown' }

function getRotationEntry(brickIndex: number): { type: PowerupType; title: string; icon: string } {
  // brickIndex is 0-based (brick 0 = session 3, brick 11 = session 36)
  if (brickIndex === 11) return CELEBRATION // session 36
  return ROTATION_CYCLE[brickIndex % ROTATION_CYCLE.length]
}

/** Static fallback content — used when LLM is unavailable */
const FALLBACK_CONTENT: Record<PowerupType, string[]> = {
  'goal-progress': [
    "You're making real progress toward your goal: {goal}. Every session brings you closer.",
    "Halfway momentum! Your goal of {goal} is becoming more achievable with every step.",
    "The finish line for {goal} is getting clearer. You've built something real.",
  ],
  'health-tip': [
    'Walking 30 minutes a day reduces hospital readmission by 30%. Every step counts!',
    'Each session strengthens the blood vessels around your stent. You\'re literally building a stronger heart.',
    'You\'ve built exercise habits that last a lifetime. Patients who finish rehab stay active for years after.',
  ],
  'loved-one': [
    "We're so proud of you! Keep going — we're cheering you on every step of the way. 💕",
    'You inspire me every single day. I told my friends about your journey and they think you\'re amazing too. ❤️',
  ],
  'achievement': [
    'You\'re in the top 25% of rehab patients. That takes real dedication.',
    'Unstoppable! You\'re in the top 10% of all cardiac rehab patients.',
  ],
  'heart-fact': [
    'Your resting heart rate has likely started to improve. Cardiac rehab patients see a 7-10 BPM drop on average!',
    'Your heart is pumping more efficiently now. Studies show cardiac output improves 15-20% through rehab.',
  ],
  'celebration': [
    'All 36 sessions complete! You\'ve reduced your risk of rehospitalization by 43%. Your heart — and everyone who loves you — thanks you.',
  ],
}

export function getPowerup(session: number, goal: string): Powerup | null {
  if (session <= 0 || session % 3 !== 0) return null
  const brickIndex = session / 3 - 1
  if (brickIndex < 0 || brickIndex > 11) return null

  const entry = getRotationEntry(brickIndex)
  const fallbacks = FALLBACK_CONTENT[entry.type]
  const content = (fallbacks[brickIndex % fallbacks.length] || fallbacks[0]).replace('{goal}', goal)

  return { session, type: entry.type, title: entry.title, content, icon: entry.icon }
}

/** Returns type/icon/title for a brick session — used as skeleton before LLM fills content */
export function getPowerupMeta(session: number): Omit<Powerup, 'content'> | null {
  if (session <= 0 || session % 3 !== 0) return null
  const brickIndex = session / 3 - 1
  if (brickIndex < 0 || brickIndex > 11) return null

  const entry = getRotationEntry(brickIndex)
  return { session, type: entry.type, title: entry.title, icon: entry.icon }
}

export function getPowerupColor(type: PowerupType): string {
  switch (type) {
    case 'health-tip':
      return 'from-emerald-400 to-green-600'
    case 'goal-progress':
      return 'from-blue-400 to-indigo-600'
    case 'loved-one':
      return 'from-pink-400 to-rose-600'
    case 'achievement':
      return 'from-amber-400 to-yellow-600'
    case 'heart-fact':
      return 'from-red-400 to-rose-600'
    case 'celebration':
      return 'from-purple-400 via-pink-500 to-amber-500'
  }
}
