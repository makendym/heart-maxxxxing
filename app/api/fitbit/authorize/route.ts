import { NextResponse } from 'next/server'
import { getAuthUrl } from '../../../lib/fitbit'

export async function GET() {
  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json(
      { error: 'Fitbit OAuth not configured' },
      { status: 500 },
    )
  }
}
