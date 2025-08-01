"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  image: string;
  specs: Record<string, unknown>;
  quantity: number;
  price: number;
  currency: 'USD' | 'SGD';
  // Store only the original image URL, not Base64
  originalImageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}



// Safe localStorage operations - store without large images
const saveToStorage = (items: CartItem[]) => {
  try {
    console.log('Saving items to storage:', items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })));
    
    // Store items without large image data to avoid localStorage quota issues
    const storageItems = items.map(item => ({
      ...item,
      image: item.image.startsWith('data:image') ? '/placeholder.svg' : item.image // Replace Base64 with placeholder
    }));
    
    const data = JSON.stringify(storageItems);
    localStorage.setItem('mousepadCart', data);
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
    
    // Try to save a minimal version without images
    try {
      const itemsWithoutImages = items.map(({ image, ...rest }) => rest);
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
      console.log('Adding item to cart:', {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        specs: item.specs
      });
      
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          const updatedItem = { ...existing, quantity: existing.quantity + item.quantity };
          console.log('Updated existing item:', updatedItem);
          return prev.map((i) => i.id === item.id ? updatedItem : i);
        }
        console.log('Adding new item to cart');
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