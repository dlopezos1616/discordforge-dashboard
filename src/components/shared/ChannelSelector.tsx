'use client'

import { useState, useEffect, useCallback } from 'react'
import { Hash, Loader2 } from 'lucide-react'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

interface DiscordChannel {
  id: string
  name: string
  parentId: string | null
  position: number
  topic: string | null
  nsfw: boolean
}

interface DiscordCategory {
  id: string
  name: string
  position: number
  channels: DiscordChannel[]
}

interface ChannelSelectorProps {
  value: string | null
  onValueChange: (channelId: string) => void
  placeholder?: string
  className?: string
}

export function ChannelSelector({ value, onValueChange, placeholder = 'Seleccionar canal...', className }: ChannelSelectorProps) {
  const { currentServer } = useAppStore()
  const [channels, setChannels] = useState<DiscordChannel[]>([])
  const [categories, setCategories] = useState<DiscordCategory[]>([])
  const [uncategorized, setUncategorized] = useState<DiscordChannel[]>([])
  const [loading, setLoading] = useState(false)

  const fetchChannels = useCallback(async () => {
    if (!currentServer?.discordId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/discord/channels?guildId=${currentServer.discordId}`)
      const data = await res.json()
      if (data.channels) {
        setChannels(data.channels)
        setCategories(data.categories || [])
        setUncategorized(data.uncategorized || [])
      }
    } catch (err) {
      console.error('Error fetching channels:', err)
    } finally {
      setLoading(false)
    }
  }, [currentServer?.discordId])

  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background/50 text-sm text-muted-foreground ${className || ''}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Cargando canales...
      </div>
    )
  }

  const selectedChannel = channels.find(c => c.id === value)

  return (
    <Select value={value || ''} onValueChange={onValueChange}>
      <SelectTrigger className={`bg-background/50 ${className || ''}`}>
        <SelectValue>
          {selectedChannel ? (
            <span className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-muted-foreground" />
              {selectedChannel.name}
            </span>
          ) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {uncategorized.length > 0 && (
          <SelectGroup>
            <SelectLabel className="text-xs text-muted-foreground">Sin categoría</SelectLabel>
            {uncategorized.map(ch => (
              <SelectItem key={ch.id} value={ch.id}>
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  {ch.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        )}

        {categories.map(cat => (
          cat.channels.length > 0 && (
            <SelectGroup key={cat.id}>
              <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                {cat.name}
              </SelectLabel>
              {cat.channels.map(ch => (
                <SelectItem key={ch.id} value={ch.id}>
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-muted-foreground" />
                    {ch.name}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          )
        ))}

        {channels.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No se encontraron canales
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
