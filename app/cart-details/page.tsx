"use client"
import { useCart } from "@/components/ui/cart-context";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Minus } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import React from "react";

export default function CartDetailsPage() {
  const { items, removeItem, updateItem, clearCart } = useCart();
  const { toast } = useToast();
  const [clearing, setClearing] = React.useState(false);
  const [checkingOut, setCheckingOut] = React.useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Example: Gather all possible data
  const handleCheckout = () => {
    const checkoutData = {
      items,
      subtotal,
      shipping,
      tax,
      total,
      // ...other data
    };

    console.log("Sending checkout data", checkoutData);

    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage(
        {
          type: "checkoutData",
          payload: checkoutData,
        },
        "*"
      );
      console.log("Message sent to parent");
    } else {
      console.log("Not in an iframe or window.parent not available");
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 md:px-4 flex flex-col md:flex-row gap-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-bold mb-6">Cart Details</h1>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Image src="/placeholder.svg" alt="Empty cart" width={120} height={120} className="mb-6 opacity-60" />
            <div className="text-xl font-semibold text-gray-500 mb-2">Your cart is empty.</div>
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
                      <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-200" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-lg truncate">{item.name}</div>
                        <Button variant="ghost" size="icon" aria-label="Remove item" onClick={() => { removeItem(item.id); toast && toast({ title: "Removed", description: "Item removed from cart.", duration: 1500 }); }} className="text-red-500 hover:bg-red-100">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500 mb-1 flex flex-wrap gap-2 mt-1">
                        {Object.entries(item.specs || {}).map(([k, v]) => (
                          <span key={k} className="bg-gray-100 rounded px-2 py-0.5">{k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        ))}
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
                      <div className="flex gap-2 mt-2">
                        <Button variant="secondary" size="sm" className="rounded px-3" disabled>Save for Later</Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 