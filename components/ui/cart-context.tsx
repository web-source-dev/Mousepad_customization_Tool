"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  image?: string; // Made optional since it can be undefined
  finalImage?: string; // Store the final customized image
  specs: Record<string, unknown>;
  quantity: number;
  price: number;
  currency: 'USD' | 'SGD';
  // Store only the original image URL, not Base64
  originalImageUrl?: string;
  
  // Comprehensive configuration data
  configuration: {
    // Basic mousepad settings
    mousepadType: string;
    mousepadSize: string;
    thickness: string;
    
    // RGB settings (if applicable)
    rgb?: {
      mode: string;
      color: string;
      brightness: number;
      animationSpeed: number;
    };
    
    // Image configuration
    imageSettings: {
      uploadedImage: string | null;
      editedImage: string | null;
      originalImage: string | null;
      zoom: number;
      position: { x: number; y: number };
      adjustments: {
        brightness: number;
        contrast: number;
        saturation: number;
        blur: number;
        sharpen: number;
        gamma: number;
      };
      filter: string;
      crop: {
        x: number;
        y: number;
        width: number;
        height: number;
      } | null;
    };
    
    // Text overlays and elements
    textElements: any[];
    imageTextOverlays: {
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
    }[];
    
    // Template and overlay data
    selectedTemplate: {
      id: number;
      overlay: string;
    } | null;
    appliedOverlays: string[];
    
    // Additional design elements
    logoFile: string | null;
    uploadedImages: string[];
  };
}

interface CartContextType {
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getItemTotalPrice: (item: CartItem) => number;
  getCartSubtotal: () => number;
  regenerateItemImage: (itemId: string) => Promise<void>;
}

// Helper function to calculate item total price with bulk discount
const calculateItemTotalPrice = (item: CartItem): number => {
  const baseTotal = item.price * item.quantity;
  // Apply 10% bulk discount for quantities > 1
  if (item.quantity > 1) {
    return baseTotal * 0.9;
  }
  return baseTotal;
};

