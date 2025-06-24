"use client";

import type { CartItem, Product, Order } from "@/lib/types";
import React, { createContext, useReducer, useEffect, ReactNode } from "react";

interface CartState {
  items: CartItem[];
  orders: Order[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: string } // productId
  | { type: "CLEAR_CART" }
  | { type: "PLACE_ORDER"; payload: Order }
  | { type: "LOAD_STATE"; payload: CartState };

const initialState: CartState = {
  items: [],
  orders: [],
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
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
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "PLACE_ORDER":
      return { ...state, orders: [...state.orders, action.payload], items: [] };
    case "LOAD_STATE":
      return action.payload;
    default:
      return state;
  }
};

interface CartContextType extends CartState {
  dispatch: React.Dispatch<CartAction>;
  totalCartItems: number;
  cartTotalAmount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "myBasketCartState";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(CART_STORAGE_KEY);
      if (storedState) {
        dispatch({ type: "LOAD_STATE", payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error("Failed to load cart state from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save cart state to localStorage:", error);
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
    <CartContext.Provider value={{ ...state, dispatch, totalCartItems, cartTotalAmount }}>
      {children}
    </CartContext.Provider>
  );
};
