import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    )

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
    })
  } catch (err) {
    return NextResponse.json({ authenticated: false })
  }
}
