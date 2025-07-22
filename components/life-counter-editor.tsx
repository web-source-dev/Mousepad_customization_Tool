"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Target, Heart, Zap, Droplets, Crown, Trash2, Copy, Eye, EyeOff } from "lucide-react"

interface LifeCounter {
  id: number
  type: string
  value: number
  position: { x: number; y: number }
  size: number
  color: string
  visible: boolean
  label?: string
  maxValue?: number
  minValue?: number
}

interface LifeCounterEditorProps {
  counters: LifeCounter[]
  onCountersChange: (counters: LifeCounter[]) => void
  selectedCounter: number | null
  onCounterSelect: (id: number | null) => void
}

const COUNTER_TYPES = [
  { value: "life", label: "Life Points", icon: Heart, color: "#ef4444" },
  { value: "mana", label: "Mana", icon: Zap, color: "#3b82f6" },
  { value: "energy", label: "Energy", icon: Target, color: "#10b981" },
  { value: "poison", label: "Poison", icon: Droplets, color: "#8b5cf6" },
  { value: "experience", label: "Experience", icon: Crown, color: "#f59e0b" },
  { value: "custom", label: "Custom", icon: Target, color: "#6b7280" }
]

export function LifeCounterEditor({
  counters,
  onCountersChange,
  selectedCounter,
  onCounterSelect
}: LifeCounterEditorProps) {
  const [newCounterType, setNewCounterType] = useState("life")
  const [newCounterValue, setNewCounterValue] = useState(20)

  const updateCounter = (id: number, updates: Partial<LifeCounter>) => {
    onCountersChange(counters.map(counter => 
      counter.id === id ? { ...counter, ...updates } : counter
    ))
  }

  const removeCounter = (id: number) => {
    onCountersChange(counters.filter(counter => counter.id !== id))
    if (selectedCounter === id) {
      onCounterSelect(null)
    }
  }

  const duplicateCounter = (counter: LifeCounter) => {
    const newCounter = {
      ...counter,
      id: Date.now(),
      position: { x: counter.position.x + 10, y: counter.position.y + 10 }
    }
    onCountersChange([...counters, newCounter])
  }

  const addCounter = () => {
    const counterType = COUNTER_TYPES.find(t => t.value === newCounterType)
    const newCounter: LifeCounter = {
      id: Date.now(),
      type: newCounterType,
      value: newCounterValue,
      position: { x: 50, y: 50 },
      size: 40,
      color: counterType?.color || "#6b7280",
      visible: true,
      label: counterType?.label,
      maxValue: newCounterType === "life" ? 9999 : undefined,
      minValue: 0
    }
    onCountersChange([...counters, newCounter])
  }

  const getCounterIcon = (type: string) => {
    const counterType = COUNTER_TYPES.find(t => t.value === type)
    return counterType?.icon || Target
  }

  const getCounterLabel = (type: string) => {
    const counterType = COUNTER_TYPES.find(t => t.value === type)
    return counterType?.label || "Custom"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Life Counters ({counters.length})</h3>
      </div>

      {/* Add New Counter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={newCounterType} onValueChange={setNewCounterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Starting Value</Label>
              <Input
                type="number"
                value={newCounterValue}
                onChange={(e) => setNewCounterValue(Number(e.target.value))}
                className="text-sm"
              />
            </div>
          </div>
          <Button onClick={addCounter} className="w-full" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Add Counter
          </Button>
        </CardContent>
      </Card>

      {/* Existing Counters */}
      <div className="space-y-3">
        {counters.map((counter) => {
          const IconComponent = getCounterIcon(counter.type)
          return (
            <Card
              key={counter.id}
              className={`cursor-pointer transition-all ${
                selectedCounter === counter.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onCounterSelect(counter.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4" style={{ color: counter.color }} />
                    <span className="font-medium">{getCounterLabel(counter.type)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        updateCounter(counter.id, { visible: !counter.visible })
                      }}
                    >
                      {counter.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateCounter(counter)
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeCounter(counter.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Counter Preview */}
                <div className="mb-3 p-3 bg-gray-50 rounded-lg text-center">
                  <div 
                    className="inline-flex items-center justify-center rounded-full text-white font-bold"
                    style={{
                      width: `${counter.size}px`,
                      height: `${counter.size}px`,
                      backgroundColor: counter.color,
                      fontSize: `${Math.max(12, counter.size / 3)}px`
                    }}
                  >
                    {counter.value}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Position</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={Math.round(counter.position.x)}
                        onChange={(e) => updateCounter(counter.id, { 
                          position: { ...counter.position, x: Number(e.target.value) }
                        })}
                        className="w-16 text-xs"
                        min="0"
                        max="100"
                      />
                      <Input
                        type="number"
                        value={Math.round(counter.position.y)}
                        onChange={(e) => updateCounter(counter.id, { 
                          position: { ...counter.position, y: Number(e.target.value) }
                        })}
                        className="w-16 text-xs"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input
                      type="number"
                      value={counter.size}
                      onChange={(e) => updateCounter(counter.id, { size: Number(e.target.value) })}
                      className="w-16 text-xs"
                      min="20"
                      max="100"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={counter.color}
                      onChange={(e) => updateCounter(counter.id, { color: e.target.value })}
                      className="w-8 h-8"
                    />
                    <Label className="text-xs">Color</Label>
                  </div>

                  <div>
                    <Label className="text-xs">Current Value</Label>
                    <Input
                      type="number"
                      value={counter.value}
                      onChange={(e) => updateCounter(counter.id, { value: Number(e.target.value) })}
                      className="text-sm"
                      min={counter.minValue}
                      max={counter.maxValue}
                    />
                  </div>

                  {counter.type === "custom" && (
                    <div>
                      <Label className="text-xs">Custom Label</Label>
                      <Input
                        value={counter.label || ""}
                        onChange={(e) => updateCounter(counter.id, { label: e.target.value })}
                        placeholder="Enter custom label"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {counters.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No counters added yet</p>
          <p className="text-sm">Add counters to track game state</p>
        </div>
      )}
    </div>
  )
} 