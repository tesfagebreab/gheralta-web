// src/lib/cart.ts

/**
 * Retrieves the current cart from local storage.
 * Safely handles server-side rendering checks.
 */
export const getCart = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem("tour_cart");
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    console.error("Error parsing cart:", e);
    return [];
  }
};

/**
 * Adds a tour documentId to the cart and triggers a global update event.
 */
export const addToCart = (id: string) => {
  if (typeof window === "undefined") return;
  const cart = getCart();
  if (!cart.includes(id)) {
    const updated = [...cart, id];
    localStorage.setItem("tour_cart", JSON.stringify(updated));
    // This event tells the floating button to refresh its count
    window.dispatchEvent(new Event("cart-updated"));
  }
};

/**
 * Removes a specific tour from the cart.
 */
export const removeFromCart = (id: string) => {
  if (typeof window === "undefined") return;
  const updated = getCart().filter((itemId) => itemId !== id);
  localStorage.setItem("tour_cart", JSON.stringify(updated));
  window.dispatchEvent(new Event("cart-updated"));
};

/**
 * Clears the cart entirely (used after successful payment).
 */
export const clearCart = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("tour_cart");
  window.dispatchEvent(new Event("cart-updated"));
};