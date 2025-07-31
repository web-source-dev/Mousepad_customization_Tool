"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"

interface Template {
  id: number
  name: string
  category: string
  image: string
  overlay: string // PNG overlay image
  premium: boolean
}

// Function to make background transparent
const makeBackgroundTransparent = (imageUrl: string, tolerance: number = 30): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Sample multiple background colors from corners and edges
      const backgroundColors = [
        // Top-left corner
        { r: data[0], g: data[1], b: data[2] },
        // Top-right corner
        { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] },
        // Bottom-left corner
        { r: data[(canvas.height - 1) * canvas.width * 4], g: data[(canvas.height - 1) * canvas.width * 4 + 1], b: data[(canvas.height - 1) * canvas.width * 4 + 2] },
        // Bottom-right corner
        { r: data[(canvas.height * canvas.width - 1) * 4], g: data[(canvas.height * canvas.width - 1) * 4 + 1], b: data[(canvas.height * canvas.width - 1) * 4 + 2] },
        // Center of top edge
        { r: data[Math.floor(canvas.width / 2) * 4], g: data[Math.floor(canvas.width / 2) * 4 + 1], b: data[Math.floor(canvas.width / 2) * 4 + 2] }
      ];
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const pixelR = data[i];
        const pixelG = data[i + 1];
        const pixelB = data[i + 2];
        
        // Check if pixel matches any background color
        let isBackground = false;
        for (const bgColor of backgroundColors) {
          const diff = Math.sqrt(
            Math.pow(pixelR - bgColor.r, 2) + 
            Math.pow(pixelG - bgColor.g, 2) + 
            Math.pow(pixelB - bgColor.b, 2)
          );
          
          if (diff < tolerance) {
            isBackground = true;
            break;
          }
        }
        
        // If pixel is background, make it transparent
        if (isBackground) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Function to process overlay and cache the result
