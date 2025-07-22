"use client"

import React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
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
  Target,
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

import { ImageEditor } from "./components/image-editor"
import { TemplateGallery } from "./components/template-gallery"
import { PriceCalculator } from "./components/price-calculator"
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/components/ui/cart-context";
import { SideCart } from "@/components/ui/side-cart";

const MOUSEPAD_SIZES = {
  small: { label: "Small (250×210mm)", width: 250, height: 210, description: "Perfect for compact setups" },
  medium: { label: "Medium (350×300mm)", width: 350, height: 300, description: "Most popular choice" },
  large: { label: "Large (450×400mm)", width: 450, height: 400, description: "Maximum gaming space" },
  xl: { label: "XL (900×400mm)", width: 900, height: 400, description: "Extended desk mat" },
}

const THICKNESS_OPTIONS = [
  { value: "2mm", label: "2mm", description: "Ultra-thin, portable" },
  { value: "3mm", label: "3mm", description: "Standard comfort" },
  { value: "4mm", label: "4mm", description: "Premium cushioning" },
  { value: "5mm", label: "5mm", description: "Maximum comfort" },
]

const SURFACE_TEXTURES = [
  { value: "smooth", label: "Smooth", description: "Fast gliding, precision gaming" },
  { value: "textured", label: "Textured", description: "Balanced control and speed" },
  { value: "premium", label: "Premium Cloth", description: "Professional esports grade" },
]

const RGB_MODES = [
  { value: "static", label: "Static Color" },
  { value: "breathing", label: "Breathing Effect" },
  { value: "rainbow", label: "Rainbow Cycle" },
  { value: "reactive", label: "Reactive Lighting" },
]

// Tab order and labels (move to top-level)
const TAB_ORDER = [
  { value: "design", label: "Design" },
  { value: "text", label: "Text" },
  { value: "rgb", label: "RGB" },
  { value: "order", label: "Order" },
];

// Helper for RGB mode descriptions
const RGB_MODE_DESCRIPTIONS: Record<string, string> = {
  static: 'A single, solid color of your choice.',
  breathing: 'A gentle fade in and out of your selected color.',
  rainbow: 'A continuous, animated rainbow color cycle.',
  reactive: 'Lights up in response to your actions.',
};

