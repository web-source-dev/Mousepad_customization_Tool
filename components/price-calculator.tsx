"use client"

import { getExactMousepadPrice } from "../lib/price";

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
  const subtotal = getExactMousepadPrice({
    mousepadSize,
    thickness,
    currency: "USD",
    quantity,
    rgb,
  });
  return (
    <div>
      <div>Subtotal: ${subtotal.toFixed(2)}</div>
      {/* Add more breakdown if needed */}
    </div>
  );
}
