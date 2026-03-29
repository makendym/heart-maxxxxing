// Loads static rehab data and extracts phase-specific context for Coach Heartley

import rehabActivities from '../../data/rehab_activities.json'
import nutritionPlaces from '../../data/nutrition_places.json'
import supporters from '../../data/supporters.json'
import patientsData from '../../data/patients.json'

type PhaseKey = 'phase_I' | 'phase_II' | 'phase_III'

interface Activity {
  name: string
  variations: string[]
  instructions: string
  risks_to_avoid: string[]
  benefits: string[]
  stats: {
    users_count?: number
    avg_progress?: number
    variations_stats?: Array<{ variation: string; users_count: number; avg_progress: number }>
  }
}

interface ScheduleEntry {
  time: string
  activity: string
  instructions: string
}

/** Determine which rehab phase the patient is in based on session number */
function getPhaseKey(session: number): PhaseKey {
  if (session <= 6) return 'phase_I'
  if (session <= 24) return 'phase_II'
  return 'phase_III'
}

/** Build a formatted context block with phase-relevant activities, supporters, and places */
export function buildRehabContext(currentSession: number): string {
  const phaseKey = getPhaseKey(currentSession)
  const phase = rehabActivities.phases[phaseKey] as {
    title: string
    focus: string
    daily_schedule?: ScheduleEntry[]
    activities: Activity[]
  }

  const sections: string[] = []

  // Current phase activities
  const activityLines = phase.activities.map((a) => {
    let line = `- ${a.name}: ${a.instructions}`
    if (a.variations.length > 0) {
      line += ` Options: ${a.variations.join(', ')}.`
    }
    if (a.benefits.length > 0) {
      line += ` Benefits: ${a.benefits.join(', ')}.`
    }
    if (a.risks_to_avoid.length > 0) {
      line += ` Avoid: ${a.risks_to_avoid.join(', ')}.`
    }
    // Social proof
    if (a.stats.users_count) {
      line += ` (${a.stats.users_count} patients, ${a.stats.avg_progress}% avg progress)`
    }
    if (a.stats.variations_stats) {
      const top = a.stats.variations_stats.sort((x, y) => y.avg_progress - x.avg_progress)[0]
      if (top) line += ` Top pick: ${top.variation} (${top.users_count} users, ${top.avg_progress}% progress).`
    }
    return line
  })

  sections.push(`<current_phase_activities>
Phase: ${phase.title}
Focus: ${phase.focus}

Activities available:
${activityLines.join('\n')}
</current_phase_activities>`)

  // Phase I daily schedule (time-aware)
  if (phase.daily_schedule) {
    const scheduleLines = phase.daily_schedule.map(
      (s) => `- ${s.time}: ${s.activity} — ${s.instructions}`,
    )
    sections.push(`<daily_schedule>
Today's schedule (suggest the next upcoming activity based on current time):
${scheduleLines.join('\n')}
</daily_schedule>`)
  }

  // Stress management techniques (always useful, pull from Phase II)
  const phaseII = rehabActivities.phases.phase_II
  const stressActivity = phaseII.activities.find((a) => a.name === 'Stress Management')
  if (stressActivity) {
    sections.push(`<stress_techniques>
When the patient is anxious, stressed, or can't sleep, offer one of these:
${stressActivity.variations.map((v) => `- ${v}`).join('\n')}
Instructions: ${stressActivity.instructions}
(${stressActivity.stats.users_count} patients found this helpful, ${stressActivity.stats.avg_progress}% avg improvement)
</stress_techniques>`)
  }

  // Nutrition places
  const placeLines = nutritionPlaces.map(
    (p) => `- ${p.name} (${p.type}): ${p.specialty} — ${p.address}`,
  )
  sections.push(`<nutrition_places>
Heart-healthy locations to recommend:
${placeLines.join('\n')}

Also check if other patients reviewed these — Jane Smith rated Green Leaf Kitchen positively: "The low-sodium bowls were perfect for Phase II diet!"
</nutrition_places>`)

  // Care supporters
  const supporterLines = supporters.map(
    (s) => `- ${s.name}, ${s.role} (${(s as { hospital?: string; organization?: string }).hospital || (s as { hospital?: string; organization?: string }).organization}): "${s.message}"`,
  )
  sections.push(`<care_supporters>
If the patient seems isolated, lonely, or lacking support, mention the Care Supporters program:
${supporterLines.join('\n')}

Offer gently: "Would it help to have someone checking in on you? We have people who've been through this and want to help."
Don't push it — just make them aware it exists.
</care_supporters>`)

  // Social proof from other patients
  const activePatients = patientsData.filter(
    (p) => p.status === 'active' && (p.progress_percent ?? 0) > 0,
  )
  if (activePatients.length > 0) {
    const proofLines = activePatients.map(
      (p) => `- ${p.name.split(' ')[0]}, ${p.age}, ${p.progress_percent}% through their "${p.rehab_plan.title}"`,
    )
    sections.push(`<community>
Other patients in the program right now (use for social proof when motivating):
${proofLines.join('\n')}

Use sparingly and naturally: "You're not alone in this — there are others going through the same thing right now." Never compare progress negatively.
</community>`)
  }

  return sections.join('\n\n')
}