export default function AdvancedMousepadCustomizer() {
  // Core settings
  const [mousepadType, setMousepadType] = useState("normal")
  const [mousepadSize, setMousepadSize] = useState("medium")
  const [thickness, setThickness] = useState("3mm")
  const [surfaceTexture, setSurfaceTexture] = useState("smooth")
  const [edgeStitching, setEdgeStitching] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // RGB settings
  const [rgbMode, setRgbMode] = useState("static")
  const [rgbColor, setRgbColor] = useState("#ff0000")
  const [rgbBrightness, setRgbBrightness] = useState(80)
  const [rgbAnimationSpeed, setRgbAnimationSpeed] = useState(50); // New state for animation speed

  // Image and design
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  // Text and typography state
  const [textElements, setTextElements] = useState<any[]>([])
  const [selectedTextElement, setSelectedTextElement] = useState<number | null>(null)
  const [textInput, setTextInput] = useState("")
  const [selectedFont, setSelectedFont] = useState("Arial")
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState("#000000")
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 })
  const [textRotation, setTextRotation] = useState(0)
  const [textOpacity, setTextOpacity] = useState(100)
  const [textShadow, setTextShadow] = useState({ enabled: false, x: 2, y: 2, blur: 4, color: "#000000" })
  const [textOutline, setTextOutline] = useState({ enabled: false, width: 1, color: "#ffffff" })
  const [textGradient, setTextGradient] = useState({
    enabled: false,
    from: "#ff0000",
    to: "#0000ff",
    direction: "horizontal",
  })
  const [isCurvedText, setIsCurvedText] = useState(false)
  const [curveRadius, setCurveRadius] = useState(100)
  const [logoFile, setLogoFile] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0].value)
  const [previewMode, setPreviewMode] = useState("normal")
  const [showHelp, setShowHelp] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<any[]>([])
  const [hasMounted, setHasMounted] = useState(false);

  // Progress tracking
  const [designProgress, setDesignProgress] = useState(25)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addItem, items } = useCart();
  const [sideCartOpen, setSideCartOpen] = useState(false);
  const { toast } = useToast();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Load saved designs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mousepadDesigns');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedDesigns(parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          // Restore editor state from last saved design
          setEditedImage(last.image || null);
          setUploadedImage(last.image || null);
          setMousepadType(last.settings?.mousepadType || "normal");
          setMousepadSize(last.settings?.mousepadSize || "medium");
          setThickness(last.settings?.thickness || "3mm");
          setSurfaceTexture(last.settings?.surfaceTexture || "smooth");
          setEdgeStitching(last.settings?.edgeStitching || false);
          setRgbMode(last.settings?.rgbMode || "static");
          setRgbColor(last.settings?.rgbColor || "#ff0000");
          setDesignProgress(100);
        }
      } catch {}
    }
    setHasMounted(true);
  }, []);

  const handleImageUpload = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const validImages = fileArr.filter((file) => file.type.startsWith("image/"))
    if (validImages.length === 0) return
    let loadedImages: string[] = []
    let loadedCount = 0
    validImages.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        loadedImages[idx] = result
        loadedCount++
        if (loadedCount === validImages.length) {
          setUploadedImages((prev) => {
            const all = [...prev, ...loadedImages]
            setUploadedImage(all[0])
            setEditedImage(all[0])
            return all
          })
        setDesignProgress((prev) => Math.min(prev + 25, 100))
      }
    }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleImageUpload(files)
      }
    },
    [handleImageUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleImageUpload(files)
      }
    },
    [handleImageUpload],
  )

  const handleShuffleImage = () => {
    if (uploadedImages.length > 1) {
      const idx = Math.floor(Math.random() * uploadedImages.length)
      setUploadedImage(uploadedImages[idx])
      setEditedImage(uploadedImages[idx])
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setEditedImage(null)
    setUploadedImages([])
    setDesignProgress((prev) => Math.max(prev - 25, 0))
    // Clear saved designs from localStorage
    localStorage.removeItem('mousepadDesigns');
    setSavedDesigns([]);
  }

  const saveDesign = () => {
    const design = {
      id: Date.now(),
      name: `Design ${savedDesigns.length + 1}`,
      image: editedImage || uploadedImage,
      settings: {
        mousepadType,
        mousepadSize,
        thickness,
        surfaceTexture,
        edgeStitching,
        rgbMode,
        rgbColor,
      },
      createdAt: new Date().toISOString(),
    }
    setSavedDesigns((prev) => {
      const updated = [...prev, design];
      localStorage.setItem('mousepadDesigns', JSON.stringify(updated));
      return updated;
    });
    if (toast) {
      toast({
        title: "Design Saved!",
        description: "Your mousepad design has been saved successfully.",
        duration: 2500,
      });
    } else {
      alert("Design saved!");
    }
  }

  const addTextElement = () => {
    if (!textInput.trim()) return

    const newElement = {
      id: Date.now(),
      text: textInput,
      font: selectedFont,
      size: fontSize,
      color: textColor,
      position: { ...textPosition },
      rotation: textRotation,
      opacity: textOpacity,
      shadow: { ...textShadow },
      outline: { ...textOutline },
      gradient: { ...textGradient },
      curved: isCurvedText,
      curveRadius: curveRadius,
      type: "text",
    }

    setTextElements((prev) => [...prev, newElement])
    setTextInput("")
    setDesignProgress((prev) => Math.min(prev + 10, 100))
  }

  // Update selected text element when controls change
  const updateSelectedElement = () => {
    if (selectedTextElement !== null) {
      updateTextElement(selectedTextElement, {
        font: selectedFont,
        size: fontSize,
        color: textColor,
        position: textPosition,
        rotation: textRotation,
        opacity: textOpacity,
        shadow: textShadow,
        outline: textOutline,
        gradient: textGradient,
        curved: isCurvedText,
        curveRadius: curveRadius,
      })
    }
  }

  // Call updateSelectedElement whenever controls change
  React.useEffect(() => {
    updateSelectedElement()
  }, [
    selectedFont,
    fontSize,
    textColor,
    textPosition,
    textRotation,
    textOpacity,
    textShadow,
    textOutline,
    textGradient,
    isCurvedText,
    curveRadius,
    selectedTextElement,
  ])

  // Load selected element properties into controls
  const loadElementToControls = (element: any) => {
    if (element.type === "text") {
      setSelectedFont(element.font || "Arial")
      setFontSize(element.size || 24)
      setTextColor(element.color || "#000000")
      setTextPosition(element.position || { x: 50, y: 50 })
      setTextRotation(element.rotation || 0)
      setTextOpacity(element.opacity || 100)
      setTextShadow(element.shadow || { enabled: false, x: 2, y: 2, blur: 4, color: "#000000" })
      setTextOutline(element.outline || { enabled: false, width: 1, color: "#ffffff" })
      setTextGradient(element.gradient || { enabled: false, from: "#ff0000", to: "#0000ff", direction: "horizontal" })
      setIsCurvedText(element.curved || false)
      setCurveRadius(element.curveRadius || 100)
    }
  }

  const updateTextElement = (id: number, updates: any) => {
    setTextElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const deleteTextElement = (id: number) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedTextElement(null)
  }

  const handleLogoUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoFile(result)

        const logoElement = {
          id: Date.now(),
          src: result,
          position: { x: 25, y: 25 },
          size: { width: 100, height: 100 },
          rotation: 0,
          opacity: 100,
          type: "logo",
        }

        setTextElements((prev) => [...prev, logoElement])
        setDesignProgress((prev) => Math.min(prev + 15, 100))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (img: string) => {
    setUploadedImages((prev) => {
      const filtered = prev.filter((i) => i !== img)
      // If the removed image is the current, set next or clear
      if (img === uploadedImage) {
        if (filtered.length > 0) {
          setUploadedImage(filtered[0])
          setEditedImage(filtered[0])
        } else {
          setUploadedImage(null)
          setEditedImage(null)
        }
      }
      return filtered
    })
  }

  const currentSize = MOUSEPAD_SIZES[mousepadSize as keyof typeof MOUSEPAD_SIZES]

  // Price calculation logic (copied from PriceCalculator)
  function getMousepadPrice() {
    const PRICING = {
      base: {
        small: 19.99,
        medium: 24.99,
        large: 29.99,
      },
      type: {
        normal: 0,
        rgb: 15.0,
      },
      thickness: {
        "2mm": 0,
        "3mm": 2.0,
        "4mm": 4.0,
      },
      surface: {
        smooth: 0,
        textured: 3.0,
        premium: 8.0,
      },
      edgeStitching: 5.0,
    };
    const basePrice = PRICING.base[mousepadSize as keyof typeof PRICING.base] || 24.99;
    const typePrice = PRICING.type[mousepadType as keyof typeof PRICING.type] || 0;
    const thicknessPrice = PRICING.thickness[thickness as keyof typeof PRICING.thickness] || 0;
    const surfacePrice = PRICING.surface[surfaceTexture as keyof typeof PRICING.surface] || 0;
    const stitchingPrice = edgeStitching ? PRICING.edgeStitching : 0;
    let subtotal = (basePrice + typePrice + thicknessPrice + surfacePrice + stitchingPrice) * quantity;
    if (quantity > 1) subtotal = subtotal * 0.9; // 10% bulk discount
    return subtotal;
  }

  if (!hasMounted) return null;
  return (
    <TooltipProvider delayDuration={2000}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mousepad Studio Pro</h1>
                  <p className="text-sm text-gray-600">Professional mousepad customization tool</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" asChild>
                    <a href="/playmat-customizer" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Playmat Customizer
                    </a>
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle Help Mode Button */}
                {showHelp ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Help mode is ON. Click to turn off.</TooltipContent>
                  </Tooltip>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                      <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
                {/* Save and Reset Buttons */}
                {showHelp ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={saveDesign} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                        <Save className="h-4 w-4" />
                        Save
                    </Button>
                  </TooltipTrigger>
                    <TooltipContent>Save your current design to local storage</TooltipContent>
                </Tooltip>
                ) : (
                  <Button onClick={saveDesign} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                )}
                {showHelp ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={removeImage} disabled={!uploadedImage} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset and clear your current design</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button variant="outline" onClick={removeImage} disabled={!uploadedImage} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                )}
                {/* Cart Button */}
                <button
                  className="relative p-2 rounded hover:bg-gray-100 transition"
                  onClick={() => setSideCartOpen(true)}
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-4 lg:p-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Panel - Preview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="sticky top-4 z-10 flex flex-col space-y-4">
                <Card className="overflow-hidden flex-grow min-h-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Live Preview
                      </CardTitle>
                      <div className="flex items-center">
                        {showHelp ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                          <Button
                            variant={previewMode === "normal" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("normal")}
                          >
                            Normal
                          </Button>
                            </TooltipTrigger>
                            <TooltipContent>Switch to normal preview mode</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant={previewMode === "normal" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("normal")}
                          >
                            Normal
                          </Button>
                        )}
                        {showHelp ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                          <Button
                            variant={previewMode === "dark" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("dark")}
                          >
                            Dark
                          </Button>
                            </TooltipTrigger>
                            <TooltipContent>Switch to dark preview mode</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant={previewMode === "dark" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("dark")}
                          >
                            Dark
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={`p-8 ${previewMode === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        {/* Mousepad Base with RGB Effect */}
                        <div
                          className={`relative rounded-xl shadow-2xl transition-all duration-500 ${
                            mousepadType === "rgb" ? "shadow-lg" : "shadow-gray-300"
                          } ${isDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''}`}
                          style={{
                            width: Math.min(500, currentSize.width * 0.8),
                            height: Math.min(400, currentSize.height * 0.8),
                            aspectRatio: `${currentSize.width}/${currentSize.height}`,
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) {
                              handleImageUpload(files);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                          }}
                        >
                          {/* RGB Glow Effect */}
                          {mousepadType === "rgb" && (
                            <div
                              className="absolute -inset-2 rounded-xl opacity-60 blur-md animate-pulse"
                              style={{
                                background:
                                  rgbMode === "rainbow"
                                    ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                                    : `linear-gradient(45deg, ${rgbColor}, ${rgbColor}80)`,
                                opacity: rgbBrightness / 100,
                              }}
                            />
                          )}

                          {/* Mousepad Surface */}
                          <div
                            className={`relative h-full w-full overflow-hidden rounded-xl ${
                              edgeStitching ? "border-2 border-orange-400" : ""
                            }`}
                          >
                            <div
                              className={`absolute inset-0 ${
                                surfaceTexture === "textured"
                                  ? "bg-gray-100"
                                  : surfaceTexture === "premium"
                                    ? "bg-gray-50"
                                    : "bg-white"
                              }`}
                            />

                            {editedImage || uploadedImage ? (
                              <Image
                                src={editedImage || uploadedImage || "/placeholder.svg"}
                                alt="Custom design"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center text-gray-400">
                                  <ImageIcon className="mx-auto h-16 w-16 mb-4" />
                                  <p className="text-lg font-medium">Your Design Here</p>
                                  <p className="text-sm">Upload an image or choose a template</p>
                                </div>
                              </div>
                            )}

                            {/* Text and Logo Overlays */}
                            {textElements.map((element) => (
                              <div
                                key={element.id}
                                className={`absolute cursor-move transition-all select-none ${
                                  selectedTextElement === element.id ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                }`}
                                style={{
                                  left: `${element.position.x}%`,
                                  top: `${element.position.y}%`,
                                  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                  opacity: element.opacity / 100,
                                  zIndex: selectedTextElement === element.id ? 10 : 1,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTextElement(element.id)
                                }}
                                onMouseDown={(e) => {
                                  if (element.type === "text") {
                                    const startX = e.clientX
                                    const startY = e.clientY
                                    const startPosX = element.position.x
                                    const startPosY = element.position.y
                                    const rect = e.currentTarget.parentElement?.getBoundingClientRect()

                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                      if (!rect) return
                                      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100
                                      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100
                                      const newX = Math.max(0, Math.min(100, startPosX + deltaX))
                                      const newY = Math.max(0, Math.min(100, startPosY + deltaY))

                                      updateTextElement(element.id, { position: { x: newX, y: newY } })
                                      setTextPosition({ x: newX, y: newY })
                                    }

                                    const handleMouseUp = () => {
                                      document.removeEventListener("mousemove", handleMouseMove)
                                      document.removeEventListener("mouseup", handleMouseUp)
                                    }

                                    document.addEventListener("mousemove", handleMouseMove)
                                    document.addEventListener("mouseup", handleMouseUp)
                                    e.preventDefault()
                                  }
                                }}
                              >
                                {element.type === "text" ? (
                                  <div
                                    style={{
                                      fontFamily: element.font,
                                      fontSize: `${element.size * 0.8}px`,
                                      color: element.gradient?.enabled ? "transparent" : element.color,
                                      background: element.gradient?.enabled
                                        ? `linear-gradient(${element.gradient.direction === "horizontal" ? "90deg" : "180deg"}, ${element.gradient.from}, ${element.gradient.to})`
                                        : "transparent",
                                      WebkitBackgroundClip: element.gradient?.enabled ? "text" : "unset",
                                      backgroundClip: element.gradient?.enabled ? "text" : "unset",
                                      textShadow: element.shadow?.enabled
                                        ? `${element.shadow.x}px ${element.shadow.y}px ${element.shadow.blur}px ${element.shadow.color}`
                                        : "none",
                                      WebkitTextStroke: element.outline?.enabled
                                        ? `${element.outline.width}px ${element.outline.color}`
                                        : "none",
                                      fontWeight:
                                        element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal",
                                      userSelect: "none",
                                      pointerEvents: "none",
                                    }}
                                    className={element.curved ? "curved-text" : ""}
                                  >
                                    {element.text}
                                  </div>
                                ) : (
                                  <Image
                                    src={element.src || "/placeholder.svg"}
                                    alt="Logo"
                                    width={element.size?.width * 0.8 || 80}
                                    height={element.size?.height * 0.8 || 80}
                                    className="object-contain pointer-events-none"
                                    draggable={false}
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Thickness/Texture Indicator */}
                          <div className="absolute -bottom-3 -right-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            {thickness} • {surfaceTexture}
                          </div>
                          {/* Size Indicator (moved from header) */}
                          <div className="absolute -bottom-3 -left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            {currentSize.label}
                          </div>
                        </div>

                        {/* 3D Effect Shadow */}
                        <div
                          className="absolute top-2 left-2 -z-10 rounded-xl bg-gray-400 opacity-20"
                          style={{
                            width: Math.min(500, currentSize.width * 0.8),
                            height: Math.min(400, currentSize.height * 0.8),
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Template Gallery - moved under Live Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Template Gallery
                      </CardTitle>
                    </CardHeader>
                <CardContent className="h-full">
                  <div className="overflow-x-auto h-full">
                      <TemplateGallery
                        onSelectTemplate={(template) => {
                          setUploadedImage(template.image)
                          setEditedImage(template.image)
                          setDesignProgress((prev) => Math.min(prev + 25, 100))
                        }}
                      horizontal
                      cardSize="small"
                      />
                  </div>
                    </CardContent>
                  </Card>
              </div>

              
            </div>

            {/* Right Panel - Controls */}
            <div className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex w-full gap-1">
                  {TAB_ORDER.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="flex-1 text-xs">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {TAB_ORDER.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className={tab.value === 'design' ? 'space-y-4' : ''}>
                    {tab.value === 'design' && (
                      <>
                  {/* Mousepad Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Mousepad Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup value={mousepadType} onValueChange={setMousepadType}>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal" className="flex-1 cursor-pointer">
                            <div className="font-medium">Standard Mousepad</div>
                            <div className="text-sm text-gray-500">Classic design without lighting</div>
                          </Label>
                          <Badge variant="secondary">$0</Badge>
                        </div>
                        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                          <RadioGroupItem value="rgb" id="rgb" />
                          <Label htmlFor="rgb" className="flex-1 cursor-pointer">
                            <div className="font-medium flex items-center gap-2">
                              RGB Gaming Mousepad
                              <Star className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div className="text-sm text-gray-500">LED-backlit with customizable effects</div>
                          </Label>
                          <Badge>+$15</Badge>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>

                  {/* Size Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Size & Dimensions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={mousepadSize} onValueChange={setMousepadSize}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(MOUSEPAD_SIZES).map(([key, size]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center justify-between w-full">
                                <span>{size.label}</span>
                                <span className="text-xs text-gray-500 ml-2">{size.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Thickness */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Thickness & Comfort</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={thickness} onValueChange={setThickness}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THICKNESS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{option.label}</span>
                                <span className="text-xs text-gray-500 ml-2">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Surface Texture */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Surface Texture</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={surfaceTexture} onValueChange={setSurfaceTexture}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SURFACE_TEXTURES.map((texture) => (
                            <SelectItem key={texture.value} value={texture.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{texture.label}</span>
                                <span className="text-xs text-gray-500 ml-2">{texture.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Edge Stitching */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Premium Options</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="stitching" className="font-medium">
                            Edge Stitching
                          </Label>
                          <p className="text-sm text-gray-500">Reinforced edges for durability</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>+$5</Badge>
                          <Switch id="stitching" checked={edgeStitching} onCheckedChange={setEdgeStitching} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                        {/* Image Upload */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Upload className="h-5 w-5" />
                              Upload Design
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div
                              className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-all ${
                                isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                              }`}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              {uploadedImages.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                                    {uploadedImages.map((img, idx) => (
                                      <div key={idx} className={`relative h-14 w-14 rounded-lg border-2 ${img === uploadedImage ? 'border-blue-500' : 'border-gray-200'}`}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <Image
                                          src={img || "/placeholder.svg"}
                                          alt={`Uploaded ${idx + 1}`}
                                          fill
                                          className="object-cover rounded"
                                          onClick={() => { setUploadedImage(img); setEditedImage(img); }}
                                        />
                                        {img === uploadedImage && (
                                          <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">Current</span>
                                        )}
                                        <button
                                          type="button"
                                          className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 shadow hover:bg-red-100"
                                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(img); }}
                                          aria-label="Remove image"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleShuffleImage}
                                      disabled={uploadedImages.length < 2}
                                      className="flex items-center gap-2 bg-transparent"
                                    >
                                      Shuffle
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={removeImage}
                                      className="flex items-center gap-2 bg-transparent"
                                    >
                                      <X className="h-4 w-4" />
                                      Remove All
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => fileInputRef.current?.click()}
                                      className="flex items-center gap-2 bg-transparent"
                                    >
                                      Upload More
                                    </Button>
                                  </div>
                                </div>
                              ) :
                                <div className="space-y-3">
                                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                  <div>
                                    <p className="font-medium">Drag & drop your images</p>
                                    <p className="text-sm text-gray-500">or click to browse</p>
                                  </div>
                                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    Choose Files
                                  </Button>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileInput}
                                    className="hidden"
                                  />
                                </div>
                              }
                            </div>
                            <p className="mt-2 text-xs text-gray-500 text-center">
                              Supports JPG, PNG, GIF • Max 10MB each • Recommended: 300 DPI
                            </p>
                          </CardContent>
                        </Card>

                        {/* Image Editor */}
                        {uploadedImage && <ImageEditor imageUrl={uploadedImage} onImageChange={setEditedImage} />}
                      </>
                    )}
                    {tab.value === 'text' && (
                      <>
                  {/* Add Text Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Add Text
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                              {showHelp ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                          <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Enter your text here..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      onKeyDown={(e) => e.key === "Enter" && addTextElement()}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>Type your text and click Add to add it to the design</TooltipContent>
                                </Tooltip>
                              ) : (
                                <input
                                  type="text"
                                  value={textInput}
                                  onChange={(e) => setTextInput(e.target.value)}
                                  placeholder="Enter your text here..."
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  onKeyDown={(e) => e.key === "Enter" && addTextElement()}
                                />
                              )}
                              {showHelp ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                          <Button onClick={addTextElement} disabled={!textInput.trim()} className="px-6">
                            Add
                          </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Add the text to your design</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Button onClick={addTextElement} disabled={!textInput.trim()} className="px-6">
                                  Add
                                </Button>
                              )}
                        </div>
                          </CardContent>
                        </Card>

                        {/* Text Elements Management Section */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Text Elements</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {textElements.map((element, index) => (
                                <div
                                  key={element.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedTextElement === element.id
                                      ? "border-blue-500 bg-blue-50 shadow-sm"
                                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                  onClick={() => {
                                    setSelectedTextElement(element.id)
                                    loadElementToControls(element)
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                      {element.type === "text" ? element.text : "Logo"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {element.type === "text"
                                        ? `${element.font} • ${element.size}px`
                                        : `${element.size?.width || 100}×${element.size?.height || 100}px`}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                            <Button
                                      variant="ghost"
                              size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteTextElement(element.id)
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4" />
                            </Button>
                                  </div>
                                </div>
                          ))}
                        </div>
                            {textElements.length > 3 && (
                              <div className="mt-3 pt-3 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTextElements([])}
                                  className="w-full text-red-600 hover:text-red-700"
                                >
                                  Clear All Elements
                                </Button>
                      </div>
                            )}
                    </CardContent>
                  </Card>

                        {/* Edit Selected Text Section */}
                        {selectedTextElement !== null && (
                  <Card>
                    <CardHeader>
                              <CardTitle>Edit Selected Text</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                              {/* Edit text content */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">Text</Label>
                                <input
                                  type="text"
                                  value={
                                    textElements.find((el) => el.id === selectedTextElement)?.text || ""
                                  }
                                  onChange={(e) => {
                                    const newText = e.target.value
                                    updateTextElement(selectedTextElement, { text: newText })
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div className="space-y-2">
                        <Label className="text-sm font-medium">Font Family</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                  {[
                                    { value: "Arial", label: "Arial" },
                                    { value: "Orbitron", label: "Orbitron" },
                                    { value: "Rajdhani", label: "Rajdhani" },
                                    { value: "Exo 2", label: "Exo 2" },
                                    { value: "Audiowide", label: "Audiowide" },
                                    { value: "Roboto", label: "Roboto" },
                                    { value: "Open Sans", label: "Open Sans" },
                                    { value: "Montserrat", label: "Montserrat" },
                                    { value: "Pacifico", label: "Pacifico" },
                                    { value: "Fredoka One", label: "Fredoka One" },
                          ].map((font) => (
                            <button
                              key={font.value}
                              onClick={() => setSelectedFont(font.value)}
                                      className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors w-full ${
                                selectedFont === font.value
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                                      type="button"
                                    >
                                      <span style={{ fontFamily: font.value }}>{font.label}</span>
                              {selectedFont === font.value && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                            </button>
                          ))}
                        </div>
                      </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Size: {fontSize}px</Label>
                          <Slider
                            value={[fontSize]}
                            onValueChange={(value) => setFontSize(value[0])}
                            min={8}
                            max={72}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Color</Label>
                                <div className="flex gap-2 mt-1 items-center">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-12 h-10 rounded border cursor-pointer"
                            />
                            <div className="flex gap-1">
                              {["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map((color) => (
                                <button
                                  key={color}
                                  className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setTextColor(color)}
                                        type="button"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                                <Label className="text-sm font-medium">Position</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">X: {textPosition.x}%</Label>
                          <Slider
                            value={[textPosition.x]}
                            onValueChange={(value) => setTextPosition((prev) => ({ ...prev, x: value[0] }))}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                                  <div>
                                    <Label className="text-xs">Y: {textPosition.y}%</Label>
                          <Slider
                            value={[textPosition.y]}
                            onValueChange={(value) => setTextPosition((prev) => ({ ...prev, y: value[0] }))}
                            min={0}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                              </div>
                        <div className="space-y-2">
                                <Label className="text-sm font-medium">Rotation</Label>
                          <Slider
                            value={[textRotation]}
                            onValueChange={(value) => setTextRotation(value[0])}
                            min={-180}
                            max={180}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                                <Label className="text-sm font-medium">Opacity</Label>
                          <Slider
                            value={[textOpacity]}
                            onValueChange={(value) => setTextOpacity(value[0])}
                            min={0}
                            max={100}
                            step={5}
                          />
                        </div>
                              {/* Collapsible Advanced Options */}
                              <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium text-gray-700">Advanced Options</summary>
                                <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2">
                                    <Label className="text-xs">Shadow</Label>
                                    <Switch checked={textShadow.enabled} onCheckedChange={(checked) => setTextShadow((prev) => ({ ...prev, enabled: checked }))} />
                        </div>
                        {textShadow.enabled && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                              <Label className="text-xs">X: {textShadow.x}px</Label>
                              <Slider
                                value={[textShadow.x]}
                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, x: value[0] }))}
                                min={-10}
                                max={10}
                                step={1}
                              />
                            </div>
                                      <div>
                              <Label className="text-xs">Y: {textShadow.y}px</Label>
                              <Slider
                                value={[textShadow.y]}
                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, y: value[0] }))}
                                min={-10}
                                max={10}
                                step={1}
                              />
                            </div>
                                      <div>
                              <Label className="text-xs">Blur: {textShadow.blur}px</Label>
                              <Slider
                                value={[textShadow.blur]}
                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, blur: value[0] }))}
                                min={0}
                                max={20}
                                step={1}
                              />
                            </div>
                                      <div>
                              <Label className="text-xs">Color</Label>
                              <input
                                type="color"
                                value={textShadow.color}
                                onChange={(e) => setTextShadow((prev) => ({ ...prev, color: e.target.value }))}
                                className="w-full h-8 rounded border cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Label className="text-xs">Outline</Label>
                                    <Switch checked={textOutline.enabled} onCheckedChange={(checked) => setTextOutline((prev) => ({ ...prev, enabled: checked }))} />
                        </div>
                        {textOutline.enabled && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                              <Label className="text-xs">Width: {textOutline.width}px</Label>
                              <Slider
                                value={[textOutline.width]}
                                onValueChange={(value) => setTextOutline((prev) => ({ ...prev, width: value[0] }))}
                                min={1}
                                max={5}
                                step={1}
                              />
                            </div>
                                      <div>
                              <Label className="text-xs">Color</Label>
                              <input
                                type="color"
                                value={textOutline.color}
                                onChange={(e) => setTextOutline((prev) => ({ ...prev, color: e.target.value }))}
                                className="w-full h-8 rounded border cursor-pointer"
                              />
                            </div>
                          </div>
                        )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Label className="text-xs">Gradient</Label>
                                    <Switch checked={textGradient.enabled} onCheckedChange={(checked) => setTextGradient((prev) => ({ ...prev, enabled: checked }))} />
                        </div>
                        {textGradient.enabled && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                <Label className="text-xs">From</Label>
                                <input
                                  type="color"
                                  value={textGradient.from}
                                  onChange={(e) => setTextGradient((prev) => ({ ...prev, from: e.target.value }))}
                                  className="w-full h-8 rounded border cursor-pointer"
                                />
                              </div>
                                      <div>
                                <Label className="text-xs">To</Label>
                                <input
                                  type="color"
                                  value={textGradient.to}
                                  onChange={(e) => setTextGradient((prev) => ({ ...prev, to: e.target.value }))}
                                  className="w-full h-8 rounded border cursor-pointer"
                                />
                              </div>
                                      <div className="col-span-2">
                              <Label className="text-xs">Direction</Label>
                                        <div className="flex gap-2 mt-1">
                                <Button
                                  variant={textGradient.direction === "horizontal" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setTextGradient((prev) => ({ ...prev, direction: "horizontal" }))}
                                >
                                  Horizontal
                                </Button>
                                <Button
                                  variant={textGradient.direction === "vertical" ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setTextGradient((prev) => ({ ...prev, direction: "vertical" }))}
                                >
                                  Vertical
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Label className="text-xs">Curved Text</Label>
                        <Switch checked={isCurvedText} onCheckedChange={setIsCurvedText} />
                      </div>
                      {isCurvedText && (
                                    <div className="space-y-2">
                          <Label className="text-xs">Curve Radius: {curveRadius}px</Label>
                          <Slider
                            value={[curveRadius]}
                            onValueChange={(value) => setCurveRadius(value[0])}
                            min={50}
                            max={300}
                            step={10}
                          />
                        </div>
                      )}
                                </div>
                              </details>
                    </CardContent>
                  </Card>
                        )}
                      </>
                    )}
                    {tab.value === 'rgb' && (
                      <>
                        {mousepadType === "normal" ? (
                  <Card>
                            <CardContent className="p-6 text-center">
                              <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                              <h3 className="font-medium mb-2">RGB Features Locked</h3>
                              <p className="text-sm text-gray-500 mb-4">
                                Switch to RGB mousepad to customize lighting effects
                              </p>
                              <Button onClick={() => setMousepadType("rgb")}>Upgrade to RGB (+$15)</Button>
                    </CardContent>
                  </Card>
                        ) : (
                    <Card>
                      <CardHeader>
                              <CardTitle>RGB Lighting</CardTitle>
                      </CardHeader>
                            <CardContent className="space-y-6">
                              {/* Live RGB Preview */}
                              <div className="flex flex-col items-center gap-2">
                                <div className="relative w-40 h-10 flex items-center justify-center">
                                  <div
                                    className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                      rgbMode === 'rainbow'
                                        ? 'animate-rainbow'
                                        : rgbMode === 'breathing'
                                        ? 'animate-breathing'
                                        : ''
                                    }`}
                                    style={{
                                      background:
                                        rgbMode === 'rainbow'
                                          ? 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
                                          : rgbMode === 'static' || rgbMode === 'breathing'
                                          ? `linear-gradient(90deg, ${rgbColor}, ${rgbColor}80)`
                                          : '#222',
                                      opacity: rgbBrightness / 100,
                                      filter: rgbMode === 'breathing' ? `blur(4px)` : 'blur(2px)',
                                    }}
                                  />
                                  <div className="relative z-10 w-32 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-semibold shadow">
                                    RGB Preview
                                </div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Live preview of your RGB effect</div>
                              </div>

                              {/* Mode Selection */}
                              <div className="space-y-2">
                                <div className="font-medium mb-1">Lighting Mode</div>
                                <div className="flex gap-2 flex-wrap">
                                  {[
                                    { value: 'static', label: 'Static' },
                                    { value: 'breathing', label: 'Breathing' },
                                    { value: 'rainbow', label: 'Rainbow' },
                                    { value: 'reactive', label: 'Reactive' },
                                  ].map((mode) => (
                                    showHelp ? (
                                      <Tooltip key={mode.value}>
                                        <TooltipTrigger asChild>
                                <Button
                                            variant={rgbMode === mode.value ? 'default' : 'outline'}
                                  size="sm"
                                            className="rounded-full px-4"
                                            onClick={() => setRgbMode(mode.value)}
                                          >
                                            {mode.label}
                                </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{RGB_MODE_DESCRIPTIONS[mode.value]}</TooltipContent>
                                      </Tooltip>
                                    ) : (
                            <Button
                                        key={mode.value}
                                        variant={rgbMode === mode.value ? 'default' : 'outline'}
                              size="sm"
                                        className="rounded-full px-4"
                                        onClick={() => setRgbMode(mode.value)}
                            >
                                        {mode.label}
                            </Button>
                                    )
                                  ))}
                          </div>
                                <div className="text-xs text-gray-500 mt-1 min-h-[20px]">
                                  {RGB_MODE_DESCRIPTIONS[rgbMode]}
                          </div>
                      </div>

                              {/* Color Picker & Palette */}
                              {(rgbMode === 'static' || rgbMode === 'breathing') && (
                                <div className="space-y-2">
                                  <div className="font-medium mb-1">Color Selection</div>
                                  <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={rgbColor}
                                onChange={(e) => setRgbColor(e.target.value)}
                                      className="w-10 h-10 rounded border"
                              />
                                    <div className="flex gap-1">
                                      {["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"].map((color) => (
                                  <button
                                    key={color}
                                          className={`w-6 h-6 rounded-full border-2 ${rgbColor === color ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-400`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setRgbColor(color)}
                                  />
                                ))}
                              </div>
                            </div>
                                </div>
                              )}

                              {/* Brightness Slider */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 font-medium mb-1">
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-7.657l1.414 1.414M4.929 19.071l1.414-1.414m12.728 0l-1.414-1.414M4.929 4.929l1.414 1.414" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="5" stroke="#fbbf24" strokeWidth="2"/></svg>
                                  Brightness
                                  <span className="ml-2 text-xs text-gray-500">{rgbBrightness}%</span>
                                </div>
                          <Slider
                            value={[rgbBrightness]}
                                  onValueChange={(value) => setRgbBrightness(value[0])}
                            min={10}
                            max={100}
                            step={5}
                          />
                              </div>

                              {/* Reset Preset Button Only */}
                              <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" onClick={() => {
                                  setRgbMode('static');
                                  setRgbColor('#ff0000');
                                  setRgbBrightness(80);
                                }}>
                                  Reset to Default
                                </Button>
                              </div>
                        </CardContent>
                      </Card>
                        )}
                    </>
                  )}
                    {tab.value === 'order' && (
                      <>
                  {/* Quantity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                          -
                        </Button>
                        <span className="font-medium text-lg w-12 text-center">{quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                          +
                        </Button>
                        {quantity > 1 && (
                          <Badge variant="secondary" className="ml-2">
                            10% Bulk Discount!
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Price Calculator */}
                  <PriceCalculator
                    mousepadType={mousepadType}
                    mousepadSize={mousepadSize}
                    thickness={thickness}
                    edgeStitching={edgeStitching}
                    surfaceTexture={surfaceTexture}
                    quantity={quantity}
                  />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                          <Button
                            className="w-full"
                            size="lg"
                            onClick={() => {
                              addItem({
                                id: Date.now().toString() + Math.random().toString(36).slice(2),
                                name: "Custom Mousepad",
                                image: editedImage || uploadedImage || "/placeholder.svg",
                                specs: {
                                  type: mousepadType,
                                  size: mousepadSize,
                                  thickness,
                                  surface: surfaceTexture,
                                  stitching: edgeStitching,
                                  rgb: mousepadType === "rgb" ? { mode: rgbMode, color: rgbColor } : undefined,
                                  text: textElements,
                                },
                                quantity,
                                price: parseFloat(getMousepadPrice().toFixed(2)),
                              });
                              if (toast) {
                                toast({
                                  title: "Added to Cart!",
                                  description: "Your custom mousepad has been added to the cart.",
                                  duration: 2000,
                                });
                              }
                            }}
                          >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Add to Cart
                    </Button>
                  </div>

                  {/* Guarantees */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-600 rounded-full" />
                          30-day money-back guarantee
                        </div>
                        <div className="flex items-center gap-2 text-blue-600">
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          Free shipping on orders over $50
                        </div>
                        <div className="flex items-center gap-2 text-purple-600">
                          <div className="w-2 h-2 bg-purple-600 rounded-full" />
                          1-year warranty included
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                      </>
                    )}
                </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <SideCart open={sideCartOpen} onClose={() => setSideCartOpen(false)} />
    </TooltipProvider>
  )
}
