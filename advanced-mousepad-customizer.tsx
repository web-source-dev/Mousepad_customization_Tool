"use client"

import React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import Image from "next/image"
import {
  Upload,
  X,
  Save,
  Download,
  Share2,
  Eye,
  Palette,
  ImageIcon,
  ShoppingCart,
  HelpCircle,
  Lightbulb,
  Star,
  Heart,
  RotateCcw,
  Target,
  Menu,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

import { ImageEditor } from "./components/image-editor"
import { TemplateGallery } from "./components/template-gallery"
import { PriceCalculator } from "./components/price-calculator"
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/components/ui/cart-context";
import { SideCart } from "@/components/ui/side-cart";
import { getExactMousepadPrice, PRICING_TABLE } from "./lib/price";

// Declare html2canvas for TypeScript
declare const html2canvas: any;

// Add the missing MOUSEPAD_SIZES constant
const MOUSEPAD_SIZES: Record<string, { label: string; width: number; height: number }> = {
  '200x240': { label: '200×240mm', width: 240, height: 200 },
  '300x350': { label: '300×350mm', width: 350, height: 300 },
  '300x600': { label: '300×600mm', width: 600, height: 300 },
  '300x700': { label: '300×700mm', width: 700, height: 300 },
  '300x800': { label: '300×800mm', width: 800, height: 300 },
  '350x600': { label: '350×600mm', width: 600, height: 350 },
  '400x600': { label: '400×600mm', width: 600, height: 400 },
  '400x700': { label: '400×700mm', width: 700, height: 400 },
  '400x800': { label: '400×800mm', width: 800, height: 400 },
  '400x900': { label: '400×900mm', width: 900, height: 400 },
  '500x800': { label: '500×800mm', width: 800, height: 500 },
  '500x1000': { label: '500×1000mm', width: 1000, height: 500 },
};

const BUTTON_FONT_SIZE_BY_SIZE = {
  small: "text-xs",
  medium: "text-sm",
  large: "text-base",
  xl: "text-lg",
};

const THICKNESS_OPTIONS = [
  { value: '3mm', label: '3mm', description: 'Standard comfort' },
  { value: '4mm', label: '4mm', description: 'Premium cushioning' },
  { value: '5mm', label: '5mm', description: 'Maximum comfort' },
];

const SURFACE_TEXTURES = [
  { value: "smooth", label: "Smooth", description: "Fast gliding, precision gaming" },
  { value: "textured", label: "Textured", description: "Balanced control and speed" },
  { value: "premium", label: "Premium Cloth", description: "Professional esports grade" },
]

const RGB_MODES = [
  { value: "static", label: "Static Color" },
  { value: "breathing", label: "Breathing Effect" },
  { value: "rainbow", label: "Rainbow Cycle" },
  { value: "reactive", label: "Reactive Lighting" },
]

// Tab order and labels (move to top-level)
const TAB_ORDER = [
  { value: "design", label: "Design" },
  { value: "order", label: "Add to Cart" },
];

// Helper for RGB mode descriptions
const RGB_MODE_DESCRIPTIONS: Record<string, string> = {
  static: 'A single, solid color of your choice.',
  breathing: 'A gentle fade in and out of your selected color.',
  rainbow: 'A continuous, animated rainbow color cycle.',
  reactive: 'Lights up in response to your actions.',
};

// Add this mapping after MOUSEPAD_SIZES:
const UPLOAD_BUTTON_FONT_SIZE_BY_SIZE: Record<string, string> = {
  '200x240': 'text-sm',
  '300x350': 'text-base',
  '300x600': 'text-lg',
  '300x700': 'text-lg',
  '300x800': 'text-xl',
  '350x600': 'text-lg',
  '400x600': 'text-xl',
  '400x700': 'text-xl',
  '400x800': 'text-xl',
  '400x900': 'text-xl',
  '500x800': 'text-xl',
  '500x1000': 'text-xl',
};

export default function AdvancedMousepadCustomizer() {
  // Core settings
  const [mousepadType, setMousepadType] = useState("normal")
  // Set a valid default value for mousepadSize
  const [mousepadSize, setMousepadSize] = useState<string>('300x350');
  console.log('Default mousepadSize:', mousepadSize);
  console.log('Available sizes in pricing table:', Object.keys(PRICING_TABLE.USD));
  const [thickness, setThickness] = useState("3mm")
  const [quantity, setQuantity] = useState(1)

  // RGB settings
  const [rgbMode, setRgbMode] = useState("static")
  const [rgbColor, setRgbColor] = useState("#ff0000")
  const [rgbBrightness, setRgbBrightness] = useState(80)
  const [rgbAnimationSpeed, setRgbAnimationSpeed] = useState(50); // New state for animation speed

  // Image and design
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  // Text and typography state
  const [textElements, setTextElements] = useState<any[]>([])
  const [selectedTextElement, setSelectedTextElement] = useState<number | null>(null)
  const [textInput, setTextInput] = useState("")
  const [selectedFont, setSelectedFont] = useState("Arial")
  const [fontSize, setFontSize] = useState(24)
  const [textColor, setTextColor] = useState("#000000")
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 })
  const [textRotation, setTextRotation] = useState(0)
  const [textOpacity, setTextOpacity] = useState(100)
  const [textShadow, setTextShadow] = useState({ enabled: false, x: 2, y: 2, blur: 4, color: "#000000" })
  const [textOutline, setTextOutline] = useState({ enabled: false, width: 1, color: "#ffffff" })
  const [textGradient, setTextGradient] = useState({
    enabled: false,
    from: "#ff0000",
    to: "#0000ff",
    direction: "horizontal",
  })
  const [logoFile, setLogoFile] = useState<string | null>(null)

  // UI state
  const [activeTab, setActiveTab] = useState(TAB_ORDER[0].value)
  const [previewMode, setPreviewMode] = useState("normal")
  const [showHelp, setShowHelp] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<any[]>([])
  const [hasMounted, setHasMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Progress tracking
  const [designProgress, setDesignProgress] = useState(25)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadMoreRef = useRef<HTMLInputElement>(null)

  // Function to capture the complete customized design
  const captureCompleteDesign = async () => {
    try {
      // Always use canvas method for guaranteed text and RGB capture
      const baseImage = editedImage || uploadedImage;
      if (baseImage) {
        console.log('Using canvas method to ensure text and RGB capture');
        return await createCanvasWithText(baseImage, textElements);
      }

      // Fallback to html2canvas if no base image
      if (typeof html2canvas === 'undefined') {
        console.warn('html2canvas not available, using placeholder');
        return "/placeholder.svg";
      }

      // Find the preview container that includes everything
      const previewContainer = document.querySelector('[data-preview-container]');
      if (!previewContainer) {
        console.warn('Preview container not found, using placeholder');
        return "/placeholder.svg";
      }

      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use html2canvas to capture the entire preview with all customizations
      const canvas = await html2canvas(previewContainer as HTMLElement, {
        backgroundColor: null,
        scale: 3, // Very high quality for better detail
        useCORS: true,
        allowTaint: true,
        width: previewContainer.clientWidth,
        height: previewContainer.clientHeight,
        logging: true, // Enable logging for debugging
        removeContainer: false,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        onclone: (clonedDoc: Document) => {
          // Ensure all text elements are visible in the cloned document
          const clonedContainer = clonedDoc.querySelector('[data-preview-container]');
          if (clonedContainer) {
            // Make sure all text elements are properly positioned and visible
            const textElements = clonedContainer.querySelectorAll('[data-text-element]');
            textElements.forEach((element: any) => {
              element.style.zIndex = '1000';
              element.style.pointerEvents = 'none';
              element.style.display = 'block';
              element.style.visibility = 'visible';
              element.style.opacity = '1';
            });

            // Also ensure the container itself is properly styled
            (clonedContainer as HTMLElement).style.overflow = 'visible';
            (clonedContainer as HTMLElement).style.position = 'relative';
          }
        }
      });

      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Error capturing complete design:', error);
      // Final fallback to base image
      return editedImage || uploadedImage || "/placeholder.svg";
    }
  }

  // Enhanced method to create canvas with text, RGB overlays, and template overlays
  const createCanvasWithText = async (baseImage: string, textElements: any[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      img.onload = () => {
        // Set canvas size to match image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        console.log('Text elements to render:', textElements.length);
        console.log('RGB mode:', mousepadType, rgbMode, rgbColor, rgbBrightness);

        // Ensure minimum size for visibility
        const minSize = 200;
        if (canvas.width < minSize || canvas.height < minSize) {
          const scale = Math.max(minSize / canvas.width, minSize / canvas.height);
          canvas.width = Math.round(canvas.width * scale);
          canvas.height = Math.round(canvas.height * scale);
          console.log('Scaled canvas size:', canvas.width, 'x', canvas.height);
        }

        // Draw base image (scaled if necessary)
        if (ctx) {
          if (canvas.width === img.width && canvas.height === img.height) {
            // No scaling needed
            ctx.drawImage(img, 0, 0);
          } else {
            // Scale the image to fit the canvas
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        }

        // Draw template overlays function
        const drawOverlays = async () => {
          if (appliedOverlays.length > 0) {
            console.log('Drawing overlays:', appliedOverlays.length);
            console.log('Overlay URLs:', appliedOverlays);

            for (let i = 0; i < appliedOverlays.length; i++) {
              const overlayUrl = appliedOverlays[i];
              try {
                const overlayImg = new window.Image();
                overlayImg.crossOrigin = 'anonymous';

                await new Promise((resolve, reject) => {
                  overlayImg.onload = resolve;
                  overlayImg.onerror = reject;
                  overlayImg.src = overlayUrl;
                });

                if (ctx) {
                  // Draw overlay to cover the entire canvas area
                  ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
                  console.log(`Overlay ${i + 1} drawn successfully from:`, overlayUrl);
                  console.log(`Overlay dimensions: ${overlayImg.width}x${overlayImg.height}, Canvas: ${canvas.width}x${canvas.height}`);
                }
              } catch (error) {
                console.warn(`Failed to draw overlay ${i + 1}:`, error);
                console.warn('Overlay URL was:', overlayUrl);
              }
            }
          } else {
            console.log('No overlays to draw');
          }
        };

        // Add RGB glow effect if RGB mode is active
        if (mousepadType === 'rgb' && ctx) {
          console.log('Adding RGB glow effect');
          console.log('RGB Mode:', rgbMode);
          console.log('RGB Color:', rgbColor);
          console.log('RGB Brightness:', rgbBrightness);

          // Create a more elegant RGB effect
          const glowColor = rgbMode === 'rainbow' ? null : rgbColor; // Don't use red for rainbow
          const glowIntensity = rgbBrightness / 100;

          console.log('Using glow color:', glowColor);
          console.log('Glow intensity:', glowIntensity);

          // Draw RGB border glow with elegant design
          ctx.save();

          // Ensure the color is valid
          if (rgbMode === 'rainbow') {
            // Rainbow mode will be handled separately
            ctx.fillStyle = '#ff0000'; // Default for non-rainbow parts
          } else if (!glowColor || glowColor === 'undefined' || glowColor === 'null') {
            console.warn('Invalid RGB color, using default red');
            ctx.fillStyle = '#ff0000';
          } else {
            ctx.fillStyle = glowColor;
          }

          // Outer glow layer - thinner and more elegant
          ctx.globalAlpha = Math.max(glowIntensity * 0.5, 0.15); // Reduced opacity for elegance
          const outerBorderWidth = Math.max(canvas.width, canvas.height) * 0.015; // Even thinner border
          const borderCornerRadius = Math.min(canvas.width, canvas.height) * 0.05;

          // Top border
          ctx.fillRect(borderCornerRadius, 0, canvas.width - borderCornerRadius * 2, outerBorderWidth);
          // Bottom border
          ctx.fillRect(borderCornerRadius, canvas.height - outerBorderWidth, canvas.width - borderCornerRadius * 2, outerBorderWidth);
          // Left border
          ctx.fillRect(0, borderCornerRadius, outerBorderWidth, canvas.height - borderCornerRadius * 2);
          // Right border
          ctx.fillRect(canvas.width - outerBorderWidth, borderCornerRadius, outerBorderWidth, canvas.height - borderCornerRadius * 2);

          // Inner glow layer - removed for cleaner look
          // ctx.globalAlpha = Math.max(glowIntensity * 0.3, 0.1); // Reduced opacity
          // const innerBorderWidth = Math.max(canvas.width, canvas.height) * 0.01; // Much thinner inner border
          // ctx.fillRect(outerBorderWidth, outerBorderWidth, canvas.width - 2 * outerBorderWidth, innerBorderWidth); // Top inner
          // ctx.fillRect(outerBorderWidth, canvas.height - outerBorderWidth - innerBorderWidth, canvas.width - 2 * outerBorderWidth, innerBorderWidth); // Bottom inner
          // ctx.fillRect(outerBorderWidth, outerBorderWidth, innerBorderWidth, canvas.height - 2 * outerBorderWidth); // Left inner
          // ctx.fillRect(canvas.width - outerBorderWidth - innerBorderWidth, outerBorderWidth, innerBorderWidth, canvas.height - 2 * outerBorderWidth); // Right inner

          ctx.restore();

          // Add corner glow effects (outer only, no inner circles)
          ctx.save();

          // Corner circles with subtle glow
          const cornerRadius = Math.min(canvas.width, canvas.height) * 0.05; // Even smaller corners

          // Outer corner glow - subtle and elegant
          ctx.globalAlpha = Math.max(glowIntensity * 0.3, 0.15); // Reduced opacity
          if (rgbMode === 'rainbow') {
            // Use different rainbow colors for each corner
            const rainbowColors = ['#ff0000', '#00ff00', '#0080ff', '#ff0080'];
            ctx.fillStyle = rainbowColors[0]; // Will be set per corner
          } else {
            ctx.fillStyle = glowColor || '#ff0000';
          }

          // Top-left corner
          if (rgbMode === 'rainbow') {
            ctx.fillStyle = '#ff0000'; // Red
          }
          ctx.beginPath();
          ctx.arc(cornerRadius, cornerRadius, cornerRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Top-right corner
          if (rgbMode === 'rainbow') {
            ctx.fillStyle = '#00ff00'; // Green
          }
          ctx.beginPath();
          ctx.arc(canvas.width - cornerRadius, cornerRadius, cornerRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Bottom-left corner
          if (rgbMode === 'rainbow') {
            ctx.fillStyle = '#0080ff'; // Blue
          }
          ctx.beginPath();
          ctx.arc(cornerRadius, canvas.height - cornerRadius, cornerRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Bottom-right corner
          if (rgbMode === 'rainbow') {
            ctx.fillStyle = '#ff0080'; // Pink
          }
          ctx.beginPath();
          ctx.arc(canvas.width - cornerRadius, canvas.height - cornerRadius, cornerRadius, 0, 2 * Math.PI);
          ctx.fill();

          ctx.restore();

          // Add rainbow effects for rainbow mode
          if (rgbMode === 'rainbow') {
            ctx.save();

            // Create rainbow border effect
            const borderWidth = Math.max(canvas.width, canvas.height) * 0.015; // Thin rainbow border
            const colors = ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff', '#ff0080'];

            // Draw rainbow border segments
            for (let i = 0; i < colors.length; i++) {
              ctx.globalAlpha = Math.max(glowIntensity * 0.3, 0.12);
              ctx.fillStyle = colors[i];

              const segmentWidth = (canvas.width * 2 + canvas.height * 2) / colors.length;
              const startPos = i * segmentWidth;

              // Top border
              if (startPos < canvas.width) {
                const x = startPos;
                const w = Math.min(segmentWidth, canvas.width - x);
                ctx.fillRect(x, 0, w, borderWidth);
              }
              // Right border
              else if (startPos < canvas.width + canvas.height) {
                const y = startPos - canvas.width;
                const h = Math.min(segmentWidth, canvas.height - y);
                ctx.fillRect(canvas.width - borderWidth, y, borderWidth, h);
              }
              // Bottom border
              else if (startPos < canvas.width * 2 + canvas.height) {
                const x = canvas.width - (startPos - (canvas.width + canvas.height));
                const w = Math.min(segmentWidth, x);
                ctx.fillRect(Math.max(0, x - w), canvas.height - borderWidth, w, borderWidth);
              }
              // Left border
              else {
                const y = canvas.height - (startPos - (canvas.width * 2 + canvas.height));
                const h = Math.min(segmentWidth, y);
                ctx.fillRect(0, Math.max(0, y - h), borderWidth, h);
              }
            }

            ctx.restore();
          }

          // Add center glow effect for static colors to make them more visible
          if (rgbMode === 'static' && glowColor && glowColor !== '#ff0000') {
            ctx.save();
            ctx.globalAlpha = Math.max(glowIntensity * 0.3, 0.2);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const maxRadius = Math.min(canvas.width, canvas.height) * 0.25;

            // Create a subtle center glow
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(0.7, glowColor + '80'); // 50% opacity
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
            ctx.fill();

            ctx.restore();
          }
        }

        // Draw text overlays with all customization details
        textElements.forEach((element, index) => {
          if (ctx && element.type === 'text') {
            console.log(`Rendering text element ${index}:`, element.text, 'at position:', element.position);

            // Set font with proper weight and larger size for better visibility
            const fontWeight = element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal";
            const fontSize = Math.max(element.size * 1.5, 18); // Increase size by 50% and minimum 18px
            ctx.font = `${fontWeight} ${fontSize}px ${element.font}`;

            // Handle gradient text
            if (element.gradient?.enabled) {
              const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
              gradient.addColorStop(0, element.gradient.from);
              gradient.addColorStop(1, element.gradient.to);
              ctx.fillStyle = gradient;
            } else {
              ctx.fillStyle = element.color || '#000000';
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Calculate position
            const x = (element.position.x / 100) * canvas.width;
            const y = (element.position.y / 100) * canvas.height;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((element.rotation * Math.PI) / 180);

            // Apply opacity
            ctx.globalAlpha = (element.opacity || 100) / 100;

            // Draw text shadow if enabled
            if (element.shadow?.enabled) {
              ctx.shadowColor = element.shadow.color || '#000000';
              ctx.shadowBlur = element.shadow.blur || 0;
              ctx.shadowOffsetX = element.shadow.x || 0;
              ctx.shadowOffsetY = element.shadow.y || 0;
            }

            // Draw text outline if enabled
            if (element.outline?.enabled) {
              ctx.strokeStyle = element.outline.color || '#ffffff';
              ctx.lineWidth = element.outline.width || 1;
              ctx.strokeText(element.text, 0, 0);
            }

            // Draw the main text
            ctx.fillText(element.text, 0, 0);
            ctx.restore();

            console.log(`Text element ${index} rendered successfully`);
          }
        });

        // Draw overlays LAST to ensure they're on top
        drawOverlays().then(() => {
          console.log('Canvas rendering completed');
          resolve(canvas.toDataURL('image/png', 1.0));
        }).catch((error) => {
          console.error('Error drawing overlays:', error);
          console.log('Canvas rendering completed (without overlays)');
          resolve(canvas.toDataURL('image/png', 1.0));
        });
      };

      img.onerror = (error) => {
        console.error('Error loading base image:', error);
        reject(error);
      };

      img.src = baseImage;
    });
  };
  const { addItem, items } = useCart();
  const [sideCartOpen, setSideCartOpen] = useState(false);
  const { toast } = useToast();
  const [appliedOverlays, setAppliedOverlays] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: number; overlay: string } | null>(null);

  // Add a new state to track the main image source (uploaded or template)
  const [mainImage, setMainImage] = useState<string | null>(null)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Load saved designs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mousepadDesigns');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedDesigns(parsed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const last = parsed[parsed.length - 1];
          // Restore editor state from last saved design
          setEditedImage(last.image || null);
          setUploadedImage(last.image || null);
          setMousepadType(last.settings?.mousepadType || "normal");
          setMousepadSize(last.settings?.mousepadSize || "medium");
          setThickness(last.settings?.thickness || "3mm");
          setRgbMode(last.settings?.rgbMode || "static");
          setRgbColor(last.settings?.rgbColor || "#ff0000");
          setSelectedTemplate(last.settings?.selectedTemplate || null);
          if (last.settings?.selectedTemplate) {
            setAppliedOverlays([last.settings.selectedTemplate.overlay]);
          }
          setDesignProgress(100);
        }
      } catch { }
    }
    setHasMounted(true);
  }, []);

  // Update handleImageUpload to set mainImage and clear template selection
  const handleImageUpload = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files)
    const validImages = fileArr.filter((file) => file.type.startsWith("image/"))
    if (validImages.length === 0) return
    let loadedImages: string[] = []
    let loadedCount = 0
    validImages.forEach((file, idx) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        loadedImages[idx] = result
        loadedCount++
        if (loadedCount === validImages.length) {
          setUploadedImages((prev) => {
            const all = [...prev, ...loadedImages]
            setUploadedImage(all[0])
            setEditedImage(all[0])
            setMainImage(all[0]) // Set main image to uploaded
            setAppliedOverlays([]) // Clear overlays/templates
            setSelectedTemplate(null) // Clear selected template
            return all
          })
          setDesignProgress((prev) => Math.min(prev + 25, 100))
        }
      }
      reader.readAsDataURL(file)
    })
  }, [])

  // Update template selection to set mainImage and clear uploaded image
  const handleSelectTemplate = (template: { id: number; overlay: string }) => {
    // Set the selected template and add its overlay
    setSelectedTemplate(template)
    setAppliedOverlays([template.overlay])
  }

  const handleRemoveTemplate = () => {
    // Remove the selected template and its overlay
    setSelectedTemplate(null)
    setAppliedOverlays([])
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleImageUpload(files)
      }
    },
    [handleImageUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleImageUpload(files)
        // Reset file input so user can upload the same file again
        e.target.value = ''
      }
    },
    [handleImageUpload],
  )

  const handleShuffleImage = () => {
    if (uploadedImages.length > 1) {
      const idx = Math.floor(Math.random() * uploadedImages.length)
      setUploadedImage(uploadedImages[idx])
      setEditedImage(uploadedImages[idx])
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setEditedImage(null)
    setUploadedImages([])
    setSelectedTemplate(null) // Clear selected template
    setAppliedOverlays([]) // Clear overlays
    setDesignProgress((prev) => Math.max(prev - 25, 0))
    // Clear saved designs from localStorage
    localStorage.removeItem('mousepadDesigns');
    setSavedDesigns([]);
  }

  const saveDesign = () => {
    const design = {
      id: Date.now(),
      name: `Design ${savedDesigns.length + 1}`,
      image: editedImage || uploadedImage,
      settings: {
        mousepadType,
        mousepadSize,
        thickness,
        rgbMode,
        rgbColor,
        selectedTemplate,
      },
      createdAt: new Date().toISOString(),
    }
    setSavedDesigns((prev) => {
      const updated = [...prev, design];
      localStorage.setItem('mousepadDesigns', JSON.stringify(updated));
      return updated;
    });
    if (toast) {
      toast({
        title: "Design Saved!",
        description: "Your mousepad design has been saved successfully.",
        duration: 2500,
      });
    } else {
      alert("Design saved!");
    }
  }

  const addTextElement = () => {
    if (!textInput.trim()) return

    const newElement = {
      id: Date.now(),
      text: textInput,
      font: selectedFont,
      size: fontSize,
      color: textColor,
      position: { ...textPosition },
      rotation: textRotation,
      opacity: textOpacity,
      shadow: { ...textShadow },
      outline: { ...textOutline },
      gradient: { ...textGradient },
      type: "text",
    }

    setTextElements((prev) => [...prev, newElement])
    setTextInput("")
    setDesignProgress((prev) => Math.min(prev + 10, 100))
  }

  // Update selected text element when controls change
  const updateSelectedElement = () => {
    if (selectedTextElement !== null) {
      updateTextElement(selectedTextElement, {
        font: selectedFont,
        size: fontSize,
        color: textColor,
        position: textPosition,
        rotation: textRotation,
        opacity: textOpacity,
        shadow: textShadow,
        outline: textOutline,
        gradient: textGradient,
      })
    }
  }

  // Call updateSelectedElement whenever controls change
  React.useEffect(() => {
    updateSelectedElement()
  }, [
    selectedFont,
    fontSize,
    textColor,
    textPosition,
    textRotation,
    textOpacity,
    textShadow,
    textOutline,
    textGradient,
    selectedTextElement,
  ])

  // Load selected element properties into controls
  const loadElementToControls = (element: any) => {
    if (element.type === "text") {
      setSelectedFont(element.font || "Arial")
      setFontSize(element.size || 24)
      setTextColor(element.color || "#000000")
      setTextPosition(element.position || { x: 50, y: 50 })
      setTextRotation(element.rotation || 0)
      setTextOpacity(element.opacity || 100)
      setTextShadow(element.shadow || { enabled: false, x: 2, y: 2, blur: 4, color: "#000000" })
      setTextOutline(element.outline || { enabled: false, width: 1, color: "#ffffff" })
      setTextGradient(element.gradient || { enabled: false, from: "#ff0000", to: "#0000ff", direction: "horizontal" })
    }
  }

  const updateTextElement = (id: number, updates: any) => {
    setTextElements((prev) => prev.map((el) => (el.id === id ? { ...el, ...updates } : el)))
  }

  const deleteTextElement = (id: number) => {
    setTextElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedTextElement(null)
  }

  const handleLogoUpload = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setLogoFile(result)

        const logoElement = {
          id: Date.now(),
          src: result,
          position: { x: 25, y: 25 },
          size: { width: 100, height: 100 },
          rotation: 0,
          opacity: 100,
          type: "logo",
        }

        setTextElements((prev) => [...prev, logoElement])
        setDesignProgress((prev) => Math.min(prev + 15, 100))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (img: string) => {
    setUploadedImages((prev) => {
      const filtered = prev.filter((i) => i !== img)
      // If the removed image is the current, set next or clear
      if (img === uploadedImage) {
        if (filtered.length > 0) {
          setUploadedImage(filtered[0])
          setEditedImage(filtered[0])
        } else {
          setUploadedImage(null)
          setEditedImage(null)
        }
      }
      return filtered
    })
  }

  // Always get a valid size or fallback
  const currentSize = MOUSEPAD_SIZES[mousepadSize] || { width: 350, height: 300, label: 'Default' };


  const [currency, setCurrency] = useState<'USD' | 'SGD'>('USD');

  // Add this handler near other handlers
  const handleSidebarImageSelect = (image: string) => {
    setUploadedImage(image);
    setEditedImage(image);
  };

  if (!hasMounted) return null;
  return (
    <TooltipProvider delayDuration={2000}>
      <div className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm border-b">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Mousepad Studio Pro</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Professional mousepad customization tool</p>
                </div>
              </div>
              
              {/* Desktop Controls */}
              <div className="hidden md:flex items-center gap-2">
                {/* Toggle Help Mode Button */}
                {showHelp ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Help mode is ON. Click to turn off.</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                )}
                {/* Save and Reset Buttons */}
                {showHelp ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={saveDesign} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Save your current design to local storage</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button onClick={saveDesign} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                    <Save className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                )}
                {showHelp ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={removeImage} disabled={!uploadedImage} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">Reset</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reset and clear your current design</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button variant="outline" onClick={removeImage} disabled={!uploadedImage} className="flex items-center gap-2 px-3 py-1 text-xs" size="sm">
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                )}
                {/* Cart Button */}
                <button
                  className="relative p-2 rounded hover:bg-gray-100 transition"
                  onClick={() => setSideCartOpen(true)}
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {itemCount}
                    </span>
                  )}
                </button>
                {/* Currency Selector */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs sm:text-sm">Currency:</Label>
                  <Select value={currency} onValueChange={(value) => setCurrency(value as 'USD' | 'SGD')}>
                    <SelectTrigger className="w-20 sm:w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="flex md:hidden items-center gap-2">
                {/* Cart Button */}
                <button
                  className="relative p-2 rounded hover:bg-gray-100 transition"
                  onClick={() => setSideCartOpen(true)}
                  aria-label="Open cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5">
                      {itemCount}
                    </span>
                  )}
                </button>
                
                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 sm:w-96">
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Quick Actions</h2>
                        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <Button onClick={saveDesign} className="w-full justify-start">
                          <Save className="h-4 w-4 mr-2" />
                          Save Design
                        </Button>
                        <Button variant="outline" onClick={removeImage} disabled={!uploadedImage} className="w-full justify-start">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset Design
                        </Button>
                        <Button variant="outline" onClick={() => setShowHelp(!showHelp)} className="w-full justify-start">
                          <HelpCircle className="h-4 w-4 mr-2" />
                          {showHelp ? 'Hide Help' : 'Show Help'}
                        </Button>
                      </div>

                      <div className="pt-4 border-t">
                        <Label className="text-sm font-medium">Currency</Label>
                        <Select value={currency} onValueChange={(value) => setCurrency(value as 'USD' | 'SGD')}>
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="SGD">SGD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl p-2 sm:p-4 lg:p-6">
          {/* Mobile Layout - Bottom Sheet for Controls */}
          <div className="block lg:hidden">
            {/* Mobile Preview Section */}
            <div className="space-y-3">
              {/* Preview Card */}
              <Card className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4" />
                      Preview
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={previewMode === "normal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("normal")}
                        className="text-xs px-2"
                      >
                        Normal
                      </Button>
                      <Button
                        variant={previewMode === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("dark")}
                        className="text-xs px-2"
                      >
                        Dark
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`p-3 ${previewMode === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                  <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-sm">
                      {/* Mobile Mousepad Preview */}
                      <div
                        data-preview-container
                        className={`relative rounded-xl shadow-2xl transition-all duration-500 mx-auto ${mousepadType === "rgb" ? "shadow-lg" : "shadow-gray-300"
                          } ${isDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''} z-0`}
                        style={{
                          width: '100%',
                          maxWidth: Math.min(300, currentSize.width * 0.7),
                          height: 'auto',
                          aspectRatio: `${currentSize.width}/${currentSize.height}`,
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            handleImageUpload(files);
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                        }}
                      >
                        {/* RGB Glow Effect */}
                        {mousepadType === "rgb" && (
                          <div
                            className="absolute -inset-1 rounded-xl opacity-60 blur-md animate-pulse"
                            style={{
                              background:
                                rgbMode === "rainbow"
                                  ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                                  : `linear-gradient(45deg, ${rgbColor}, ${rgbColor}80)`,
                              opacity: rgbBrightness / 100,
                            }}
                          />
                        )}

                        {/* Mousepad Surface */}
                        <div className={`relative h-full w-full overflow-hidden rounded-xl`}>
                          <div className={`absolute inset-0 bg-white`} />

                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt="Custom design"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-3">
                              <Upload className="w-8 h-8 text-blue-400 mb-2 animate-bounce-slow" aria-hidden="true" />
                              <Button
                                variant="default"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-xs px-3 py-2 font-semibold shadow-lg bg-gradient-custom hover:bg-gradient-custom-reverse text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transform hover:scale-105 text-center truncate whitespace-nowrap text-sm"
                                tabIndex={0}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                aria-label="Upload your image"
                              >
                                Upload Image
                              </Button>
                              <div className="mt-2 text-xs text-gray-500 text-center">
                                JPG, PNG, GIF • Max 10MB
                              </div>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileInput}
                                className="hidden"
                              />
                            </div>
                          )}

                          {/* Text and Logo Overlays */}
                          {textElements.map((element) => (
                            <div
                              key={element.id}
                              data-text-element
                              className={`absolute cursor-move transition-all select-none ${selectedTextElement === element.id ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                }`}
                              style={{
                                left: `${element.position.x}%`,
                                top: `${element.position.y}%`,
                                transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                opacity: element.opacity / 100,
                                zIndex: selectedTextElement === element.id ? 10 : 1,
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTextElement(element.id)
                              }}
                            >
                              {element.type === "text" ? (
                                <div
                                  style={{
                                    fontFamily: element.font,
                                    fontSize: `clamp(10px, ${element.size * 0.5}px, ${element.size * 0.6}px)`,
                                    color: element.gradient?.enabled ? "transparent" : element.color,
                                    background: element.gradient?.enabled
                                      ? `linear-gradient(${element.gradient.direction === "horizontal" ? "90deg" : "180deg"}, ${element.gradient.from}, ${element.gradient.to})`
                                      : "transparent",
                                    WebkitBackgroundClip: element.gradient?.enabled ? "text" : "unset",
                                    backgroundClip: element.gradient?.enabled ? "text" : "unset",
                                    textShadow: element.shadow?.enabled
                                      ? `${element.shadow.x}px ${element.shadow.y}px ${element.shadow.blur}px ${element.shadow.color}`
                                      : "none",
                                    WebkitTextStroke: element.outline?.enabled
                                      ? `${element.outline.width}px ${element.outline.color}`
                                      : "none",
                                    fontWeight:
                                      element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal",
                                    userSelect: "none",
                                    pointerEvents: "none",
                                    maxWidth: "90%",
                                    wordBreak: "break-word",
                                  }}
                                  className={element.curved ? "curved-text" : ""}
                                >
                                  {element.text}
                                </div>
                              ) : (
                                <Image
                                  src={element.src || "/placeholder.svg"}
                                  alt="Logo"
                                  width={Math.min(element.size?.width * 0.6 || 60, 80)}
                                  height={Math.min(element.size?.height * 0.6 || 60, 80)}
                                  className="object-contain pointer-events-none"
                                  draggable={false}
                                />
                              )}
                            </div>
                          ))}
                          {appliedOverlays.map((overlay, idx) => (
                            <img
                              key={idx}
                              src={overlay}
                              alt={`Overlay ${idx + 1}`}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              style={{ zIndex: 10 + idx }}
                            />
                          ))}
                        </div>

                        {/* Thickness/Texture Indicator */}
                        <div className="absolute -bottom-2 -right-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                          {thickness}
                        </div>
                        {/* Size Indicator */}
                        <div className="absolute -bottom-2 -left-2 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                          {currentSize.label}
                        </div>
                      </div>

                      {/* 3D Effect Shadow */}
                      <div
                        className="absolute top-1 left-1 -z-10 rounded-xl bg-gray-400 opacity-20"
                        style={{
                          width: '100%',
                          maxWidth: Math.min(300, currentSize.width * 0.7),
                          height: 'auto',
                          aspectRatio: `${currentSize.width}/${currentSize.height}`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Template Gallery */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="h-4 w-4" />
                    Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="overflow-x-auto">
                    <TemplateGallery
                      onSelectTemplate={handleSelectTemplate}
                      onRemoveTemplate={handleRemoveTemplate}
                      selectedTemplateId={selectedTemplate?.id || null}
                      horizontal
                      cardSize="small"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile Bottom Sheet for Controls */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-custom hover:bg-gradient-custom-reverse text-white shadow-lg z-50"
                  size="lg"
                >
                  <Palette className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Customize Your Mousepad</h2>
                    <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Mobile Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="flex w-full gap-1 bg-white shadow-lg border rounded-lg p-1">
                      {TAB_ORDER.map(tab => (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={`flex-1 text-xs font-semibold transition-all duration-200 ${tab.value === 'order'
                              ? 'data-[state=active]:bg-gradient-custom data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105'
                              : 'data-[state=active]:bg-gradient-custom data-[state=active]:text-white'
                            }`}
                        >
                          {tab.value === 'order' && <ShoppingCart className="h-3 w-3 mr-1" />}
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {TAB_ORDER.map(tab => (
                      <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-4">
                        {tab.value === 'design' && (
                          <>
                            {/* Mobile Design Controls */}
                            {/* Mousepad Type */}
                            <Card>
                              <CardHeader className="pb-2 pt-3">
                                <CardTitle className="text-base">Mousepad Type</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3">
                                <RadioGroup value={mousepadType} onValueChange={setMousepadType}>
                                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                                    <RadioGroupItem value="normal" id="normal" className="mt-1" />
                                    <Label htmlFor="normal" className="flex-1 cursor-pointer">
                                      <div className="font-medium text-sm">Standard Mousepad</div>
                                      <div className="text-xs text-gray-500">Classic design without lighting</div>
                                    </Label>
                                    <Badge variant="secondary" className="text-xs">$0</Badge>
                                  </div>
                                  <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                                    <RadioGroupItem value="rgb" id="rgb" className="mt-1" />
                                    <Label htmlFor="rgb" className="flex-1 cursor-pointer">
                                      <div className="font-medium flex items-center gap-2 text-sm">
                                        RGB Gaming Mousepad
                                        <Star className="h-3 w-3 text-yellow-500" />
                                      </div>
                                      <div className="text-xs text-gray-500">LED-backlit with customizable effects</div>
                                    </Label>
                                    <Badge className="text-xs">+$15</Badge>
                                  </div>
                                </RadioGroup>
                              </CardContent>
                            </Card>

                            {/* Mobile Accordion for Controls */}
                            <Accordion type="multiple" className="w-full">
                              {mousepadType === 'rgb' && (
                                <AccordionItem value="rgb-controls">
                                  <AccordionTrigger className="text-sm">RGB Settings</AccordionTrigger>
                                  <AccordionContent className="bg-white rounded-lg p-3">
                                    {/* Mobile RGB Controls */}
                                    <div className="space-y-3">
                                      {/* Mode Selection */}
                                      <div className="space-y-2">
                                        <div className="font-medium text-sm">Lighting Mode</div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {[
                                            { value: 'static', label: 'Static' },
                                            { value: 'breathing', label: 'Breathing' },
                                            { value: 'rainbow', label: 'Rainbow' },
                                            { value: 'reactive', label: 'Reactive' },
                                          ].map((mode) => (
                                            <Button
                                              key={mode.value}
                                              variant={rgbMode === mode.value ? 'default' : 'outline'}
                                              size="sm"
                                              className={`rounded-full px-2 text-xs ${rgbMode === mode.value
                                                  ? 'bg-gradient-custom hover:bg-gradient-custom-reverse text-white'
                                                  : 'hover:bg-gradient-custom hover:text-white'
                                                }`}
                                              onClick={() => setRgbMode(mode.value)}
                                            >
                                              {mode.label}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Color Picker */}
                                      {(rgbMode === 'static' || rgbMode === 'breathing') && (
                                        <div className="space-y-2">
                                          <div className="font-medium text-sm">Color</div>
                                          <div className="flex gap-2 items-center">
                                            <input
                                              type="color"
                                              value={rgbColor}
                                              onChange={(e) => setRgbColor(e.target.value)}
                                              className="w-12 h-12 rounded border bg-white"
                                            />
                                            <div className="grid grid-cols-4 gap-1">
                                              {["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"].map((color) => (
                                                <button
                                                  key={color}
                                                  className={`w-8 h-8 rounded-full border-2 bg-white ${rgbColor === color ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-400`}
                                                  style={{ backgroundColor: color }}
                                                  onClick={() => setRgbColor(color)}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Brightness */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 font-medium text-sm">
                                          <span>Brightness</span>
                                          <span className="text-xs text-gray-500">{rgbBrightness}%</span>
                                        </div>
                                        <Slider
                                          value={[rgbBrightness]}
                                          onValueChange={(value) => setRgbBrightness(value[0])}
                                          min={10}
                                          max={100}
                                          step={5}
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              )}

                              <AccordionItem value="text-controls">
                                <AccordionTrigger className="text-sm">Text & Design</AccordionTrigger>
                                <AccordionContent className="space-y-3">
                                  {/* Mobile Text Controls */}
                                  <div className="space-y-3">
                                    {/* Add Text */}
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Add Text</Label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={textInput}
                                          onChange={(e) => setTextInput(e.target.value)}
                                          placeholder="Enter text..."
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                          onKeyDown={(e) => e.key === "Enter" && addTextElement()}
                                        />
                                        <Button onClick={addTextElement} disabled={!textInput.trim()} className="px-4 bg-gradient-custom hover:bg-gradient-custom-reverse text-white text-sm">
                                          Add
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Text Elements List */}
                                    {textElements.length > 0 && (
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium">Text Elements</Label>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {textElements.map((element) => (
                                            <div
                                              key={element.id}
                                              className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${selectedTextElement === element.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                                }`}
                                              onClick={() => {
                                                setSelectedTextElement(element.id)
                                                loadElementToControls(element)
                                              }}
                                            >
                                              <div className="flex-1 min-w-0">
                                                <div className="font-medium text-xs truncate">
                                                  {element.type === "text" ? element.text : "Logo"}
                                                </div>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  deleteTextElement(element.id)
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>

                              <AccordionItem value="size-controls">
                                <AccordionTrigger className="text-sm">Size & Settings</AccordionTrigger>
                                <AccordionContent className="space-y-3">
                                  {/* Size Selection */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Size</Label>
                                    <Select value={mousepadSize} onValueChange={v => setMousepadSize(v as keyof typeof MOUSEPAD_SIZES)}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(MOUSEPAD_SIZES).map(([key, size]) => (
                                          <SelectItem key={key} value={key}>
                                            <div className="flex items-center justify-between w-full">
                                              <span>{size.label}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Thickness */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Thickness</Label>
                                    <Select value={thickness} onValueChange={setThickness}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {THICKNESS_OPTIONS.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center justify-between w-full">
                                              <span>{option.label}</span>
                                              <span className="text-xs text-gray-500 ml-2">{option.description}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Image Upload */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium">Upload Design</Label>
                                    <div
                                      className={`relative rounded-lg border-2 border-dashed p-4 text-center transition-all ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                                        }`}
                                      onDrop={handleDrop}
                                      onDragOver={handleDragOver}
                                      onDragLeave={handleDragLeave}
                                    >
                                      {uploadedImages.length > 0 ? (
                                        <div className="space-y-3">
                                          <div className="flex flex-wrap gap-2 justify-center">
                                            {uploadedImages.map((img, idx) => (
                                              <div key={idx} className={`relative h-12 w-12 rounded-lg border-2 ${img === uploadedImage ? 'border-blue-500' : 'border-gray-200'}`}
                                                style={{ cursor: 'pointer' }}
                                              >
                                                <Image
                                                  src={img || "/placeholder.svg"}
                                                  alt={`Uploaded ${idx + 1}`}
                                                  fill
                                                  className="object-cover rounded"
                                                  onClick={() => { setUploadedImage(img); setEditedImage(img); }}
                                                />
                                                {img === uploadedImage && (
                                                  <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">Current</span>
                                                )}
                                                <button
                                                  type="button"
                                                  className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 shadow hover:bg-red-100"
                                                  onClick={(e) => { e.stopPropagation(); handleRemoveImage(img); }}
                                                  aria-label="Remove image"
                                                >
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                          <div className="flex flex-wrap gap-2 justify-center">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={handleShuffleImage}
                                              disabled={uploadedImages.length < 2}
                                              className="flex items-center gap-1 bg-transparent text-xs"
                                            >
                                              Shuffle
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={removeImage}
                                              className="flex items-center gap-1 bg-transparent text-xs"
                                            >
                                              <X className="h-3 w-3" />
                                              Clear
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => uploadMoreRef.current?.click()}
                                              className="flex items-center gap-1 bg-gradient-custom hover:bg-gradient-custom-reverse text-white border-0 text-xs"
                                            >
                                              More
                                            </Button>
                                            <input
                                              ref={uploadMoreRef}
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              onChange={handleFileInput}
                                              className="hidden"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                          <div>
                                            <p className="font-medium text-sm">Drag & drop images</p>
                                            <p className="text-xs text-gray-500">or click to browse</p>
                                          </div>
                                          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-gradient-custom hover:bg-gradient-custom-reverse text-white border-0 text-sm">
                                            Choose Files
                                          </Button>
                                          <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileInput}
                                            className="hidden"
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">
                                      JPG, PNG, GIF • Max 10MB
                                    </p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </>
                        )}
                        
                        {tab.value === 'order' && (
                          <>
                            {/* Mobile Order Controls */}
                            {/* Quantity */}
                            <Card>
                              <CardHeader className="pb-2 pt-3">
                                <CardTitle className="text-base">Quantity</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                    -
                                  </Button>
                                  <span className="font-medium text-lg w-12 text-center">{quantity}</span>
                                  <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                                    +
                                  </Button>
                                  {quantity > 1 && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      10% Bulk Discount!
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {/* Price Calculator */}
                            <PriceCalculator
                              mousepadType={mousepadType}
                              mousepadSize={mousepadSize}
                              thickness={thickness}
                              quantity={quantity}
                            />

                            {/* Order Summary */}
                            <Card>
                              <CardHeader className="pb-2 pt-3">
                                <CardTitle className="text-base">Order Summary</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3">
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span>Type:</span>
                                    <span className="text-right">{mousepadType === 'rgb' ? 'RGB Gaming (+$15)' : 'Standard'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Size:</span>
                                    <span className="text-right">{MOUSEPAD_SIZES[mousepadSize]?.label || mousepadSize}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Thickness:</span>
                                    <span className="text-right">{thickness}</span>
                                  </div>
                                  {mousepadType === 'rgb' && (
                                    <div className="flex justify-between">
                                      <span>RGB Mode:</span>
                                      <span className="text-right">{rgbMode.charAt(0).toUpperCase() + rgbMode.slice(1)}</span>
                                    </div>
                                  )}
                                  {appliedOverlays.length > 0 && (
                                    <div className="flex justify-between">
                                      <span>Overlay:</span>
                                      <span className="text-right">Yes</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span>Quantity:</span>
                                    <span className="text-right">{quantity}{quantity > 1 && ' (10% Bulk Discount)'}</span>
                                  </div>
                                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                                    <span>Total:</span>
                                    <span className="text-right">
                                      ${getExactMousepadPrice({
                                        mousepadSize,
                                        thickness,
                                        currency,
                                        quantity,
                                        rgb: mousepadType === 'rgb',
                                      }).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Add to Cart Button */}
                            <Button
                              className="w-full bg-gradient-custom hover:bg-gradient-custom-reverse text-white font-semibold shadow-lg text-sm"
                              size="lg"
                              onClick={async () => {
                                try {
                                  console.log('Capturing design with text elements:', textElements);
                                  console.log('RGB settings before capture:', {
                                    mousepadType,
                                    rgbMode,
                                    rgbColor,
                                    rgbBrightness,
                                    rgbAnimationSpeed
                                  });
                                  console.log('Applied overlays:', appliedOverlays);
                                  console.log('Selected template:', selectedTemplate);
                                  const finalImage = await captureCompleteDesign();
                                  console.log('Capture completed, image length:', finalImage.length);

                                  const calculatedPrice = getExactMousepadPrice({
                                    mousepadSize,
                                    thickness,
                                    currency,
                                    quantity,
                                    rgb: mousepadType === "rgb",
                                  });
                                  console.log('Calculated price for cart:', calculatedPrice);
                                  console.log('Price type:', typeof calculatedPrice);
                                  console.log('Is price valid?', !isNaN(calculatedPrice) && calculatedPrice > 0);

                                  await addItem({
                                    id: Date.now().toString() + Math.random().toString(36).slice(2),
                                    name: "Custom Mousepad",
                                    image: finalImage,
                                    specs: {
                                      type: mousepadType,
                                      size: mousepadSize,
                                      thickness,
                                      rgb: mousepadType === "rgb" ? {
                                        mode: rgbMode,
                                        color: rgbColor,
                                        brightness: rgbBrightness,
                                        animationSpeed: rgbAnimationSpeed
                                      } : undefined,
                                      text: textElements,
                                      overlays: appliedOverlays,
                                    },
                                    quantity,
                                    price: parseFloat(calculatedPrice.toFixed(2)),
                                  });
                                  if (toast) {
                                    toast({
                                      title: "Added to Cart!",
                                      description: "Your custom mousepad has been added to the cart.",
                                      duration: 2000,
                                    });
                                  }
                                  setSideCartOpen(true);
                                  setMobileMenuOpen(false);
                                } catch (error) {
                                  console.error('Error adding to cart:', error);
                                  const fallbackPrice = getExactMousepadPrice({
                                    mousepadSize,
                                    thickness,
                                    currency,
                                    quantity,
                                    rgb: mousepadType === "rgb",
                                  });
                                  console.log('Fallback price for cart:', fallbackPrice);
                                  await addItem({
                                    id: Date.now().toString() + Math.random().toString(36).slice(2),
                                    name: "Custom Mousepad",
                                    image: editedImage || uploadedImage || "/placeholder.svg",
                                    specs: {
                                      type: mousepadType,
                                      size: mousepadSize,
                                      thickness,
                                      rgb: mousepadType === "rgb" ? {
                                        mode: rgbMode,
                                        color: rgbColor,
                                        brightness: rgbBrightness,
                                        animationSpeed: rgbAnimationSpeed
                                      } : undefined,
                                      text: textElements,
                                      overlays: appliedOverlays,
                                    },
                                    quantity,
                                    price: parseFloat(getExactMousepadPrice({
                      mousepadSize,
                      thickness,
                      currency,
                      quantity,
                      rgb: mousepadType === "rgb",
                    }).toFixed(2)),
                                  });
                                  if (toast) {
                                    toast({
                                      title: "Added to Cart!",
                                      description: "Your custom mousepad has been added to the cart.",
                                      duration: 2000,
                                    });
                                  }
                                  setSideCartOpen(true);
                                  setMobileMenuOpen(false);
                                }
                              }}
                            >
                              <ShoppingCart className="h-5 w-5 mr-2" />
                              Add to Cart
                            </Button>

                            {/* Guarantees */}
                            <Card>
                              <CardContent className="p-3">
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-2 text-green-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                                    <span>30-day money-back guarantee</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                    <span>Free shipping on orders over $50</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-purple-600">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                                    <span>1-year warranty included</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid gap-6 grid-cols-3">
            {/* Left Panel - Preview */}
            <div className="col-span-2 space-y-6">
              <div className="sticky top-24 z-10 flex flex-col space-y-4">
                <Card className="overflow-hidden flex-grow min-h-0">
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                        Live Preview
                      </CardTitle>
                      <div className="flex items-center gap-1 sm:gap-2">
                        {showHelp ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={previewMode === "normal" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreviewMode("normal")}
                                className="text-xs px-2 sm:px-3"
                              >
                                Normal
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Switch to normal preview mode</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant={previewMode === "normal" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("normal")}
                            className="text-xs px-2 sm:px-3"
                          >
                            Normal
                          </Button>
                        )}
                        {showHelp ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={previewMode === "dark" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPreviewMode("dark")}
                                className="text-xs px-2 sm:px-3"
                              >
                                Dark
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Switch to dark preview mode</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button
                            variant={previewMode === "dark" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode("dark")}
                            className="text-xs px-2 sm:px-3"
                          >
                            Dark
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={`p-4 sm:p-6 lg:p-8 ${previewMode === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                    <div className="flex items-center justify-center">
                      <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl">
                        {/* Mousepad Base with RGB Effect */}
                        <div
                          data-preview-container
                          className={`relative rounded-xl shadow-2xl transition-all duration-500 mx-auto ${mousepadType === "rgb" ? "shadow-lg" : "shadow-gray-300"
                            } ${isDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''} z-0`}
                          style={{
                            width: '100%',
                            maxWidth: Math.min(500, currentSize.width * 0.85),
                            height: 'auto',
                            aspectRatio: `${currentSize.width}/${currentSize.height}`,
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            const files = e.dataTransfer.files;
                            if (files && files.length > 0) {
                              handleImageUpload(files);
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                          }}
                        >
                          {/* RGB Glow Effect */}
                          {mousepadType === "rgb" && (
                            <div
                              className="absolute -inset-2 rounded-xl opacity-60 blur-md animate-pulse"
                              style={{
                                background:
                                  rgbMode === "rainbow"
                                    ? "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)"
                                    : `linear-gradient(45deg, ${rgbColor}, ${rgbColor}80)`,
                                opacity: rgbBrightness / 100,
                              }}
                            />
                          )}

                          {/* Mousepad Surface */}
                          <div
                            className={`relative h-full w-full overflow-hidden rounded-xl`}
                          >
                            <div
                              className={`absolute inset-0 bg-white`}
                            />

                            {mainImage ? (
                              <Image
                                src={mainImage}
                                alt="Custom design"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
                                <Upload className="w-10 h-10 sm:w-14 sm:h-14 text-blue-400 mb-3 sm:mb-4 animate-bounce-slow" aria-hidden="true" />
                                <Button
                                  variant="default"
                                  onClick={() => fileInputRef.current?.click()}
                                  className={`min-w-0 w-full max-w-xs sm:max-w-lg px-3 sm:px-4 py-3 sm:py-4 font-semibold shadow-lg bg-gradient-custom hover:bg-gradient-custom-reverse text-white transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transform hover:scale-105 text-center truncate whitespace-nowrap text-sm sm:text-base`}
                                  tabIndex={0}
                                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                                  aria-label="Upload your image"
                                >
                                  Upload Your Image
                                </Button>
                                <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center px-2">
                                  JPG, PNG, GIF • Max 10MB • 300 DPI recommended
                                </div>
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={handleFileInput}
                                  className="hidden"
                                />
                              </div>
                            )}

                            {/* Text and Logo Overlays */}
                            {textElements.map((element) => (
                              <div
                                key={element.id}
                                data-text-element
                                className={`absolute cursor-move transition-all select-none ${selectedTextElement === element.id ? "ring-2 ring-blue-500 ring-offset-1" : ""
                                  }`}
                                style={{
                                  left: `${element.position.x}%`,
                                  top: `${element.position.y}%`,
                                  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                                  opacity: element.opacity / 100,
                                  zIndex: selectedTextElement === element.id ? 10 : 1,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTextElement(element.id)
                                }}
                                onMouseDown={(e) => {
                                  if (element.type === "text") {
                                    const startX = e.clientX
                                    const startY = e.clientY
                                    const startPosX = element.position.x
                                    const startPosY = element.position.y
                                    const rect = e.currentTarget.parentElement?.getBoundingClientRect()

                                    const handleMouseMove = (moveEvent: MouseEvent) => {
                                      if (!rect) return
                                      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100
                                      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100
                                      const newX = Math.max(0, Math.min(100, startPosX + deltaX))
                                      const newY = Math.max(0, Math.min(100, startPosY + deltaY))

                                      updateTextElement(element.id, { position: { x: newX, y: newY } })
                                      setTextPosition({ x: newX, y: newY })
                                    }

                                    const handleMouseUp = () => {
                                      document.removeEventListener("mousemove", handleMouseMove)
                                      document.removeEventListener("mouseup", handleMouseUp)
                                    }

                                    document.addEventListener("mousemove", handleMouseMove)
                                    document.addEventListener("mouseup", handleMouseUp)
                                    e.preventDefault()
                                  }
                                }}
                              >
                                {element.type === "text" ? (
                                  <div
                                    style={{
                                      fontFamily: element.font,
                                      fontSize: `clamp(12px, ${element.size * 0.6}px, ${element.size * 0.8}px)`,
                                      color: element.gradient?.enabled ? "transparent" : element.color,
                                      background: element.gradient?.enabled
                                        ? `linear-gradient(${element.gradient.direction === "horizontal" ? "90deg" : "180deg"}, ${element.gradient.from}, ${element.gradient.to})`
                                        : "transparent",
                                      WebkitBackgroundClip: element.gradient?.enabled ? "text" : "unset",
                                      backgroundClip: element.gradient?.enabled ? "text" : "unset",
                                      textShadow: element.shadow?.enabled
                                        ? `${element.shadow.x}px ${element.shadow.y}px ${element.shadow.blur}px ${element.shadow.color}`
                                        : "none",
                                      WebkitTextStroke: element.outline?.enabled
                                        ? `${element.outline.width}px ${element.outline.color}`
                                        : "none",
                                      fontWeight:
                                        element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal",
                                      userSelect: "none",
                                      pointerEvents: "none",
                                      maxWidth: "90%",
                                      wordBreak: "break-word",
                                    }}
                                    className={element.curved ? "curved-text" : ""}
                                  >
                                    {element.text}
                                  </div>
                                ) : (
                                  <Image
                                    src={element.src || "/placeholder.svg"}
                                    alt="Logo"
                                    width={Math.min(element.size?.width * 0.8 || 80, 120)}
                                    height={Math.min(element.size?.height * 0.8 || 80, 120)}
                                    className="object-contain pointer-events-none"
                                    draggable={false}
                                  />
                                )}
                              </div>
                            ))}
                            {appliedOverlays.map((overlay, idx) => (
                              <img
                                key={idx}
                                src={overlay}
                                alt={`Overlay ${idx + 1}`}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                style={{ zIndex: 10 + idx }}
                              />
                            ))}
                          </div>

                          {/* Thickness/Texture Indicator */}
                          <div className="absolute -bottom-3 -right-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                            {thickness}
                          </div>
                          {/* Size Indicator (moved from header) */}
                          <div className="absolute -bottom-3 -left-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg z-10">
                            {currentSize.label}
                          </div>
                        </div>

                        {/* 3D Effect Shadow */}
                        <div
                          className="absolute top-1 left-1 sm:top-2 sm:left-2 -z-10 rounded-xl bg-gray-400 opacity-20"
                          style={{
                            width: '100%',
                            maxWidth: Math.min(500, currentSize.width * 0.8),
                            height: 'auto',
                            aspectRatio: `${currentSize.width}/${currentSize.height}`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Template Gallery - moved under Live Preview */}
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                      Template Gallery
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full p-3 sm:p-4">
                    <div className="overflow-x-auto h-full">
                      <TemplateGallery
                        onSelectTemplate={handleSelectTemplate}
                        onRemoveTemplate={handleRemoveTemplate}
                        selectedTemplateId={selectedTemplate?.id || null}
                        horizontal
                        cardSize="small"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>

            {/* Right Panel - Controls */}
            <div className="lg:sticky lg:top-16 z-10 space-y-3 sm:space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex w-full gap-1 bg-white shadow-lg border rounded-lg p-1">
                  {TAB_ORDER.map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`flex-1 text-xs sm:text-sm font-semibold transition-all duration-200 ${tab.value === 'order'
                          ? 'data-[state=active]:bg-gradient-custom data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-105'
                          : 'data-[state=active]:bg-gradient-custom data-[state=active]:text-white'
                        }`}
                    >
                      {tab.value === 'order' && <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.value === 'order' ? 'Cart' : 'Design'}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {TAB_ORDER.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className={tab.value === 'design' ? 'space-y-4' : ''}>
                    {tab.value === 'design' && (
                      <>
                        {/* Mousepad Type */}
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle className="text-base sm:text-lg">Mousepad Type</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <RadioGroup value={mousepadType} onValueChange={setMousepadType}>
                              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                                <RadioGroupItem value="normal" id="normal" className="mt-1" />
                                <Label htmlFor="normal" className="flex-1 cursor-pointer">
                                  <div className="font-medium text-sm sm:text-base">Standard Mousepad</div>
                                  <div className="text-xs sm:text-sm text-gray-500">Classic design without lighting</div>
                                </Label>
                                <Badge variant="secondary" className="text-xs">$0</Badge>
                              </div>
                              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50">
                                <RadioGroupItem value="rgb" id="rgb" className="mt-1" />
                                <Label htmlFor="rgb" className="flex-1 cursor-pointer">
                                  <div className="font-medium flex items-center gap-2 text-sm sm:text-base">
                                    RGB Gaming Mousepad
                                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500">LED-backlit with customizable effects</div>
                                </Label>
                                <Badge className="text-xs">+$15</Badge>
                              </div>
                            </RadioGroup>
                          </CardContent>
                        </Card>

                        {/* Accordion for Text and RGB Controls */}
                        <Accordion type="multiple" className="w-full">
                          {mousepadType === 'rgb' && (
                            <AccordionItem value="rgb-controls">
                              <AccordionTrigger>RGB</AccordionTrigger>
                              <AccordionContent className="bg-white rounded-lg p-4">
                                {/* Live RGB Preview */}
                                <div className="flex flex-col items-center gap-2">
                                  <div className="relative w-32 sm:w-40 h-8 sm:h-10 flex items-center justify-center">
                                    <div
                                      className={`absolute inset-0 rounded-full transition-all duration-500 ${rgbMode === 'rainbow'
                                        ? 'animate-rainbow'
                                        : rgbMode === 'breathing'
                                          ? 'animate-breathing'
                                          : ''
                                        }`}
                                      style={{
                                        background:
                                          rgbMode === 'rainbow'
                                            ? 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
                                            : rgbMode === 'static' || rgbMode === 'breathing'
                                              ? `linear-gradient(90deg, ${rgbColor}, ${rgbColor}80)`
                                              : '#222',
                                        opacity: rgbBrightness / 100,
                                        filter: rgbMode === 'breathing' ? `blur(4px)` : 'blur(2px)',
                                      }}
                                    />
                                    <div className="relative z-10 w-24 sm:w-32 h-6 sm:h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-semibold shadow">
                                      RGB Preview
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 text-center">Live preview of your RGB effect</div>
                                </div>

                                {/* Mode Selection */}
                                <div className="space-y-2">
                                  <div className="font-medium mb-1 text-sm sm:text-base">Lighting Mode</div>
                                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                                    {[
                                      { value: 'static', label: 'Static' },
                                      { value: 'breathing', label: 'Breathing' },
                                      { value: 'rainbow', label: 'Rainbow' },
                                      { value: 'reactive', label: 'Reactive' },
                                    ].map((mode) => (
                                      showHelp ? (
                                        <Tooltip key={mode.value}>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant={rgbMode === mode.value ? 'default' : 'outline'}
                                              size="sm"
                                              className={`rounded-full px-2 sm:px-4 text-xs sm:text-sm ${rgbMode === mode.value
                                                  ? 'bg-gradient-custom hover:bg-gradient-custom-reverse text-white'
                                                  : 'hover:bg-gradient-custom hover:text-white'
                                                }`}
                                              onClick={() => setRgbMode(mode.value)}
                                            >
                                              {mode.label}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{RGB_MODE_DESCRIPTIONS[mode.value]}</TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        <Button
                                          key={mode.value}
                                          variant={rgbMode === mode.value ? 'default' : 'outline'}
                                          size="sm"
                                          className={`rounded-full px-2 sm:px-4 text-xs sm:text-sm ${rgbMode === mode.value
                                              ? 'bg-gradient-custom hover:bg-gradient-custom-reverse text-white'
                                              : 'hover:bg-gradient-custom hover:text-white'
                                            }`}
                                          onClick={() => setRgbMode(mode.value)}
                                        >
                                          {mode.label}
                                        </Button>
                                      )
                                    ))}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1 min-h-[20px]">
                                    {RGB_MODE_DESCRIPTIONS[rgbMode]}
                                  </div>
                                </div>

                                {/* Color Picker & Palette */}
                                {(rgbMode === 'static' || rgbMode === 'breathing') && (
                                  <div className="space-y-2">
                                    <div className="font-medium mb-1 text-sm sm:text-base">Color Selection</div>
                                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                      <input
                                        type="color"
                                        value={rgbColor}
                                        onChange={(e) => setRgbColor(e.target.value)}
                                        className="w-12 h-12 sm:w-10 sm:h-10 rounded border bg-white"
                                      />
                                      <div className="grid grid-cols-4 sm:flex gap-1">
                                        {["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"].map((color) => (
                                          <button
                                            key={color}
                                            className={`w-8 h-8 sm:w-6 sm:h-6 rounded-full border-2 bg-white ${rgbColor === color ? 'border-blue-500' : 'border-gray-300'} hover:border-blue-400`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setRgbColor(color)}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Brightness Slider */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 font-medium mb-1">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-7.657l1.414 1.414M4.929 19.071l1.414-1.414m12.728 0l-1.414-1.414M4.929 4.929l1.414 1.414" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="5" stroke="#fbbf24" strokeWidth="2" /></svg>
                                    <span className="text-sm sm:text-base">Brightness</span>
                                    <span className="ml-2 text-xs text-gray-500">{rgbBrightness}%</span>
                                  </div>
                                  <Slider
                                    value={[rgbBrightness]}
                                    onValueChange={(value) => setRgbBrightness(value[0])}
                                    min={10}
                                    max={100}
                                    step={5}
                                    className="w-full"
                                  />
                                </div>

                                {/* Reset Preset Button Only */}
                                <div className="flex gap-2 mt-4">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    setRgbMode('static');
                                    setRgbColor('#ff0000');
                                    setRgbBrightness(80);
                                  }}>
                                    Reset to Default
                                  </Button>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          )}
                          <AccordionItem value="text-controls">
                            <AccordionTrigger>Text</AccordionTrigger>
                            <AccordionContent>
                              {/* Add Text Section */}
                              <Card>
                                <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Add Text
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 sm:p-4 space-y-4">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    {showHelp ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <input
                                            type="text"
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder="Enter your text here..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            onKeyDown={(e) => e.key === "Enter" && addTextElement()}
                                          />
                                        </TooltipTrigger>
                                        <TooltipContent>Type your text and click Add to add it to the design</TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <input
                                        type="text"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Enter your text here..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        onKeyDown={(e) => e.key === "Enter" && addTextElement()}
                                      />
                                    )}
                                    {showHelp ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button onClick={addTextElement} disabled={!textInput.trim()} className="px-4 sm:px-6 bg-gradient-custom hover:bg-gradient-custom-reverse text-white text-sm">
                                            Add
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Add the text to your design</TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <Button onClick={addTextElement} disabled={!textInput.trim()} className="px-4 sm:px-6 bg-gradient-custom hover:bg-gradient-custom-reverse text-white text-sm">
                                        Add
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Text Elements Management Section */}
                              <Card>
                                <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                                  <CardTitle className="text-base sm:text-lg">Text Elements</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 sm:p-4">
                                  <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                                    {textElements.map((element, index) => (
                                      <div
                                        key={element.id}
                                        className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${selectedTextElement === element.id
                                          ? "border-blue-500 bg-blue-50 shadow-sm"
                                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                          }`}
                                        onClick={() => {
                                          setSelectedTextElement(element.id)
                                          loadElementToControls(element)
                                        }}
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-xs sm:text-sm truncate">
                                            {element.type === "text" ? element.text : "Logo"}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {element.type === "text"
                                              ? `${element.font} • ${element.size}px`
                                              : `${element.size?.width || 100}×${element.size?.height || 100}px`}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              deleteTextElement(element.id)
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8 p-0"
                                          >
                                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {textElements.length > 3 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTextElements([])}
                                        className="w-full text-red-600 hover:text-red-700"
                                      >
                                        Clear All Elements
                                      </Button>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Edit Selected Text Section */}
                              {selectedTextElement !== null && (
                                <Card>
                                  <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                                    <CardTitle>Edit Selected Text</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 sm:p-4 space-y-4">
                                    {/* Edit text content */}
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Text</Label>
                                      <input
                                        type="text"
                                        value={
                                          textElements.find((el) => el.id === selectedTextElement)?.text || ""
                                        }
                                        onChange={(e) => {
                                          const newText = e.target.value
                                          updateTextElement(selectedTextElement, { text: newText })
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Font Family</Label>
                                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                        {[
                                          { value: "Arial", label: "Arial" },
                                          { value: "Orbitron", label: "Orbitron" },
                                          { value: "Rajdhani", label: "Rajdhani" },
                                          { value: "Exo 2", label: "Exo 2" },
                                          { value: "Audiowide", label: "Audiowide" },
                                          { value: "Roboto", label: "Roboto" },
                                          { value: "Open Sans", label: "Open Sans" },
                                          { value: "Montserrat", label: "Montserrat" },
                                          { value: "Pacifico", label: "Pacifico" },
                                          { value: "Fredoka One", label: "Fredoka One" },
                                        ].map((font) => (
                                          <button
                                            key={font.value}
                                            onClick={() => setSelectedFont(font.value)}
                                            className={`flex items-center justify-between p-2 rounded-lg border text-left transition-colors w-full ${selectedFont === font.value
                                              ? "border-blue-500 bg-blue-50"
                                              : "border-gray-200 hover:border-gray-300"
                                              }`}
                                            type="button"
                                          >
                                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                                            {selectedFont === font.value && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Size: {fontSize}px</Label>
                                      <Slider
                                        value={[fontSize]}
                                        onValueChange={(value) => setFontSize(value[0])}
                                        min={8}
                                        max={72}
                                        step={1}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Color</Label>
                                      <div className="flex gap-2 mt-1 items-center">
                                        <input
                                          type="color"
                                          value={textColor}
                                          onChange={(e) => setTextColor(e.target.value)}
                                          className="w-12 h-10 rounded border cursor-pointer"
                                        />
                                        <div className="flex gap-1">
                                          {["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00"].map((color) => (
                                            <button
                                              key={color}
                                              className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                                              style={{ backgroundColor: color }}
                                              onClick={() => setTextColor(color)}
                                              type="button"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Position</Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs">X: {textPosition.x}%</Label>
                                          <Slider
                                            value={[textPosition.x]}
                                            onValueChange={(value) => setTextPosition((prev) => ({ ...prev, x: value[0] }))}
                                            min={0}
                                            max={100}
                                            step={1}
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-xs">Y: {textPosition.y}%</Label>
                                          <Slider
                                            value={[textPosition.y]}
                                            onValueChange={(value) => setTextPosition((prev) => ({ ...prev, y: value[0] }))}
                                            min={0}
                                            max={100}
                                            step={1}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Rotation</Label>
                                      <Slider
                                        value={[textRotation]}
                                        onValueChange={(value) => setTextRotation(value[0])}
                                        min={-180}
                                        max={180}
                                        step={1}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Opacity</Label>
                                      <Slider
                                        value={[textOpacity]}
                                        onValueChange={(value) => setTextOpacity(value[0])}
                                        min={0}
                                        max={100}
                                        step={5}
                                      />
                                    </div>
                                    {/* Collapsible Advanced Options */}
                                    <details className="mt-2">
                                      <summary className="cursor-pointer text-sm font-medium text-gray-700">Advanced Options</summary>
                                      <div className="space-y-2 mt-2">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-xs">Shadow</Label>
                                          <Switch checked={textShadow.enabled} onCheckedChange={(checked) => setTextShadow((prev) => ({ ...prev, enabled: checked }))} />
                                        </div>
                                        {textShadow.enabled && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs">X: {textShadow.x}px</Label>
                                              <Slider
                                                value={[textShadow.x]}
                                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, x: value[0] }))}
                                                min={-10}
                                                max={10}
                                                step={1}
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Y: {textShadow.y}px</Label>
                                              <Slider
                                                value={[textShadow.y]}
                                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, y: value[0] }))}
                                                min={-10}
                                                max={10}
                                                step={1}
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Blur: {textShadow.blur}px</Label>
                                              <Slider
                                                value={[textShadow.blur]}
                                                onValueChange={(value) => setTextShadow((prev) => ({ ...prev, blur: value[0] }))}
                                                min={0}
                                                max={20}
                                                step={1}
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Color</Label>
                                              <input
                                                type="color"
                                                value={textShadow.color}
                                                onChange={(e) => setTextShadow((prev) => ({ ...prev, color: e.target.value }))}
                                                className="w-full h-8 rounded border cursor-pointer"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          <Label className="text-xs">Outline</Label>
                                          <Switch checked={textOutline.enabled} onCheckedChange={(checked) => setTextOutline((prev) => ({ ...prev, enabled: checked }))} />
                                        </div>
                                        {textOutline.enabled && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs">Width: {textOutline.width}px</Label>
                                              <Slider
                                                value={[textOutline.width]}
                                                onValueChange={(value) => setTextOutline((prev) => ({ ...prev, width: value[0] }))}
                                                min={1}
                                                max={5}
                                                step={1}
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">Color</Label>
                                              <input
                                                type="color"
                                                value={textOutline.color}
                                                onChange={(e) => setTextOutline((prev) => ({ ...prev, color: e.target.value }))}
                                                className="w-full h-8 rounded border cursor-pointer"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          <Label className="text-xs">Gradient</Label>
                                          <Switch checked={textGradient.enabled} onCheckedChange={(checked) => setTextGradient((prev) => ({ ...prev, enabled: checked }))} />
                                        </div>
                                        {textGradient.enabled && (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <Label className="text-xs">From</Label>
                                              <input
                                                type="color"
                                                value={textGradient.from}
                                                onChange={(e) => setTextGradient((prev) => ({ ...prev, from: e.target.value }))}
                                                className="w-full h-8 rounded border cursor-pointer"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-xs">To</Label>
                                              <input
                                                type="color"
                                                value={textGradient.to}
                                                onChange={(e) => setTextGradient((prev) => ({ ...prev, to: e.target.value }))}
                                                className="w-full h-8 rounded border cursor-pointer"
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <Label className="text-xs">Direction</Label>
                                              <div className="flex gap-2 mt-1">
                                                <Button
                                                  variant={textGradient.direction === "horizontal" ? "default" : "outline"}
                                                  size="sm"
                                                  onClick={() => setTextGradient((prev) => ({ ...prev, direction: "horizontal" }))}
                                                >
                                                  Horizontal
                                                </Button>
                                                <Button
                                                  variant={textGradient.direction === "vertical" ? "default" : "outline"}
                                                  size="sm"
                                                  onClick={() => setTextGradient((prev) => ({ ...prev, direction: "vertical" }))}
                                                >
                                                  Vertical
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </details>
                                  </CardContent>
                                </Card>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>

                        {/* Size Selection */}
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle>Size & Dimensions</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <Select value={mousepadSize} onValueChange={v => setMousepadSize(v as keyof typeof MOUSEPAD_SIZES)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(MOUSEPAD_SIZES).map(([key, size]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{size.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>

                        {/* Thickness */}
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle>Thickness & Comfort</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <Select value={thickness} onValueChange={setThickness}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {THICKNESS_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center justify-between w-full">
                                      <span>{option.label}</span>
                                      <span className="text-xs text-gray-500 ml-2">{option.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </CardContent>
                        </Card>

                        {/* Image Upload */}
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                              Upload Design
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <div
                              className={`relative rounded-lg border-2 border-dashed p-4 sm:p-6 text-center transition-all ${isDragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              {uploadedImages.length > 0 ? (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                                    {uploadedImages.map((img, idx) => (
                                      <div key={idx} className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 ${img === uploadedImage ? 'border-blue-500' : 'border-gray-200'}`}
                                        style={{ cursor: 'pointer' }}
                                      >
                                        <Image
                                          src={img || "/placeholder.svg"}
                                          alt={`Uploaded ${idx + 1}`}
                                          fill
                                          className="object-cover rounded"
                                          onClick={() => { setUploadedImage(img); setEditedImage(img); }}
                                        />
                                        {img === uploadedImage && (
                                          <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl">Current</span>
                                        )}
                                        <button
                                          type="button"
                                          className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 shadow hover:bg-red-100"
                                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(img); }}
                                          aria-label="Remove image"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex flex-wrap gap-2 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleShuffleImage}
                                      disabled={uploadedImages.length < 2}
                                      className="flex items-center gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm"
                                    >
                                      Shuffle
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={removeImage}
                                      className="flex items-center gap-1 sm:gap-2 bg-transparent text-xs sm:text-sm"
                                    >
                                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                      <span className="hidden sm:inline">Remove All</span>
                                      <span className="sm:hidden">Clear</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => uploadMoreRef.current?.click()}
                                      className="flex items-center gap-1 sm:gap-2 bg-gradient-custom hover:bg-gradient-custom-reverse text-white border-0 text-xs sm:text-sm"
                                    >
                                      <span className="hidden sm:inline">Upload More</span>
                                      <span className="sm:hidden">More</span>
                                    </Button>
                                    <input
                                      ref={uploadMoreRef}
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={handleFileInput}
                                      className="hidden"
                                    />
                                  </div>
                                </div>
                              ) :
                                <div className="space-y-3">
                                  <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-sm sm:text-base">Drag & drop your images</p>
                                    <p className="text-xs sm:text-sm text-gray-500">or click to browse</p>
                                  </div>
                                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-gradient-custom hover:bg-gradient-custom-reverse text-white border-0 text-sm">
                                    Choose Files
                                  </Button>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileInput}
                                    className="hidden"
                                  />
                                </div>
                              }
                            </div>
                            <p className="mt-2 text-xs text-gray-500 text-center px-2">
                              Supports JPG, PNG, GIF • Max 10MB each • Recommended: 300 DPI
                            </p>
                          </CardContent>
                        </Card>

                        {/* Image Editor */}
                        {uploadedImage && <ImageEditor imageUrl={uploadedImage} onImageChange={(img) => { setEditedImage(img); setMainImage(img); }} />}
                      </>
                    )}
                    {tab.value === 'order' && (
                      <>
                        {/* Quantity */}
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle className="text-base sm:text-lg">Quantity</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center gap-3">
                              <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                                -
                              </Button>
                              <span className="font-medium text-lg w-12 text-center">{quantity}</span>
                              <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                                +
                              </Button>
                              {quantity > 1 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  10% Bulk Discount!
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        {/* Price Calculator */}
                        <PriceCalculator
                          mousepadType={mousepadType}
                          mousepadSize={mousepadSize}
                          thickness={thickness}
                          quantity={quantity}
                        />
                        <Card>
                          <CardHeader className="pb-2 pt-3 sm:pt-4 sm:pb-3">
                            <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2 text-xs sm:text-sm">
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="text-right">{mousepadType === 'rgb' ? 'RGB Gaming (+$15)' : 'Standard'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Size:</span>
                                <span className="text-right">{MOUSEPAD_SIZES[mousepadSize]?.label || mousepadSize}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Thickness:</span>
                                <span className="text-right">{thickness}</span>
                              </div>
                              {mousepadType === 'rgb' && (
                                <div className="flex justify-between">
                                  <span>RGB Mode:</span>
                                  <span className="text-right">{rgbMode.charAt(0).toUpperCase() + rgbMode.slice(1)}</span>
                                </div>
                              )}
                              {appliedOverlays.length > 0 && (
                                <div className="flex justify-between">
                                  <span>Overlay:</span>
                                  <span className="text-right">Yes</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Quantity:</span>
                                <span className="text-right">{quantity}{quantity > 1 && ' (10% Bulk Discount)'}</span>
                              </div>
                              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                                <span>Total:</span>
                                <span className="text-right">
                                  ${getExactMousepadPrice({
                                    mousepadSize,
                                    thickness,
                                    currency,
                                    quantity,
                                    rgb: mousepadType === 'rgb',
                                  }).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {/* Action Buttons */}
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-gradient-custom hover:bg-gradient-custom-reverse text-white font-semibold shadow-lg text-sm sm:text-base"
                            size="lg"
                            onClick={async () => {
                              try {
                                // Always capture the complete customized design
                                console.log('Capturing design with text elements:', textElements);
                                console.log('RGB settings before capture:', {
                                  mousepadType,
                                  rgbMode,
                                  rgbColor,
                                  rgbBrightness,
                                  rgbAnimationSpeed
                                });
                                console.log('Applied overlays:', appliedOverlays);
                                console.log('Selected template:', selectedTemplate);
                                const finalImage = await captureCompleteDesign();
                                console.log('Capture completed, image length:', finalImage.length);

                                const calculatedPrice = getExactMousepadPrice({
          mousepadSize,
          thickness,
          currency,
          quantity,
          rgb: mousepadType === "rgb",
        });
                                console.log('Calculated price for cart:', calculatedPrice);
                                console.log('Price type:', typeof calculatedPrice);
                                console.log('Is price valid?', !isNaN(calculatedPrice) && calculatedPrice > 0);

                                await addItem({
                                  id: Date.now().toString() + Math.random().toString(36).slice(2),
                                  name: "Custom Mousepad",
                                  image: finalImage,
                                  specs: {
                                    type: mousepadType,
                                    size: mousepadSize,
                                    thickness,
                                    rgb: mousepadType === "rgb" ? {
                                      mode: rgbMode,
                                      color: rgbColor,
                                      brightness: rgbBrightness,
                                      animationSpeed: rgbAnimationSpeed
                                    } : undefined,
                                    text: textElements,
                                    overlays: appliedOverlays,
                                  },
                                  quantity,
                                  price: parseFloat(calculatedPrice.toFixed(2)),
                                });
                                if (toast) {
                                  toast({
                                    title: "Added to Cart!",
                                    description: "Your custom mousepad has been added to the cart.",
                                    duration: 2000,
                                  });
                                }
                                setSideCartOpen(true);
                              } catch (error) {
                                console.error('Error adding to cart:', error);
                                // Fallback to base image if capture fails
                                const fallbackPrice = getExactMousepadPrice({
          mousepadSize,
          thickness,
          currency,
          quantity,
          rgb: mousepadType === "rgb",
        });
                                console.log('Fallback price for cart:', fallbackPrice);
                                await addItem({
                                  id: Date.now().toString() + Math.random().toString(36).slice(2),
                                  name: "Custom Mousepad",
                                  image: editedImage || uploadedImage || "/placeholder.svg",
                                  specs: {
                                    type: mousepadType,
                                    size: mousepadSize,
                                    thickness,
                                    rgb: mousepadType === "rgb" ? {
                                      mode: rgbMode,
                                      color: rgbColor,
                                      brightness: rgbBrightness,
                                      animationSpeed: rgbAnimationSpeed
                                    } : undefined,
                                    text: textElements,
                                    overlays: appliedOverlays,
                                  },
                                  quantity,
                                  price: parseFloat(getExactMousepadPrice({
                    mousepadSize,
                    thickness,
                    currency,
                    quantity,
                    rgb: mousepadType === "rgb",
                  }).toFixed(2)),
                                });
                                if (toast) {
                                  toast({
                                    title: "Added to Cart!",
                                    description: "Your custom mousepad has been added to the cart.",
                                    duration: 2000,
                                  });
                                }
                              }
                            }}
                          >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Add to Cart
                          </Button>
                        </div>

                        {/* Guarantees */}
                        <Card>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2 text-xs sm:text-sm">
                              <div className="flex items-center gap-2 text-green-600">
                                <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0" />
                                <span>30-day money-back guarantee</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-600">
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                <span>Free shipping on orders over $50</span>
                              </div>
                              <div className="flex items-center gap-2 text-purple-600">
                                <div className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0" />
                                <span>1-year warranty included</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
      <SideCart open={sideCartOpen} onClose={() => setSideCartOpen(false)} />
    </TooltipProvider>
  )
}
