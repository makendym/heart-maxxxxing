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
    "You're making real progress toward {goal}. Your body knows the difference even if your mind hasn't caught up yet.",
    "Halfway there. {goal} used to feel impossible — now it's just a matter of time.",
    "The finish line for {goal} is getting clearer. You've built something real.",
  ],
  'health-tip': [
    'Your blood pressure drops for 22 hours after each session. Your arteries are thanking you right now.',
    'Each session strengthens the blood vessels around your heart. You are literally building backup routes.',
    'Exercise after cardiac events reduces readmission by 30%. You are stacking the odds in your favor.',
  ],
  'loved-one': [
    "I screenshot your Mario every time it moves. So proud of you. — Ana",
    "Told my friends about your rehab journey. You're famous now. Keep going! — David",
  ],
  'achievement': [
    'IRON WILL — You are in the top 25% of rehab patients. That takes showing up when you did not feel like it.',
    'UNSTOPPABLE — Top 10% of all cardiac rehab patients. Your consistency is rare.',
  ],
  'heart-fact': [
    'Your resting heart rate has likely dropped 5-10 BPM since session 1. That is your heart getting more efficient with every beat.',
    'Your heart is pumping more blood per beat now. Cardiac output improves 15-20% through rehab — yours included.',
  ],
  'celebration': [
    'All 36 sessions. You reduced your risk of rehospitalization by 43%. The person who started session 1 would not recognize who you are now.',
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
