import { useState, useEffect } from 'react'

export function useCart<T extends { id: string; price: number }>(storageKey = 'cart') {
    const [items, setItems] = useState<Array<T & { quantity: number }>>([])

    useEffect(() => {
        const saved = localStorage.getItem(storageKey)
        if (saved) setItems(JSON.parse(saved))
    }, [])

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(items))
    }, [items])

    const add = (item: T) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === item.id)
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            return [...prev, { ...item, quantity: 1 }]
        })
    }

    const updateQty = (id: string, quantity: number) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i).filter(i => i.quantity > 0))
    }

    const remove = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const clear = () => setItems([])

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.05
    const total = subtotal + tax

    return {
        items,
        add,
        updateQty,
        remove,
        clear,
        count: items.length,
        subtotal,
        tax,
        total
    }
}