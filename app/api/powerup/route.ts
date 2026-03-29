import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { type PowerupType } from '../../lib/powerups'

export const maxDuration = 15

const TYPE_PROMPTS: Record<PowerupType, string> = {
  'goal-progress': `Write a short, motivating goal-progress message (2-3 sentences).

YOUR JOB: Break their goal into a concrete milestone that maps to their current progress. Be SPECIFIC — generic "you're doing great" is useless.

EXAMPLES of how to adapt to different goals:
- Goal "run a marathon" at 25%: "Your heart can now sustain the effort of a solid 10K. That's 6 miles of proof that a marathon isn't a dream — it's a plan."
- Goal "walk 30 minutes without stopping" at 50%: "Two weeks ago, 15 minutes felt like a wall. Now your body barely notices it. The 30-minute mark is right there."
- Goal "play with my grandkids without getting winded" at 33%: "That breathlessness you used to feel after climbing stairs? It's already fading. Imagine keeping up at the park."
- Goal "lose 20 pounds" at 75%: "Your metabolism is running hotter now — cardiac rehab patients burn more calories at rest. The scale is catching up to what your heart already knows."
- Goal "get back to gardening" at 50%: "The bending, lifting, kneeling — your heart is handling more load every week. Your garden is going to have its best season."
- Goal "reduce my medication" at 40%: "Patients who complete rehab often work with their doctor to reduce meds. You're building the evidence your body needs."

RULES:
- Name a CONCRETE sub-milestone they've likely reached (not just a percentage)
- Connect it to something physical they can FEEL or DO now that they couldn't before
- If the goal is vague ("get healthier"), invent a tangible marker ("you could probably walk a mile faster than you could 3 weeks ago")
- End with forward momentum — what's next, not just what's done
Tone: excited, personal, like a coach who knows their body.`,

  'health-tip': `Share one specific health tip (2-3 sentences) that connects DIRECTLY to something this patient cares about.

DON'T: Generic advice like "drink water" or "eat vegetables."
DO: Tie it to their goal, conditions, or stage.

EXAMPLES:
- Patient with hypertension wanting to run: "Your blood pressure drops for up to 22 hours after a cardio session. That post-exercise window is literally when your arteries are at their most relaxed."
- Diabetic patient in early rehab: "Your muscles just became better at pulling sugar from your blood — that's why exercise can work like a second dose of medication. Your body is learning."
- Patient who wants to play with grandkids, mid-program: "The 'second wind' you feel around minute 15? That's your heart shifting into efficient mode. Kids run in bursts — your heart is learning to match that."

Make them think "wow, I didn't know that about MY body." Not a pamphlet — a revelation.`,

  'loved-one': `Write a short message (2-3 sentences) from the patient's daughter Ana.

THIS IS NOT A HALLMARK CARD. Make it feel like a real text from a real daughter:
- Reference something SPECIFIC about their goal or recent progress
- Show she's paying attention to the game ("I saw your Mario hit session {session}!")
- Include a small personal detail (inside joke, family reference, future plan together)
- She can be funny, teasing, or emotional — real daughters aren't just "proud"

EXAMPLES:
- "Mom, {session} sessions?! Remember when you said you'd never stick with this? I screenshot your Mario every time it moves. Also, Dad says hi and that dinner's on him when you finish."
- "I showed your game to my coworkers and now they're all asking how their parents can do this. You're literally famous. Keep going, I need bragging rights at session 36."`,

  'achievement': `Create a SPECIFIC achievement that makes the patient feel legendary (2-3 sentences).

DON'T: Generic badges like "Great Job!" or "Keep Going!"
DO: Make the achievement name reference their specific goal or journey.

EXAMPLES:
- Goal "run a marathon", session 12: "🏅 MILE MAKER — You've built the cardiovascular base of someone training for a half marathon. 12 sessions ago, your heart didn't know this pace existed."
- Goal "play with grandkids", session 27: "🏅 PLAYGROUND READY — Your stamina now exceeds what it takes to chase a 5-year-old. You're not just recovering — you're becoming the fun grandparent."
- Goal "get back to normal", session 9: "🏅 NEW NORMAL UNLOCKED — Your 'normal' at session 9 would've been your 'great day' at session 1. The bar moved and you didn't even notice."

The name should be 2-3 words, ALL CAPS, memorable. The description should make them feel the progress in their bones.`,

  'heart-fact': `Share one MIND-BLOWING fact about what's happening inside their body right now (2-3 sentences).

DON'T: Textbook facts. "The heart pumps 2000 gallons a day."
DO: Connect it to something they can FEEL happening.

EXAMPLES:
- Session 6: "Right now, your heart is literally growing new blood vessel branches around any blockages. It's called collateral circulation — your body is building its own bypass, one session at a time."
- Session 15: "Your heart muscle fibers have started to realign. Before rehab, some were pulling in different directions from the damage. Now they're rowing together like a crew team."
- Session 30: "Your vagus nerve — the one that calms your heart down after stress — is now 20% more responsive than when you started. That's why you sleep better. Your heart learned to relax."

Make them think "my body is DOING this?!" — awe about their own biology.`,

  'celebration': `Write a deeply personal triumph message (3-4 sentences) for completing ALL 36 sessions.

This is the biggest moment. Reference:
- Their specific goal and how the journey changed them
- The 43% reduction in rehospitalization risk
- Something about who they are NOW vs who they were at session 1
- The people who love them and what this means for that future

Don't be generic. This patient pushed through fear, doubt, bad days, and the temptation to quit. Honor that specifically.
Tone: emotional enough to make them tear up, but strong — they're a warrior, not a victim.`,
}

