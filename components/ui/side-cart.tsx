import React from "react";
import { useCart } from "@/components/ui/cart-context";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface SideCartProps {
  open: boolean;
  onClose: () => void;
}

export const SideCart: React.FC<SideCartProps> = ({ open, onClose }) => {
  const { items, removeItem } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transition-transform duration-300 border-l border-gray-200 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}
      style={{ maxWidth: 360 }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-bold text-lg">Cart</span>
        <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">Your cart is empty.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 items-center border-b pb-3 last:border-b-0">
                <div className="w-14 h-14 relative flex-shrink-0">
                  <Image src={item.image} alt={item.name} fill className="object-cover rounded" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                  <div className="text-xs font-semibold">${(item.price * item.quantity).toFixed(2)}</div>
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
        <Button className="w-full" size="lg" disabled={items.length === 0}>Checkout</Button>
      </div>
    </div>
  );
}; 