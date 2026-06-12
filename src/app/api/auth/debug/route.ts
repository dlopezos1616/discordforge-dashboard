import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const hasClientId = !!process.env.DISCORD_CLIENT_ID
  const hasClientSecret = !!process.env.DISCORD_CLIENT_SECRET
  const hasPublicClientId = !!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID
  const hasDatabaseUrl = !!process.env.DATABASE_URL

  const sessionCookie = request.cookies.get('discord_session')
  let sessionInfo: any = null

  if (sessionCookie?.value) {
    try {
      const data = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
      sessionInfo = {
        hasUser: !!data.user,
        hasAccessToken: !!data.accessToken,
        hasTokenType: !!data.tokenType,
        cookieSize: sessionCookie.value.length,
        username: data.user?.username || null,
        userId: data.user?.id || null,
      }
    } catch {
      sessionInfo = { error: 'Failed to decode session cookie' }
    }
  }

  return NextResponse.json({
    envVars: {
      DISCORD_CLIENT_ID: hasClientId ? '✅ Set' : '❌ Missing',
      DISCORD_CLIENT_SECRET: hasClientSecret ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_DISCORD_CLIENT_ID: hasPublicClientId ? '✅ Set' : '❌ Missing',
      DATABASE_URL: hasDatabaseUrl ? '✅ Set' : '❌ Missing',
    },
    session: sessionInfo || 'No session cookie found',
    timestamp: new Date().toISOString(),
  })
}
