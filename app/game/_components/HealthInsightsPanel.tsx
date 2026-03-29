'use client'

import type { HealthTrends } from '../../lib/fitbit'

interface HealthInsightsPanelProps {
  trends: HealthTrends
  currentSession: number
}

function generateInsight(trends: HealthTrends, session: number): string {
  const parts: string[] = []

  if (trends.deltas.restingHR != null && trends.deltas.restingHR < 0) {
    parts.push(
      `Your resting heart rate dropped ${Math.abs(trends.deltas.restingHR)} BPM — your heart is pumping more efficiently.`,
    )
  } else if (trends.deltas.restingHR != null && trends.deltas.restingHR > 0) {
    parts.push(
      `Your resting HR is up ${trends.deltas.restingHR} BPM. Stress, sleep, and hydration all play a role — keep going.`,
    )
  }

  if (trends.deltas.dailySteps != null && trends.deltas.dailySteps > 500) {
    parts.push(
      `You're walking ${trends.deltas.dailySteps.toLocaleString()} more steps/day than when you started.`,
    )
  }

  if (trends.totals.totalSteps != null && trends.totals.totalSteps > 10000) {
    parts.push(
      `${trends.totals.totalSteps.toLocaleString()} total steps logged since session 1.`,
    )
  }

  if (trends.deltas.activeMinutes != null && trends.deltas.activeMinutes > 5) {
    parts.push(
      `Active minutes up ${trends.deltas.activeMinutes} min/day — real endurance gains.`,
    )
  }

  if (trends.current.sleepMinutes != null && trends.current.sleepMinutes >= 420) {
    parts.push(`Great recovery: ${Math.floor(trends.current.sleepMinutes / 60)}h sleep last night.`)
  } else if (trends.current.sleepMinutes != null && trends.current.sleepMinutes < 360) {
    parts.push(`Only ${Math.floor(trends.current.sleepMinutes / 60)}h sleep — your heart recovers best with 7+ hours.`)
  }

  if (parts.length === 0) {
    if (session <= 6) {
      parts.push('Building your baseline. Every session teaches your heart it can do more.')
    } else if (session <= 18) {
      parts.push('You\'re in the consistency zone. This is where lasting change happens.')
    } else {
      parts.push('Your body is transforming. The data will show it soon.')
    }
  }

  return parts[0]
}

function StatBox({
  label,
  value,
  sub,
  color,
}: {
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[70px]">
      <span className="font-pixel text-[7px] text-sky-500 uppercase">{label}</span>
      <span className={`font-pixel text-sm ${color}`}>{value}</span>
      {sub && <span className="text-[9px] text-sky-500">{sub}</span>}
    </div>
  )
}

export default function HealthInsightsPanel({
  trends,
  currentSession,
}: HealthInsightsPanelProps) {
  const insight = generateInsight(trends, currentSession)

  const deltaLabel = (val?: number, unit = '', invert = false) => {
    if (val == null || val === 0) return undefined
    const good = invert ? val < 0 : val > 0
    const arrow = val > 0 ? '↑' : '↓'
    const color = good ? '🟢' : '🔴'
    return `${color} ${arrow}${Math.abs(val)}${unit}`
  }

  return (
    <div className="bg-sky-950/60 backdrop-blur-sm border-b border-teal-700/20">
      {/* Insight text */}
      <div className="px-4 py-2 border-b border-sky-800/30">
        <div className="flex items-start gap-2">
          <span className="text-teal-400 text-xs shrink-0">💡</span>
          <p className="text-sky-200 text-xs leading-relaxed">{insight}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="flex items-center justify-around px-2 py-2.5 gap-1 overflow-x-auto no-scrollbar">
        {trends.current.restingHR != null && (
          <StatBox
            label="Resting HR"
            value={`${trends.current.restingHR}`}
            sub={deltaLabel(trends.deltas.restingHR, ' bpm', true)}
            color="text-red-400"
          />
        )}

        {trends.current.stepsToday != null && (
          <StatBox
            label="Steps"
            value={trends.current.stepsToday.toLocaleString()}
            sub={deltaLabel(trends.deltas.dailySteps, '/day')}
            color="text-emerald-400"
          />
        )}

        {trends.current.activeMinutes != null && (
          <StatBox
            label="Active"
            value={`${trends.current.activeMinutes}m`}
            sub={deltaLabel(trends.deltas.activeMinutes, 'm/day')}
            color="text-amber-400"
          />
        )}

        {trends.current.sleepMinutes != null && (
          <StatBox
            label="Sleep"
            value={`${Math.floor(trends.current.sleepMinutes / 60)}h${trends.current.sleepMinutes % 60}m`}
            color="text-indigo-400"
          />
        )}

        {trends.totals.totalSteps != null && trends.totals.totalSteps > 0 && (
          <StatBox
            label="Total Steps"
            value={`${(trends.totals.totalSteps / 1000).toFixed(0)}k`}
            sub={`${trends.totals.programDays || 0} days`}
            color="text-teal-400"
          />
        )}

        {trends.totals.totalActiveMinutes != null && trends.totals.totalActiveMinutes > 0 && (
          <StatBox
            label="Total Active"
            value={`${trends.totals.totalActiveMinutes}m`}
            color="text-orange-400"
          />
        )}
      </div>

      {/* Baseline comparison */}
      {(trends.baseline.avgRestingHR != null || trends.baseline.avgDailySteps != null) && (
        <div className="flex items-center justify-center gap-4 px-3 py-1.5 border-t border-sky-800/30 text-[9px] text-sky-500">
          <span className="font-pixel text-[7px] text-sky-600">WEEK 1 →  NOW</span>
          {trends.baseline.avgRestingHR != null && trends.current.restingHR != null && (
            <span>
              HR: {trends.baseline.avgRestingHR} → <span className="text-red-400">{trends.current.restingHR}</span>
            </span>
          )}
          {trends.baseline.avgDailySteps != null && trends.current.avgDailySteps != null && (
            <span>
              Steps: {trends.baseline.avgDailySteps.toLocaleString()} → <span className="text-emerald-400">{trends.current.avgDailySteps.toLocaleString()}</span>
            </span>
          )}
          {trends.baseline.avgActiveMinutes != null && trends.current.activeMinutes != null && (
            <span>
              Active: {trends.baseline.avgActiveMinutes}m → <span className="text-amber-400">{trends.current.activeMinutes}m</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
