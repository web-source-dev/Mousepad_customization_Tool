"use client"

import React, { useState, useRef } from "react"
import { Star, Palette, Upload, Type, Settings, Zap, Monitor, Smartphone, Tablet, Mouse, Keyboard, Gamepad2, Sparkles, Flame, Droplets, Rainbow, X } from "lucide-react"
import { ExpandableDropdownSelector, DropdownOption } from "./dropdown-selector"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { PRICING_TABLE } from "@/lib/price"

interface ConfigurationPanelProps {
  // Device Type (Mousepad Type)
  mousepadType: string
  onMousepadTypeChange: (value: string) => void
  
  // Device Model (Size)
  mousepadSize: string
  onMousepadSizeChange: (value: string) => void
  mousepadSizes: Record<string, { label: string; width: number; height: number }>
  
  // Case Type (Thickness)
  thickness: string
  onThicknessChange: (value: string) => void
  thicknessOptions: Array<{ value: string; label: string; description: string }>
  
  // Case Color (RGB Settings)
  rgbMode: string
  onRgbModeChange: (value: string) => void
  rgbColor: string
  onRgbColorChange: (value: string) => void
  rgbBrightness: number
  onRgbBrightnessChange: (value: number) => void
  
  // Text Editor Props
  textInput?: string
  onTextInputChange?: (value: string) => void
  onAddTextElement?: () => void
  textElements?: Array<{
    id: number
    type: string
    text: string
    font: string
    size: number
    x: number
    y: number
    color: string
  }>
  selectedTextElement?: number | null
  onTextElementSelect?: (id: number) => void
  onDeleteTextElement?: (id: number) => void
  onLoadElementToControls?: (element: any) => void
  
  // Image Upload Props
  onImageUpload?: (file: File | null) => void
  uploadedImage?: string | null
  isDragOver?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  
  // Image Position Props
  imageZoom?: number
  onImageZoomChange?: (value: number) => void
  imagePosition?: { x: number; y: number }
  onImagePositionChange?: (value: { x: number; y: number }) => void
  
  // Pricing Props
  currency?: 'USD' | 'SGD'
  
  className?: string
}

