"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import {
  Crop,
  Sun,
  Palette,
  Type,
  Download,
  Settings,
  X,
  Check,
  Image as ImageIcon,
  Filter,
  Contrast,
  Layers,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ImageEditorProps {
  imageSrc: string | null;
  onImageChange: (newImageSrc: string) => void;
  onClose: () => void;
  aspectRatio?: number;
  mousepadSize?: string;
}

interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  sharpen: number;
  gamma: number;
}

interface Filter {
  name: string;
  value: string;
  preview: string;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
  opacity: number;
  bold: boolean;
  italic: boolean;
  shadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

const FILTERS: Filter[] = [
  { name: 'None', value: 'none', preview: 'filter-none' },
  { name: 'Grayscale', value: 'grayscale(100%)', preview: 'filter-grayscale' },
  { name: 'Sepia', value: 'sepia(100%)', preview: 'filter-sepia' },
  { name: 'Vintage', value: 'sepia(50%) contrast(120%) brightness(90%)', preview: 'filter-vintage' },
  { name: 'Cool', value: 'hue-rotate(180deg) saturate(120%)', preview: 'filter-cool' },
  { name: 'Warm', value: 'sepia(30%) saturate(140%) brightness(110%)', preview: 'filter-warm' },
  { name: 'Dramatic', value: 'contrast(150%) brightness(80%) saturate(120%)', preview: 'filter-dramatic' },
  { name: 'Fade', value: 'opacity(80%) contrast(90%)', preview: 'filter-fade' },
  { name: 'High Contrast', value: 'contrast(200%) brightness(90%)', preview: 'filter-high-contrast' },
  { name: 'Low Saturation', value: 'saturate(50%)', preview: 'filter-low-saturation' },
];

const FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
  'Comic Sans MS',
  'Orbitron',
  'Audiowide',
  'Roboto',
  'Open Sans',
  'Lato',
  'Poppins',
  'Montserrat',
];

