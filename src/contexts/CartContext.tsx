"use client";

import type { CartItem, Product, Order } from "@/lib/types";
import { cartService, orderService } from "@/lib/api";
import React, { createContext, useReducer, useEffect, ReactNode } from "react";

// Mock user ID - in a real app, this would come from authentication
const MOCK_USER_ID = "user-123";

interface CartState {
  items: CartItem[];
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}

type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string } // productId
  | { type: "UPDATE_ITEM"; payload: { productId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "LOAD_STATE"; payload: CartState };

const initialState: CartState = {
  items: [],
  orders: [],
  isLoading: false,
  error: null,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_CART":
      return { ...state, items: action.payload };
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    }
    case "UPDATE_ITEM": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload], items: [] };
    case "LOAD_STATE":
      return action.payload;
    default:
      return state;
  }
};

interface CartContextType {
  state: CartState;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  placeOrder: (order: Order) => void;
  loadCart: () => Promise<void>;
  totalCartItems: number;
  cartTotalAmount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "myBasketCartState";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from microservice on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      
      const cart = await cartService.getCart(MOCK_USER_ID);
      dispatch({ type: "SET_CART", payload: cart.items });
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to load cart" });
      
      // Load from localStorage as fallback
      try {
        const storedState = localStorage.getItem(CART_STORAGE_KEY);
        if (storedState) {
          dispatch({ type: "LOAD_STATE", payload: JSON.parse(storedState) });
        }
      } catch (localError) {
        console.error("Failed to load cart state from localStorage:", localError);
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const addToCart = async (product: Product) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      
      const cart = await cartService.addToCart(MOCK_USER_ID, product.id);
      dispatch({ type: "SET_CART", payload: cart.items });
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to add item to cart" });
      
      // Fallback to local state
      dispatch({ type: "ADD_ITEM", payload: product });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      
      const cart = await cartService.removeFromCart(MOCK_USER_ID, productId);
      dispatch({ type: "SET_CART", payload: cart.items });
    } catch (error) {
      console.error('Error removing from cart:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to remove item from cart" });
      
      // Fallback to local state
      dispatch({ type: "REMOVE_ITEM", payload: productId });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateCartItem = async (productId: string, quantity: number) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      
      const cart = await cartService.updateCartItem(MOCK_USER_ID, productId, quantity);
      dispatch({ type: "SET_CART", payload: cart.items });
    } catch (error) {
      console.error('Error updating cart item:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to update cart item" });
      
      // Fallback to local state
      dispatch({ type: "UPDATE_ITEM", payload: { productId, quantity } });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });
      
      await cartService.clearCart(MOCK_USER_ID);
      dispatch({ type: "CLEAR_CART" });
    } catch (error) {
      console.error('Error clearing cart:', error);
      dispatch({ type: "SET_ERROR", payload: "Failed to clear cart" });
      
      // Fallback to local state
      dispatch({ type: "CLEAR_CART" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const placeOrder = (order: Order) => {
    dispatch({ type: "ADD_ORDER", payload: order });
  };

  // Save to localStorage as backup
  useEffect(() => {
    if (!state.isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save cart state to localStorage:", error);
      }
    }
  }, [state]);

  const totalCartItems = state.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const cartTotalAmount = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        placeOrder,
        loadCart,
        totalCartItems,
        cartTotalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = React.useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
