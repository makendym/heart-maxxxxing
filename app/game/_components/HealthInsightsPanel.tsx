'use client'

import type { HealthTrends } from '../../lib/fitbit'

interface HealthInsightsPanelProps {
  trends: HealthTrends
  currentSession: number
  hideMilestone?: boolean
}

// ── Research-backed health benefit estimates ──

function computeBenefits(t: HealthTrends) {
  const benefits: Array<{ label: string; value: string; detail: string }> = []

  // Each 10 BPM lower resting HR ≈ 15-20% lower CV mortality (Cooney et al., Eur Heart J 2010)
  if (t.deltas.restingHR != null && t.deltas.restingHR < 0) {
    const bpmDrop = Math.abs(t.deltas.restingHR)
    const riskReduction = Math.round(bpmDrop * 1.8)
    benefits.push({ label: 'CV Risk', value: `↓~${riskReduction}%`, detail: `${bpmDrop} BPM lower HR` })
  }

  // Each 1000 steps/day ≈ 6-10% lower all-cause mortality (Saint-Maurice et al., JAMA 2020)
  if (t.deltas.dailySteps != null && t.deltas.dailySteps > 0) {
    const reduction = Math.round((t.deltas.dailySteps / 1000) * 8)
    if (reduction > 0) {
      benefits.push({ label: 'Mortality Risk', value: `↓~${reduction}%`, detail: `+${t.deltas.dailySteps.toLocaleString()} steps/day` })
    }
  }

  // 150 min/week ≈ +3.4 yrs, 75 min/week ≈ +1.8 yrs (Moore et al., PLOS Medicine 2012)
  if (t.totals.totalActiveMinutes != null && t.totals.programDays != null && t.totals.programDays > 0) {
    const weeklyEst = Math.round((t.totals.totalActiveMinutes / t.totals.programDays) * 7)
    if (weeklyEst >= 150) benefits.push({ label: 'Est. Life Gain', value: '+3.4 yrs', detail: `~${weeklyEst} min/wk active` })
    else if (weeklyEst >= 75) benefits.push({ label: 'Est. Life Gain', value: '+1.8 yrs', detail: `~${weeklyEst} min/wk active` })
    else if (weeklyEst >= 30) benefits.push({ label: 'Est. Life Gain', value: '+0.9 yrs', detail: `~${weeklyEst} min/wk active` })
  }

  // Distance walked
  if (t.totals.totalSteps != null && t.totals.totalSteps > 0) {
    const km = t.totals.totalSteps * 0.0008
    if (km >= 1) benefits.push({ label: 'Distance', value: `${km.toFixed(0)} km`, detail: `${t.totals.totalSteps.toLocaleString()} steps` })
  }

  // Rehab completion → readmission reduction (Cochrane review: 43% at full completion)
  if (t.totals.programDays != null && t.totals.programDays > 0) {
    const pct = Math.min(100, Math.round((t.totals.programDays / 84) * 100))
    const reduction = Math.round(43 * (pct / 100))
    if (reduction > 0) benefits.push({ label: 'Readmit Risk', value: `↓~${reduction}%`, detail: `${pct}% program done` })
  }

  return benefits
}

// ── Data-driven insights ──

