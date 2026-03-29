import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const response = NextResponse.redirect(`${baseUrl}/game`)

  response.cookies.set('fitbit_tokens', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  })
  response.cookies.set('fitbit_connected', '', {
    httpOnly: false,
    maxAge: 0,
    path: '/',
  })

  return response
}
