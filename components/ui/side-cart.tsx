"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { useCart } from './cart-context';
import { X, Settings, Image, Type, Palette, RotateCcw, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface SideCartProps {
  open: boolean;
  onClose: () => void;
}

export const SideCart: React.FC<SideCartProps> = ({ open, onClose }) => {
  const { items, removeItem, getItemTotalPrice, getCartSubtotal, regenerateItemImage } = useCart();
  const subtotal = getCartSubtotal();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string; itemName: string } | null>(null);

  // Helper function to safely render spec values
  const renderSpecValue = (value: unknown): string | null => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return null;
  };

  // Helper function to render configuration details
  const renderConfigurationDetails = (item: any) => {
    const config = item.configuration;
    if (!config) return null;

    return (
      <div className="text-xs text-gray-600 mt-2 space-y-1">
        {/* Basic specs */}
        <div className="flex items-center gap-1">
          <Settings className="h-3 w-3" />
          <span>{config.mousepadType} • {config.mousepadSize} • {config.thickness}</span>
        </div>
        
        {/* RGB settings if applicable */}
        {config.rgb && (
          <div className="flex items-center gap-1">
            <Palette className="h-3 w-3" />
            <span>RGB {config.rgb.mode} • {config.rgb.brightness}%</span>
          </div>
        )}
        
        {/* Image settings */}
        {(config.imageSettings?.uploadedImage || config.selectedTemplate) && (
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span>
              {config.selectedTemplate ? 'Template' : 'Custom Image'}
              {config.imageSettings?.zoom !== 1 && ` • ${Math.round(config.imageSettings.zoom * 100)}% zoom`}
            </span>
          </div>
        )}
        
        {/* Text elements */}
        {(config.textElements?.length > 0 || config.imageTextOverlays?.length > 0) && (
          <div className="flex items-center gap-1">
            <Type className="h-3 w-3" />
            <span>
              {config.imageTextOverlays?.length || config.textElements?.length} text element{(config.imageTextOverlays?.length || config.textElements?.length) !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        {/* Overlays */}
        {config.appliedOverlays?.length > 0 && (
          <div className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            <span>{config.appliedOverlays.length} overlay{config.appliedOverlays.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  };

  const handleImageClick = (imageSrc: string, itemName: string) => {
    setSelectedImage({ src: imageSrc, alt: itemName, itemName });
    setImageModalOpen(true);
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Cart ({items.length})</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div 
                    className="w-16 h-16 relative overflow-hidden rounded cursor-pointer hover:scale-105 transition-transform duration-200 group"
                    onClick={() => handleImageClick(item.finalImage || item.image || '/placeholder.svg', item.name)}
                  >
                    <img 
                      src={item.finalImage || item.image || '/placeholder.svg'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const typeValue = item.specs?.type ? renderSpecValue(item.specs.type) : null;
                        const sizeValue = item.specs?.size ? renderSpecValue(item.specs.size) : null;
                        return (
                          <>
                            {typeValue && (
                              <span className="bg-gray-100 rounded px-1 mr-1">
                                {typeValue}
                              </span>
                            )}
                            {sizeValue && (
                              <span className="bg-gray-100 rounded px-1 mr-1">
                                {sizeValue}
                              </span>
                            )}
                            {item.specs?.rgb && (
                              <span className="bg-gray-100 rounded px-1">
                                RGB
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Configuration details */}
                    {renderConfigurationDetails(item)}
                    
                    <div className="text-xs text-gray-500 mt-2">Qty: {item.quantity}</div>
                    <div className="text-xs font-semibold">${getItemTotalPrice(item).toFixed(2)}</div>
                    
                    {/* Regenerate image button if final image is missing */}
                    {(!item.finalImage || item.finalImage === '/placeholder.svg' || !item.finalImage.startsWith('data:image')) && item.configuration && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={async () => {
                          await regenerateItemImage(item.id);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Regenerate customized image"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-500">Remove</Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between font-semibold mb-2">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <Button className="w-full mb-2" size="lg" disabled={items.length === 0} onClick={() => { window.location.href = '/cart'; }}>View Cart</Button>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {selectedImage?.itemName}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImageModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 bg-gray-50 min-h-[400px]">
            {selectedImage && (
              <div className="relative max-w-full max-h-full">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 