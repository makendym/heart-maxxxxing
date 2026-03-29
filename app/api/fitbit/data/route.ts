import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  fetchHealthTrends,
  refreshAccessToken,
  type FitbitTokens,
} from '../../../lib/fitbit'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get('fitbit_tokens')

  if (!tokenCookie?.value) {
    return NextResponse.json({ error: 'Not connected' }, { status: 401 })
  }

  let tokens: FitbitTokens
  try {
    tokens = JSON.parse(tokenCookie.value)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  try {
    const data = await fetchHealthTrends(tokens.access_token, startDate, endDate)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[Fitbit API] First attempt failed:', err instanceof Error ? err.message : err)

    if (!tokens.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token. Re-connect Fitbit.' },
        { status: 401 },
      )
    }

    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token)
      const merged = { ...tokens, ...newTokens }
      const data = await fetchHealthTrends(merged.access_token, startDate, endDate)

      const response = NextResponse.json(data)
      response.cookies.set('fitbit_tokens', JSON.stringify(merged), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      return response
    } catch (refreshErr) {
      console.error('[Fitbit API] Refresh failed:', refreshErr instanceof Error ? refreshErr.message : refreshErr)
      return NextResponse.json(
        { error: 'Failed to fetch Fitbit data' },
        { status: 502 },
      )
    }
  }
}
