"use client"

import { getBaseMousepadPrice, getExactMousepadPrice } from "../lib/price";

interface PriceCalculatorProps {
  mousepadType: string
  mousepadSize: string
  thickness: string
  quantity: number
}

export function PriceCalculator({
  mousepadType,
  mousepadSize,
  thickness,
  quantity,
}: PriceCalculatorProps) {
  const rgb = mousepadType === "rgb";
  const basePrice = getBaseMousepadPrice({
    mousepadSize,
    thickness,
    currency: "USD",
    rgb,
  });
  const totalPrice = getExactMousepadPrice({
    mousepadSize,
    thickness,
    currency: "USD",
    quantity,
    rgb,
  });
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Base Price: ${basePrice.toFixed(2)} per unit
      </div>
      {quantity > 1 && (
        <div className="text-sm text-green-600">
          Bulk Discount: 10% off (${(basePrice * quantity * 0.1).toFixed(2)} saved)
        </div>
      )}
      <div className="font-semibold text-lg">
        Total: ${totalPrice.toFixed(2)}
      </div>
    </div>
  );
}