// Helper function to regenerate final image from configuration
const regenerateFinalImage = async (item: CartItem): Promise<string> => {
  try {
    console.log('Starting image regeneration for item:', item.id);
    console.log('Item configuration:', item.configuration);
    
    // If we already have a finalImage that's not a placeholder, use it
    if (item.finalImage && item.finalImage !== '/placeholder.svg' && !item.finalImage.includes('data:image')) {
      console.log('Using existing finalImage:', item.finalImage);
      return item.finalImage;
    }

    // Get the base image from configuration
    const baseImage = item.configuration?.imageSettings?.uploadedImage || 
                     item.configuration?.imageSettings?.editedImage || 
                     item.originalImageUrl || 
                     item.image;

    console.log('Base image source:', baseImage);

    if (!baseImage || baseImage === '/placeholder.svg') {
      console.log('No valid base image found, using placeholder');
      return '/placeholder.svg';
    }

    // Get mousepad dimensions from configuration
    const mousepadSize = item.configuration?.mousepadSize || '400x900';
    const [width, height] = mousepadSize.split('x').map(Number);
    
    // Validate dimensions and provide fallback
    const finalWidth = width && !isNaN(width) ? width : 400;
    const finalHeight = height && !isNaN(height) ? height : 900;
    
    console.log('Mousepad dimensions:', finalWidth, 'x', finalHeight);

    // Create a canvas to regenerate the final image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        console.log('Base image loaded, dimensions:', img.width, 'x', img.height);
        
        // Set canvas size to match mousepad dimensions
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        console.log('Canvas set to mousepad size:', canvas.width, 'x', canvas.height);

        if (ctx) {
          // Draw base image to fit mousepad dimensions
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          console.log('Base image drawn to canvas at mousepad size');

          // Apply image adjustments if available
          const adjustments = item.configuration?.imageSettings?.adjustments;
          if (adjustments) {
            console.log('Applying image adjustments:', adjustments);
            // Apply brightness, contrast, etc. using CSS filters
            // This is a simplified version - in a real implementation you'd use more sophisticated image processing
          }

          // Draw text elements (optional - only if they exist)
          const textElements = item.configuration?.textElements || [];
          console.log('Drawing text elements:', textElements.length);
          textElements.forEach((element: any) => {
            if (ctx && element.type === 'text' && element.text && element.text.trim()) {
              const fontWeight = element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal";
              const fontSize = Math.max(element.size * 1.5, 18);
              ctx.font = `${fontWeight} ${fontSize}px ${element.font}`;
              ctx.fillStyle = element.color || '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // Calculate position based on percentage of mousepad dimensions
              const x = (element.position.x / 100) * canvas.width;
              const y = (element.position.y / 100) * canvas.height;

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((element.rotation * Math.PI) / 180);
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

              ctx.fillText(element.text, 0, 0);
              ctx.restore();
              console.log('Drew text element:', element.text, 'at position:', x, y);
            }
          });

          // Draw overlays FIRST - use Promise.all to wait for all overlays to load
          const appliedOverlays = item.configuration?.appliedOverlays || [];
          console.log('Drawing overlays:', appliedOverlays.length, appliedOverlays);
          if (appliedOverlays.length > 0) {
            try {
              await Promise.all(appliedOverlays.map(async (overlayUrl: string, index: number) => {
                console.log(`Loading overlay ${index + 1}:`, overlayUrl);
                const overlayImg = new window.Image();
                overlayImg.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                  overlayImg.onload = () => {
                    console.log(`Overlay ${index + 1} loaded successfully`);
                    resolve(true);
                  };
                  overlayImg.onerror = (error) => {
                    console.error(`Failed to load overlay ${index + 1}:`, error);
                    reject(error);
                  };
                  overlayImg.src = overlayUrl;
                });

                if (ctx) {
                  // Draw overlay to cover the entire canvas
                  ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
                  console.log(`Drew overlay ${index + 1} to canvas`);
                }
              }));
            } catch (error) {
              console.warn('Failed to draw overlays:', error);
            }
          }

          // Add RGB effects if applicable
          const rgb = item.configuration?.rgb;
          if (rgb && item.configuration?.mousepadType === 'rgb' && ctx) {
            console.log('Adding RGB effects:', rgb);
            const glowColor = rgb.mode === 'rainbow' ? '#ff0000' : rgb.color;
            const glowIntensity = rgb.brightness / 100;

            ctx.save();
            ctx.globalAlpha = Math.max(glowIntensity * 0.5, 0.15);
            ctx.fillStyle = glowColor;

            const borderWidth = Math.max(canvas.width, canvas.height) * 0.015;
            const cornerRadius = Math.min(canvas.width, canvas.height) * 0.05;

            // Draw border
            ctx.fillRect(cornerRadius, 0, canvas.width - cornerRadius * 2, borderWidth);
            ctx.fillRect(cornerRadius, canvas.height - borderWidth, canvas.width - cornerRadius * 2, borderWidth);
            ctx.fillRect(0, cornerRadius, borderWidth, canvas.height - cornerRadius * 2);
            ctx.fillRect(canvas.width - borderWidth, cornerRadius, borderWidth, canvas.height - cornerRadius * 2);

            ctx.restore();
            console.log('Added RGB border effects');
          }

          const finalImageData = canvas.toDataURL('image/png', 1.0);
          console.log('Final image generated successfully, size:', finalImageData.length, 'characters');
          resolve(finalImageData);
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = (error) => {
        console.error('Error loading base image for regeneration:', error);
        resolve('/placeholder.svg');
      };

      img.src = baseImage;
    });
  } catch (error) {
    console.error('Error regenerating final image:', error);
    return '/placeholder.svg';
  }
};

