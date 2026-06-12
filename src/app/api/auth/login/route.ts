import { db } from '@/lib/db'

export async function POST() {
  try {
    const user = await db.user.findFirst({ where: { isAdmin: true } })
    if (!user) {
      return Response.json({ error: 'No admin user found. Run /api/seed first.' }, { status: 404 })
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
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