interface HealthContext {
  restingHR?: number
  baselineHR?: number
  deltaHR?: number
  stepsToday?: number
  deltaSteps?: number
  totalSteps?: number
  activeMinutes?: number
  deltaActiveMinutes?: number
  totalDistance?: number
  programDays?: number
}

export async function POST(req: Request) {
  const { session, goal, playerName, type, progress, health, patientProfile } = (await req.json()) as {
    session: number
    goal: string
    playerName: string
    type: PowerupType
    progress: number
    health?: HealthContext
    patientProfile?: {
      age: number
      gender: string
      bloodPressure: string
      restingHeartRate: number
      pastDiseases: string[]
      rehabPhase?: string
    }
  }

  const typePrompt = TYPE_PROMPTS[type] || TYPE_PROMPTS['health-tip']

  let healthPrompt = ''
  if (health) {
    const lines: string[] = []
    if (health.restingHR) lines.push(`Current resting HR: ${health.restingHR} BPM`)
    if (health.deltaHR != null) lines.push(`HR change since start: ${health.deltaHR > 0 ? '+' : ''}${health.deltaHR} BPM (negative = improvement)`)
    if (health.stepsToday) lines.push(`Steps today: ${health.stepsToday.toLocaleString()}`)
    if (health.deltaSteps != null) lines.push(`Daily steps change since start: ${health.deltaSteps > 0 ? '+' : ''}${health.deltaSteps.toLocaleString()}`)
    if (health.totalSteps) lines.push(`Total steps in program: ${health.totalSteps.toLocaleString()}`)
    if (health.totalDistance) lines.push(`Total distance walked: ${(health.totalDistance / 1000).toFixed(1)} km`)
    if (health.activeMinutes) lines.push(`Active minutes today: ${health.activeMinutes}`)
    if (health.deltaActiveMinutes != null) lines.push(`Active minutes change since start: ${health.deltaActiveMinutes > 0 ? '+' : ''}${health.deltaActiveMinutes} min/day`)
    if (health.programDays) lines.push(`Days in program: ${health.programDays}`)

    if (lines.length > 0) {
      healthPrompt = `\n\nREAL HEALTH DATA from their Fitbit (use these specific numbers to make the message personal and data-driven!):\n${lines.join('\n')}`
    }
  }

  const { text } = await generateText({
    model: google('gemini-3.1-flash-lite-preview'),
    system: `You write reward messages for a cardiac rehab game (Super Mario style). A patient just hit a ? block.

RULES:
- Max 3 sentences. Plain text only, no markdown.
- Be DEEPLY PERSONAL. Reference their name, goal, conditions, and progress. Generic = failure.
- If health data is provided, weave in specific numbers naturally ("your resting HR dropped 4 BPM — that's your heart literally getting more efficient").
- Never use medical jargon. Write like a human who knows them, not a pamphlet.
- Make them FEEL something — pride, awe, warmth, determination. Not just "good job."`,
    prompt: `Patient: ${playerName}${patientProfile ? ` (${patientProfile.age}yo ${patientProfile.gender}, BP ${patientProfile.bloodPressure}, resting HR ${patientProfile.restingHeartRate} BPM, conditions: ${patientProfile.pastDiseases.join(', ') || 'none'})` : ''}
Personal Goal: "${goal}"
Sessions completed: ${session} of 36 (${progress}% done)${patientProfile?.rehabPhase ? `\nCurrent rehab phase: ${patientProfile.rehabPhase}` : ''}
Reward type: ${type}

${typePrompt}${healthPrompt}`,
  })

  return Response.json({ content: text })
}
