'use client'

import { useState, useEffect, useCallback } from 'react'
import { TOTAL_SESSIONS } from '../../lib/game-state'
import type { HealthTrends } from '../../lib/fitbit'
import PhIcon from './PhIcon'

const FIREWORK_ICONS = ['sparkle', 'confetti', 'star', 'heart', 'crown', 'fire']

interface CompletionScreenProps {
  playerName: string
  hearts: number
  goal: string
  healthTrends?: HealthTrends | null
  language?: string
  onClose: () => void
}

export default function CompletionScreen({
  playerName,
  goal,
  healthTrends,
  language,
  onClose,
}: CompletionScreenProps) {
  const [llmSummary, setLlmSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const t = healthTrends

  // Generate LLM-powered personalized summary + future directions
  const fetchSummary = useCallback(async () => {
    if (!t) return
    setLoading(true)
    try {
      const res = await fetch('/api/health-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trends: t,
          session: TOTAL_SESSIONS,
          playerName,
          goal,
          language,
          isCompletion: true,
        }),
      })
      if (res.ok) {
        const { report } = await res.json()
        setLlmSummary(report)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [t, playerName, goal, language])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  // Computed benefits
  const cvRisk = t?.deltas.restingHR != null && t.deltas.restingHR < 0
    ? Math.round(Math.abs(t.deltas.restingHR) * 1.8) : null
  const mortalityRisk = t?.deltas.dailySteps != null && t.deltas.dailySteps > 0
    ? Math.round((t.deltas.dailySteps / 1000) * 8) : null
  const lifeGain = (() => {
    if (!t?.totals.totalActiveMinutes || !t?.totals.programDays || t.totals.programDays === 0) return null
    const wk = Math.round((t.totals.totalActiveMinutes / t.totals.programDays) * 7)
    if (wk >= 150) return '+3.4 yrs'
    if (wk >= 75) return '+1.8 yrs'
    if (wk >= 30) return '+0.9 yrs'
    return null
  })()
  const distance = t?.totals.totalSteps ? (t.totals.totalSteps * 0.0008) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md">
      {/* Fireworks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <div key={i} className="firework absolute" style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 1.5}s`,
          }}>
            <PhIcon name={FIREWORK_ICONS[i % FIREWORK_ICONS.length]} size={20}
              className={['text-amber-400', 'text-pink-400', 'text-yellow-300', 'text-red-400', 'text-purple-400', 'text-orange-400'][i % 6]} />
          </div>
        ))}
      </div>

      <div className="modal-enter relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="bg-gradient-to-br from-[#a04000] via-[#e09050] to-[#fcd890] rounded-2xl p-[3px] shadow-2xl">
          <div className="bg-black/95 rounded-xl p-5 md:p-6">
            {/* Crown + title */}
            <div className="text-center mb-5">
              <div className="mb-3 flex justify-center">
                <PhIcon name="crown" size={48} className="text-[#fcd890]" />
              </div>
              <h2 className="font-pixel text-lg text-[#fcd890] mb-1 leading-relaxed">
                JOURNEY COMPLETE
              </h2>
              <p className="font-pixel text-[9px] text-[#e09050]">
                {playerName} &middot; {TOTAL_SESSIONS} Sessions &middot; 12 Weeks
              </p>
            </div>

            {/* Goal achieved */}
            <div className="bg-[#a04000]/15 border border-[#a04000]/30 rounded-lg p-3 mb-4 text-center">
              <p className="font-pixel text-[7px] text-[#80d8ff] mb-1">GOAL</p>
              <p className="text-white text-sm">&quot;{goal}&quot;</p>
              <div className="w-full h-2 bg-[#333] rounded-sm mt-2 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-[#80d010] to-[#00a800] rounded-sm" />
              </div>
            </div>

            {/* Your body — data driven */}
            {t && (
              <div className="bg-[#a04000]/10 border border-[#a04000]/20 rounded-lg p-3 mb-4">
                <p className="font-pixel text-[7px] text-[#80d8ff] mb-2">YOUR BODY</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  {t.baseline.avgRestingHR != null && t.current.restingHR != null && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#a0501c]">Resting HR</span>
                      <span>{t.baseline.avgRestingHR} → <span className="text-[#80d010]">{t.current.restingHR} BPM</span></span>
                    </div>
                  )}
                  {t.baseline.avgHRV != null && t.current.hrv != null && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#a0501c]">HRV</span>
                      <span>{t.baseline.avgHRV} → <span className="text-[#80d010]">{t.current.hrv} ms</span></span>
                    </div>
                  )}
                  {t.baseline.avgDailySteps != null && t.current.avgDailySteps != null && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#a0501c]">Daily Steps</span>
                      <span>{t.baseline.avgDailySteps.toLocaleString()} → <span className="text-[#80d010]">{t.current.avgDailySteps.toLocaleString()}</span></span>
                    </div>
                  )}
                  {t.baseline.avgActiveMinutes != null && t.current.activeMinutes != null && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-[#a0501c]">Active Min/Day</span>
                      <span>{t.baseline.avgActiveMinutes} → <span className="text-[#80d010]">{t.current.activeMinutes}m</span></span>
                    </div>
                  )}
                  {t.totals.totalSteps != null && (
                    <div><span className="text-[#a0501c]">Total Steps</span><br/><span className="text-white font-pixel text-[10px]">{t.totals.totalSteps.toLocaleString()}</span></div>
                  )}
                  {t.totals.totalActiveMinutes != null && (
                    <div><span className="text-[#a0501c]">Total Active</span><br/><span className="text-white font-pixel text-[10px]">{t.totals.totalActiveMinutes}m</span></div>
                  )}
                  {distance != null && distance >= 1 && (
                    <div><span className="text-[#a0501c]">Distance</span><br/><span className="text-white font-pixel text-[10px]">{distance.toFixed(0)} km</span></div>
                  )}
                  {t.totals.totalCardioMinutes != null && (
                    <div><span className="text-[#a0501c]">Cardio Zone</span><br/><span className="text-white font-pixel text-[10px]">{t.totals.totalCardioMinutes}m total</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Health impact */}
            {(cvRisk || mortalityRisk || lifeGain) && (
              <div className="bg-[#6b88ff]/10 border border-[#6b88ff]/20 rounded-lg p-3 mb-4">
                <p className="font-pixel text-[7px] text-[#6b88ff] mb-2">ESTIMATED HEALTH IMPACT</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {cvRisk && (
                    <div>
                      <div className="font-pixel text-sm text-[#80d010]">↓{cvRisk}%</div>
                      <div className="text-[8px] text-[#a0501c]">CV Risk</div>
                    </div>
                  )}
                  {mortalityRisk && (
                    <div>
                      <div className="font-pixel text-sm text-[#80d010]">↓{mortalityRisk}%</div>
                      <div className="text-[8px] text-[#a0501c]">Mortality</div>
                    </div>
                  )}
                  {lifeGain && (
                    <div>
                      <div className="font-pixel text-sm text-[#80d010]">{lifeGain}</div>
                      <div className="text-[8px] text-[#a0501c]">Life Gain</div>
                    </div>
                  )}
                </div>
                <div className="text-center mt-1">
                  <div className="font-pixel text-sm text-[#80d010]">↓43%</div>
                  <div className="text-[8px] text-[#a0501c]">Rehospitalization Risk (Cochrane)</div>
                </div>
                <p className="text-center text-[6px] text-[#a0501c]/50 mt-1">AHA / JAMA / PLOS research</p>
              </div>
            )}

            {/* LLM personalized summary + future directions */}
            <div className="bg-[#a04000]/10 border border-[#a04000]/20 rounded-lg p-3 mb-4">
              <p className="font-pixel text-[7px] text-[#fcd890] mb-2">YOUR REPORT</p>
              {loading && (
                <div className="flex items-center justify-center gap-1 py-4">
                  <span className="w-2 h-2 bg-[#fcd890]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-[#fcd890]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-[#fcd890]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              {llmSummary && llmSummary.split('\n').map((line, i) => {
                const isHeader = /^(HEART|ACTIVITY|RECOVERY|OUTLOOK)/i.test(line.trim())
                return line.trim() ? (
                  <p key={i} className={isHeader
                    ? 'font-pixel text-[7px] text-[#80d8ff] uppercase mt-2.5 mb-1 first:mt-0'
                    : 'text-[10px] text-[#fcd890]/80 leading-relaxed'
                  }>{line}</p>
                ) : null
              })}
              {!loading && !llmSummary && (
                <p className="text-[10px] text-[#a0501c] text-center py-2">Could not generate report.</p>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#e02020] hover:bg-[#ff3030] text-white font-pixel text-[10px] border-[3px] border-t-[#ff6060] border-l-[#ff6060] border-b-[#800000] border-r-[#800000] transition-all active:scale-95"
            >
              KEEP GOING
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
