"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Type, Trash2, Copy, Eye, EyeOff, RotateCw, Bold, Italic, Underline } from "lucide-react"

interface TextElement {
  id: number
  text: string
  position: { x: number; y: number }
  font: string
  size: number
  color: string
  rotation: number
  opacity: number
  visible: boolean
  bold: boolean
  italic: boolean
  underline: boolean
  shadow: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffset: { x: number; y: number }
}

interface TextEffectsEditorProps {
  textElements: TextElement[]
  onTextElementsChange: (elements: TextElement[]) => void
  selectedTextElement: number | null
  onTextElementSelect: (id: number | null) => void
}

const FONTS = [
  { value: "Arial", label: "Arial" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Impact", label: "Impact" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Arial Black", label: "Arial Black" },
  { value: "Lucida Console", label: "Lucida Console" }
]

const PRESET_TEXTS = [
  "Player Name",
  "Life: 20",
  "Mana: 5",
  "Turn: 1",
  "Score: 0",
  "Custom Text"
]

export function TextEffectsEditor({
  textElements,
  onTextElementsChange,
  selectedTextElement,
  onTextElementSelect
}: TextEffectsEditorProps) {
  const [newText, setNewText] = useState("")
  const [newFont, setNewFont] = useState("Arial")
  const [newSize, setNewSize] = useState(24)
  const [newColor, setNewColor] = useState("#000000")

  const updateTextElement = (id: number, updates: Partial<TextElement>) => {
    onTextElementsChange(textElements.map(element => 
      element.id === id ? { ...element, ...updates } : element
    ))
  }

  const removeTextElement = (id: number) => {
    onTextElementsChange(textElements.filter(element => element.id !== id))
    if (selectedTextElement === id) {
      onTextElementSelect(null)
    }
  }

  const duplicateTextElement = (element: TextElement) => {
    const newElement = {
      ...element,
      id: Date.now(),
      position: { x: element.position.x + 10, y: element.position.y + 10 }
    }
    onTextElementsChange([...textElements, newElement])
  }

  const addTextElement = () => {
    const newElement: TextElement = {
      id: Date.now(),
      text: newText || "Sample Text",
      position: { x: 50, y: 50 },
      font: newFont,
      size: newSize,
      color: newColor,
      rotation: 0,
      opacity: 100,
      visible: true,
      bold: false,
      italic: false,
      underline: false,
      shadow: false,
      shadowColor: "#000000",
      shadowBlur: 2,
      shadowOffset: { x: 1, y: 1 }
    }
    onTextElementsChange([...textElements, newElement])
    setNewText("")
  }

  const getTextStyle = (element: TextElement) => {
    return {
      fontFamily: element.font,
      fontSize: `${element.size}px`,
      color: element.color,
      fontWeight: element.bold ? "bold" : "normal",
      fontStyle: element.italic ? "italic" : "normal",
      textDecoration: element.underline ? "underline" : "none",
      opacity: element.opacity / 100,
      transform: `rotate(${element.rotation}deg)`,
      textShadow: element.shadow 
        ? `${element.shadowOffset.x}px ${element.shadowOffset.y}px ${element.shadowBlur}px ${element.shadowColor}`
        : "none"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Text Elements ({textElements.length})</h3>
      </div>

      {/* Add New Text */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add New Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Text Content</Label>
            <div className="flex gap-2">
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text..."
                className="flex-1 text-sm"
                rows={2}
              />
              <Select value={newText} onValueChange={setNewText}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_TEXTS.map((text) => (
                    <SelectItem key={text} value={text}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Font</Label>
              <Select value={newFont} onValueChange={setNewFont}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Size</Label>
              <Input
                type="number"
                value={newSize}
                onChange={(e) => setNewSize(Number(e.target.value))}
                className="text-sm"
                min="8"
                max="72"
              />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full h-10"
              />
            </div>
          </div>

          <Button onClick={addTextElement} className="w-full" size="sm">
            <Type className="h-4 w-4 mr-2" />
            Add Text
          </Button>
        </CardContent>
      </Card>

      {/* Existing Text Elements */}
      <div className="space-y-3">
        {textElements.map((element) => (
          <Card
            key={element.id}
            className={`cursor-pointer transition-all ${
              selectedTextElement === element.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => onTextElementSelect(element.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span className="font-medium">Text Element</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateTextElement(element.id, { visible: !element.visible })
                    }}
                  >
                    {element.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      duplicateTextElement(element)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTextElement(element.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Text Preview */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg text-center">
                <div style={getTextStyle(element)}>
                  {element.text}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Text Content</Label>
                  <Textarea
                    value={element.text}
                    onChange={(e) => updateTextElement(element.id, { text: e.target.value })}
                    className="text-sm"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Position</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={Math.round(element.position.x)}
                        onChange={(e) => updateTextElement(element.id, { 
                          position: { ...element.position, x: Number(e.target.value) }
                        })}
                        className="w-16 text-xs"
                        min="0"
                        max="100"
                      />
                      <Input
                        type="number"
                        value={Math.round(element.position.y)}
                        onChange={(e) => updateTextElement(element.id, { 
                          position: { ...element.position, y: Number(e.target.value) }
                        })}
                        className="w-16 text-xs"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Rotation</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={element.rotation}
                        onChange={(e) => updateTextElement(element.id, { rotation: Number(e.target.value) })}
                        className="w-16 text-xs"
                        min="-180"
                        max="180"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateTextElement(element.id, { rotation: 0 })}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Font</Label>
                    <Select value={element.font} onValueChange={(value) => updateTextElement(element.id, { font: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONTS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input
                      type="number"
                      value={element.size}
                      onChange={(e) => updateTextElement(element.id, { size: Number(e.target.value) })}
                      className="text-sm"
                      min="8"
                      max="72"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Color</Label>
                    <Input
                      type="color"
                      value={element.color}
                      onChange={(e) => updateTextElement(element.id, { color: e.target.value })}
                      className="w-full h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Opacity</Label>
                  <Slider
                    value={[element.opacity]}
                    onValueChange={([value]) => updateTextElement(element.id, { opacity: value })}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Text Style</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={element.bold ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextElement(element.id, { bold: !element.bold })}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={element.italic ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextElement(element.id, { italic: !element.italic })}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={element.underline ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateTextElement(element.id, { underline: !element.underline })}
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Text Shadow</Label>
                    <Switch
                      checked={element.shadow}
                      onCheckedChange={(checked) => updateTextElement(element.id, { shadow: checked })}
                    />
                  </div>
                  {element.shadow && (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Shadow Color</Label>
                        <Input
                          type="color"
                          value={element.shadowColor}
                          onChange={(e) => updateTextElement(element.id, { shadowColor: e.target.value })}
                          className="w-full h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Blur</Label>
                        <Input
                          type="number"
                          value={element.shadowBlur}
                          onChange={(e) => updateTextElement(element.id, { shadowBlur: Number(e.target.value) })}
                          className="text-sm"
                          min="0"
                          max="20"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Offset</Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={element.shadowOffset.x}
                            onChange={(e) => updateTextElement(element.id, { 
                              shadowOffset: { ...element.shadowOffset, x: Number(e.target.value) }
                            })}
                            className="w-12 text-xs"
                            min="-10"
                            max="10"
                          />
                          <Input
                            type="number"
                            value={element.shadowOffset.y}
                            onChange={(e) => updateTextElement(element.id, { 
                              shadowOffset: { ...element.shadowOffset, y: Number(e.target.value) }
                            })}
                            className="w-12 text-xs"
                            min="-10"
                            max="10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {textElements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No text elements added yet</p>
                          <p className="text-sm">Add text to customize your mousepad</p>
        </div>
      )}
    </div>
  )
} 