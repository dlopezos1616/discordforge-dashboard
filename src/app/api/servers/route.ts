import { db } from '@/lib/db'

export async function GET() {
  try {
    const servers = await db.server.findMany({
      include: {
        config: true,
        _count: {
          select: { tickets: true, moderationActions: true, logs: true },
        },
      },
      orderBy: { memberCount: 'desc' },
    })
    return Response.json({ servers })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
