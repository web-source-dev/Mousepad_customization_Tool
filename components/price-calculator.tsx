"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PriceCalculatorProps {
  mousepadType: string
  mousepadSize: string
  thickness: string
  edgeStitching: boolean
  surfaceTexture: string
  quantity: number
}

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
}

export function PriceCalculator({
  mousepadType,
  mousepadSize,
  thickness,
  edgeStitching,
  surfaceTexture,
  quantity,
}: PriceCalculatorProps) {
  const basePrice = PRICING.base[mousepadSize as keyof typeof PRICING.base] || 24.99
  const typePrice = PRICING.type[mousepadType as keyof typeof PRICING.type] || 0
  const thicknessPrice = PRICING.thickness[thickness as keyof typeof PRICING.thickness] || 0
  const surfacePrice = PRICING.surface[surfaceTexture as keyof typeof PRICING.surface] || 0
  const stitchingPrice = edgeStitching ? PRICING.edgeStitching : 0

  const subtotal = (basePrice + typePrice + thicknessPrice + surfacePrice + stitchingPrice) * quantity
  const shipping = subtotal > 50 ? 0 : 5.99
  const tax = subtotal * 0.08
  const total = subtotal + shipping + tax

  const savings = quantity > 1 ? subtotal * 0.1 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Price Summary
          {quantity > 1 && <Badge variant="secondary">Bulk Discount Applied!</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Base Price ({mousepadSize})</span>
            <span>${basePrice.toFixed(2)}</span>
          </div>

          {typePrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>RGB Lighting</span>
              <span>+${typePrice.toFixed(2)}</span>
            </div>
          )}

          {thicknessPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>Extra Thickness ({thickness})</span>
              <span>+${thicknessPrice.toFixed(2)}</span>
            </div>
          )}

          {surfacePrice > 0 && (
            <div className="flex justify-between text-sm">
              <span>Surface Upgrade</span>
              <span>+${surfacePrice.toFixed(2)}</span>
            </div>
          )}

          {edgeStitching && (
            <div className="flex justify-between text-sm">
              <span>Edge Stitching</span>
              <span>+${stitchingPrice.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Quantity</span>
            <span>×{quantity}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {savings > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Bulk Discount (10%)</span>
              <span>-${savings.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${(total - savings).toFixed(2)}</span>
        </div>

        {shipping === 0 && <p className="text-xs text-green-600 text-center">🎉 Free shipping on orders over $50!</p>}
      </CardContent>
    </Card>
  )
}
