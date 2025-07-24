"use client"
import { useCart } from "@/components/ui/cart-context";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type WixUser = { email: string; id: string } | null;

export default function CartPage() {
  const { items, removeItem, updateItem, clearCart } = useCart();
  const { toast } = useToast();
  const [clearing, setClearing] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);
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

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!wixUser) {
      toast && toast({ title: "User info not loaded", description: "Please wait...", duration: 2000 });
      return;
    }
    const checkoutData = {
      items,
      subtotal,
      shipping,
      tax,
      total,
      user: wixUser,
    };

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
      toast &&
        toast({
          title: "Checkout (Demo)",
          description: "Checkout data sent to Wix parent site.",
          duration: 2000,
        });
    }, 1200);
  };

  // Responsive: stack on mobile, side-by-side on desktop
  return (
    <div className="max-w-5xl mx-auto py-8 px-2 md:px-4 flex flex-col md:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log("Manual user info request");
              if (typeof window !== "undefined" && window.parent) {
                window.parent.postMessage({ type: "requestUserInfo" }, "*");
              }
            }}
          >
            Request User Info
          </Button>
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
                        src={item.image} 
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
                        <span className="ml-4 font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>

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
              disabled={items.length === 0 || checkingOut || !wixUser}
              aria-label="Checkout"
              onClick={handleCheckout}
            >
              {checkingOut ? "Processing..." : "Checkout"}
            </Button>

            {/* Debug info - remove this in production */}
            <div className="mt-2 text-xs text-gray-500">
              Debug: Items: {items.length} | User: {wixUser ? 'Loaded' : 'Not loaded'} | CheckingOut: {checkingOut ? 'Yes' : 'No'}
            </div>
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
  );
} 