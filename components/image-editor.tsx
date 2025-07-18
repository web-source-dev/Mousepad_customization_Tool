"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { RotateCw, ZoomIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface ImageEditorProps {
  imageUrl: string
  onImageChange: (editedImage: string) => void
}

export function ImageEditor({ imageUrl, onImageChange }: ImageEditorProps) {
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(100)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      // Set canvas size to image size (or fixed size if you want)
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(scale / 100, scale / 100)
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()
    }
    img.src = imageUrl
  }, [imageUrl, rotation, scale, brightness, contrast, saturation, offset])

  // Redraw on any change
  useEffect(() => {
    drawImage()
  }, [drawImage])

  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(scale / 100, scale / 100)
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      ctx.drawImage(img, -img.width / 2, -img.height / 2)
      ctx.restore()
      const editedImageUrl = canvas.toDataURL("image/png")
      onImageChange(editedImageUrl)
    }
    img.src = imageUrl
  }, [imageUrl, rotation, scale, brightness, contrast, saturation, offset, onImageChange])

  const resetFilters = () => {
    setRotation(0)
    setScale(100)
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Image Editor</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <Button size="sm" onClick={applyFilters}>
              Apply Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Rotation: {rotation}°
            </Label>
            <Slider value={[rotation]} onValueChange={(value) => setRotation(value[0])} min={-180} max={180} step={1} />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Scale: {scale}%
            </Label>
            <Slider value={[scale]} onValueChange={(value) => setScale(value[0])} min={50} max={200} step={1} />
          </div>

          <div className="space-y-2">
            <Label>Brightness: {brightness}%</Label>
            <Slider
              value={[brightness]}
              onValueChange={(value) => setBrightness(value[0])}
              min={50}
              max={150}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Contrast: {contrast}%</Label>
            <Slider value={[contrast]} onValueChange={(value) => setContrast(value[0])} min={50} max={150} step={1} />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Saturation: {saturation}%</Label>
            <Slider
              value={[saturation]}
              onValueChange={(value) => setSaturation(value[0])}
              min={0}
              max={200}
              step={1}
            />
          </div>
        </div>

        <div className="mt-6">
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              maxHeight: '300px',
              aspectRatio: '4/3',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              margin: '0 auto',
              cursor: dragging ? 'grabbing' : 'grab',
              background: '#f9fafb',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseDown={(e) => {
              setDragging(true)
              setDragStart({ x: e.clientX, y: e.clientY })
            }}
            onMouseUp={() => {
              setDragging(false)
              setDragStart(null)
            }}
            onMouseLeave={() => {
              setDragging(false)
              setDragStart(null)
            }}
            onMouseMove={(e) => {
              if (dragging && dragStart) {
                setOffset((prev) => ({
                  x: prev.x + (e.clientX - dragStart.x),
                  y: prev.y + (e.clientY - dragStart.y),
                }))
                setDragStart({ x: e.clientX, y: e.clientY })
              }
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '300px',
                display: 'block',
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
