// Fitbit Web API — tracks health trends across the rehab program

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize'
const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token'
const FITBIT_API = 'https://api.fitbit.com'

export interface FitbitTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  user_id?: string
}

export interface HealthTrends {
  current: {
    restingHR?: number
    stepsToday?: number
    avgDailySteps?: number
    activeMinutes?: number
    sleepMinutes?: number
  }
  baseline: {
    avgRestingHR?: number
    avgDailySteps?: number
    avgActiveMinutes?: number
  }
  deltas: {
    restingHR?: number
    dailySteps?: number
    activeMinutes?: number
  }
  totals: {
    totalSteps?: number
    totalActiveMinutes?: number
    programDays?: number
  }
  profile?: { name: string; picture: string }
}

// ── OAuth ──

function basicAuth(): string {
  return Buffer.from(
    `${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`,
  ).toString('base64')
}

export function getAuthUrl(): string {
  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) throw new Error('FITBIT_CLIENT_ID not set')

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fitbit/callback`,
    scope: 'activity heartrate sleep profile',
    expires_in: '604800',
  })

  return `${FITBIT_AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(code: string): Promise<FitbitTokens> {
  const res = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/fitbit/callback`,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshAccessToken(token: string): Promise<FitbitTokens> {
  const res = await fetch(FITBIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token,
    }),
  })
  if (!res.ok) throw new Error('Token refresh failed')
  return res.json()
}

// ── Fitbit API helpers ──

async function fitbitGet(path: string, accessToken: string) {
  const res = await fetch(`${FITBIT_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error(`[Fitbit] ${path} error ${res.status}:`, errText.slice(0, 200))
    throw new Error(`Fitbit API error: ${res.status}`)
  }
  return res.json()
}

function toDateStr(d: Date | string | number): string {
  return new Date(d).toISOString().split('T')[0]
}

function avgFirst(values: number[], n: number): number | undefined {
  const valid = values.slice(0, n).filter((v) => v > 0)
  if (valid.length === 0) return undefined
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

function avgLast(values: number[], n: number): number | undefined {
  const valid = values.slice(-n).filter((v) => v > 0)
  if (valid.length === 0) return undefined
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

// ── Main trends fetch ──

export async function fetchHealthTrends(
  accessToken: string,
  programStartDate?: string,
  programEndDate?: string,
): Promise<HealthTrends> {
  const startDate = programStartDate
    ? toDateStr(programStartDate)
    : '2025-11-01'
  const endDate = programEndDate
    ? toDateStr(programEndDate)
    : toDateStr(new Date())

  const startMs = new Date(startDate).getTime()
  const endMs = new Date(endDate).getTime()
  const DAY_MS = 86_400_000
  const programDays = Math.max(1, Math.floor((endMs - startMs) / DAY_MS))

  console.log(`[Fitbit] Fetching ${startDate} to ${endDate} (program day ${programDays})`)

  const [stepsRes, hrRes, fairlyActiveRes, veryActiveRes, sleepRes, profileRes] =
    await Promise.allSettled([
      fitbitGet(`/1/user/-/activities/steps/date/${startDate}/${endDate}.json`, accessToken),
      fitbitGet(`/1/user/-/activities/heart/date/${startDate}/${endDate}.json`, accessToken),
      fitbitGet(`/1/user/-/activities/minutesFairlyActive/date/${startDate}/${endDate}.json`, accessToken),
      fitbitGet(`/1/user/-/activities/minutesVeryActive/date/${startDate}/${endDate}.json`, accessToken),
      fitbitGet(`/1.2/user/-/sleep/date/${endDate}/${endDate}.json`, accessToken),
      fitbitGet('/1/user/-/profile.json', accessToken),
    ])

  // ── Steps ──
  let stepsToday: number | undefined
  let avgDailyStepsCurrent: number | undefined
  let avgDailyStepsBaseline: number | undefined
  let totalSteps: number | undefined

  if (stepsRes.status === 'fulfilled') {
    const entries = stepsRes.value['activities-steps'] || []
    const days = entries.map((e: { value: string }) => parseInt(e.value) || 0)
    console.log(`[Fitbit] Steps: ${days.length} days, sample: ${days.slice(0, 3).join(', ')}`)
    stepsToday = days[days.length - 1] || 0
    totalSteps = days.reduce((a: number, b: number) => a + b, 0)
    avgDailyStepsBaseline = avgFirst(days, 7)
    avgDailyStepsCurrent = avgLast(days, 7)
  }

  // ── Heart Rate ──
  let currentRestingHR: number | undefined
  let baselineRestingHR: number | undefined

  if (hrRes.status === 'fulfilled') {
    const entries = hrRes.value['activities-heart'] || []
    const dailyRHR = entries
      .map((e: { value: { restingHeartRate?: number } }) => e.value?.restingHeartRate || 0)
      .filter((v: number) => v > 0)
    console.log(`[Fitbit] Resting HR: ${dailyRHR.length} days with data, sample: ${dailyRHR.slice(0, 3).join(', ')}`)
    baselineRestingHR = avgFirst(dailyRHR, 7)
    currentRestingHR = avgLast(dailyRHR, 7)
  }

  // ── Active Minutes (fairly + very) ──
  let activeMinutesToday: number | undefined
  let avgActiveBaseline: number | undefined
  let avgActiveCurrent: number | undefined
  let totalActiveMinutes: number | undefined

  if (fairlyActiveRes.status === 'fulfilled' && veryActiveRes.status === 'fulfilled') {
    const fairly = (fairlyActiveRes.value['activities-minutesFairlyActive'] || [])
      .map((e: { value: string }) => parseInt(e.value) || 0)
    const very = (veryActiveRes.value['activities-minutesVeryActive'] || [])
      .map((e: { value: string }) => parseInt(e.value) || 0)
    const days = fairly.map((f: number, i: number) => f + (very[i] || 0))
    console.log(`[Fitbit] Active mins: ${days.length} days, sample: ${days.slice(0, 3).join(', ')}`)
    activeMinutesToday = days[days.length - 1] || 0
    totalActiveMinutes = days.reduce((a: number, b: number) => a + b, 0)
    avgActiveBaseline = avgFirst(days, 7)
    avgActiveCurrent = avgLast(days, 7)
  }

  // ── Sleep ──
  let sleepMinutes: number | undefined
  if (sleepRes.status === 'fulfilled') {
    sleepMinutes = sleepRes.value?.summary?.totalMinutesAsleep
    console.log(`[Fitbit] Sleep: ${sleepMinutes ?? 'no data'} min`)
  }

  // ── Profile ──
  let profile: { name: string; picture: string } | undefined
  if (profileRes.status === 'fulfilled') {
    const user = profileRes.value?.user
    if (user) {
      profile = {
        name: user.displayName || '',
        picture: user.avatar || '',
      }
    }
  }

  // ── Deltas ──
  const deltaHR =
    currentRestingHR != null && baselineRestingHR != null
      ? currentRestingHR - baselineRestingHR
      : undefined
  const deltaSteps =
    avgDailyStepsCurrent != null && avgDailyStepsBaseline != null
      ? avgDailyStepsCurrent - avgDailyStepsBaseline
      : undefined
  const deltaActive =
    avgActiveCurrent != null && avgActiveBaseline != null
      ? avgActiveCurrent - avgActiveBaseline
      : undefined

  return {
    current: {
      restingHR: currentRestingHR,
      stepsToday,
      avgDailySteps: avgDailyStepsCurrent,
      activeMinutes: activeMinutesToday,
      sleepMinutes,
    },
    baseline: {
      avgRestingHR: baselineRestingHR,
      avgDailySteps: avgDailyStepsBaseline,
      avgActiveMinutes: avgActiveBaseline,
    },
    deltas: {
      restingHR: deltaHR,
      dailySteps: deltaSteps,
      activeMinutes: deltaActive,
    },
    totals: {
      totalSteps,
      totalActiveMinutes,
      programDays,
    },
    profile,
  }
}
