import { NextRequest, NextResponse } from 'next/server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1514983732761854113'
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // If user denied access
  if (error) {
    return NextResponse.redirect(new URL('/?auth=denied', request.url))
  }

  // If no code, redirect to Discord OAuth
  if (!code) {
    const redirectUri = `${new URL(request.url).origin}/api/auth/discord`
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
    discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
    discordAuthUrl.searchParams.set('redirect_uri', redirectUri)
    discordAuthUrl.searchParams.set('response_type', 'code')
    discordAuthUrl.searchParams.set('scope', 'identify guilds')
    discordAuthUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(discordAuthUrl.toString())
  }

  // Exchange code for token
  try {
    const redirectUri = `${new URL(request.url).origin}/api/auth/discord`
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('Discord token exchange error:', errText)
      return NextResponse.redirect(new URL('/?auth=error', request.url))
    }

    const tokenData = await tokenResponse.json()
    const { access_token, token_type } = tokenData

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` },
    })

    if (!userResponse.ok) {
      console.error('Discord user fetch error')
      return NextResponse.redirect(new URL('/?auth=error', request.url))
    }

    const discordUser = await userResponse.json()

    // Fetch user's guilds
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { Authorization: `${token_type} ${access_token}` },
    })

    let guilds: any[] = []
    if (guildsResponse.ok) {
      guilds = await guildsResponse.json()
    }

    // Create session cookie with user data + guilds
    // Store minimal data in cookie, guilds in a separate approach
    const sessionData = {
      user: {
        id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        email: discordUser.email || null,
      },
      accessToken: access_token,
      tokenType: token_type,
      guilds: guilds.map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        owner: g.owner,
        permissions: g.permissions,
      })),
    }

    // Encode session data as base64 for cookie
    const encoded = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    const response = NextResponse.redirect(new URL('/?auth=success', request.url))
    response.cookies.set('discord_session', encoded, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Discord OAuth error:', err)
    return NextResponse.redirect(new URL('/?auth=error', request.url))
  }
}

// DELETE = Logout
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.set('discord_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
