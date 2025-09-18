import { CartItem as BaseCartItem, Product } from "@shared/schema";

// Extended CartItem type that includes joined product data
export interface CartItemWithProduct extends BaseCartItem {
  product: Product;
}

// Type for cart items as returned by the API
export type ApiCartItem = CartItemWithProduct;