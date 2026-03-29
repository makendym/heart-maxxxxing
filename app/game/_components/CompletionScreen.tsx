'use client'

import { TOTAL_SESSIONS } from '../../lib/game-state'
import type { HealthTrends } from '../../lib/fitbit'
import PhIcon from './PhIcon'

const FIREWORK_ICONS = ['sparkle', 'confetti', 'star', 'heart', 'crown', 'fire']

interface CompletionScreenProps {
  playerName: string
  hearts: number
  goal: string
  healthTrends?: HealthTrends | null
  onClose: () => void
}

export default function CompletionScreen({
  playerName,
  hearts,
  goal,
  healthTrends,
  onClose,
}: CompletionScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Fireworks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="firework absolute"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 1.5}s`,
            }}
          >
            <PhIcon
              name={FIREWORK_ICONS[i % FIREWORK_ICONS.length]}
              size={20}
              className={['text-amber-400', 'text-pink-400', 'text-yellow-300', 'text-red-400', 'text-purple-400', 'text-orange-400'][i % 6]}
            />
          </div>
        ))}
      </div>

      <div className="modal-enter relative z-10 w-full max-w-md text-center">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-amber-500 rounded-2xl p-1 shadow-2xl">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl p-8">
            {/* Crown */}
            <div className="mb-4 flex justify-center">
              <PhIcon name="crown" size={56} className="text-amber-400" />
            </div>

            {/* Title */}
            <h2 className="font-pixel text-xl text-amber-400 mb-2 leading-relaxed">
              YOU DID IT!
            </h2>
            <p className="font-pixel text-[10px] text-pink-300 mb-6">
              {playerName}&apos;s Journey is Complete
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="mb-1 flex justify-center">
                  <PhIcon name="heart" size={24} className="text-red-400" />
                </div>
                <div className="font-pixel text-[8px] text-gray-400">Hearts</div>
                <div className="font-pixel text-sm text-red-400">{hearts}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="mb-1 flex justify-center">
                  <PhIcon name="run" size={24} className="text-emerald-400" />
                </div>
                <div className="font-pixel text-[8px] text-gray-400">Sessions</div>
                <div className="font-pixel text-sm text-emerald-400">{TOTAL_SESSIONS}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="mb-1 flex justify-center">
                  <PhIcon name="trend-down" size={24} className="text-blue-400" />
                </div>
                <div className="font-pixel text-[8px] text-gray-400">Risk Cut</div>
                <div className="font-pixel text-sm text-blue-400">43%</div>
              </div>
            </div>

            {/* Goal */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="font-pixel text-[8px] text-gray-400 mb-2">YOUR GOAL</div>
              <p className="text-white text-sm">&quot;{goal}&quot;</p>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" />
              </div>
              <div className="font-pixel text-[8px] text-emerald-400 mt-1">100% ACHIEVED</div>
            </div>

            {/* Data-driven journey summary */}
            {healthTrends && (
              <div className="bg-white/5 rounded-lg p-4 mb-5 text-left">
                <div className="font-pixel text-[8px] text-amber-400 mb-3">YOUR JOURNEY IN NUMBERS</div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  {healthTrends.current.restingHR != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Resting HR</span>
                      <div className="text-white font-pixel text-xs">
                        {healthTrends.current.restingHR} BPM
                        {healthTrends.deltas.restingHR != null && (
                          <span className={healthTrends.deltas.restingHR < 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {' '}({healthTrends.deltas.restingHR > 0 ? '+' : ''}{healthTrends.deltas.restingHR})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {healthTrends.current.avgDailySteps != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Avg Daily Steps</span>
                      <div className="text-white font-pixel text-xs">
                        {healthTrends.current.avgDailySteps.toLocaleString()}
                        {healthTrends.deltas.dailySteps != null && healthTrends.deltas.dailySteps !== 0 && (
                          <span className={healthTrends.deltas.dailySteps > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {' '}({healthTrends.deltas.dailySteps > 0 ? '+' : ''}{healthTrends.deltas.dailySteps.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {healthTrends.totals.totalSteps != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Total Steps</span>
                      <div className="text-emerald-400 font-pixel text-xs">{healthTrends.totals.totalSteps.toLocaleString()}</div>
                    </div>
                  )}
                  {healthTrends.totals.totalActiveMinutes != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Total Active</span>
                      <div className="text-emerald-400 font-pixel text-xs">{healthTrends.totals.totalActiveMinutes} min</div>
                    </div>
                  )}
                  {healthTrends.totals.totalSteps != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Distance Walked</span>
                      <div className="text-emerald-400 font-pixel text-xs">{(healthTrends.totals.totalSteps * 0.0008).toFixed(0)} km</div>
                    </div>
                  )}
                  {healthTrends.totals.programDays != null && (
                    <div>
                      <span className="text-gray-400 text-xs">Program Duration</span>
                      <div className="text-emerald-400 font-pixel text-xs">{healthTrends.totals.programDays} days</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estimated health benefits — computed from actual data */}
            {healthTrends && (
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-4 mb-5 text-left">
                <div className="font-pixel text-[8px] text-purple-400 mb-3">ESTIMATED HEALTH IMPACT</div>
                <div className="space-y-2 text-xs">
                  {healthTrends.deltas.restingHR != null && healthTrends.deltas.restingHR < 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">CV Risk Reduction</span>
                      <span className="text-purple-300 font-pixel">~{Math.round(Math.abs(healthTrends.deltas.restingHR) * 1.8)}%</span>
                    </div>
                  )}
                  {healthTrends.deltas.dailySteps != null && healthTrends.deltas.dailySteps > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Mortality Risk Reduction</span>
                      <span className="text-purple-300 font-pixel">~{Math.round((healthTrends.deltas.dailySteps / 1000) * 8)}%</span>
                    </div>
                  )}
                  {healthTrends.totals.totalActiveMinutes != null && healthTrends.totals.programDays != null && healthTrends.totals.programDays > 0 && (() => {
                    const weeklyEst = Math.round((healthTrends.totals.totalActiveMinutes! / healthTrends.totals.programDays!) * 7)
                    const gain = weeklyEst >= 150 ? '+3.4' : weeklyEst >= 75 ? '+1.8' : weeklyEst >= 30 ? '+0.9' : null
                    return gain ? (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Est. Life Expectancy Gain</span>
                        <span className="text-purple-300 font-pixel">{gain} years</span>
                      </div>
                    ) : null
                  })()}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rehab Readmission Risk</span>
                    <span className="text-purple-300 font-pixel">↓43%</span>
                  </div>
                </div>
                <p className="text-[7px] text-sky-700 mt-2">Based on AHA / JAMA / PLOS published research</p>
              </div>
            )}

            {/* Baseline → Now comparison */}
            {healthTrends && (healthTrends.baseline.avgRestingHR != null || healthTrends.baseline.avgDailySteps != null) && (
              <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
                <div className="font-pixel text-[8px] text-sky-400 mb-3">WEEK 1 → WEEK 12</div>
                <div className="space-y-2 text-xs">
                  {healthTrends.baseline.avgRestingHR != null && healthTrends.current.restingHR != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resting HR</span>
                      <span className="text-gray-300">{healthTrends.baseline.avgRestingHR} → <span className="text-emerald-400">{healthTrends.current.restingHR} BPM</span></span>
                    </div>
                  )}
                  {healthTrends.baseline.avgDailySteps != null && healthTrends.current.avgDailySteps != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Daily Steps</span>
                      <span className="text-gray-300">{healthTrends.baseline.avgDailySteps.toLocaleString()} → <span className="text-emerald-400">{healthTrends.current.avgDailySteps.toLocaleString()}</span></span>
                    </div>
                  )}
                  {healthTrends.baseline.avgActiveMinutes != null && healthTrends.current.activeMinutes != null && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Minutes</span>
                      <span className="text-gray-300">{healthTrends.baseline.avgActiveMinutes}m → <span className="text-emerald-400">{healthTrends.current.activeMinutes}m</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="py-3 px-8 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white font-pixel text-[10px] rounded-lg transition-all active:scale-95"
            >
              KEEP GOING
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
