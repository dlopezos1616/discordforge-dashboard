import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      console.log('Session API: No session cookie found')
      return NextResponse.json({ authenticated: false })
    }

    console.log(`Session API: Cookie found, size: ${sessionCookie.value.length} bytes`)

    let sessionData: any
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
    } catch (parseErr) {
      console.error('Session API: Failed to parse session cookie', parseErr)
      return NextResponse.json({ authenticated: false, error: 'Invalid session' })
    }

    if (!sessionData.user || !sessionData.user.id) {
      console.error('Session API: Session cookie has no user data')
      return NextResponse.json({ authenticated: false, error: 'No user data in session' })
    }

    console.log(`Session API: User authenticated - ${sessionData.user.username} (${sessionData.user.id})`)

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
    })
  } catch (err) {
    console.error('Session API error:', err)
    return NextResponse.json({ authenticated: false })
  }
}
