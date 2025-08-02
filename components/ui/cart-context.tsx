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
    // If we already have a finalImage that's not a placeholder, use it
    if (item.finalImage && item.finalImage !== '/placeholder.svg' && !item.finalImage.includes('data:image')) {
      return item.finalImage;
    }

    // Get the base image from configuration
    const baseImage = item.configuration?.imageSettings?.uploadedImage || 
                     item.configuration?.imageSettings?.editedImage || 
                     item.originalImageUrl || 
                     item.image;

    if (!baseImage || baseImage === '/placeholder.svg') {
      return '/placeholder.svg';
    }

    // Create a canvas to regenerate the final image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas size to match image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Ensure minimum size for visibility
        const minSize = 200;
        if (canvas.width < minSize || canvas.height < minSize) {
          const scale = Math.max(minSize / canvas.width, minSize / canvas.height);
          canvas.width = Math.round(canvas.width * scale);
          canvas.height = Math.round(canvas.height * scale);
        }

        if (ctx) {
          // Draw base image
          if (canvas.width === img.width && canvas.height === img.height) {
            ctx.drawImage(img, 0, 0);
          } else {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }

          // Apply image adjustments if available
          const adjustments = item.configuration?.imageSettings?.adjustments;
          if (adjustments) {
            // Apply brightness, contrast, etc. using CSS filters
            // This is a simplified version - in a real implementation you'd use more sophisticated image processing
          }

          // Draw text elements
          const textElements = item.configuration?.textElements || [];
          textElements.forEach((element: any) => {
            if (ctx && element.type === 'text') {
              const fontWeight = element.font === "Orbitron" || element.font === "Audiowide" ? "bold" : "normal";
              const fontSize = Math.max(element.size * 1.5, 18);
              ctx.font = `${fontWeight} ${fontSize}px ${element.font}`;
              ctx.fillStyle = element.color || '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

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
            }
          });

          // Draw overlays
          const appliedOverlays = item.configuration?.appliedOverlays || [];
          appliedOverlays.forEach(async (overlayUrl: string) => {
            try {
              const overlayImg = new window.Image();
              overlayImg.crossOrigin = 'anonymous';
              
              await new Promise((resolve, reject) => {
                overlayImg.onload = resolve;
                overlayImg.onerror = reject;
                overlayImg.src = overlayUrl;
              });

              if (ctx) {
                ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);
              }
            } catch (error) {
              console.warn('Failed to draw overlay:', error);
            }
          });

          // Add RGB effects if applicable
          const rgb = item.configuration?.rgb;
          if (rgb && item.configuration?.mousepadType === 'rgb' && ctx) {
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
          }

          resolve(canvas.toDataURL('image/png', 1.0));
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