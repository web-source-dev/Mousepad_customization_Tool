"use client"
import { useCart } from "@/components/ui/cart-context";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Minus, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserDetailsForm from "@/components/user-details-form";

type WixUser = { email: string; id: string } | null;

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateItem, clearCart, getItemTotalPrice, getCartSubtotal, regenerateItemImage } = useCart();
  const { toast } = useToast();
  const [clearing, setClearing] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
  const [showUserDetailsForm, setShowUserDetailsForm] = React.useState(false);
  const [wixUser, setWixUser] = useState<WixUser>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      console.log("Cart page received message:", event.data);
      console.log("Message origin:", event.origin);
      console.log("Message source:", event.source);

      if (event.data?.type === "userInfo") {
        console.log("Setting wixUser:", event.data);
        setWixUser({
          email: event.data.email,
          id: event.data.id
        });
      }
      if (event.data?.type === "clearCart") {
        clearCart();
      }
    }
    window.addEventListener("message", handleMessage);

    // Request user info if not received within 2 seconds
    const timeout = setTimeout(() => {
      if (typeof window !== "undefined" && window.parent) {
        console.log("Requesting user info from parent...");
        window.parent.postMessage({ type: "requestUserInfo" }, "*");
      }
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
    };
  }, [clearCart]);

  // Separate effect to request user info if not received
  useEffect(() => {
    if (!wixUser && typeof window !== "undefined" && window.parent) {
      const timeout = setTimeout(() => {
        console.log("Requesting user info from parent...");
        window.parent.postMessage({ type: "requestUserInfo" }, "*");
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [wixUser]);

  // Add debugging for button state
  console.log("Cart page state:", { wixUser, items: items.length, checkingOut });

  const subtotal = getCartSubtotal();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    setShowUserDetailsForm(true);
  };

  const handleUserDetailsSubmit = async (userDetails: any) => {
    try {
      // Collect all item data including customized images
      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          // Get the original uploaded image URL
          const originalImageUrl = item.image;
          
          // Get the customized image base64 (if available in specs)
          let customizedImageBase64 = null;
          
          // Check if the item has a customized image in its specs
          if (item.specs && item.specs.customizedImage) {
            customizedImageBase64 = item.specs.customizedImage;
          } else {
            // If no customized image is stored, try to generate it from the current image
            // This is a fallback in case the customization wasn't saved properly
            customizedImageBase64 = originalImageUrl;
          }

          return {
            ...item,
            originalImageUrl,
            customizedImageBase64,
            // Include all specs data
            specs: {
              ...item.specs,
              // Ensure we have the image data
              originalImageUrl,
              customizedImageBase64
            }
          };
        })
      );

      const checkoutData = {
        items: itemsWithImages,
        subtotal,
        shipping,
        tax,
        total,
        currency: items[0]?.currency || 'USD', // Get currency from first item, default to USD
        user: wixUser,
        userDetails, // Include the user details form data
        // Additional metadata
        orderDate: new Date().toISOString(),
        orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // Include all form data
        customerInfo: {
          ...userDetails,
          wixUserId: wixUser?.id,
          wixUserEmail: wixUser?.email
        }
      };

      console.log('Checkout data:', checkoutData);

      console.log('Sending complete checkout data to Wix:', {
        orderId: checkoutData.orderId,
        itemCount: checkoutData.items.length,
        total: checkoutData.total,
        customerEmail: checkoutData.customerInfo.email
      });

      if (typeof window !== "undefined" && window.parent) {
        window.parent.postMessage(
          {
            type: "checkoutData",
            payload: checkoutData,
          },
          "*"
        );
      }

      setCheckingOut(true);
      setTimeout(() => {
        setCheckingOut(false);
        setShowUserDetailsForm(false);
        toast &&
          toast({
            title: "Checkout Complete",
            description: "Order data sent to Wix. You will receive a confirmation email shortly.",
            duration: 3000,
          });
      }, 1200);
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast &&
        toast({
          title: "Checkout Error",
          description: "There was an error processing your order. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
    }
  };

  const handleUserDetailsCancel = () => {
    setShowUserDetailsForm(false);
  };

  // Responsive: stack on mobile, side-by-side on desktop
  return (
    <div className="max-w-5xl mx-auto py-8 px-2 md:px-4">
      {showUserDetailsForm ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleUserDetailsCancel}>&larr; Back to Cart</Button>
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>
          
          {/* Checkout Layout - Show cart items on left if multiple items */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side - Cart Items Summary (show if more than 1 item) */}
            {items.length > 1 && (
              <div className="space-y-4 w-full">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary ({items.length} items)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {items.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                          <div className="w-16 h-16 relative flex-shrink-0 overflow-hidden rounded border bg-white">
                            <Image 
                              src={item.finalImage || item.image || '/placeholder.svg'} 
                              alt={item.name} 
                              fill 
                              className="object-contain" 
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.configuration?.mousepadType === 'rgb' ? 'RGB Gaming' : 'Standard'} • 
                              {item.configuration?.mousepadSize} • {item.configuration?.thickness}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {item.quantity} • ${getItemTotalPrice(item).toFixed(2)}
                            </div>
                            {/* Show customization highlights */}
                            {item.configuration?.textElements?.length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                ✓ {item.configuration.textElements.length} text element{item.configuration.textElements.length !== 1 ? 's' : ''}
                              </div>
                            )}
                            {item.configuration?.appliedOverlays?.length > 0 && (
                              <div className="text-xs text-purple-600">
                                ✓ {item.configuration.appliedOverlays.length} overlay{item.configuration.appliedOverlays.length !== 1 ? 's' : ''}
                              </div>
                            )}
                            {item.configuration?.rgb && (
                              <div className="text-xs text-green-600">
                                ✓ RGB {item.configuration.rgb.mode} mode
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Show "and X more" if there are more than 4 items */}
                      {items.length > 4 && (
                        <div className="text-center py-2 text-sm text-gray-500 border-t">
                          and {items.length - 4} more item{items.length - 4 !== 1 ? 's' : ''}
                        </div>
                      )}
                      
                      {/* Order totals */}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Shipping:</span>
                          <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Right Side - Checkout Form */}
            <div className="w-full">
              {/* Show compact order summary for single items */}
              {items.length === 1 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 p-3 border rounded-lg">
                      <div className="w-20 h-20 relative flex-shrink-0 overflow-hidden rounded border bg-white">
                        <Image 
                          src={items[0].finalImage || items[0].image || '/placeholder.svg'} 
                          alt={items[0].name} 
                          fill 
                          className="object-contain" 
                          unoptimized
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{items[0].name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {items[0].configuration?.mousepadType === 'rgb' ? 'RGB Gaming' : 'Standard'} • 
                          {items[0].configuration?.mousepadSize} • {items[0].configuration?.thickness}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {items[0].quantity} • ${getItemTotalPrice(items[0]).toFixed(2)}
                        </div>
                        {/* Show customization highlights */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {items[0].configuration?.textElements?.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {items[0].configuration.textElements.length} text element{items[0].configuration.textElements.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {items[0].configuration?.appliedOverlays?.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {items[0].configuration.appliedOverlays.length} overlay{items[0].configuration.appliedOverlays.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {items[0].configuration?.rgb && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              RGB {items[0].configuration.rgb.mode} mode
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <UserDetailsForm
                onSubmit={handleUserDetailsSubmit}
                onCancel={handleUserDetailsCancel}
                isLoading={checkingOut}
                initialEmail={wixUser?.email || ''}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="mb-4">
            <Button variant="outline" onClick={() => router.back()}>&larr; Back</Button>
          </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Cart</h1>
        </div>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Image src="/placeholder.svg" alt="Empty cart" width={120} height={120} className="mb-6 opacity-60" />
            <div className="text-xl font-semibold text-gray-500 mb-2">Your cart is empty.</div>
            <Link href="/" className="inline-block mt-2">
              <Button size="lg" className="px-8">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cart Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-4 items-center border-b pb-6 last:border-b-0 group">
                    <div className="w-24 h-24 relative flex-shrink-0 overflow-hidden rounded-lg border bg-white">
                      <Image 
                        src={item.finalImage || item.image || '/placeholder.svg'} 
                        alt={item.name} 
                        fill 
                        className="object-contain group-hover:scale-105 transition-transform duration-200" 
                        style={{
                          padding: '1px',
                          backgroundColor: 'transparent',
                          objectFit: 'contain'
                        }}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-lg truncate">{item.name}</div>
                        <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => { removeItem(item.id); toast && toast({ title: "Removed", description: "Item removed from cart.", duration: 1500 }); }} className="text-red-500 hover:bg-red-100">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mb-1 flex flex-wrap gap-2 mt-1">
                        {Object.entries(item.specs || {}).map(([k, v]) => {
                          // Format the spec values for better display
                          let displayValue = String(v);
                          
                          if (typeof v === 'object' && v !== null) {
                            if (k === 'rgb' && (v as any).mode) {
                              displayValue = `${(v as any).mode} mode`;
                              if ((v as any).color && (v as any).mode !== 'rainbow') {
                                displayValue += ` (${(v as any).color})`;
                              }
                              if ((v as any).brightness) {
                                displayValue += ` - ${(v as any).brightness}% brightness`;
                              }
                            } else if (k === 'text' && Array.isArray(v) && v.length > 0) {
                              const textItems = v.map((textItem: any) => textItem.text).join(', ');
                              displayValue = textItems;
                            } else if (k === 'overlays' && Array.isArray(v)) {
                              displayValue = v.length > 0 ? `${v.length} overlay(s)` : 'None';
                            } else {
                              displayValue = 'Custom';
                            }
                          }
                          
                          return (
                            <span key={k} className="bg-gray-100 rounded px-2 py-0.5">
                              {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {displayValue}
                            </span>
                          );
                        })}
                      </div>
                      
                      {/* Configuration details */}
                      {item.configuration && (
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Configuration:</span>
                            <span>{item.configuration.mousepadType} • {item.configuration.mousepadSize} • {item.configuration.thickness}</span>
                          </div>
                          
                          {item.configuration.rgb && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">RGB:</span>
                              <span>{item.configuration.rgb.mode} mode • {item.configuration.rgb.brightness}% brightness</span>
                            </div>
                          )}
                          
                          {(item.configuration.imageSettings?.uploadedImage || item.configuration.selectedTemplate) && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Image:</span>
                              <span>
                                {item.configuration.selectedTemplate ? 'Template' : 'Custom Upload'}
                                {item.configuration.imageSettings?.zoom !== 1 && ` • ${Math.round(item.configuration.imageSettings.zoom * 100)}% zoom`}
                              </span>
                            </div>
                          )}
                          
                          {(item.configuration.textElements?.length > 0 || item.configuration.imageTextOverlays?.length > 0) && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Text:</span>
                              <span>
                                {item.configuration.imageTextOverlays?.length || item.configuration.textElements?.length} element{(item.configuration.imageTextOverlays?.length || item.configuration.textElements?.length) !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          
                          {item.configuration.appliedOverlays?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Overlays:</span>
                              <span>{item.configuration.appliedOverlays.length} applied</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm">Qty:</span>
                        <Button size="icon" variant="outline" aria-label="Decrease quantity" onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })} disabled={item.quantity <= 1}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={e => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="w-14 px-2 py-1 border rounded text-center"
                          aria-label="Quantity"
                        />
                        <Button size="icon" variant="outline" aria-label="Increase quantity" onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="ml-4 text-right">
                          <div className="font-semibold">${getItemTotalPrice(item).toFixed(2)}</div>
                          {item.quantity > 1 && (
                            <div className="text-xs text-green-600">
                              Bulk discount applied (10% off)
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Regenerate image button if final image is missing */}
                      {(!item.finalImage || item.finalImage === '/placeholder.svg' || !item.finalImage.startsWith('data:image')) && item.configuration && (
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              await regenerateItemImage(item.id);
                              toast && toast({
                                title: "Image Regenerated",
                                description: "The customized image has been regenerated.",
                                duration: 2000,
                              });
                            }}
                            className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Regenerate Image
                          </Button>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Order Summary Sidebar (sticky on desktop) */}
      <div className="md:w-80 w-full md:sticky md:top-8 h-fit">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full mt-6"
              size="lg"
              disabled={items.length === 0 || checkingOut}
              aria-label="Checkout"
              onClick={handleCheckout}
            >
              {checkingOut ? "Processing..." : "Checkout"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full mt-2" disabled={items.length === 0 || clearing} aria-label="Clear Cart">{clearing ? "Clearing..." : "Clear Cart"}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                  <AlertDialogDescription>This will remove all items from your cart. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { setClearing(true); setTimeout(() => { clearCart(); setClearing(false); toast && toast({ title: "Cart Cleared", description: "All items have been removed from your cart.", duration: 1500 }); }, 1000); }}>Clear</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href="/" className="block mt-4">
              <Button variant="ghost" className="w-full" aria-label="Continue Shopping">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
        </div>
      )}
    </div>
  );
} 