import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const serverId = searchParams.get('serverId')

    if (!serverId) {
      return Response.json({ error: 'serverId required' }, { status: 400 })
    }

    const presets = await db.embedPreset.findMany({
      where: { serverId },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ presets })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { serverId, name, title, description, author, authorIcon, footer, footerIcon, thumbnail, image, color, fields, channelId } = body

    if (!serverId || !name) {
      return Response.json({ error: 'serverId and name required' }, { status: 400 })
    }

    const preset = await db.embedPreset.create({
      data: {
        serverId,
        name,
        title: title || null,
        description: description || null,
        author: author || null,
        authorIcon: authorIcon || null,
        footer: footer || null,
        footerIcon: footerIcon || null,
        thumbnail: thumbnail || null,
        image: image || null,
        color: color || '#5865F2',
        fields: fields || '[]',
        channelId: channelId || null,
      },
    })

    return Response.json({ preset })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get('presetId')

    if (!presetId) {
      return Response.json({ error: 'presetId required' }, { status: 400 })
    }

    await db.embedPreset.delete({ where: { id: presetId } })

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 })
  }
}