const processOverlay = async (overlayUrl: string): Promise<string> => {
  try {
    // Check if we already have a processed version in cache
    const cacheKey = `processed_${overlayUrl}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Process the overlay with higher tolerance for better results
    const transparentOverlay = await makeBackgroundTransparent(overlayUrl, 80);
    
    // Cache the result
    sessionStorage.setItem(cacheKey, transparentOverlay);
    
    return transparentOverlay;
  } catch (error) {
    console.warn('Failed to process overlay:', error);
    // Return original if processing fails
    return overlayUrl;
  }
};

// CSS-based background removal (alternative method)
const createCSSBackgroundRemoval = (overlayUrl: string, backgroundColor: string = '#ffffff'): string => {
  return `
    background-image: url('${overlayUrl}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    filter: brightness(0) saturate(100%) invert(0) sepia(0) saturate(0) hue-rotate(0deg) brightness(1) contrast(1);
    mix-blend-mode: multiply;
  `;
};

const TEMPLATES: Template[] = [
  {
    id: 1,
    name: "EvoGear X Tefuda",
    category: "Gaming",
    image: "/overlays/EvoGear X Tefuda.png",
    overlay: "/overlays/EvoGear X Tefuda.png",
    premium: false,
  },
  {
    id: 2,
    name: "EvoGear Pokemon",
    category: "Gaming",
    image: "/overlays/EvoGear Pokemon.png",
    overlay: "/overlays/EvoGear Pokemon.png",
    premium: false,
  },
  {
    id: 3,
    name: "EvoGear Yu-gi-oh",
    category: "Gaming",
    image: "/overlays/EvoGear Yu-gi-hu.png",
    overlay: "/overlays/EvoGear Yu-gi-hu.png",
    premium: true,
  },
  {
    id: 4,
    name: "EvoGear Digimon",
    category: "Gaming",
    image: "/overlays/EvoGear Digimon.png",
    overlay: "/overlays/EvoGear Digimon.png",
    premium: false,
  },
  {
    id: 5,
    name: "EvoGear Weiss Schwarz",
    category: "Gaming",
    image: "/overlays/EvoGear Weiss schwarz.png",
    overlay: "/overlays/EvoGear Weiss schwarz.png",
    premium: true,
  },
  {
    id: 6,
    name: "EvoGear Vanguard",
    category: "Gaming",
    image: "/overlays/EvoGear Vanguard.png",
    overlay: "/overlays/EvoGear Vanguard.png",
    premium: false,
  },
  // Suggested Templates
  {
    id: 7,
    name: "Minimalist Gaming",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
  {
    id: 8,
    name: "Abstract Geometric",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
  {
    id: 9,
    name: "Nature Landscape",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
  {
    id: 10,
    name: "Space Theme",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
  {
    id: 11,
    name: "Retro Gaming",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
  {
    id: 12,
    name: "Modern Tech",
    category: "Suggested",
    image: "/placeholder.svg",
    overlay: "/placeholder.svg",
    premium: false,
  },
]



interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void
  onRemoveTemplate: () => void
  selectedTemplateId?: number | null
  horizontal?: boolean
  cardSize?: 'small' | 'normal';
}

export function TemplateGallery({ 
  onSelectTemplate, 
  onRemoveTemplate, 
  selectedTemplateId, 
  horizontal, 
  cardSize = 'normal' 
}: TemplateGalleryProps) {
  const [processedOverlays, setProcessedOverlays] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("Gaming")

  const filteredTemplates = TEMPLATES.filter(template => template.category === activeTab)

  const handleTemplateClick = async (template: Template) => {
    if (selectedTemplateId === template.id) {
      // If clicking the same template, remove it
      onRemoveTemplate()
    } else {
      // Process the overlay to make background transparent
      let processedOverlay = template.overlay
      if (!processedOverlays[template.overlay]) {
        try {
          console.log('Processing overlay:', template.overlay)
          processedOverlay = await processOverlay(template.overlay)
          console.log('Processed overlay result:', processedOverlay.substring(0, 50) + '...')
          setProcessedOverlays(prev => ({
            ...prev,
            [template.overlay]: processedOverlay
          }))
        } catch (error) {
          console.warn('Failed to process overlay:', error)
          // Use original overlay if processing fails
          processedOverlay = template.overlay
        }
      } else {
        processedOverlay = processedOverlays[template.overlay]
        console.log('Using cached processed overlay')
      }
      
      // Select the new template with processed overlay
      onSelectTemplate({
        ...template,
        overlay: processedOverlay
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Gaming">Gaming</TabsTrigger>
          <TabsTrigger value="Suggested">Suggested</TabsTrigger>
        </TabsList>
        
        <TabsContent value="Gaming" className="mt-4">
          {horizontal ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id
                return (
                  <Card
                    key={template.id}
                    className={
                      cardSize === 'small'
                        ? `min-w-[120px] max-w-[140px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`
                        : `min-w-[200px] max-w-[220px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`
                    }
                  >
                    <CardContent className={cardSize === 'small' ? 'p-1' : 'p-3'}>
                      <div className={cardSize === 'small' ? 'relative aspect-[4/3] mb-1' : 'relative aspect-[4/3] mb-2'}>
                        <div
                          onClick={() => handleTemplateClick(template)}
                          className="relative aspect-[4/3] cursor-pointer"
                        >
                          <Image
                            src={template.image || "/placeholder.svg"}
                            alt={template.name}
                            fill
                            className="object-contain rounded hover:ring-2 hover:ring-blue-500 bg-gray-100"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
                              <Check className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className={cardSize === 'small' ? 'font-medium text-xs mb-0.5' : 'font-medium text-sm mb-1'}>{template.name}</h4>
                      <p className={cardSize === 'small' ? 'text-[10px] text-gray-500 mb-1' : 'text-xs text-gray-500 mb-2'}>{template.category}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id
                return (
                  <Card key={template.id} className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}>
                    <CardContent className="p-3">
                      <div className="relative aspect-[4/3] mb-2">
                        <div
                          onClick={() => handleTemplateClick(template)}
                          className="relative aspect-[4/3] cursor-pointer"
                        >
                          <Image
                            src={template.image || "/placeholder.svg"}
                            alt={template.name}
                            fill
                            className="object-contain rounded hover:ring-2 hover:ring-blue-500 bg-gray-100"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
                              <Check className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="Suggested" className="mt-4">
          {horizontal ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id
                return (
                  <Card
                    key={template.id}
                    className={
                      cardSize === 'small'
                        ? `min-w-[120px] max-w-[140px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`
                        : `min-w-[200px] max-w-[220px] cursor-pointer hover:shadow-lg transition-shadow flex-shrink-0 ${
                            isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                          }`
                    }
                  >
                    <CardContent className={cardSize === 'small' ? 'p-1' : 'p-3'}>
                      <div className={cardSize === 'small' ? 'relative aspect-[4/3] mb-1' : 'relative aspect-[4/3] mb-2'}>
                        <div
                          onClick={() => handleTemplateClick(template)}
                          className="relative aspect-[4/3] cursor-pointer"
                        >
                          <Image
                            src={template.image || "/placeholder.svg"}
                            alt={template.name}
                            fill
                            className="object-contain rounded hover:ring-2 hover:ring-blue-500 bg-gray-100"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
                              <Check className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className={cardSize === 'small' ? 'font-medium text-xs mb-0.5' : 'font-medium text-sm mb-1'}>{template.name}</h4>
                      <p className={cardSize === 'small' ? 'text-[10px] text-gray-500 mb-1' : 'text-xs text-gray-500 mb-2'}>{template.category}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplateId === template.id
                return (
                  <Card key={template.id} className={`cursor-pointer hover:shadow-lg transition-shadow ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}>
                    <CardContent className="p-3">
                      <div className="relative aspect-[4/3] mb-2">
                        <div
                          onClick={() => handleTemplateClick(template)}
                          className="relative aspect-[4/3] cursor-pointer"
                        >
                          <Image
                            src={template.image || "/placeholder.svg"}
                            alt={template.name}
                            fill
                            className="object-contain rounded hover:ring-2 hover:ring-blue-500 bg-gray-100"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded flex items-center justify-center">
                              <Check className="h-6 w-6 text-white bg-blue-500 rounded-full p-1" />
                            </div>
                          )}
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-500 mb-2">{template.category}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