function getInsights(t: HealthTrends): string[] {
  const out: string[] = []

  if (t.deltas.restingHR != null) {
    if (t.deltas.restingHR < -3) out.push(`❤️ Resting HR down ${Math.abs(t.deltas.restingHR)} BPM — your heart is pumping more efficiently.`)
    else if (t.deltas.restingHR < 0) out.push(`❤️ Resting HR improved by ${Math.abs(t.deltas.restingHR)} BPM. Steady progress.`)
    else if (t.deltas.restingHR > 3) out.push(`❤️ HR is up ${t.deltas.restingHR} BPM. Stress and sleep matter — you'll bounce back.`)
  }
  if (t.deltas.dailySteps != null) {
    if (t.deltas.dailySteps > 1000) out.push(`👟 ${t.deltas.dailySteps.toLocaleString()} more steps/day than week 1.`)
    else if (t.deltas.dailySteps > 0) out.push(`👟 Steps trending up by ${t.deltas.dailySteps.toLocaleString()}/day.`)
    else if (t.deltas.dailySteps < -500) out.push(`👟 Steps are down from baseline. Even a short walk today counts.`)
  }
  if (t.deltas.activeMinutes != null) {
    if (t.deltas.activeMinutes > 10) out.push(`⚡ ${t.deltas.activeMinutes} more active minutes/day — endurance is growing.`)
    else if (t.deltas.activeMinutes < -10) out.push(`⚡ Active time dipped. A 10-minute walk is enough to turn this around.`)
  }
  if (t.current.sleepMinutes != null) {
    if (t.current.sleepMinutes >= 420) out.push(`🌙 ${Math.floor(t.current.sleepMinutes / 60)}h sleep — great for recovery.`)
    else if (t.current.sleepMinutes < 360 && t.current.sleepMinutes > 0) out.push(`🌙 Only ${Math.floor(t.current.sleepMinutes / 60)}h sleep. Your heart heals best with 7+.`)
  }

  return out
}

// ── Milestone: data-derived summary every 3 sessions ──

function getMilestoneSummary(t: HealthTrends, session: number): { summary: string; appreciation: string } | null {
  if (session === 0 || session % 3 !== 0) return null

  const parts: string[] = []
  if (t.current.restingHR != null) parts.push(`HR ${t.current.restingHR}bpm`)
  if (t.current.avgDailySteps != null) parts.push(`${t.current.avgDailySteps.toLocaleString()} steps/day avg`)
  if (t.current.activeMinutes != null) parts.push(`${t.current.activeMinutes}m active`)
  if (t.totals.totalSteps != null) parts.push(`${(t.totals.totalSteps / 1000).toFixed(0)}k total steps`)

  const summary = parts.length > 0 ? `Session ${session}. ${parts.join(' · ')}` : `Session ${session} complete.`

  const progress = Math.round((session / 36) * 100)
  const appParts: string[] = []
  if (t.deltas.restingHR != null && t.deltas.restingHR < 0) appParts.push(`Heart rate down ${Math.abs(t.deltas.restingHR)} BPM since you started`)
  if (t.deltas.dailySteps != null && t.deltas.dailySteps > 0) appParts.push(`${t.deltas.dailySteps.toLocaleString()} more steps/day than week 1`)
  if (t.totals.totalSteps != null && t.totals.totalSteps > 0) appParts.push(`${t.totals.totalSteps.toLocaleString()} total steps logged`)

  const appreciation = appParts.length > 0 ? `${progress}% done. ${appParts[0]}.` : `${progress}% complete.`

  return { summary, appreciation }
}

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[70px]">
      <span className="font-pixel text-[7px] text-sky-500 uppercase">{label}</span>
      <span className={`font-pixel text-sm ${color}`}>{value}</span>
      {sub && <span className="text-[9px] text-sky-500">{sub}</span>}
    </div>
  )
}

