"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import {
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
  Crop,
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
import { useToast } from '@/components/ui/use-toast';

interface ImageEditorProps {
  imageSrc: string | null;
  onImageChange: (newImageSrc: string) => void;
  onClose: () => void;
  aspectRatio?: number;
  mousepadSize?: string;
  enableLivePreview?: boolean; // New prop for live preview
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  imagePosition?: { x: number; y: number };
  onImagePositionChange?: (position: { x: number; y: number }) => void;
  // Props to preserve editor state
  currentAdjustments?: {
    brightness: number;
    contrast: number;
    saturation: number;
    blur: number;
    sharpen: number;
    gamma: number;
  };
  currentFilter?: string;
  currentTextOverlays?: TextOverlay[];
  onAdjustmentsChange?: (adjustments: any) => void;
  onFilterChange?: (filter: string) => void;
  onTextOverlaysChange?: (textOverlays: TextOverlay[]) => void;
  // Crop props
  currentCrop?: CropArea | null;
  onCropChange?: (crop: CropArea | null) => void;
  // Reset callback
  onReset?: () => void;
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

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
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
  enableLivePreview = true, // Default to true
  zoom = 1,
  onZoomChange,
  imagePosition = { x: 0, y: 0 },
  onImagePositionChange,
  currentAdjustments,
  currentFilter = 'none',
  currentTextOverlays = [],
  onAdjustmentsChange,
  onFilterChange,
  onTextOverlaysChange,
  currentCrop,
  onCropChange,
  onReset,
}: ImageEditorProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(imageSrc);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(
    currentAdjustments || {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpen: 0,
      gamma: 100,
    }
  );
  const [selectedFilter, setSelectedFilter] = useState<string>(currentFilter);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>(currentTextOverlays);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('adjust');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Text dragging state
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [textDragStart, setTextDragStart] = useState({ x: 0, y: 0 });
  const [draggedTextId, setDraggedTextId] = useState<string | null>(null);

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

  // Crop state
  const [cropArea, setCropArea] = useState<CropArea | null>(currentCrop || null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [cropMode, setCropMode] = useState<'select' | 'resize' | 'move'>('select');
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const livePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Debug log for image loading
  useEffect(() => {
    console.log('Current image in editor:', currentImage ? 'Image loaded' : 'No image');
    console.log('Active tab:', activeTab);
  }, [currentImage, activeTab]);

  // Sync state with props when editor opens
  useEffect(() => {
    if (imageSrc) {
      // Always start with the original image, not the processed one
      // This allows users to see the original with their previous settings applied
      setCurrentImage(imageSrc);
    }
  }, [imageSrc]);

  // Sync adjustments with props
  useEffect(() => {
    if (currentAdjustments) {
      setAdjustments(currentAdjustments);
    }
  }, [currentAdjustments]);

  // Sync filter with props
  useEffect(() => {
    if (currentFilter) {
      setSelectedFilter(currentFilter);
    }
  }, [currentFilter]);

  // Sync text overlays with props
  useEffect(() => {
    if (currentTextOverlays) {
      setTextOverlays(currentTextOverlays);
    }
  }, [currentTextOverlays]);

  // Sync crop with props
  useEffect(() => {
    if (currentCrop) {
      setCropArea(currentCrop);
    }
  }, [currentCrop]);

  // Debounced live preview update
  const updateLivePreview = useCallback(async () => {
    if (!enableLivePreview || !currentImage) return;
    
    // Clear existing timeout
    if (livePreviewTimeoutRef.current) {
      clearTimeout(livePreviewTimeoutRef.current);
    }
    
    // Set new timeout for debounced update
    livePreviewTimeoutRef.current = setTimeout(async () => {
      try {
        // Apply only effects for live preview (text overlays are handled by CSS)
        const processedImage = await applyEffects();
        if (processedImage) {
          setProcessedImage(processedImage); // Update secondary preview
          // Don't update main preview - only show changes in editor
        }
      } catch (error) {
        console.error('Error updating live preview:', error);
      }
    }, 300); // 300ms debounce
  }, [enableLivePreview, currentImage, adjustments, selectedFilter]);

  // Initialize processed image when component loads
  useEffect(() => {
    if (currentImage) {
      updateLivePreview();
    }
  }, [currentImage]);

  // Global mouse events for text dragging
  useEffect(() => {
    if (isDraggingText) {
      document.addEventListener('mousemove', handleTextMouseMove);
      document.addEventListener('mouseup', handleTextMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleTextMouseMove);
        document.removeEventListener('mouseup', handleTextMouseUp);
      };
    }
  }, [isDraggingText, draggedTextId, textDragStart]);

  // Global mouse events for crop dragging
  useEffect(() => {
    if (isDraggingCrop) {
      document.addEventListener('mousemove', handleCropMouseMove as any);
      document.addEventListener('mouseup', handleCropMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleCropMouseMove as any);
        document.removeEventListener('mouseup', handleCropMouseUp);
      };
    }
  }, [isDraggingCrop, cropArea, cropMode, resizeHandle, cropDragStart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (livePreviewTimeoutRef.current) {
        clearTimeout(livePreviewTimeoutRef.current);
      }
    };
  }, []);

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
        // Use original image dimensions for processing
        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          // Apply adjustments using CSS filters
          ctx.filter = `
            brightness(${adjustments.brightness}%)
            contrast(${adjustments.contrast}%)
            saturate(${adjustments.saturation}%)
            blur(${adjustments.blur}px)
            ${selectedFilter !== 'none' ? selectedFilter : ''}
          `;
          
          ctx.drawImage(img, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };

      img.src = currentImage;
    });
  }, [currentImage, adjustments, selectedFilter]);

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

    const newTextOverlays = [...textOverlays, newText];
    setTextOverlays(newTextOverlays);
    onTextOverlaysChange?.(newTextOverlays);
    setSelectedTextId(newText.id);
    setTextInput('');
    setShowTextEditor(false);
    
    // Don't update main preview - only show in editor
  };

  const editTextOverlay = (textId: string) => {
    const text = textOverlays.find(t => t.id === textId);
    if (text) {
      setTextInput(text.text);
      setEditingTextId(textId);
      setShowTextEditor(true);
    }
  };

  const saveTextEdit = () => {
    if (!editingTextId || !textInput.trim()) return;

    const newTextOverlays = textOverlays.map(text => 
      text.id === editingTextId ? { ...text, text: textInput } : text
    );
    setTextOverlays(newTextOverlays);
    onTextOverlaysChange?.(newTextOverlays);
    setTextInput('');
    setEditingTextId(null);
    setShowTextEditor(false);
    
    // Don't update main preview - only show in editor
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    const newTextOverlays = textOverlays.map(text => 
      text.id === id ? { ...text, ...updates } : text
    );
    setTextOverlays(newTextOverlays);
    onTextOverlaysChange?.(newTextOverlays);
    // Don't update main preview - only show in editor
  };

  const removeTextOverlay = (id: string) => {
    const newTextOverlays = textOverlays.filter(text => text.id !== id);
    setTextOverlays(newTextOverlays);
    onTextOverlaysChange?.(newTextOverlays);
    setSelectedTextId(null);
    
    // Don't update main preview - only show in editor
  };

  // Text dragging functions
  const handleTextMouseDown = (e: React.MouseEvent, textId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingText(true);
    setDraggedTextId(textId);
    setTextDragStart({ x: e.clientX, y: e.clientY });
    setSelectedTextId(textId);
  };

  const handleTextMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDraggingText || !draggedTextId || !imageContainerRef.current) return;
    
    const deltaX = e.clientX - textDragStart.x;
    const deltaY = e.clientY - textDragStart.y;
    
    // Convert pixel deltas to percentage deltas based on zoomed image size
    const container = imageContainerRef.current.getBoundingClientRect();
    const deltaXPercent = (deltaX / container.width) * 100;
    const deltaYPercent = (deltaY / container.height) * 100;
    
    setTextOverlays(prev => prev.map(text => 
      text.id === draggedTextId 
        ? { ...text, x: text.x + deltaXPercent, y: text.y + deltaYPercent }
        : text
    ));
    
    setTextDragStart({ x: e.clientX, y: e.clientY });
    
    // Don't update main preview - only show in editor
  };

  const handleTextMouseUp = () => {
    if (isDraggingText && draggedTextId) {
      onTextOverlaysChange?.(textOverlays);
      // Don't update main preview - only show in editor
    }
    setIsDraggingText(false);
    setDraggedTextId(null);
  };

  // Crop functions
  const startCrop = () => {
    if (!currentImage) return;
    
    // Initialize crop area to center 80% of image
    const newCropArea = {
      x: 10,
      y: 10,
      width: 80,
      height: 80,
    };
    setCropArea(newCropArea);
    setCropMode('resize');
  };

  const handleCropMouseDown = (e: React.MouseEvent, handle?: string) => {
    if (activeTab !== 'crop' || !cropArea) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (handle) {
      // Resizing specific handle
      setResizeHandle(handle);
      setCropMode('resize');
    } else if (isPointInCropArea(x, y)) {
      // Moving the entire crop area
      setCropMode('move');
    } else {
      // Creating new crop area
      setCropMode('select');
    }
    
    setIsDraggingCrop(true);
    setCropDragStart({ x, y });
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCrop || !cropArea || activeTab !== 'crop') return;
    
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const deltaX = x - cropDragStart.x;
    const deltaY = y - cropDragStart.y;
    
    if (cropMode === 'move') {
      // Move entire crop area
      const newX = Math.max(0, Math.min(100 - cropArea.width, cropArea.x + deltaX));
      const newY = Math.max(0, Math.min(100 - cropArea.height, cropArea.y + deltaY));
      
      setCropArea({ ...cropArea, x: newX, y: newY });
    } else if (cropMode === 'resize' && resizeHandle) {
      // Resize based on handle
      const newCropArea = { ...cropArea };
      
      switch (resizeHandle) {
        case 'nw': // Top-left
          newCropArea.x = Math.min(x, cropArea.x + cropArea.width - 10);
          newCropArea.y = Math.min(y, cropArea.y + cropArea.height - 10);
          newCropArea.width = Math.max(10, cropArea.x + cropArea.width - newCropArea.x);
          newCropArea.height = Math.max(10, cropArea.y + cropArea.height - newCropArea.y);
          break;
        case 'n': // Top
          newCropArea.y = Math.min(y, cropArea.y + cropArea.height - 10);
          newCropArea.height = Math.max(10, cropArea.y + cropArea.height - newCropArea.y);
          break;
        case 'ne': // Top-right
          newCropArea.y = Math.min(y, cropArea.y + cropArea.height - 10);
          newCropArea.width = Math.max(10, x - cropArea.x);
          newCropArea.height = Math.max(10, cropArea.y + cropArea.height - newCropArea.y);
          break;
        case 'w': // Left
          newCropArea.x = Math.min(x, cropArea.x + cropArea.width - 10);
          newCropArea.width = Math.max(10, cropArea.x + cropArea.width - newCropArea.x);
          break;
        case 'e': // Right
          newCropArea.width = Math.max(10, x - cropArea.x);
          break;
        case 'sw': // Bottom-left
          newCropArea.x = Math.min(x, cropArea.x + cropArea.width - 10);
          newCropArea.width = Math.max(10, cropArea.x + cropArea.width - newCropArea.x);
          newCropArea.height = Math.max(10, y - cropArea.y);
          break;
        case 's': // Bottom
          newCropArea.height = Math.max(10, y - cropArea.y);
          break;
        case 'se': // Bottom-right
          newCropArea.width = Math.max(10, x - cropArea.x);
          newCropArea.height = Math.max(10, y - cropArea.y);
          break;
      }
      
      // Ensure crop area stays within bounds
      newCropArea.x = Math.max(0, Math.min(100 - newCropArea.width, newCropArea.x));
      newCropArea.y = Math.max(0, Math.min(100 - newCropArea.height, newCropArea.y));
      
      setCropArea(newCropArea);
    }
    
    setCropDragStart({ x, y });
  };

  const handleCropMouseUp = () => {
    if (!isDraggingCrop) return;
    
    setIsDraggingCrop(false);
    setResizeHandle(null);
    setCropMode('select');
    
    if (cropArea) {
      onCropChange?.(cropArea);
    }
  };

  const isPointInCropArea = (x: number, y: number): boolean => {
    if (!cropArea) return false;
    return x >= cropArea.x && x <= cropArea.x + cropArea.width &&
           y >= cropArea.y && y <= cropArea.y + cropArea.height;
  };

  const applyCrop = async (crop: CropArea) => {
    if (!currentImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        // Calculate crop dimensions in pixels
        const cropX = (crop.x / 100) * img.width;
        const cropY = (crop.y / 100) * img.height;
        const cropWidth = (crop.width / 100) * img.width;
        const cropHeight = (crop.height / 100) * img.height;
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        }
        
        const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
        setCurrentImage(croppedImage);
        setCropArea(null); // Clear crop area after applying
        onCropChange?.(null);
        
        // Update main preview
        onImageChange(croppedImage);
        resolve(croppedImage);
      };
      
      img.src = currentImage;
    });
  };

  const handleApplyCrop = async () => {
    if (cropArea) {
      await applyCrop(cropArea);
    }
  };

  const resetCrop = () => {
    setCropArea(null);
    onCropChange?.(null);
  };

  // Apply all changes and return final image
  const applyAllChanges = async (): Promise<string> => {
    if (!currentImage) return '';

    setIsProcessing(true);
    
    try {
      // First apply effects
      const effectedImage = await applyEffects();
      
      // Then add text overlays and apply zoom/position
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          // Calculate the final canvas size based on zoom
          const zoomedWidth = img.width * zoom;
          const zoomedHeight = img.height * zoom;
          
          canvas.width = zoomedWidth;
          canvas.height = zoomedHeight;

          if (ctx) {
            // Apply zoom and position transformations
            ctx.save();
            ctx.translate(zoomedWidth / 2, zoomedHeight / 2);
            ctx.scale(zoom, zoom);
            ctx.translate(-img.width / 2, -img.height / 2);
            
            // Apply position offset
            const offsetX = (imagePosition.x / 100) * img.width;
            const offsetY = (imagePosition.y / 100) * img.height;
            ctx.translate(offsetX, offsetY);
            
            ctx.drawImage(img, 0, 0);

                         // Draw text overlays - position relative to zoomed image
             textOverlays.forEach(text => {
               ctx.save();
               // Position text relative to the zoomed image dimensions
               const textX = text.x * canvas.width / 100;
               const textY = text.y * canvas.height / 100;
               ctx.translate(textX, textY);
               ctx.rotate((text.rotation * Math.PI) / 180);
               ctx.globalAlpha = text.opacity / 100;

               // Scale font size relative to zoomed image
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
            
            ctx.restore();
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
    try {
      setIsProcessing(true);
      
      // Apply all changes to get the final edited image
      const finalImage = await applyAllChanges();
      
      // Update the image in the main customizer
      onImageChange(finalImage);
      
      // Show success toast
      toast({
        title: "Changes Applied",
        description: "Image has been updated with all customizations applied.",
        duration: 3000,
      });
      
      // Close the editor
      onClose();
    } catch (error) {
      console.error('Error applying changes:', error);
      toast({
        title: "Error",
        description: "Failed to apply changes. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };



  // Reset all editor settings
  const resetAdjustments = () => {
    // Reset image adjustments
    const defaultAdjustments = {
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      sharpen: 0,
      gamma: 100,
    };
    setAdjustments(defaultAdjustments);
    onAdjustmentsChange?.(defaultAdjustments);
    
    // Reset filters and transformations
    setSelectedFilter('none');
    onFilterChange?.('none');
    onZoomChange?.(1);
    onImagePositionChange?.({ x: 0, y: 0 });
    
    // Reset text overlays
    setTextOverlays([]);
    onTextOverlaysChange?.([]);
    setSelectedTextId(null);
    
    // Reset crop
    setCropArea(null);
    onCropChange?.(null);
    
    // Reset crop mode and dragging state
    setCropMode('select');
    setIsDraggingCrop(false);
    setResizeHandle(null);
    
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
    
    // Reset to original image (remove all edits)
    if (imageSrc) {
      setCurrentImage(imageSrc);
      setProcessedImage(null);
      // Call parent's reset callback to restore original image
      onReset?.();
    }
    
    // Update live preview after reset
    updateLivePreview();
    
    // Show success toast
    toast({
      title: "Settings Reset",
      description: "All image settings have been reset to default values.",
      duration: 3000,
    });
    
    // Call the reset callback to update parent component state
    onReset?.();
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
        <div className="flex h-full max-h-[95vh] flex-col lg:flex-row">
          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
                              <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Enhanced Image Editor</h2>
                  <Badge variant="secondary">{mousepadSize}</Badge>
                  {enableLivePreview && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview Only
                    </Badge>
                  )}
                </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => setShowResetConfirm(true)}>
                        Reset All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset all settings: zoom, position, filters, adjustments, crop, and text overlays</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleSave} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : 'Apply & Save'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Apply all changes to the main customizer and save as new base image</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden min-h-0 flex-col lg:flex-row">
              {/* Image Preview */}
              <div className="flex-1 p-4 bg-gray-50 overflow-auto min-h-0">
                <div className="flex items-center justify-center h-full">
                  <div className="relative max-w-full max-h-full">
                    <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden">
                      {currentImage ? (
                        <>
                                                     {/* Image container */}
                                                     <div 
                            ref={imageContainerRef}
                            className="relative w-full h-full flex items-center justify-center select-none"
                            onMouseMove={handleCropMouseMove}
                            onMouseUp={handleCropMouseUp}
                          >
                            <div className="relative">
                                                             <img
                                 ref={imageRef}
                                 src={processedImage || currentImage}
                                 alt="Image preview"
                                 className="max-w-full max-h-full object-contain"
                                 style={{
                                   transform: `scale(${zoom}) translate(${imagePosition.x}%, ${imagePosition.y}%)`,
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
                                   onMouseDown={(e) => handleTextMouseDown(e, text.id)}
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
                            
                            {/* Crop Overlay */}
                            {activeTab === 'crop' && cropArea && (
                              <div className="absolute inset-0">
                                {/* Crop selection rectangle */}
                                <div
                                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
                                  style={{
                                    left: `${cropArea.x}%`,
                                    top: `${cropArea.y}%`,
                                    width: `${cropArea.width}%`,
                                    height: `${cropArea.height}%`,
                                  }}
                                  onMouseDown={(e) => handleCropMouseDown(e)}
                                />
                                
                                {/* Resize handles */}
                                {cropArea && (
                                  <>
                                    {/* Corner handles */}
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize"
                                      style={{
                                        left: `${cropArea.x - 1.5}%`,
                                        top: `${cropArea.y - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'nw')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize"
                                      style={{
                                        left: `${cropArea.x + cropArea.width - 1.5}%`,
                                        top: `${cropArea.y - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'ne')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize"
                                      style={{
                                        left: `${cropArea.x - 1.5}%`,
                                        top: `${cropArea.y + cropArea.height - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'sw')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize"
                                      style={{
                                        left: `${cropArea.x + cropArea.width - 1.5}%`,
                                        top: `${cropArea.y + cropArea.height - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'se')}
                                    />
                                    
                                    {/* Edge handles */}
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-n-resize"
                                      style={{
                                        left: `${cropArea.x + cropArea.width / 2 - 1.5}%`,
                                        top: `${cropArea.y - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'n')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-s-resize"
                                      style={{
                                        left: `${cropArea.x + cropArea.width / 2 - 1.5}%`,
                                        top: `${cropArea.y + cropArea.height - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 's')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-w-resize"
                                      style={{
                                        left: `${cropArea.x - 1.5}%`,
                                        top: `${cropArea.y + cropArea.height / 2 - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'w')}
                                    />
                                    <div
                                      className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-e-resize"
                                      style={{
                                        left: `${cropArea.x + cropArea.width - 1.5}%`,
                                        top: `${cropArea.y + cropArea.height / 2 - 1.5}%`,
                                      }}
                                      onMouseDown={(e) => handleCropMouseDown(e, 'e')}
                                    />
                                  </>
                                )}
                                
                                {/* Crop instructions */}
                                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  {cropMode === 'move' ? 'Drag to move crop area' : 
                                   cropMode === 'resize' ? 'Drag handles to resize' : 
                                   'Click Start Crop to begin'}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Debug info */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded p-2 text-white text-xs">
                            <div>Zoom: {Math.round(zoom * 100)}%</div>
                            <div>Position: {Math.round(imagePosition.x)}, {Math.round(imagePosition.y)}</div>
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
                  </div>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="w-full lg:w-80 border-t lg:border-l lg:border-t-0 bg-white overflow-y-auto flex-shrink-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="adjust" className="text-xs">
                      <Settings className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="filters" className="text-xs">
                      <Filter className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="crop" className="text-xs">
                      <Crop className="h-3 w-3" />
                    </TabsTrigger>
                    <TabsTrigger value="text" className="text-xs">
                      <Type className="h-3 w-3" />
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(95vh-200px)]">
                    {/* Adjustments Tab */}
                    <TabsContent value="adjust" className="space-y-4">
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 <strong>Preview Mode:</strong> Changes are only shown in this editor. Click "Apply & Save" to apply to main customizer.
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Zoom</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[zoom]}
                            onValueChange={([value]) => {
                              onZoomChange?.(value);
                              updateLivePreview();
                            }}
                            min={0.1}
                            max={3}
                            step={0.01}
                            className="flex-1 mt-2"
                          />
                          <Input
                            type="number"
                            value={Math.round(zoom * 100)}
                            onChange={(e) => {
                              const value = Math.max(10, Math.min(300, parseInt(e.target.value) || 100));
                              onZoomChange?.(value / 100);
                              updateLivePreview();
                            }}
                            min={10}
                            max={300}
                            className="w-16 h-8 text-xs"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10%</span>
                          <span>{Math.round(zoom * 100)}%</span>
                          <span>300%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Brightness</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[adjustments.brightness]}
                            onValueChange={([value]) => {
                              const newAdjustments = { ...adjustments, brightness: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            step={1}
                            className="flex-1 mt-2"
                          />
                          <Input
                            type="number"
                            value={adjustments.brightness}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 100));
                              const newAdjustments = { ...adjustments, brightness: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            className="w-16 h-8 text-xs"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.brightness}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Contrast</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[adjustments.contrast]}
                            onValueChange={([value]) => {
                              const newAdjustments = { ...adjustments, contrast: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            step={1}
                            className="flex-1 mt-2"
                          />
                          <Input
                            type="number"
                            value={adjustments.contrast}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 100));
                              const newAdjustments = { ...adjustments, contrast: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            className="w-16 h-8 text-xs"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.contrast}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Saturation</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[adjustments.saturation]}
                            onValueChange={([value]) => {
                              const newAdjustments = { ...adjustments, saturation: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            step={1}
                            className="flex-1 mt-2"
                          />
                          <Input
                            type="number"
                            value={adjustments.saturation}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(200, parseInt(e.target.value) || 100));
                              const newAdjustments = { ...adjustments, saturation: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={200}
                            className="w-16 h-8 text-xs"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0%</span>
                          <span>{adjustments.saturation}%</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Blur</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[adjustments.blur]}
                            onValueChange={([value]) => {
                              const newAdjustments = { ...adjustments, blur: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={10}
                            step={0.1}
                            className="flex-1 mt-2"
                          />
                          <Input
                            type="number"
                            value={adjustments.blur}
                            onChange={(e) => {
                              const value = Math.max(0, Math.min(10, parseFloat(e.target.value) || 0));
                              const newAdjustments = { ...adjustments, blur: value };
                              setAdjustments(newAdjustments);
                              onAdjustmentsChange?.(newAdjustments);
                              updateLivePreview();
                            }}
                            min={0}
                            max={10}
                            step={0.1}
                            className="w-16 h-8 text-xs"
                          />
                        </div>
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
                                                         onClick={() => {
                               setSelectedFilter(filter.value);
                               onFilterChange?.(filter.value);
                               updateLivePreview();
                             }}
                            className="h-16 flex flex-col items-center justify-center text-xs"
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded mb-1" />
                            {filter.name}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Crop Tab */}
                    <TabsContent value="crop" className="space-y-4">
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 <strong>Crop Tool:</strong> Use the 8 handles to resize and move the crop area
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Crop Image</Label>
                          <div className="flex gap-2">
                            {!cropArea && (
                              <Button
                                size="sm"
                                onClick={startCrop}
                                className="text-xs"
                              >
                                Start Crop
                              </Button>
                            )}
                            {cropArea && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={resetCrop}
                                  className="text-xs"
                                >
                                  Reset
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleApplyCrop}
                                  className="text-xs"
                                >
                                  Apply Crop
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>• Click "Start Crop" to begin</p>
                          <p>• Drag the 8 handles to resize</p>
                          <p>• Drag inside the area to move</p>
                          <p>• Click "Apply Crop" to confirm</p>
                        </div>
                        
                        {cropArea && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <div>Crop Area: {Math.round(cropArea.x)}%, {Math.round(cropArea.y)}%</div>
                            <div>Size: {Math.round(cropArea.width)}% × {Math.round(cropArea.height)}%</div>
                          </div>
                        )}
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
                                <div className="flex items-center gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            editTextOverlay(text.id);
                                          }}
                                        >
                                          <Type className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit text content</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedTextId && (
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="text-sm font-medium">Text Properties</Label>
                          
                          <div>
                            <Label className="text-xs">Text Content</Label>
                            <Input
                              value={textOverlays.find(t => t.id === selectedTextId)?.text || ''}
                              onChange={(e) => updateTextOverlay(selectedTextId, { text: e.target.value })}
                              placeholder="Enter text..."
                              className="h-8"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[textOverlays.find(t => t.id === selectedTextId)?.fontSize || 24]}
                                onValueChange={([value]) => updateTextOverlay(selectedTextId, { fontSize: value })}
                                min={8}
                                max={72}
                                step={1}
                                className="flex-1 mt-1"
                              />
                              <Input
                                type="number"
                                value={textOverlays.find(t => t.id === selectedTextId)?.fontSize || 24}
                                onChange={(e) => {
                                  const value = Math.max(8, Math.min(72, parseInt(e.target.value) || 24));
                                  updateTextOverlay(selectedTextId, { fontSize: value });
                                }}
                                min={8}
                                max={72}
                                className="w-12 h-6 text-xs"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>8px</span>
                              <span>{textOverlays.find(t => t.id === selectedTextId)?.fontSize || 24}px</span>
                              <span>72px</span>
                            </div>
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
                            <Label className="text-xs">Text Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="color"
                                value={textOverlays.find(t => t.id === selectedTextId)?.color || '#000000'}
                                onChange={(e) => updateTextOverlay(selectedTextId, { color: e.target.value })}
                                className="h-8 w-12"
                              />
                              <Input
                                value={textOverlays.find(t => t.id === selectedTextId)?.color || '#000000'}
                                onChange={(e) => updateTextOverlay(selectedTextId, { color: e.target.value })}
                                placeholder="#000000"
                                className="h-8 flex-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[textOverlays.find(t => t.id === selectedTextId)?.opacity || 100]}
                                onValueChange={([value]) => updateTextOverlay(selectedTextId, { opacity: value })}
                                min={0}
                                max={100}
                                step={1}
                                className="flex-1 mt-1"
                              />
                              <Input
                                type="number"
                                value={textOverlays.find(t => t.id === selectedTextId)?.opacity || 100}
                                onChange={(e) => {
                                  const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
                                  updateTextOverlay(selectedTextId, { opacity: value });
                                }}
                                min={0}
                                max={100}
                                className="w-12 h-6 text-xs"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>0%</span>
                              <span>{textOverlays.find(t => t.id === selectedTextId)?.opacity || 100}%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Rotation</Label>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[textOverlays.find(t => t.id === selectedTextId)?.rotation || 0]}
                                onValueChange={([value]) => updateTextOverlay(selectedTextId, { rotation: value })}
                                min={-180}
                                max={180}
                                step={1}
                                className="flex-1 mt-1"
                              />
                              <Input
                                type="number"
                                value={textOverlays.find(t => t.id === selectedTextId)?.rotation || 0}
                                onChange={(e) => {
                                  const value = Math.max(-180, Math.min(180, parseInt(e.target.value) || 0));
                                  updateTextOverlay(selectedTextId, { rotation: value });
                                }}
                                min={-180}
                                max={180}
                                className="w-12 h-6 text-xs"
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-180°</span>
                              <span>{textOverlays.find(t => t.id === selectedTextId)?.rotation || 0}°</span>
                              <span>180°</span>
                            </div>
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
                              checked={textOverlays.find(t => t.id === selectedTextId)?.italic || false}
                              onCheckedChange={(checked) => updateTextOverlay(selectedTextId, { italic: checked })}
                            />
                            <Label className="text-xs">Italic</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={textOverlays.find(t => t.id === selectedTextId)?.shadow || false}
                              onCheckedChange={(checked) => updateTextOverlay(selectedTextId, { shadow: checked })}
                            />
                            <Label className="text-xs">Shadow</Label>
                          </div>

                          {textOverlays.find(t => t.id === selectedTextId)?.shadow && (
                            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                              <div>
                                <Label className="text-xs">Shadow Color</Label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    value={textOverlays.find(t => t.id === selectedTextId)?.shadowColor || '#000000'}
                                    onChange={(e) => updateTextOverlay(selectedTextId, { shadowColor: e.target.value })}
                                    className="h-6 w-8"
                                  />
                                  <Input
                                    value={textOverlays.find(t => t.id === selectedTextId)?.shadowColor || '#000000'}
                                    onChange={(e) => updateTextOverlay(selectedTextId, { shadowColor: e.target.value })}
                                    className="h-6 flex-1"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs">Shadow Blur</Label>
                                <div className="flex items-center gap-2">
                                  <Slider
                                    value={[textOverlays.find(t => t.id === selectedTextId)?.shadowBlur || 4]}
                                    onValueChange={([value]) => updateTextOverlay(selectedTextId, { shadowBlur: value })}
                                    min={0}
                                    max={20}
                                    step={1}
                                    className="flex-1 mt-1"
                                  />
                                  <Input
                                    type="number"
                                    value={textOverlays.find(t => t.id === selectedTextId)?.shadowBlur || 4}
                                    onChange={(e) => {
                                      const value = Math.max(0, Math.min(20, parseInt(e.target.value) || 4));
                                      updateTextOverlay(selectedTextId, { shadowBlur: value });
                                    }}
                                    min={0}
                                    max={20}
                                    className="w-12 h-6 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
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
              <DialogTitle>{editingTextId ? 'Edit Text Overlay' : 'Add Text Overlay'}</DialogTitle>
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
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={textSettings.color}
                      onChange={(e) => setTextSettings(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10 w-12"
                    />
                    <Input
                      value={textSettings.color}
                      onChange={(e) => setTextSettings(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#000000"
                      className="h-10 flex-1"
                    />
                  </div>
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
                <Button variant="outline" onClick={() => {
                  setShowTextEditor(false);
                  setEditingTextId(null);
                  setTextInput('');
                }}>
                  Cancel
                </Button>
                <Button onClick={editingTextId ? saveTextEdit : addTextOverlay}>
                  {editingTextId ? 'Save Changes' : 'Add Text'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset All Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will reset all image settings including:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Zoom and position</li>
                <li>• All filters and adjustments</li>
                <li>• Crop area</li>
                <li>• All text overlays</li>
                <li>• Return to original image</li>
              </ul>
              <p className="text-sm font-medium text-red-600">
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    resetAdjustments();
                    setShowResetConfirm(false);
                  }}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
} 