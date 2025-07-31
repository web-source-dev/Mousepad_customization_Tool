// Pricing table as provided by the user
export const PRICING_TABLE: Record<string, Record<string, Record<string, number>>> = {
  USD: {
    '200x240': { '3mm': 33, '4mm': 38, '5mm': 40 },
    '300x350': { '3mm': 44, '4mm': 49, '5mm': 51 },
    '300x600': { '3mm': 52, '4mm': 57, '5mm': 59 },
    '300x700': { '3mm': 53, '4mm': 58, '5mm': 60 },
    '300x800': { '3mm': 57, '4mm': 62, '5mm': 64 },
    '350x600': { '3mm': 53, '4mm': 58, '5mm': 60 },
    '400x600': { '3mm': 70, '4mm': 75, '5mm': 77 },
    '400x700': { '3mm': 71, '4mm': 76, '5mm': 78 },
    '400x800': { '3mm': 71, '4mm': 76, '5mm': 78 },
    '400x900': { '3mm': 75, '4mm': 80, '5mm': 82 },
    '500x800': { '3mm': 79, '4mm': 84, '5mm': 86 },
    '500x1000': { '3mm': 93, '4mm': 98, '5mm': 100 },
  },
  SGD: {
    '200x240': { '3mm': 44, '4mm': 50, '5mm': 53 },
    '300x350': { '3mm': 59, '4mm': 66, '5mm': 69 },
    '300x600': { '3mm': 70, '4mm': 77, '5mm': 80 },
    '300x700': { '3mm': 72, '4mm': 79, '5mm': 82 },
    '300x800': { '3mm': 77, '4mm': 84, '5mm': 86 },
    '350x600': { '3mm': 72, '4mm': 79, '5mm': 82 },
    '400x600': { '3mm': 95, '4mm': 102, '5mm': 104 },
    '400x700': { '3mm': 96, '4mm': 103, '5mm': 105 },
    '400x800': { '3mm': 96, '4mm': 103, '5mm': 105 },
    '400x900': { '3mm': 101, '4mm': 108, '5mm': 110 },
    '500x800': { '3mm': 106, '4mm': 113, '5mm': 115 },
    '500x1000': { '3mm': 125, '4mm': 132, '5mm': 134 },
  },
};

export function getExactMousepadPrice({
  mousepadSize,
  thickness,
  currency = "USD",
  quantity = 1,
  rgb = false,
}: {
  mousepadSize: string,
  thickness: string,
  currency?: string,
  quantity?: number,
  rgb?: boolean,
}) {
  let base = PRICING_TABLE[currency][mousepadSize]?.[thickness] || 0;
  // Add-ons
  if (rgb) base += 15;
  let subtotal = base * quantity;
  // Bulk discount
  if (quantity > 1) subtotal = subtotal * 0.9;
  return subtotal;
} 