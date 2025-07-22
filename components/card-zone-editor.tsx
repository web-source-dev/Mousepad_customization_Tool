"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Grid, Move, Eye, EyeOff, Trash2, Copy } from "lucide-react"

interface CardZone {
  id: number
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  visible: boolean
  color: string
  opacity: number
  border: boolean
  borderColor: string
  borderWidth: number
}

interface CardZoneEditorProps {
  zones: CardZone[]
  onZonesChange: (zones: CardZone[]) => void
  selectedZone: number | null
  onZoneSelect: (id: number | null) => void
}

export function CardZoneEditor({
  zones,
  onZonesChange,
  selectedZone,
  onZoneSelect
}: CardZoneEditorProps) {
  const [draggingZone, setDraggingZone] = useState<number | null>(null)

  const updateZone = (id: number, updates: Partial<CardZone>) => {
    onZonesChange(zones.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    ))
  }

  const removeZone = (id: number) => {
    onZonesChange(zones.filter(zone => zone.id !== id))
    if (selectedZone === id) {
      onZoneSelect(null)
    }
  }

  const duplicateZone = (zone: CardZone) => {
    const newZone = {
      ...zone,
      id: Date.now(),
      name: `${zone.name} (Copy)`,
      position: { x: zone.position.x + 10, y: zone.position.y + 10 }
    }
    onZonesChange([...zones, newZone])
  }

  const handleZoneDrag = (id: number, e: React.MouseEvent) => {
    if (draggingZone !== id) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    updateZone(id, {
      position: { x: Math.max(0, Math.min(90, x)), y: Math.max(0, Math.min(90, y)) }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Card Zones ({zones.length})</h3>
        <Button
          size="sm"
          onClick={() => {
            const newZone: CardZone = {
              id: Date.now(),
              name: `Zone ${zones.length + 1}`,
              position: { x: 10, y: 10 },
              size: { width: 80, height: 120 },
              visible: true,
              color: "#ffffff",
              opacity: 0.8,
              border: true,
              borderColor: "#000000",
              borderWidth: 2
            }
            onZonesChange([...zones, newZone])
          }}
        >
          <Grid className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </div>

      <div className="space-y-3">
        {zones.map((zone) => (
          <Card
            key={zone.id}
            className={`cursor-pointer transition-all ${
              selectedZone === zone.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => onZoneSelect(zone.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Move className="h-4 w-4 text-gray-500" />
                  <Input
                    value={zone.name}
                    onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                    className="w-32 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateZone(zone.id, { visible: !zone.visible })
                    }}
                  >
                    {zone.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateZone(zone)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeZone(zone.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Position</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={Math.round(zone.position.x)}
                      onChange={(e) => updateZone(zone.id, { 
                        position: { ...zone.position, x: Number(e.target.value) }
                      })}
                      className="w-16 text-xs"
                      min="0"
                      max="100"
                    />
                    <Input
                      type="number"
                      value={Math.round(zone.position.y)}
                      onChange={(e) => updateZone(zone.id, { 
                        position: { ...zone.position, y: Number(e.target.value) }
                      })}
                      className="w-16 text-xs"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Size</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={zone.size.width}
                      onChange={(e) => updateZone(zone.id, { 
                        size: { ...zone.size, width: Number(e.target.value) }
                      })}
                      className="w-16 text-xs"
                      min="20"
                      max="200"
                    />
                    <Input
                      type="number"
                      value={zone.size.height}
                      onChange={(e) => updateZone(zone.id, { 
                        size: { ...zone.size, height: Number(e.target.value) }
                      })}
                      className="w-16 text-xs"
                      min="20"
                      max="300"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={zone.color}
                    onChange={(e) => updateZone(zone.id, { color: e.target.value })}
                    className="w-8 h-8"
                  />
                  <Label className="text-xs">Background</Label>
                </div>

                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[zone.opacity * 100]}
                    onValueChange={([value]) => updateZone(zone.id, { opacity: value / 100 })}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Border</Label>
                  <Switch
                    checked={zone.border}
                    onCheckedChange={(checked) => updateZone(zone.id, { border: checked })}
                  />
                </div>

                {zone.border && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={zone.borderColor}
                      onChange={(e) => updateZone(zone.id, { borderColor: e.target.value })}
                      className="w-8 h-8"
                    />
                    <Input
                      type="number"
                      value={zone.borderWidth}
                      onChange={(e) => updateZone(zone.id, { borderWidth: Number(e.target.value) })}
                      className="w-16 text-xs"
                      min="1"
                      max="10"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Grid className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No card zones added yet</p>
          <p className="text-sm">Add zones to create your game layout</p>
        </div>
      )}
    </div>
  )
} 