export default function HealthInsightsPanel({ trends, currentSession, hideMilestone }: HealthInsightsPanelProps) {
  const insights = getInsights(trends)
  const milestone = hideMilestone ? null : getMilestoneSummary(trends, currentSession)
  const benefits = computeBenefits(trends)

  const deltaLabel = (val?: number, unit = '', invert = false) => {
    if (val == null || val === 0) return undefined
    const good = invert ? val < 0 : val > 0
    const arrow = val > 0 ? '↑' : '↓'
    const dot = good ? '\u25CF' : '\u25CB'
    return `${dot} ${arrow}${Math.abs(val)}${unit}`
  }

  return (
    <div className="bg-sky-950/60 backdrop-blur-sm border-b border-teal-700/20">
      {milestone && (
        <div className="px-4 py-2.5 border-b border-amber-500/20 bg-amber-900/10">
          <p className="text-amber-200 text-xs leading-relaxed">{milestone.summary}</p>
          <p className="text-amber-400 text-xs leading-relaxed mt-1 font-medium">{milestone.appreciation}</p>
        </div>
      )}

      {insights.length > 0 && (
        <div className="px-4 py-2 border-b border-sky-800/30 space-y-1">
          {insights.map((text, i) => (
            <p key={i} className="text-sky-200 text-xs leading-relaxed">{text}</p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-around px-2 py-2.5 gap-1 overflow-x-auto no-scrollbar">
        {trends.current.restingHR != null && (
          <StatBox label="Resting HR" value={`${trends.current.restingHR}`} sub={deltaLabel(trends.deltas.restingHR, ' bpm', true)} color="text-red-400" />
        )}
        {trends.current.stepsToday != null && (
          <StatBox label="Steps" value={trends.current.stepsToday.toLocaleString()} sub={deltaLabel(trends.deltas.dailySteps, '/day')} color="text-emerald-400" />
        )}
        {trends.current.activeMinutes != null && (
          <StatBox label="Active" value={`${trends.current.activeMinutes}m`} sub={deltaLabel(trends.deltas.activeMinutes, 'm/day')} color="text-amber-400" />
        )}
        {trends.current.sleepMinutes != null && (
          <StatBox label="Sleep" value={`${Math.floor(trends.current.sleepMinutes / 60)}h${trends.current.sleepMinutes % 60}m`} color="text-indigo-400" />
        )}
        {trends.totals.totalSteps != null && trends.totals.totalSteps > 0 && (
          <StatBox label="Total Steps" value={`${(trends.totals.totalSteps / 1000).toFixed(0)}k`} sub={`${trends.totals.programDays || 0} days`} color="text-teal-400" />
        )}
        {trends.totals.totalActiveMinutes != null && trends.totals.totalActiveMinutes > 0 && (
          <StatBox label="Total Active" value={`${trends.totals.totalActiveMinutes}m`} color="text-orange-400" />
        )}
      </div>

      {benefits.length > 0 && (
        <div className="border-t border-sky-800/30">
          <div className="flex items-center justify-around px-2 py-2 gap-2 overflow-x-auto no-scrollbar">
            {benefits.map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5 min-w-[75px]">
                <span className="font-pixel text-[6px] text-purple-400 uppercase">{b.label}</span>
                <span className="font-pixel text-xs text-purple-300">{b.value}</span>
                <span className="text-[8px] text-sky-600">{b.detail}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-[7px] text-sky-700 pb-1">Estimates based on AHA / JAMA / PLOS published research</p>
        </div>
      )}

      {(trends.baseline.avgRestingHR != null || trends.baseline.avgDailySteps != null) && (
        <div className="flex items-center justify-center gap-4 px-3 py-1.5 border-t border-sky-800/30 text-[9px] text-sky-500">
          <span className="font-pixel text-[7px] text-sky-600">WEEK 1 → NOW</span>
          {trends.baseline.avgRestingHR != null && trends.current.restingHR != null && (
            <span>HR: {trends.baseline.avgRestingHR} → <span className="text-red-400">{trends.current.restingHR}</span></span>
          )}
          {trends.baseline.avgDailySteps != null && trends.current.avgDailySteps != null && (
            <span>Steps: {trends.baseline.avgDailySteps.toLocaleString()} → <span className="text-emerald-400">{trends.current.avgDailySteps.toLocaleString()}</span></span>
          )}
          {trends.baseline.avgActiveMinutes != null && trends.current.activeMinutes != null && (
            <span>Active: {trends.baseline.avgActiveMinutes}m → <span className="text-amber-400">{trends.current.activeMinutes}m</span></span>
          )}
        </div>
      )}
    </div>
  )
}
