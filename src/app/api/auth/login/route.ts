import { db } from '@/lib/db'

export async function POST() {
  try {
    let user = await db.user.findFirst({ where: { isAdmin: true } })

    // Auto-create admin user if none exists (first login on fresh DB)
    if (!user) {
      user = await db.user.create({
        data: {
          discordId: 'admin_001',
          username: 'Admin',
          discriminator: '0001',
          avatar: null,
          email: 'admin@discordforge.com',
          isAdmin: true,
        },
      })
    }

    return Response.json({
      user: {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
