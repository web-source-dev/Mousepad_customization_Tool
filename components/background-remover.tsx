"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BackgroundRemoverProps {
  imageUrl: string
  onProcessed?: (processedUrl: string) => void
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

export function BackgroundRemover({ imageUrl, onProcessed }: BackgroundRemoverProps) {
  const [tolerance, setTolerance] = useState([50])
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const result = await makeBackgroundTransparent(imageUrl, tolerance[0])
      setProcessedImage(result)
      onProcessed?.(result)
    } catch (error) {
      console.error('Failed to process image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Background Remover</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Tolerance: {tolerance[0]}</label>
            <Slider
              value={tolerance}
              onValueChange={setTolerance}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing}
            className="whitespace-nowrap"
          >
            {isProcessing ? 'Processing...' : 'Remove Background'}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Original</h4>
            <div className="border rounded-lg p-2 bg-gray-100">
              <img 
                src={imageUrl} 
                alt="Original" 
                className="w-full h-auto max-h-48 object-contain"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Processed</h4>
            <div className="border rounded-lg p-2 bg-gray-100">
              {processedImage ? (
                <img 
                  src={processedImage} 
                  alt="Processed" 
                  className="w-full h-auto max-h-48 object-contain"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-gray-500">
                  Process image to see result
                </div>
              )}
            </div>
          </div>
        </div>

        {processedImage && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => {
                const link = document.createElement('a')
                link.href = processedImage
                link.download = 'processed-overlay.png'
                link.click()
              }}
            >
              Download Processed Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 