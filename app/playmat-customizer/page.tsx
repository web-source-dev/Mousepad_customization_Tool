"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Upload,
  X,
  Save,
  Download,
  Share2,
  Eye,
  Palette,
  ImageIcon,
  ShoppingCart,
  HelpCircle,
  Lightbulb,
  Star,
  Heart,
  RotateCcw,
  Grid,
  Layers,
  Type,
  Zap,
  Target,
  Crown,
  Sword,
  Shield,
  Flame,
  Droplets,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { ImageEditor } from "@/components/image-editor"
import { TemplateGallery } from "@/components/template-gallery"
import { PriceCalculator } from "@/components/price-calculator"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/components/ui/cart-context"
import { SideCart } from "@/components/ui/side-cart"

// Game-specific constants
const GAME_TYPES = {
  magic: { name: "Magic: The Gathering", icon: "🃏", zones: ["hand", "graveyard", "exile", "library", "battlefield"] },
  yugioh: { name: "Yu-Gi-Oh!", icon: "🐉", zones: ["hand", "graveyard", "banished", "deck", "field", "extra"] },
  pokemon: { name: "Pokémon TCG", icon: "⚡", zones: ["hand", "discard", "deck", "bench", "active"] },
  hearthstone: { name: "Hearthstone", icon: "🔥", zones: ["hand", "deck", "board"] },
  custom: { name: "Custom Layout", icon: "🎨", zones: [] }
}

const PLAYMAT_SIZES = {
  standard: { label: "Standard (24×14 inches)", width: 610, height: 356, description: "Perfect for most card games" },
  large: { label: "Large (36×24 inches)", width: 914, height: 610, description: "Extra space for complex games" },
  xl: { label: "XL (48×36 inches)", width: 1219, height: 914, description: "Maximum gaming space" },
  custom: { label: "Custom Size", width: 610, height: 356, description: "Specify your own dimensions" }
}

const MATERIALS = [
  { value: "neoprene", label: "Neoprene", description: "Standard gaming mat material" },
  { value: "silicone", label: "Silicone", description: "Premium non-slip surface" },
  { value: "fabric", label: "Fabric", description: "Soft, comfortable feel" }
]

const EDGE_TYPES = [
  { value: "stitched", label: "Stitched Edge", description: "Professional finish" },
  { value: "rolled", label: "Rolled Edge", description: "Smooth, modern look" },
  { value: "raw", label: "Raw Edge", description: "Minimalist design" }
]

const TAB_ORDER = [
  { value: "game", label: "Game Setup" },
  { value: "design", label: "Design" },
  { value: "zones", label: "Card Zones" },
  { value: "text", label: "Text & Counters" },
  { value: "effects", label: "Effects" },
  { value: "order", label: "Order" },
]

