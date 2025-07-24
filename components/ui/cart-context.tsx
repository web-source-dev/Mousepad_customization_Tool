"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  specs: Record<string, unknown>;
  quantity: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}

// Image compression utility
const compressImage = (dataUrl: string, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

// Safe localStorage operations with compression
const saveToStorage = async (items: CartItem[]) => {
  try {
    // Compress images before storing
    const compressedItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        image: await compressImage(item.image, 600, 0.7) // Smaller size for cart
      }))
    );
    
    const data = JSON.stringify(compressedItems);
    
    // Check if data is too large (localStorage limit is ~5-10MB)
    if (data.length > 4 * 1024 * 1024) { // 4MB limit
      console.warn('Cart data too large, clearing old items');
      // Remove oldest items to make space
      const reducedItems = compressedItems.slice(-2); // Keep only last 2 items
      localStorage.setItem('mousepadCart', JSON.stringify(reducedItems));
    } else {
      localStorage.setItem('mousepadCart', data);
    }
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
    
    // Try to clear localStorage and save a minimal version
    try {
      localStorage.clear();
      const itemsWithoutImages = items.map(({ image, ...rest }) => rest);
      localStorage.setItem('mousepadCart', JSON.stringify(itemsWithoutImages));
      console.log('Saved cart without images due to storage error');
    } catch (clearError) {
      console.error('Failed to clear localStorage:', clearError);
      // Last resort: remove the cart data completely
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
        // Validate that it's an array
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
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

  // Persist to localStorage with compression
  useEffect(() => {
    if (items.length > 0) {
      saveToStorage(items);
    } else {
      localStorage.removeItem('mousepadCart');
    }
  }, [items]);

  const addItem = async (item: CartItem) => {
    try {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i);
        }
        return [...prev, item];
      });
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, setItems, addItem, removeItem, updateItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
} 