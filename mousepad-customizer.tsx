"use client"

import type React from "react"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const MOUSEPAD_SIZES = {
  small: { label: "Small (250x210mm)", width: 250, height: 210 },
  medium: { label: "Medium (350x300mm)", width: 350, height: 300 },
  large: { label: "Large (450x400mm)", width: 450, height: 400 },
}

const THICKNESS_OPTIONS = ["2mm", "3mm", "4mm"]

export default function MousepadCustomizer() {
  const [mousepadType, setMousepadType] = useState("normal")
  const [mousepadSize, setMousepadSize] = useState("medium")
  const [thickness, setThickness] = useState("3mm")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleImageUpload(files[0])
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
        handleImageUpload(files[0])
      }
    },
    [handleImageUpload],
  )

  const removeImage = () => {
    setUploadedImage(null)
  }

  const currentSize = MOUSEPAD_SIZES[mousepadSize as keyof typeof MOUSEPAD_SIZES]

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Custom Mousepad Designer</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create your perfect mousepad with our easy-to-use customization tool
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Panel - Live Preview */}
          <div className="order-2 lg:order-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Live Preview
                  <div className="text-sm font-normal text-gray-500">{currentSize.label}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-8">
                <div className="relative">
                  {/* Mousepad Base */}
                  <div
                    className={`relative rounded-lg border-2 shadow-lg transition-all duration-300 ${
                      mousepadType === "rgb"
                        ? "border-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-xl"
                        : "border-gray-300"
                    }`}
                    style={{
                      width: Math.min(400, currentSize.width * 0.8),
                      height: Math.min(300, currentSize.height * 0.8),
                      aspectRatio: `${currentSize.width}/${currentSize.height}`,
                    }}
                  >
                    {/* RGB Effect */}
                    {mousepadType === "rgb" && (
                      <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-20 blur-sm"></div>
                    )}

                    {/* Mousepad Surface */}
                    <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
                      {uploadedImage ? (
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Custom design"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100">
                          <div className="text-center text-gray-400">
                            <Upload className="mx-auto h-12 w-12 mb-2" />
                            <p className="text-sm">Upload an image to see preview</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Thickness Indicator */}
                    <div className="absolute -bottom-2 -right-2 rounded bg-gray-800 px-2 py-1 text-xs text-white">
                      {thickness} thick
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Customization Controls */}
          <div className="order-1 space-y-6 lg:order-2">
            {/* Mousepad Type */}
            <Card>
              <CardHeader>
                <CardTitle>Select Mousepad Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={mousepadType} onValueChange={setMousepadType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="flex-1 cursor-pointer">
                      <div className="font-medium">Normal</div>
                      <div className="text-sm text-gray-500">Standard mousepad without lighting</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rgb" id="rgb" />
                    <Label htmlFor="rgb" className="flex-1 cursor-pointer">
                      <div className="font-medium">RGB</div>
                      <div className="text-sm text-gray-500">LED-backlit mousepad with RGB lighting</div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Mousepad Size */}
            <Card>
              <CardHeader>
                <CardTitle>Select Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={mousepadSize} onValueChange={setMousepadSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose size" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MOUSEPAD_SIZES).map(([key, size]) => (
                      <SelectItem key={key} value={key}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Mousepad Thickness */}
            <Card>
              <CardHeader>
                <CardTitle>Select Thickness</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={thickness} onValueChange={setThickness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    {THICKNESS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Upload Image */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Design</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {uploadedImage ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded design"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">Design uploaded successfully!</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          className="mx-auto flex items-center gap-2 bg-transparent"
                        >
                          <X className="h-4 w-4" />
                          Remove Image
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">Drag and drop your image here</p>
                        <p className="text-sm text-gray-500">or click to browse files</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">Supported formats: JPG, PNG, GIF (Max size: 10MB)</p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                Add to Cart - $29.99
              </Button>
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                Save Design
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
