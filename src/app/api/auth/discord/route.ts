import { NextRequest, NextResponse } from 'next/server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1514983732761854113'
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || ''

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const origin = new URL(request.url).origin

  // If user denied access
  if (error) {
    return NextResponse.redirect(`${origin}/?auth=denied`)
  }

  // If no code, redirect to Discord OAuth
  if (!code) {
    // Validate that we have the client secret before starting OAuth
    if (!DISCORD_CLIENT_SECRET) {
      console.error('DISCORD_CLIENT_SECRET is not set! OAuth will fail.')
      return NextResponse.redirect(`${origin}/?auth=error&reason=no_secret`)
    }

    const redirectUri = `${origin}/api/auth/discord`
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
    discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID)
    discordAuthUrl.searchParams.set('redirect_uri', redirectUri)
    discordAuthUrl.searchParams.set('response_type', 'code')
    discordAuthUrl.searchParams.set('scope', 'identify guilds guilds.members.read')
    discordAuthUrl.searchParams.set('prompt', 'consent')

    return NextResponse.redirect(discordAuthUrl.toString())
  }

  // Exchange code for token
  try {
    const redirectUri = `${origin}/api/auth/discord`

    if (!DISCORD_CLIENT_SECRET) {
      console.error('DISCORD_CLIENT_SECRET is not set! Cannot exchange code.')
      return NextResponse.redirect(`${origin}/?auth=error&reason=no_secret`)
    }

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
      return NextResponse.redirect(`${origin}/?auth=error&reason=token_exchange`)
    }

    const tokenData = await tokenResponse.json()
    const { access_token, token_type, refresh_token } = tokenData

    // Fetch user info
    const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` },
    })

    if (!userResponse.ok) {
      console.error('Discord user fetch error:', userResponse.status)
      return NextResponse.redirect(`${origin}/?auth=error&reason=user_fetch`)
    }

    const discordUser = await userResponse.json()

    // IMPORTANT: Only store minimal data in the cookie to avoid exceeding
    // the 4KB browser cookie limit. Guilds are fetched on demand via /api/discord/guilds
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
      refreshToken: refresh_token || null,
    }

    // Encode session data as base64 for cookie
    const encoded = Buffer.from(JSON.stringify(sessionData)).toString('base64')

    // Log cookie size for debugging
    console.log(`Session cookie size: ${encoded.length} bytes (limit: 4093)`)

    if (encoded.length > 4000) {
      console.error('WARNING: Session cookie may exceed browser limit!')
    }

    const isSecure = origin.startsWith('https')

    const response = NextResponse.redirect(`${origin}/?auth=success`)
    response.cookies.set('discord_session', encoded, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Discord OAuth error:', err)
    return NextResponse.redirect(`${origin}/?auth=error&reason=exception`)
  }
}

// DELETE = Logout
export async function DELETE(request: NextRequest) {
  const origin = new URL(request.url).origin
  const isSecure = origin.startsWith('https')
  const response = NextResponse.json({ success: true })
  response.cookies.set('discord_session', '', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
