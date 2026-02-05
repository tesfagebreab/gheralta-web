"use client";
import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export default function SuccessClientHandler() {
  useEffect(() => {
    clearCart();
    window.scrollTo(0, 0);
  }, []);
  return null; // Renders nothing, just runs logic
}