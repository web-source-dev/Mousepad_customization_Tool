"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const TEMPLATES = [
  {
    id: 1,
    name: "Neon Gamer",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 2,
    name: "Minimalist Blue Waves",
    category: "Abstract",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 3,
    name: "Cyberpunk Cityscape",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    premium: true,
  },
  {
    id: 4,
    name: "Mountain Sunrise",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 5,
    name: "Geometric Hexagons",
    category: "Abstract",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    premium: true,
  },
  {
    id: 6,
    name: "Starfield",
    category: "Space",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 7,
    name: "Aurora Borealis",
    category: "Nature",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80",
    premium: true,
  },
  {
    id: 8,
    name: "Retro Grid",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 9,
    name: "Abstract Color Splash",
    category: "Abstract",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    premium: false,
  },
  {
    id: 10,
    name: "Deep Space Nebula",
    category: "Space",
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=80",
    premium: true,
  },
]

const CATEGORIES = ["All", "Gaming", "Abstract", "Nature", "Space"]

interface TemplateGalleryProps {
  onSelectTemplate: (template: any) => void
  horizontal?: boolean
  cardSize?: 'small' | 'normal';
}

export function TemplateGallery({ onSelectTemplate, horizontal, cardSize = 'normal' }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredTemplates = TEMPLATES.filter(
    (template) => selectedCategory === "All" || template.category === selectedCategory,
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {horizontal ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={
                cardSize === 'small'
                  ? 'min-w-[120px] max-w-[140px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0'
                  : 'min-w-[200px] max-w-[220px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0'
              }
            >
              <CardContent className={cardSize === 'small' ? 'p-1' : 'p-3'}>
                <div className={cardSize === 'small' ? 'relative aspect-[4/3] mb-1' : 'relative aspect-[4/3] mb-2'}>
                  <Image
                    src={template.image || "/placeholder.svg"}
                    alt={template.name}
                    fill
                    className="object-cover rounded"
                  />
                  {template.premium && <Badge className="absolute top-2 right-2 bg-yellow-500">Premium</Badge>}
                </div>
                <h4 className={cardSize === 'small' ? 'font-medium text-xs mb-0.5' : 'font-medium text-sm mb-1'}>{template.name}</h4>
                <p className={cardSize === 'small' ? 'text-[10px] text-gray-500 mb-1' : 'text-xs text-gray-500 mb-2'}>{template.category}</p>
                <Button size="sm" className="w-full" onClick={() => onSelectTemplate(template)}>
                  Use
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="relative aspect-[4/3] mb-2">
                  <Image
                    src={template.image || "/placeholder.svg"}
                    alt={template.name}
                    fill
                    className="object-cover rounded"
                  />
                  {template.premium && <Badge className="absolute top-2 right-2 bg-yellow-500">Premium</Badge>}
                </div>
                <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                <Button size="sm" className="w-full" onClick={() => onSelectTemplate(template)}>
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
