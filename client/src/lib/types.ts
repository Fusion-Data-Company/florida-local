import { CartItem as BaseCartItem, Product } from "@shared/types";

// Extended CartItem type that includes joined product data
export interface CartItemWithProduct extends BaseCartItem {
  product: Product;
}

// Type for cart items as returned by the API
export type ApiCartItem = CartItemWithProduct;

// Re-export all types from shared/types for convenience
export * from "@shared/types";