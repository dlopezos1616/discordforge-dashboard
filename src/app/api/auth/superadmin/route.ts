import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('discord_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ isSuperAdmin: false })
    }

    let sessionData: any
    try {
      sessionData = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
      )
    } catch {
      return NextResponse.json({ isSuperAdmin: false })
    }

    const userId = sessionData.user?.id
    const superAdminId = process.env.SUPER_ADMIN_DISCORD_ID

    if (!userId || !superAdminId) {
      return NextResponse.json({ isSuperAdmin: false })
    }

    const isSuperAdmin = userId === superAdminId

    return NextResponse.json({ isSuperAdmin, userId })
  } catch {
    return NextResponse.json({ isSuperAdmin: false })
  }
}
