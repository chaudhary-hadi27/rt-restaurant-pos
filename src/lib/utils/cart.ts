import {CartItem} from "@/types/menu";

export const calculateCart = (items: CartItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    return { subtotal, tax, total, itemCount: items.length };
};