// Safe localStorage operations - store with comprehensive data including final images
const saveToStorage = (items: CartItem[]) => {
  try {
    console.log('Saving items to storage:', items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })));
    
    // Store comprehensive cart info in localStorage including final customized images
    const itemsToStore = items.map(item => {
      // Safely handle image property - store the final customized image
      const imageUrl = item.image || '/placeholder.svg';
      
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        currency: item.currency,
        specs: item.specs,
        originalImageUrl: item.originalImageUrl,
        configuration: item.configuration, // Store full configuration
        finalImage: imageUrl, // Store the final customized image directly
        image: imageUrl // Keep image for backward compatibility
      };
    });
    
    localStorage.setItem('mousepadCart', JSON.stringify(itemsToStore));
    
    // Also store in sessionStorage as backup for large images
    items.forEach((item) => {
      const imageUrl = item.image;
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
        sessionStorage.setItem(`cartImage_${item.id}`, imageUrl);
      }
    });
    
    // Store configuration data in sessionStorage for persistence
    items.forEach((item) => {
      if (item.configuration) {
        sessionStorage.setItem(`cartConfig_${item.id}`, JSON.stringify(item.configuration));
      }
    });
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
    
    // Try to save a minimal version without images
    try {
      const itemsWithoutImages = items.map(({ image, finalImage, ...rest }) => rest);
      localStorage.setItem('mousepadCart', JSON.stringify(itemsWithoutImages));
      console.log('Saved cart without images due to storage error');
    } catch (clearError) {
      console.error('Failed to save cart to localStorage:', clearError);
      localStorage.removeItem('mousepadCart');
    }
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mousepadCart');
    if (stored) {
      try {
        const parsedItems = JSON.parse(stored);
        console.log('Loaded items from localStorage:', parsedItems.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })));
        
        // Validate that it's an array
        if (Array.isArray(parsedItems)) {
          // Restore full images and configuration from localStorage and sessionStorage
          const restoredItems = parsedItems.map((item: any) => {
            const sessionImage = sessionStorage.getItem(`cartImage_${item.id}`);
            const sessionConfig = sessionStorage.getItem(`cartConfig_${item.id}`);
            
            let restoredItem = { 
              ...item, 
              image: item.image || '/placeholder.svg',
              finalImage: item.finalImage || item.image || '/placeholder.svg'
            };
            
            // Prioritize finalImage from localStorage, then sessionStorage backup
            if (item.finalImage && item.finalImage !== '/placeholder.svg') {
              restoredItem.image = item.finalImage;
              restoredItem.finalImage = item.finalImage;
            } else if (sessionImage) {
              restoredItem.image = sessionImage;
              restoredItem.finalImage = sessionImage;
            }
            
            // Restore configuration if available
            if (sessionConfig) {
              try {
                restoredItem.configuration = JSON.parse(sessionConfig);
              } catch (e) {
                console.warn('Failed to parse configuration for item:', item.id);
              }
            }
            
            return restoredItem;
          });
          
          // Set items first, then regenerate final images
          setItems(restoredItems);
          
          // Regenerate final images for items that need it
          const regenerateImages = async () => {
            const updatedItems = await Promise.all(
              restoredItems.map(async (item) => {
                // Check if we need to regenerate the final image
                const needsRegeneration = !item.finalImage || 
                                        item.finalImage === '/placeholder.svg' || 
                                        !item.finalImage.startsWith('data:image');
                
                if (needsRegeneration && item.configuration) {
                  try {
                    const regeneratedImage = await regenerateFinalImage(item);
                    return { ...item, finalImage: regeneratedImage, image: regeneratedImage };
                  } catch (error) {
                    console.error('Failed to regenerate image for item:', item.id, error);
                    return item;
                  }
                }
                return item;
              })
            );
            
            // Update items with regenerated images
            setItems(updatedItems);
          };
          
          // Regenerate images after a short delay to ensure the component is mounted
          setTimeout(regenerateImages, 100);
        } else {
          throw new Error('Cart data is not an array');
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
        // Clear corrupted data
        localStorage.removeItem('mousepadCart');
        setItems([]);
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (items.length > 0) {
      saveToStorage(items);
    } else {
      localStorage.removeItem('mousepadCart');
    }
  }, [items]);

  const addItem = async (item: CartItem) => {
    try {
      // Ensure the item has a valid image
      const validatedItem = {
        ...item,
        image: item.image || '/placeholder.svg'
      };
      
      console.log('Adding item to cart:', {
        id: validatedItem.id,
        name: validatedItem.name,
        price: validatedItem.price,
        quantity: validatedItem.quantity,
        specs: validatedItem.specs,
        hasImage: !!validatedItem.image
      });
      
      setItems((prev) => {
        const existing = prev.find((i) => i.id === validatedItem.id);
        if (existing) {
          const updatedItem = { ...existing, quantity: existing.quantity + validatedItem.quantity };
          console.log('Updated existing item:', updatedItem);
          return prev.map((i) => i.id === validatedItem.id ? updatedItem : i);
        }
        console.log('Adding new item to cart');
        return [...prev, validatedItem];
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  };

  const removeItem = (id: string) => {
    // Clean up sessionStorage
    sessionStorage.removeItem(`cartImage_${id}`);
    sessionStorage.removeItem(`cartConfig_${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  };

  const clearCart = () => {
    // Clean up all sessionStorage cart data
    items.forEach(item => {
      sessionStorage.removeItem(`cartImage_${item.id}`);
      sessionStorage.removeItem(`cartConfig_${item.id}`);
    });
    setItems([]);
  };

  const getItemTotalPrice = (item: CartItem) => {
    return calculateItemTotalPrice(item);
  };

  const getCartSubtotal = () => {
    return items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);
  };

  const regenerateItemImage = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      const regeneratedImage = await regenerateFinalImage(item);
      updateItem(itemId, { finalImage: regeneratedImage, image: regeneratedImage });
    } catch (error) {
      console.error('Failed to regenerate image for item:', itemId, error);
    }
  };

  return (
    <CartContext.Provider value={{ items, setItems, addItem, removeItem, updateItem, clearCart, getItemTotalPrice, getCartSubtotal, regenerateItemImage }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
} 