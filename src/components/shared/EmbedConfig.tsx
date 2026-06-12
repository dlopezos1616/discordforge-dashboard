'use client'

import { useState } from 'react'
import { Hash, Image as ImageIcon, Palette, Type, AlignLeft, User, Footer, Eye, Plus, X, GripVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { ChannelSelector } from '@/components/shared/ChannelSelector'

export interface EmbedField {
  name: string
  value: string
  inline: boolean
}

export interface EmbedConfigData {
  channelId: string | null
  title: string
  description: string
  color: string
  authorName: string
  authorIconUrl: string
  thumbnailUrl: string
  imageUrl: string
  footerText: string
  footerIconUrl: string
  fields: EmbedField[]
  showTimestamp: boolean
}

export const defaultEmbedConfig: EmbedConfigData = {
  channelId: null,
  title: '',
  description: '',
  color: '#8b5cf6',
  authorName: '',
  authorIconUrl: '',
  thumbnailUrl: '',
  imageUrl: '',
  footerText: '',
  footerIconUrl: '',
  fields: [],
  showTimestamp: true,
}

interface EmbedConfigProps {
  config: EmbedConfigData
  onChange: (config: EmbedConfigData) => void
  showChannelSelector?: boolean
}

export function EmbedConfig({ config, onChange, showChannelSelector = true }: EmbedConfigProps) {
  const update = (partial: Partial<EmbedConfigData>) => {
    onChange({ ...config, ...partial })
  }

  const addField = () => {
    update({ fields: [...config.fields, { name: '', value: '', inline: false }] })
  }

  const removeField = (index: number) => {
    update({ fields: config.fields.filter((_, i) => i !== index) })
  }

  const updateField = (index: number, partial: Partial<EmbedField>) => {
    const newFields = config.fields.map((f, i) => i === index ? { ...f, ...partial } : f)
    update({ fields: newFields })
  }

  return (
    <div className="space-y-4">
      {/* Channel Selector */}
      {showChannelSelector && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Hash className="w-3 h-3" />
            Canal de destino
          </Label>
          <ChannelSelector
            value={config.channelId}
            onValueChange={(channelId) => update({ channelId })}
            placeholder="Selecciona el canal donde se enviará..."
          />
        </div>
      )}

      {/* Title & Color */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Type className="w-3 h-3" />
            Título del Embed
          </Label>
          <Input
            placeholder="Título del mensaje embed..."
            value={config.title}
            onChange={(e) => update({ title: e.target.value })}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Palette className="w-3 h-3" />
            Color
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color}
              onChange={(e) => update({ color: e.target.value })}
              className="w-9 h-9 rounded-md border border-input cursor-pointer bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <AlignLeft className="w-3 h-3" />
          Descripción
        </Label>
        <Textarea
          placeholder="Descripción del embed... Soporta **negrita**, *cursiva*, y `código`"
          value={config.description}
          onChange={(e) => update({ description: e.target.value })}
          className="bg-background/50 resize-none"
          rows={3}
        />
      </div>

      {/* Author */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <User className="w-3 h-3" />
            Autor
          </Label>
          <Input
            placeholder="Nombre del autor"
            value={config.authorName}
            onChange={(e) => update({ authorName: e.target.value })}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Icono del autor (URL)</Label>
          <Input
            placeholder="https://..."
            value={config.authorIconUrl}
            onChange={(e) => update({ authorIconUrl: e.target.value })}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Thumbnail (URL)
          </Label>
          <Input
            placeholder="https://... (imagen pequeña)"
            value={config.thumbnailUrl}
            onChange={(e) => update({ thumbnailUrl: e.target.value })}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3" />
            Imagen principal (URL)
          </Label>
          <Input
            placeholder="https://... (imagen grande)"
            value={config.imageUrl}
            onChange={(e) => update({ imageUrl: e.target.value })}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Campos personalizados</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={addField}
            className="h-7 text-xs gap-1 text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-3 h-3" />
            Añadir campo
          </Button>
        </div>
        {config.fields.map((field, i) => (
          <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-background/30 border border-border/30">
            <div className="flex-1 space-y-1.5">
              <Input
                placeholder="Nombre del campo"
                value={field.name}
                onChange={(e) => updateField(i, { name: e.target.value })}
                className="bg-background/50 h-8 text-sm"
              />
              <Input
                placeholder="Valor del campo"
                value={field.value}
                onChange={(e) => updateField(i, { value: e.target.value })}
                className="bg-background/50 h-8 text-sm"
              />
            </div>
            <div className="flex flex-col items-center gap-1 pt-1">
              <Switch
                checked={field.inline}
                onCheckedChange={(inline) => updateField(i, { inline })}
                className="scale-75"
              />
              <span className="text-[9px] text-muted-foreground">Inline</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeField(i)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Texto del footer</Label>
          <Input
            placeholder="Texto del pie..."
            value={config.footerText}
            onChange={(e) => update({ footerText: e.target.value })}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">Icono del footer (URL)</Label>
          <Input
            placeholder="https://..."
            value={config.footerIconUrl}
            onChange={(e) => update({ footerIconUrl: e.target.value })}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-2">
        <Switch
          checked={config.showTimestamp}
          onCheckedChange={(showTimestamp) => update({ showTimestamp })}
        />
        <Label className="text-sm">Mostrar fecha/hora en el embed</Label>
      </div>
    </div>
  )
}

/* Discord-style embed preview */
export function EmbedPreview({ config }: { config: EmbedConfigData }) {
  const hasContent = config.title || config.description || config.fields.length > 0 || config.authorName || config.imageUrl

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        Configura el embed para ver la vista previa
      </div>
    )
  }

  return (
    <div className="flex gap-0 max-w-lg">
      {/* Color bar */}
      <div
        className="w-1 rounded-l-md shrink-0"
        style={{ backgroundColor: config.color || '#8b5cf6' }}
      />
      <div className="flex-1 bg-[#2b2d31] rounded-r-md p-3 space-y-2 text-sm">
        {/* Author */}
        {config.authorName && (
          <div className="flex items-center gap-2">
            {config.authorIconUrl && (
              <img src={config.authorIconUrl} alt="" className="w-5 h-5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <span className="font-semibold text-xs text-white">{config.authorName}</span>
          </div>
        )}

        {/* Title */}
        {config.title && (
          <h3 className="font-bold text-white">{config.title}</h3>
        )}

        {/* Description */}
        {config.description && (
          <p className="text-[#dbdee1] text-sm whitespace-pre-wrap">{config.description}</p>
        )}

        {/* Fields */}
        {config.fields.length > 0 && (
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {config.fields.map((field, i) => (
              <div key={i} className={field.inline ? '' : 'col-span-3'}>
                <p className="font-bold text-white text-xs">{field.name || '\u00A0'}</p>
                <p className="text-[#dbdee1] text-xs">{field.value || '\u00A0'}</p>
              </div>
            ))}
          </div>
        )}

        {/* Image */}
        {config.imageUrl && (
          <img
            src={config.imageUrl}
            alt="Embed preview"
            className="max-w-full rounded-md mt-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {/* Footer */}
        {(config.footerText || config.showTimestamp) && (
          <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/5">
            {config.footerIconUrl && (
              <img src={config.footerIconUrl} alt="" className="w-4 h-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <span className="text-[10px] text-[#dbdee1]">
              {config.footerText}
              {config.footerText && config.showTimestamp && ' • '}
              {config.showTimestamp && 'Hoy a las ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