export default function PlaymatCustomizer() {
  // Game settings
  const [gameType, setGameType] = useState("magic")
  const [playmatSize, setPlaymatSize] = useState("standard")
  const [material, setMaterial] = useState("neoprene")
  const [edgeType, setEdgeType] = useState("stitched")
  const [quantity, setQuantity] = useState(1)

  // Design state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Card zones state
  const [cardZones, setCardZones] = useState<any[]>([])
  const [selectedZone, setSelectedZone] = useState<number | null>(null)
  const [showZoneGrid, setShowZoneGrid] = useState(true)

  // Text and counters state
  const [textElements, setTextElements] = useState<any[]>([])
  const [selectedTextElement, setSelectedTextElement] = useState<number | null>(null)
  const [textInput, setTextInput] = useState("")
  const [selectedFont, setSelectedFont] = useState("Arial")
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState("#000000")
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 })

  // Life counters and effects
  const [lifeCounters, setLifeCounters] = useState<any[]>([])
  const [selectedCounter, setSelectedCounter] = useState<number | null>(null)
  const [counterValue, setCounterValue] = useState(20)
  const [counterType, setCounterType] = useState("life")

  // Effects and animations
  const [effects, setEffects] = useState<any[]>([])
  const [selectedEffect, setSelectedEffect] = useState<number | null>(null)
  const [effectType, setEffectType] = useState("glow")

  // UI state
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0].value)
  const [previewMode, setPreviewMode] = useState("normal")
  const [showHelp, setShowHelp] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<any[]>([])
  const [hasMounted, setHasMounted] = useState(false)

  // Progress tracking
  const [designProgress, setDesignProgress] = useState(25)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addItem, items } = useCart()
  const [sideCartOpen, setSideCartOpen] = useState(false)
  const { toast } = useToast()

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Initialize default card zones based on game type
  useEffect(() => {
    const game = GAME_TYPES[gameType as keyof typeof GAME_TYPES]
    const defaultZones = game.zones.map((zone, index) => ({
      id: index,
      name: zone,
      position: { x: 10 + (index * 15), y: 10 + (index * 10) },
      size: { width: 80, height: 120 },
      visible: true,
      color: "#ffffff",
      opacity: 0.8,
      border: true,
      borderColor: "#000000",
      borderWidth: 2
    }))
    setCardZones(defaultZones)
  }, [gameType])

  // Load saved designs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('playmatDesigns')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSavedDesigns(parsed)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1]
          setEditedImage(last.image || null)
          setUploadedImage(last.image || null)
          setGameType(last.settings?.gameType || "magic")
          setPlaymatSize(last.settings?.playmatSize || "standard")
          setMaterial(last.settings?.material || "neoprene")
          setEdgeType(last.settings?.edgeType || "stitched")
          setDesignProgress(100)
        }
      } catch {}
    }
    setHasMounted(true)
  }, [])

  const handleImageUpload = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const validImages = fileArr.filter((file) => file.type.startsWith("image/"))
    if (validImages.length === 0) return

    const file = validImages[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setUploadedImage(result)
      setEditedImage(result)
      setDesignProgress((prev) => Math.min(prev + 25, 100))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files.length > 0) {
        handleImageUpload(files)
      }
    },
    [handleImageUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const addCardZone = () => {
    const newZone = {
      id: Date.now(),
      name: `Zone ${cardZones.length + 1}`,
      position: { x: 50, y: 50 },
      size: { width: 80, height: 120 },
      visible: true,
      color: "#ffffff",
      opacity: 0.8,
      border: true,
      borderColor: "#000000",
      borderWidth: 2
    }
    setCardZones([...cardZones, newZone])
  }

  const updateCardZone = (id: number, updates: any) => {
    setCardZones(cardZones.map(zone => 
      zone.id === id ? { ...zone, ...updates } : zone
    ))
  }

  const removeCardZone = (id: number) => {
    setCardZones(cardZones.filter(zone => zone.id !== id))
  }

  const addTextElement = () => {
    const newText = {
      id: Date.now(),
      text: textInput || "Sample Text",
      position: { x: textPosition.x, y: textPosition.y },
      font: selectedFont,
      size: fontSize,
      color: textColor,
      rotation: 0,
      opacity: 100
    }
    setTextElements([...textElements, newText])
    setTextInput("")
  }

  const addLifeCounter = () => {
    const newCounter = {
      id: Date.now(),
      type: counterType,
      value: counterValue,
      position: { x: 50, y: 50 },
      size: 40,
      color: "#ff0000",
      visible: true
    }
    setLifeCounters([...lifeCounters, newCounter])
  }

  const addEffect = () => {
    const newEffect = {
      id: Date.now(),
      type: effectType,
      position: { x: 50, y: 50 },
      intensity: 50,
      color: "#ffffff",
      visible: true
    }
    setEffects([...effects, newEffect])
  }

  const saveDesign = () => {
    const design = {
      id: Date.now(),
      name: `Playmat Design ${savedDesigns.length + 1}`,
      image: editedImage,
      settings: {
        gameType,
        playmatSize,
        material,
        edgeType,
        cardZones,
        textElements,
        lifeCounters,
        effects
      },
      createdAt: new Date().toISOString()
    }
    const updatedDesigns = [...savedDesigns, design]
    setSavedDesigns(updatedDesigns)
    localStorage.setItem('playmatDesigns', JSON.stringify(updatedDesigns))
    toast && toast({
      title: "Design Saved",
      description: "Your playmat design has been saved successfully.",
      duration: 2000,
    })
  }

  const addToCart = () => {
    const playmatItem = {
      id: `playmat_${Date.now()}`,
      name: `${GAME_TYPES[gameType as keyof typeof GAME_TYPES].name} Playmat`,
      image: editedImage || "/placeholder.svg",
      specs: {
        gameType,
        size: playmatSize,
        material,
        edgeType,
        cardZones: cardZones.length,
        textElements: textElements.length,
        lifeCounters: lifeCounters.length,
        effects: effects.length
      },
      quantity: 1,
      price: getPlaymatPrice()
    }
    addItem(playmatItem)
    setSideCartOpen(true)
    toast && toast({
      title: "Added to Cart",
      description: "Playmat has been added to your cart.",
      duration: 2000,
    })
  }

  function getPlaymatPrice() {
    let basePrice = 29.99
    if (playmatSize === "large") basePrice += 10
    if (playmatSize === "xl") basePrice += 20
    if (material === "silicone") basePrice += 5
    if (edgeType === "stitched") basePrice += 3
    return basePrice
  }

  if (!hasMounted) return null

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                  <a href="/" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Mousepad Customizer
                  </a>
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">Playmat Customizer</h1>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {GAME_TYPES[gameType as keyof typeof GAME_TYPES].icon} {GAME_TYPES[gameType as keyof typeof GAME_TYPES].name}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSideCartOpen(true)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({itemCount})
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Design Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Design Progress</span>
                    <span className="text-sm text-gray-500">{designProgress}%</span>
                  </div>
                  <Progress value={designProgress} className="h-2" />
                </CardContent>
              </Card>

              {/* Design Canvas */}
              <Card className="min-h-[600px]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Design Canvas</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPreviewMode("normal")}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={saveDesign}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div
                    className={`relative w-full h-96 border-2 border-dashed rounded-lg flex items-center justify-center ${
                      isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {editedImage ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={editedImage}
                          alt="Playmat design"
                          fill
                          className="object-contain rounded"
                        />
                        {/* Card Zones Overlay */}
                        {showZoneGrid && cardZones.map((zone) => (
                          <div
                            key={zone.id}
                            className={`absolute border-2 cursor-move ${
                              selectedZone === zone.id ? "border-blue-500" : "border-gray-400"
                            }`}
                            style={{
                              left: `${zone.position.x}%`,
                              top: `${zone.position.y}%`,
                              width: `${zone.size.width}px`,
                              height: `${zone.size.height}px`,
                              backgroundColor: zone.color,
                              opacity: zone.opacity,
                              borderColor: zone.borderColor,
                              borderWidth: zone.borderWidth
                            }}
                            onClick={() => setSelectedZone(zone.id)}
                          >
                            <div className="text-xs text-center mt-1">{zone.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Drag and drop your image here</p>
                        <p className="text-sm text-gray-500">or</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          Choose File
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Control Panel */}
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  {TAB_ORDER.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Game Setup Tab */}
                <TabsContent value="game" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Game Type</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup value={gameType} onValueChange={setGameType}>
                        {Object.entries(GAME_TYPES).map(([key, game]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <RadioGroupItem value={key} id={key} />
                            <Label htmlFor={key} className="flex items-center gap-2">
                              <span>{game.icon}</span>
                              {game.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Playmat Size</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select value={playmatSize} onValueChange={setPlaymatSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PLAYMAT_SIZES).map(([key, size]) => (
                            <SelectItem key={key} value={key}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Material & Finish</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Material</Label>
                        <Select value={material} onValueChange={setMaterial}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MATERIALS.map((mat) => (
                              <SelectItem key={mat.value} value={mat.value}>
                                {mat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Edge Type</Label>
                        <Select value={edgeType} onValueChange={setEdgeType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {EDGE_TYPES.map((edge) => (
                              <SelectItem key={edge.value} value={edge.value}>
                                {edge.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Background Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TemplateGallery
                        onSelectTemplate={(template) => {
                          setBackgroundImage(template.image)
                          setEditedImage(template.image)
                        }}
                        horizontal={false}
                        cardSize="small"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Card Zones Tab */}
                <TabsContent value="zones" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Card Zones</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Show Zone Grid</Label>
                        <Switch
                          checked={showZoneGrid}
                          onCheckedChange={setShowZoneGrid}
                        />
                      </div>
                      <Button onClick={addCardZone} className="w-full">
                        <Grid className="h-4 w-4 mr-2" />
                        Add Card Zone
                      </Button>
                      
                      {cardZones.map((zone) => (
                        <div key={zone.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{zone.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCardZone(zone.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Input
                              value={zone.name}
                              onChange={(e) => updateCardZone(zone.id, { name: e.target.value })}
                              placeholder="Zone name"
                            />
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={zone.color}
                                onChange={(e) => updateCardZone(zone.id, { color: e.target.value })}
                                className="w-12"
                              />
                              <Slider
                                value={[zone.opacity * 100]}
                                onValueChange={([value]) => updateCardZone(zone.id, { opacity: value / 100 })}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Text & Counters Tab */}
                <TabsContent value="text" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Text Elements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Textarea
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Enter text..."
                        />
                        <div className="flex gap-2">
                          <Select value={selectedFont} onValueChange={setSelectedFont}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Times New Roman">Times</SelectItem>
                              <SelectItem value="Courier New">Courier</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={fontSize}
                            onChange={(e) => setFontSize(Number(e.target.value))}
                            className="w-20"
                            min="8"
                            max="72"
                          />
                          <Input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-12"
                          />
                        </div>
                        <Button onClick={addTextElement} className="w-full">
                          <Type className="h-4 w-4 mr-2" />
                          Add Text
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Life Counters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Select value={counterType} onValueChange={setCounterType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="life">Life Points</SelectItem>
                            <SelectItem value="mana">Mana</SelectItem>
                            <SelectItem value="energy">Energy</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={counterValue}
                          onChange={(e) => setCounterValue(Number(e.target.value))}
                          placeholder="Starting value"
                        />
                        <Button onClick={addLifeCounter} className="w-full">
                          <Target className="h-4 w-4 mr-2" />
                          Add Counter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Effects Tab */}
                <TabsContent value="effects" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Visual Effects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setEffectType("glow")}
                          className={effectType === "glow" ? "border-blue-500" : ""}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Glow
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEffectType("shadow")}
                          className={effectType === "shadow" ? "border-blue-500" : ""}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Shadow
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEffectType("fire")}
                          className={effectType === "fire" ? "border-blue-500" : ""}
                        >
                          <Flame className="h-4 w-4 mr-2" />
                          Fire
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEffectType("water")}
                          className={effectType === "water" ? "border-blue-500" : ""}
                        >
                          <Droplets className="h-4 w-4 mr-2" />
                          Water
                        </Button>
                      </div>
                      <Button onClick={addEffect} className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        Add Effect
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Order Tab */}
                <TabsContent value="order" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Base Price ({playmatSize})</span>
                          <span>${getPlaymatPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Material ({material})</span>
                          <span>+${material === "silicone" ? "5.00" : "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Edge Type ({edgeType})</span>
                          <span>+${edgeType === "stitched" ? "3.00" : "0.00"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Quantity</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>${(getPlaymatPrice() * quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={addToCart} className="w-full" size="lg">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart - ${(getPlaymatPrice() * quantity).toFixed(2)}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Side Cart */}
        <SideCart open={sideCartOpen} onClose={() => setSideCartOpen(false)} />
      </div>
    </TooltipProvider>
  )
} 