export default function EnhancedImageEditor({
  imageSrc,
  onImageChange,
  onClose,
  aspectRatio = 16 / 9,
  mousepadSize = '400x900',
}: ImageEditorProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(imageSrc);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    sharpen: 0,
    gamma: 100,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('crop');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalCropArea, setOriginalCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [imageContainer, setImageContainer] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [imageBounds, setImageBounds] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [textSettings, setTextSettings] = useState({
    fontSize: 24,
    color: '#000000',
    fontFamily: 'Arial',
    bold: false,
    italic: false,
    shadow: false,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);



  // Debug log for image loading
  useEffect(() => {
    console.log('Current image in editor:', currentImage ? 'Image loaded' : 'No image');
    console.log('Active tab:', activeTab);
  }, [currentImage, activeTab]);



  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    try {
      setIsProcessing(true);
      let processedFile: File | Blob = file;

      // Compress if too large
      if (file.size > 10 * 1024 * 1024) {
        processedFile = await imageCompression(file, {
          maxSizeMB: 10,
          maxWidthOrHeight: 4000,
          useWebWorker: true,
        });
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCurrentImage(result);
        setIsProcessing(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
    }
  };

  // Apply adjustments and filters
  const applyEffects = useCallback(async (): Promise<string> => {
    if (!currentImage) return '';

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply adjustments using CSS filters
        const adjustedCanvas = document.createElement('canvas');
        const adjustedCtx = adjustedCanvas.getContext('2d');
        adjustedCanvas.width = canvas.width;
        adjustedCanvas.height = canvas.height;

        if (adjustedCtx) {
          adjustedCtx.filter = `
            brightness(${adjustments.brightness}%)
            contrast(${adjustments.contrast}%)
            saturate(${adjustments.saturation}%)
            blur(${adjustments.blur}px)
            ${selectedFilter !== 'none' ? selectedFilter : ''}
          `;
          adjustedCtx.drawImage(img, 0, 0);
        }

        resolve(adjustedCanvas.toDataURL('image/jpeg', 0.95));
      };

      img.src = currentImage;
    });
  }, [currentImage, adjustments, selectedFilter]);

  // Crop image
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!currentImage) return;

    setIsProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Apply zoom first
          const zoomedCanvas = document.createElement('canvas');
          const zoomedCtx = zoomedCanvas.getContext('2d');
          const zoomedWidth = img.width * zoom;
          const zoomedHeight = img.height * zoom;
          
          zoomedCanvas.width = zoomedWidth;
          zoomedCanvas.height = zoomedHeight;
          
          if (zoomedCtx) {
            zoomedCtx.drawImage(img, 0, 0, zoomedWidth, zoomedHeight);
          }
          
          // Now apply crop
          const cropX = Math.max(0, (cropArea.x / 100) * zoomedWidth);
          const cropY = Math.max(0, (cropArea.y / 100) * zoomedHeight);
          const cropWidth = Math.min(zoomedWidth - cropX, (cropArea.width / 100) * zoomedWidth);
          const cropHeight = Math.min(zoomedHeight - cropY, (cropArea.height / 100) * zoomedHeight);
          
          // Ensure minimum crop size
          if (cropWidth < 1 || cropHeight < 1) {
            throw new Error('Crop area too small');
          }

          canvas.width = cropWidth;
          canvas.height = cropHeight;

          if (ctx) {
            ctx.drawImage(
              zoomedCanvas,
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              cropWidth,
              cropHeight
            );
          }

          const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
          setCurrentImage(croppedImage);
          onImageChange(croppedImage); // Update the parent component
          setCropArea({ x: 10, y: 10, width: 80, height: 80 });
          setZoom(1);
        } catch (error) {
          console.error('Error during crop operation:', error);
          // Reset to safe state
          setCropArea({ x: 10, y: 10, width: 80, height: 80 });
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        console.error('Failed to load image for cropping');
        setIsProcessing(false);
      };

      img.src = currentImage;
    } catch (error) {
      console.error('Error in handleCrop:', error);
      setIsProcessing(false);
    }
  };

  // Text overlay functions
  const addTextOverlay = () => {
    if (!textInput.trim()) return;

    const newText: TextOverlay = {
      id: Date.now().toString(),
      text: textInput,
      x: 50,
      y: 50,
      fontSize: textSettings.fontSize,
      color: textSettings.color,
      fontFamily: textSettings.fontFamily,
      rotation: 0,
      opacity: 100,
      bold: textSettings.bold,
      italic: textSettings.italic,
      shadow: textSettings.shadow,
      shadowColor: textSettings.shadowColor,
      shadowBlur: textSettings.shadowBlur,
      shadowOffsetX: textSettings.shadowOffsetX,
      shadowOffsetY: textSettings.shadowOffsetY,
    };

    setTextOverlays(prev => [...prev, newText]);
    setSelectedTextId(newText.id);
    setTextInput('');
    setShowTextEditor(false);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(prev => prev.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(text => text.id !== id));
    setSelectedTextId(null);
  };

  // Apply all changes and return final image
  const applyAllChanges = async (): Promise<string> => {
    if (!currentImage) return '';

    setIsProcessing(true);
    
    try {
      // First apply effects
      const effectedImage = await applyEffects();
      
      // Then add text overlays
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          if (ctx) {
            ctx.drawImage(img, 0, 0);

            // Draw text overlays
            textOverlays.forEach(text => {
              ctx.save();
              ctx.translate(text.x * canvas.width / 100, text.y * canvas.height / 100);
              ctx.rotate((text.rotation * Math.PI) / 180);
              ctx.globalAlpha = text.opacity / 100;

              const fontSize = (text.fontSize * canvas.width) / 1000;
              ctx.font = `${text.bold ? 'bold' : 'normal'} ${text.italic ? 'italic' : 'normal'} ${fontSize}px ${text.fontFamily}`;
              ctx.fillStyle = text.color;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              if (text.shadow) {
                ctx.shadowColor = text.shadowColor;
                ctx.shadowBlur = text.shadowBlur;
                ctx.shadowOffsetX = text.shadowOffsetX;
                ctx.shadowOffsetY = text.shadowOffsetY;
              }

              ctx.fillText(text.text, 0, 0);
              ctx.restore();
            });
          }

          const finalImage = canvas.toDataURL('image/jpeg', 0.95);
          setIsProcessing(false);
          resolve(finalImage);
        };

        img.src = effectedImage;
      });
    } catch (error) {
      console.error('Error applying changes:', error);
      setIsProcessing(false);
      return currentImage;
    }
  };

  // Save changes
  const handleSave = async () => {
    const finalImage = await applyAllChanges();
    onImageChange(finalImage);
    onClose();
  };

  // Calculate image bounds when image loads
  const calculateImageBounds = useCallback(() => {
    if (imageRef.current && imageContainerRef.current) {
      const container = imageContainerRef.current.getBoundingClientRect();
      const img = imageRef.current.getBoundingClientRect();
      
      console.log('Calculating bounds:', { container, img });
      
      // Prevent division by zero and ensure valid dimensions
      if (container.width > 0 && container.height > 0) {
        setImageContainer({ width: container.width, height: container.height });
        setImageBounds({
          x: img.left - container.left,
          y: img.top - container.top,
          width: img.width,
          height: img.height
        });
        console.log('Bounds set:', { width: container.width, height: container.height });
      } else {
        console.log('Invalid container dimensions:', { width: container.width, height: container.height });
      }
    } else {
      console.log('Missing refs:', { imageRef: !!imageRef.current, imageContainerRef: !!imageContainerRef.current });
    }
  }, []);

  // Crop area interaction functions
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target as HTMLElement;
    console.log('Mouse down on:', target.className, 'data-handle:', target.dataset.handle);
    
    // Check if the target or any of its parents has the crop-handle class
    let currentTarget = target;
    while (currentTarget && currentTarget !== e.currentTarget) {
      if (currentTarget.classList.contains('crop-handle')) {
        setDragMode('resize');
        setResizeHandle(currentTarget.dataset.handle || null);
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setOriginalCropArea(cropArea);
        return;
      }
      currentTarget = currentTarget.parentElement as HTMLElement;
    }
    
    // If not a handle, check if it's the crop area
    if (target.classList.contains('crop-area') || target.closest('.crop-area')) {
      setDragMode('move');
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setOriginalCropArea(cropArea);
    }
  };

  const handleCropMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging || !imageContainer.width || !imageContainer.height) {
      console.log('Mouse move blocked:', { isDragging, imageContainerWidth: imageContainer.width, imageContainerHeight: imageContainer.height });
      return;
    }
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (dragMode === 'move') {
      const deltaXPercent = (deltaX / imageContainer.width) * 100;
      const deltaYPercent = (deltaY / imageContainer.height) * 100;
      
      setCropArea(prev => ({
        x: Math.max(0, Math.min(100 - originalCropArea.width, originalCropArea.x + deltaXPercent)),
        y: Math.max(0, Math.min(100 - originalCropArea.height, originalCropArea.y + deltaYPercent)),
        width: originalCropArea.width,
        height: originalCropArea.height,
      }));
    } else if (dragMode === 'resize' && resizeHandle) {
      const deltaXPercent = (deltaX / imageContainer.width) * 100;
      const deltaYPercent = (deltaY / imageContainer.height) * 100;
      
      setCropArea(prev => {
        let newArea = { ...prev };
        
        switch (resizeHandle) {
          case 'nw':
            newArea.x = Math.max(0, originalCropArea.x + deltaXPercent);
            newArea.y = Math.max(0, originalCropArea.y + deltaYPercent);
            newArea.width = Math.max(20, Math.min(100 - newArea.x, originalCropArea.width - deltaXPercent));
            newArea.height = Math.max(20, Math.min(100 - newArea.y, originalCropArea.height - deltaYPercent));
            break;
          case 'ne':
            newArea.y = Math.max(0, originalCropArea.y + deltaYPercent);
            newArea.width = Math.max(20, Math.min(100 - originalCropArea.x, originalCropArea.width + deltaXPercent));
            newArea.height = Math.max(20, Math.min(100 - newArea.y, originalCropArea.height - deltaYPercent));
            break;
          case 'sw':
            newArea.x = Math.max(0, originalCropArea.x + deltaXPercent);
            newArea.width = Math.max(20, Math.min(100 - newArea.x, originalCropArea.width - deltaXPercent));
            newArea.height = Math.max(20, Math.min(100 - originalCropArea.y, originalCropArea.height + deltaYPercent));
            break;
          case 'se':
            newArea.width = Math.max(20, Math.min(100 - originalCropArea.x, originalCropArea.width + deltaXPercent));
            newArea.height = Math.max(20, Math.min(100 - originalCropArea.y, originalCropArea.height + deltaYPercent));
            break;
          case 'n':
            newArea.y = Math.max(0, originalCropArea.y + deltaYPercent);
            newArea.height = Math.max(20, Math.min(100 - newArea.y, originalCropArea.height - deltaYPercent));
            break;
          case 's':
            newArea.height = Math.max(20, Math.min(100 - originalCropArea.y, originalCropArea.height + deltaYPercent));
            break;
          case 'w':
            newArea.x = Math.max(0, originalCropArea.x + deltaXPercent);
            newArea.width = Math.max(20, Math.min(100 - newArea.x, originalCropArea.width - deltaXPercent));
            break;
          case 'e':
            newArea.width = Math.max(20, Math.min(100 - originalCropArea.x, originalCropArea.width + deltaXPercent));
            break;
        }
        
        // Maintain aspect ratio if needed (for corner handles and when aspect ratio is enforced)
        if (aspectRatio && aspectRatio !== 0 && ['nw', 'ne', 'sw', 'se'].includes(resizeHandle || '')) {
          const currentRatio = newArea.width / newArea.height;
          if (Math.abs(currentRatio - aspectRatio) > 0.1) {
            // Calculate which dimension changed more and adjust the other accordingly
            const widthChange = Math.abs(newArea.width - originalCropArea.width);
            const heightChange = Math.abs(newArea.height - originalCropArea.height);
            
            if (widthChange > heightChange) {
              // Width changed more, adjust height
              const targetHeight = newArea.width / aspectRatio;
              // Check if the target height would fit within bounds
              if (targetHeight >= 20 && targetHeight <= 100 - newArea.y) {
                newArea.height = targetHeight;
              } else {
                // If height can't be adjusted, adjust width instead
                const maxHeight = 100 - newArea.y;
                const minHeight = 20;
                if (maxHeight >= minHeight) {
                  const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, targetHeight));
                  newArea.height = constrainedHeight;
                  newArea.width = constrainedHeight * aspectRatio;
                  // Ensure width stays within bounds
                  newArea.width = Math.max(20, Math.min(100 - newArea.x, newArea.width));
                }
              }
            } else {
              // Height changed more, adjust width
              const targetWidth = newArea.height * aspectRatio;
              // Check if the target width would fit within bounds
              if (targetWidth >= 20 && targetWidth <= 100 - newArea.x) {
                newArea.width = targetWidth;
              } else {
                // If width can't be adjusted, adjust height instead
                const maxWidth = 100 - newArea.x;
                const minWidth = 20;
                if (maxWidth >= minWidth) {
                  const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, targetWidth));
                  newArea.width = constrainedWidth;
                  newArea.height = constrainedWidth / aspectRatio;
                  // Ensure height stays within bounds
                  newArea.height = Math.max(20, Math.min(100 - newArea.y, newArea.height));
                }
              }
            }
          }
        }
        
        return newArea;
      });
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
    setResizeHandle(null);
    
    // Validate and fix crop area if it became invalid during resize
    setCropArea(prev => {
      const fixedArea = { ...prev };
      
      // Ensure minimum size
      if (fixedArea.width < 20) fixedArea.width = 20;
      if (fixedArea.height < 20) fixedArea.height = 20;
      
      // Ensure position is within bounds
      if (fixedArea.x < 0) fixedArea.x = 0;
      if (fixedArea.y < 0) fixedArea.y = 0;
      if (fixedArea.x + fixedArea.width > 100) {
        fixedArea.x = Math.max(0, 100 - fixedArea.width);
      }
      if (fixedArea.y + fixedArea.height > 100) {
        fixedArea.y = Math.max(0, 100 - fixedArea.height);
      }
      
      return fixedArea;
    });
  };

  // Calculate bounds when image loads
  useEffect(() => {
    if (currentImage && activeTab === 'crop') {
      // Use a longer timeout to ensure the image is fully rendered
      const timer = setTimeout(calculateImageBounds, 200);
      return () => clearTimeout(timer);
    }
  }, [currentImage, activeTab, calculateImageBounds]);

  // Reset crop state when switching modes
  useEffect(() => {
    if (activeTab === 'crop') {
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      // Also reset the interactive crop area to a safe default
      setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    }
  }, [activeTab]);

  // Global mouse event listeners for crop interaction
  useEffect(() => {
    if (activeTab !== 'crop') return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleCropMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleCropMouseUp();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [activeTab, isDragging]);

  // Keyboard shortcuts for crop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'crop') return;
      
      const step = e.shiftKey ? 5 : 1; // Larger step with Shift
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCropArea(prev => ({
            ...prev,
            x: Math.max(0, Math.min(100 - prev.width, prev.x - step))
          }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCropArea(prev => ({
            ...prev,
            x: Math.max(0, Math.min(100 - prev.width, prev.x + step))
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setCropArea(prev => ({
            ...prev,
            y: Math.max(0, Math.min(100 - prev.height, prev.y - step))
          }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setCropArea(prev => ({
            ...prev,
            y: Math.max(0, Math.min(100 - prev.height, prev.y + step))
          }));
          break;
        case 'Escape':
          setCropArea({ x: 10, y: 10, width: 80, height: 80 });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Reset all editor settings
  const resetAdjustments = () => {
    // Reset image adjustments
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpen: 0,
      gamma: 100,
    });
    
    // Reset filters and transformations
    setSelectedFilter('none');
    setZoom(1);
    
    // Reset crop settings
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
    setCrop({ x: 0, y: 0 });
    setCroppedAreaPixels(null);
    
    // Reset text overlays
    setTextOverlays([]);
    setSelectedTextId(null);
    
    // Reset text settings
    setTextSettings({
      fontSize: 24,
      color: '#000000',
      fontFamily: 'Arial',
      bold: false,
      italic: false,
      shadow: false,
      shadowColor: '#000000',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
    });
  };

  if (!currentImage) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Enhanced Image Editor
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <ImageIcon className="h-16 w-16 text-gray-400" />
            <p className="text-gray-500">No image selected</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-full">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Enhanced Image Editor</h2>
                <Badge variant="secondary">{mousepadSize}</Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={resetAdjustments}>
                        Reset
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset all editor settings (adjustments, crop, text, etc.)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button onClick={handleSave} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Apply Changes'}
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Image Preview */}
              <div className="flex-1 p-4 bg-gray-50 overflow-auto">
                <div className="flex items-center justify-center h-full">
                  <div className="relative max-w-full max-h-full">
                                         {activeTab === 'crop' ? (
                       <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
                         {currentImage ? (
                           <>
                                                           {/* Enhanced Interactive crop mode */}
                                <div 
                                  ref={imageContainerRef}
                                  className="relative w-full h-full flex items-center justify-center cursor-crosshair select-none"
                                  onMouseMove={handleCropMouseMove}
                                  onMouseUp={handleCropMouseUp}
                                  onMouseLeave={handleCropMouseUp}
                                >
                                  <div className="relative">
                                    <img
                                      ref={imageRef}
                                      src={currentImage}
                                      alt="Crop preview"
                                      className="max-w-full max-h-full object-contain"
                                      style={{
                                        transform: `scale(${zoom})`,
                                      }}
                                      onLoad={calculateImageBounds}
                                    />
                                    
                                    {/* Dark overlay outside crop area */}
                                    <div className="absolute inset-0 bg-black bg-opacity-60" />
                                    
                                    {/* Crop area (transparent) */}
                                    <div
                                      className="crop-area absolute border-2 border-white border-dashed cursor-move"
                                      style={{
                                        left: `${cropArea.x}%`,
                                        top: `${cropArea.y}%`,
                                        width: `${cropArea.width}%`,
                                        height: `${cropArea.height}%`,
                                        backgroundColor: 'transparent',
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                                      }}
                                      onMouseDown={handleCropMouseDown}
                                    >
                                      {/* Grid lines inside crop area */}
                                      <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/3 left-0 right-0 border-t border-white border-opacity-40"></div>
                                        <div className="absolute top-2/3 left-0 right-0 border-t border-white border-opacity-40"></div>
                                        <div className="absolute left-1/3 top-0 bottom-0 border-l border-white border-opacity-40"></div>
                                        <div className="absolute left-2/3 top-0 bottom-0 border-l border-white border-opacity-40"></div>
                                      </div>
                                      
                                      {/* Corner resize handles */}
                                      <div 
                                        className="crop-handle absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-nw-resize rounded-sm hover:bg-blue-50"
                                        data-handle="nw"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-ne-resize rounded-sm hover:bg-blue-50"
                                        data-handle="ne"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-sw-resize rounded-sm hover:bg-blue-50"
                                        data-handle="sw"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-se-resize rounded-sm hover:bg-blue-50"
                                        data-handle="se"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      
                                      {/* Edge resize handles */}
                                      <div 
                                        className="crop-handle absolute top-1/2 -left-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-w-resize rounded-sm hover:bg-blue-50 transform -translate-y-1/2"
                                        data-handle="w"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute top-1/2 -right-2 w-4 h-4 bg-white border-2 border-blue-500 cursor-e-resize rounded-sm hover:bg-blue-50 transform -translate-y-1/2"
                                        data-handle="e"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute -top-2 left-1/2 w-4 h-4 bg-white border-2 border-blue-500 cursor-n-resize rounded-sm hover:bg-blue-50 transform -translate-x-1/2"
                                        data-handle="n"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      <div 
                                        className="crop-handle absolute -bottom-2 left-1/2 w-4 h-4 bg-white border-2 border-blue-500 cursor-s-resize rounded-sm hover:bg-blue-50 transform -translate-x-1/2"
                                        data-handle="s"
                                        onMouseDown={handleCropMouseDown}
                                      />
                                      
                                      {/* Crop info overlay */}
                                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        {Math.round(cropArea.width)}% × {Math.round(cropArea.height)}%
                                      </div>
                                    </div>
                                  </div>
                                </div>
                             ) : (
                               // Advanced crop mode with react-easy-crop
                               <div className="w-full h-full bg-black flex items-center justify-center">
                                 <Cropper
                                   image={currentImage}
                                   crop={crop}
                                   zoom={zoom}
                                   aspect={aspectRatio}
                                   onCropChange={setCrop}
                                   onZoomChange={setZoom}
                                   onCropComplete={onCropComplete}
                                   cropShape="rect"
                                   showGrid={true}
                                   restrictPosition={true}
                                   style={{
                                     containerStyle: {
                                       width: '100%',
                                       height: '100%',
                                       backgroundColor: '#000',
                                     },
                                     cropAreaStyle: {
                                       border: '2px solid #fff',
                                       color: 'rgba(255, 255, 255, 0.5)',
                                     },
                                     mediaStyle: {
                                       width: '100%',
                                       height: '100%',
                                       objectFit: 'contain',
                                     },
                                   }}
                                 />
                               </div>
                             )&rbrace;
                             
                             {/* Debug info */}
                             <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded p-2 text-white text-xs">
                               <div>Mode: Interactive</div>
                               <div>Zoom: {Math.round(zoom * 100)}%</div>
                               <div>Crop: {Math.round(crop.x)}, {Math.round(crop.y)}</div>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-center h-full text-white">
                             <div className="text-center">
                               <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                               <p>No image loaded</p>
                             </div>
                           </div>
                         )}
                       </div>
                    ) : (
                      <div className="relative">
                        <img
                          src={currentImage}
                          alt="Preview"
                          className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                          style={{
                            filter: `
                              brightness(${adjustments.brightness}%)
                              contrast(${adjustments.contrast}%)
                              saturate(${adjustments.saturation}%)
                              blur(${adjustments.blur}px)
                              ${selectedFilter !== 'none' ? selectedFilter : ''}
                            `,
                          }}
                        />
                        
                        {/* Text Overlays Preview */}
                        {textOverlays.map((text) => (
                          <div
                            key={text.id}
                            className={`absolute cursor-move ${
                              selectedTextId === text.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            style={{
                              left: `${text.x}%`,
                              top: `${text.y}%`,
                              transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
                              opacity: text.opacity / 100,
                            }}
                            onClick={() => setSelectedTextId(text.id)}
                          >
                            <div
                              style={{
                                fontFamily: text.fontFamily,
                                fontSize: `${text.fontSize}px`,
                                color: text.color,
                                fontWeight: text.bold ? 'bold' : 'normal',
                                fontStyle: text.italic ? 'italic' : 'normal',
                                textShadow: text.shadow
                                  ? `${text.shadowOffsetX}px ${text.shadowOffsetY}px ${text.shadowBlur}px ${text.shadowColor}`
                                  : 'none',
                              }}
                            >
                              {text.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="w-80 border-l bg-white overflow-y-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="crop" className="text-xs">
                      <Crop className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="adjust" className="text-xs">
                      <Settings className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="text-xs">
                      <Filter className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs">
                      <Type className="h-3 w-3" />
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4 space-y-4">
                                         {/* Crop Tab */}
                     <TabsContent value="crop" className="space-y-4">
                       <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                         💡 <strong>Tips:</strong> Drag to move, use handles to resize, arrow keys for fine control, Shift+arrows for larger steps
                       </div>
                       
                       <div className="space-y-2">
                         <Label className="text-sm font-medium">Crop Area</Label>
                         <div className="grid grid-cols-2 gap-2 text-xs">
                           <div>
                             <span className="text-gray-500">X: {Math.round(cropArea.x)}%</span>
                             <Slider
                               value={[cropArea.x]}
                               onValueChange={([value]) => setCropArea(prev => ({ 
                                 ...prev, 
                                 x: Math.max(0, Math.min(100 - prev.width, value)) 
                               }))}
                               min={0}
                               max={Math.max(0, 100 - cropArea.width)}
                               step={1}
                               className="mt-1"
                             />
                           </div>
                           <div>
                             <span className="text-gray-500">Y: {Math.round(cropArea.y)}%</span>
                             <Slider
                               value={[cropArea.y]}
                               onValueChange={([value]) => setCropArea(prev => ({ 
                                 ...prev, 
                                 y: Math.max(0, Math.min(100 - prev.height, value)) 
                               }))}
                               min={0}
                               max={Math.max(0, 100 - cropArea.height)}
                               step={1}
                               className="mt-1"
                             />
                           </div>
                           <div>
                             <span className="text-gray-500">Width: {Math.round(cropArea.width)}%</span>
                             <Slider
                               value={[cropArea.width]}
                               onValueChange={([value]) => setCropArea(prev => ({ 
                                 ...prev, 
                                 width: Math.max(20, Math.min(100 - prev.x, value)) 
                               }))}
                               min={20}
                               max={Math.max(20, 100 - cropArea.x)}
                               step={1}
                               className="mt-1"
                             />
                           </div>
                           <div>
                             <span className="text-gray-500">Height: {Math.round(cropArea.height)}%</span>
                             <Slider
                               value={[cropArea.height]}
                               onValueChange={([value]) => setCropArea(prev => ({ 
                                 ...prev, 
                                 height: Math.max(20, Math.min(100 - prev.y, value)) 
                               }))}
                               min={20}
                               max={Math.max(20, 100 - cropArea.y)}
                               step={1}
                               className="mt-1"
                             />
                           </div>
                         </div>
                       </div>
                       
                       <div className="space-y-2">
                         <Label className="text-sm font-medium">Quick Presets</Label>
                         <div className="grid grid-cols-2 gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setCropArea({ x: 10, y: 10, width: 80, height: 80 })}
                             className="text-xs"
                           >
                             Center
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setCropArea({ x: 0, y: 0, width: 100, height: 100 })}
                             className="text-xs"
                           >
                             Full Image
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setCropArea({ x: 0, y: 0, width: 50, height: 100 })}
                             className="text-xs"
                           >
                             Left Half
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => setCropArea({ x: 50, y: 0, width: 50, height: 100 })}
                             className="text-xs"
                           >
                             Right Half
                           </Button>
                         </div>
                       </div>
                       
                       <div>
                         <Label className="text-sm font-medium">Zoom</Label>
                         <Slider
                           value={[zoom]}
                           onValueChange={([value]) => setZoom(value)}
                           min={1}
                           max={3}
                           step={0.01}
                           className="mt-2"
                         />
                         <div className="flex justify-between text-xs text-gray-500 mt-1">
                           <span>100%</span>
                           <span>{Math.round(zoom * 100)}%</span>
                           <span>300%</span>
                         </div>
                       </div>

                      <Button onClick={handleCrop} className="w-full" disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Apply Crop'}
                      </Button>
                    </TabsContent>

                    {/* Adjustments Tab */}
                    <TabsContent value="adjust" className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Brightness</Label>
                        <Slider
                          value={[adjustments.brightness]}
                          onValueChange={([value]) => setAdjustments(prev => ({ ...prev, brightness: value }))}
                          min={0}
                          max={200}
                          step={1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.brightness}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Contrast</Label>
                        <Slider
                          value={[adjustments.contrast]}
                          onValueChange={([value]) => setAdjustments(prev => ({ ...prev, contrast: value }))}
                          min={0}
                          max={200}
                          step={1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.contrast}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Saturation</Label>
                        <Slider
                          value={[adjustments.saturation]}
                          onValueChange={([value]) => setAdjustments(prev => ({ ...prev, saturation: value }))}
                          min={0}
                          max={200}
                          step={1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.saturation}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Blur</Label>
                        <Slider
                          value={[adjustments.blur]}
                          onValueChange={([value]) => setAdjustments(prev => ({ ...prev, blur: value }))}
                          min={0}
                          max={10}
                          step={0.1}
                          className="mt-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0px</span>
                          <span>{adjustments.blur}px</span>
                          <span>10px</span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Filters Tab */}
                    <TabsContent value="filters" className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {FILTERS.map((filter) => (
                          <Button
                            key={filter.name}
                            variant={selectedFilter === filter.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedFilter(filter.value)}
                            className="h-16 flex flex-col items-center justify-center text-xs"
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded mb-1" />
                            {filter.name}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Text Tab */}
                    <TabsContent value="text" className="space-y-4">
                      <Button
                        onClick={() => setShowTextEditor(true)}
                        className="w-full"
                      >
                        <Type className="h-4 w-4 mr-2" />
                        Add Text
                      </Button>

                      {textOverlays.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Text Overlays</Label>
                          {textOverlays.map((text) => (
                            <div
                              key={text.id}
                              className={`p-2 border rounded cursor-pointer ${
                                selectedTextId === text.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => setSelectedTextId(text.id)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm truncate">{text.text}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeTextOverlay(text.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedTextId && (
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="text-sm font-medium">Text Properties</Label>
                          
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Slider
                              value={[textOverlays.find(t => t.id === selectedTextId)?.fontSize || 24]}
                              onValueChange={([value]) => updateTextOverlay(selectedTextId, { fontSize: value })}
                              min={8}
                              max={72}
                              step={1}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Font Family</Label>
                            <Select
                              value={textOverlays.find(t => t.id === selectedTextId)?.fontFamily || 'Arial'}
                              onValueChange={(value) => updateTextOverlay(selectedTextId, { fontFamily: value })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONTS.map((font) => (
                                  <SelectItem key={font} value={font}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Color</Label>
                            <Input
                              type="color"
                              value={textOverlays.find(t => t.id === selectedTextId)?.color || '#000000'}
                              onChange={(e) => updateTextOverlay(selectedTextId, { color: e.target.value })}
                              className="h-8"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={textOverlays.find(t => t.id === selectedTextId)?.bold || false}
                              onCheckedChange={(checked) => updateTextOverlay(selectedTextId, { bold: checked })}
                            />
                            <Label className="text-xs">Bold</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={textOverlays.find(t => t.id === selectedTextId)?.shadow || false}
                              onCheckedChange={(checked) => updateTextOverlay(selectedTextId, { shadow: checked })}
                            />
                            <Label className="text-xs">Shadow</Label>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {/* Text Editor Dialog */}
        <Dialog open={showTextEditor} onOpenChange={setShowTextEditor}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Text Overlay</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Text</Label>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter your text..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Font Size</Label>
                  <Slider
                    value={[textSettings.fontSize]}
                    onValueChange={([value]) => setTextSettings(prev => ({ ...prev, fontSize: value }))}
                    min={8}
                    max={72}
                    step={1}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={textSettings.color}
                    onChange={(e) => setTextSettings(prev => ({ ...prev, color: e.target.value }))}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={textSettings.fontFamily}
                  onValueChange={(value) => setTextSettings(prev => ({ ...prev, fontFamily: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={textSettings.bold}
                    onCheckedChange={(checked) => setTextSettings(prev => ({ ...prev, bold: checked }))}
                  />
                  <Label>Bold</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={textSettings.italic}
                    onCheckedChange={(checked) => setTextSettings(prev => ({ ...prev, italic: checked }))}
                  />
                  <Label>Italic</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={textSettings.shadow}
                    onCheckedChange={(checked) => setTextSettings(prev => ({ ...prev, shadow: checked }))}
                  />
                  <Label>Shadow</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowTextEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={addTextOverlay}>
                  Add Text
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 