export function ConfigurationPanel({
  mousepadType,
  onMousepadTypeChange,
  mousepadSize,
  onMousepadSizeChange,
  mousepadSizes,
  thickness,
  onThicknessChange,
  thicknessOptions,
  rgbMode,
  onRgbModeChange,
  rgbColor,
  onRgbColorChange,
  rgbBrightness,
  onRgbBrightnessChange,
  textInput = "",
  onTextInputChange,
  onAddTextElement,
  textElements = [],
  selectedTextElement,
  onTextElementSelect,
  onDeleteTextElement,
  onLoadElementToControls,
  onImageUpload,
  uploadedImage,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  imageZoom = 1,
  onImageZoomChange,
  imagePosition = { x: 0, y: 0 },
  onImagePositionChange,
  currency = 'USD',
  className
}: ConfigurationPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    deviceType: false,
    imagePosition: false,
    deviceModel: false,
    caseType: false,
    imageUpload: false
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImageUpload) {
      onImageUpload(file)
    }
  }

  const handleRemoveImage = () => {
    if (onImageUpload) {
      // Pass a null file to indicate image removal
      onImageUpload(null as any)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDragOver) onDragOver(e)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDragLeave) onDragLeave(e)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (onDrop) onDrop(e)
  }

  const toggleSection = (section: string) => {
    // Auto-close other sections when opening a new one
    setExpandedSections(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false
        return acc
      }, {} as Record<string, boolean>)
      newState[section] = !prev[section]
      return newState
    })
  }

  // Device Type Options
  const deviceTypeOptions: DropdownOption[] = [
    {
      id: "normal",
      label: "Standard Mousepad",
      value: "normal",
      description: "Classic design with premium materials, perfect for everyday use",
      icon: <Mouse className="h-4 w-4 text-gray-600" />,
      badge: "$0"
    },
    {
      id: "rgb",
      label: "RGB Gaming Mousepad",
      value: "rgb",
      description: "LED-backlit with customizable effects for immersive gaming experience",
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      badge: "+$15"
    }
  ]

  // RGB Customization Options
  const rgbCustomizationOptions: DropdownOption[] = [
    {
      id: "static",
      label: "Static Color",
      value: "static",
      description: "A single, solid color of your choice - perfect for matching your setup",
      icon: <Palette className="h-4 w-4 text-blue-500" />
    },
    {
      id: "rainbow",
      label: "Rainbow Cycle",
      value: "rainbow",
      description: "A continuous, animated rainbow color cycle - perfect for gaming setups",
      icon: <Rainbow className="h-4 w-4 text-purple-500" />
    }
  ]

  // Device Model Options with Pricing
  const deviceModelOptions: DropdownOption[] = Object.entries(mousepadSizes).map(([key, size], index) => {
    // Get base price for this size (using 3mm as baseline)
    const basePrice = PRICING_TABLE[currency]?.[key]?.['3mm'] || 0
    const priceDisplay = basePrice > 0 ? `$${basePrice}` : ''
    
    return {
      id: key,
      label: size.label,
      value: key,
      description: `${size.width}×${size.height}mm - Perfect for ${index === 0 ? 'compact setups' : index === 1 ? 'standard desks' : 'large gaming stations'}`,
      icon: index === 0 ? <Smartphone className="h-4 w-4 text-blue-500" /> : 
            index === 1 ? <Monitor className="h-4 w-4 text-green-500" /> : 
            <Gamepad2 className="h-4 w-4 text-purple-500" />,
      price: priceDisplay
    }
  })

  // Case Type Options with Pricing
  const caseTypeOptions: DropdownOption[] = thicknessOptions.map((option, index) => {
    // Calculate additional cost for this thickness compared to 3mm baseline
    const basePrice = PRICING_TABLE[currency]?.[mousepadSize]?.['3mm'] || 0
    const thicknessPrice = PRICING_TABLE[currency]?.[mousepadSize]?.[option.value] || 0
    const additionalCost = thicknessPrice - basePrice
    
    let priceDisplay = ''
    if (additionalCost > 0) {
      priceDisplay = `+$${additionalCost}`
    } else if (additionalCost < 0) {
      priceDisplay = `-$${Math.abs(additionalCost)}`
    }
    
    return {
      id: option.value,
      label: option.label,
      value: option.value,
      description: option.description,
      icon: index === 0 ? <Droplets className="h-4 w-4 text-blue-500" /> : 
            index === 1 ? <Flame className="h-4 w-4 text-orange-500" /> : 
            <Zap className="h-4 w-4 text-yellow-500" />,
      price: priceDisplay
    }
  })



  return (
    <div className={`space-y-0 ${className}`}>
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-0">
          
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {/* 01. Mousepad Type */}
            <ExpandableDropdownSelector
               title="01. Mousepad Type"
              options={deviceTypeOptions}
              value={mousepadType}
              onValueChange={onMousepadTypeChange}
              placeholder="Select mousepad type"
              isExpanded={expandedSections.deviceType}
              onToggle={() => toggleSection('deviceType')}
            />

            {/* RGB Customization - Inside Device Type when RGB is selected */}
            {mousepadType === 'rgb' && expandedSections.deviceType && (
              <div className="border-t border-gray-100 bg-purple-50/30">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-900">RGB Customization</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* RGB Mode Selection */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">Lighting Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        {rgbCustomizationOptions.map((option) => (
                          <button
                            key={option.id}
                            className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                              rgbMode === option.value
                                ? 'border-purple-500 bg-purple-50 text-purple-900'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                            onClick={() => onRgbModeChange(option.value)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {option.icon}
                              <span className="text-sm font-medium">{option.label}</span>
                            </div>
                            <p className="text-xs text-gray-600">{option.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                                {/* Color Picker - Only show for static mode */}
            {rgbMode === 'static' && (
                      <div className="space-y-3">
                        <label className="text-xs font-medium text-gray-700 block">Custom Color</label>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                              type="color"
                              value={rgbColor}
                              onChange={(e) => onRgbColorChange(e.target.value)}
                              className="w-12 h-12 rounded-lg border-2 border-gray-200 bg-white cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                            />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border border-gray-300"></div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">Selected Color</div>
                            <div className="text-xs text-gray-600">{rgbColor.toUpperCase()}</div>
                          </div>
                        </div>
                        
                        {/* Quick Color Palette */}
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-2">Quick Colors</div>
                          <div className="grid grid-cols-8 gap-2">
                            {[
                              "#ff0000", "#00ff00", "#0000ff", "#ffff00", 
                              "#ff00ff", "#00ffff", "#ffffff", "#000000"
                            ].map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded border-2 transition-all duration-200 ${
                                  rgbColor === color ? 'border-purple-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => onRgbColorChange(color)}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Brightness Slider */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">Brightness</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{rgbBrightness}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={rgbBrightness}
                            onChange={(e) => onRgbBrightnessChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

                         {/* 02. Size & Dimension */}
             <ExpandableDropdownSelector
               title="02. Size & Dimension"
              options={deviceModelOptions}
              value={mousepadSize}
              onValueChange={onMousepadSizeChange}
              placeholder="Select size"
              isExpanded={expandedSections.deviceModel}
              onToggle={() => toggleSection('deviceModel')}
            />

                         {/* 03. Thickness & Comfort */}
             <ExpandableDropdownSelector
               title="03. Thickness & Comfort"
              options={caseTypeOptions}
              value={thickness}
              onValueChange={onThicknessChange}
              placeholder="Select thickness"
              isExpanded={expandedSections.caseType}
              onToggle={() => toggleSection('caseType')}
            />

            {/* 04. Upload Design - Simplified */}
            <ExpandableDropdownSelector
              title="04. Upload Design"
              options={[
                {
                  id: "upload",
                  label: "Upload & Edit",
                  value: "upload",
                  description: "Upload and edit custom images with advanced editing tools",
                  icon: <Upload className="h-4 w-4 text-green-500" />
                }
              ]}
              value="upload"
              onValueChange={() => {}}
              placeholder="Upload your design"
              isExpanded={expandedSections.imageUpload}
              onToggle={() => toggleSection('imageUpload')}
              inlineChildren={{
                upload: (
                  <div className="bg-green-50/30">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Upload className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-900">Image Upload</span>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        
                        {/* Upload area */}
                        <div
                          className={`text-center p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                            isDragOver 
                              ? "border-green-400 bg-green-100" 
                              : "border-green-300 bg-green-50/50 hover:border-green-400 hover:bg-green-100/50"
                          }`}
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          {uploadedImage ? (
                            <div className="space-y-3">
                              <div className="relative mx-auto w-24 h-24">
                                <img
                                  src={uploadedImage}
                                  alt="Uploaded design"
                                  className="w-full h-full object-cover rounded-lg border border-green-200"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveImage()
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              <p className="text-sm font-medium text-green-900">Image uploaded successfully!</p>
                              <p className="text-xs text-green-600">Click to change image</p>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-8 w-8 text-green-400 mb-2" />
                              <p className="text-sm font-medium text-green-900">Upload your design</p>
                              <p className="text-xs text-green-600">PNG, JPG, GIF up to 10MB</p>
                              <p className="text-xs text-green-500 mt-2">Drag & drop or click to browse</p>
                            </>
                          )}
                        </div>
                        
                        {/* Upload button */}
                        {!uploadedImage && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }}
            />

            {/* 05. Image Position - Only show when image is uploaded */}
            {uploadedImage && (
              <ExpandableDropdownSelector
                title="05. Image Position"
                options={[
                  {
                    id: "position",
                    label: "Adjust Position & Zoom",
                    value: "position",
                    description: "Fine-tune the position and zoom of your uploaded image",
                    icon: <Settings className="h-4 w-4 text-blue-500" />
                  }
                ]}
                value="position"
                onValueChange={() => {}}
                placeholder="Adjust image position"
                isExpanded={expandedSections.imagePosition}
                onToggle={() => toggleSection('imagePosition')}
                inlineChildren={{
                  position: (
                    <div className="bg-blue-50/30">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-semibold text-blue-900">Image Adjustments</span>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Zoom Control */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-700">Zoom</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{Math.round(imageZoom * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.1"
                              max="3"
                              step="0.01"
                              value={imageZoom}
                              onChange={(e) => onImageZoomChange?.(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>10%</span>
                              <span>300%</span>
                            </div>
                          </div>

                          {/* Position Controls */}
                          <div className="grid grid-cols-2 gap-4">
                            {/* X Position */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">X Position</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{Math.round(imagePosition.x)}%</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                step="1"
                                value={imagePosition.x}
                                onChange={(e) => onImagePositionChange?.({ ...imagePosition, x: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>-50%</span>
                                <span>50%</span>
                              </div>
                            </div>

                            {/* Y Position */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">Y Position</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{Math.round(imagePosition.y)}%</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                step="1"
                                value={imagePosition.y}
                                onChange={(e) => onImagePositionChange?.({ ...imagePosition, y: Number(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                              />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>-50%</span>
                                <span>50%</span>
                              </div>
                            </div>
                          </div>

                          {/* Reset Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              onImageZoomChange?.(1);
                              onImagePositionChange?.({ x: 0, y: 0 });
                            }}
                          >
                            Reset to Default
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 