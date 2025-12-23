// src/lib/hooks/useOrderManagement.ts
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

export function useOrderManagement() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const toast = useToast()

    // ✅ Complete order + free table
    const completeOrder = useCallback(async (orderId: string, tableId?: string, orderType?: string) => {
        setLoading(true)
        try {
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', orderId)

            if (orderError) throw orderError

            if (orderType === 'dine-in' && tableId) {
                await supabase
                    .from('restaurant_tables')
                    .update({ status: 'available', current_order_id: null, waiter_id: null })
                    .eq('id', tableId)
            }

            toast.add('success', '✅ Order completed!')
            return { success: true }
        } catch (error: any) {
            toast.add('error', `❌ ${error.message}`)
            return { success: false, error: error.message }
        } finally {
            setLoading(false)
        }
    }, [supabase, toast])

    // ✅ Cancel order + free table
    const cancelOrder = useCallback(async (orderId: string, tableId?: string, orderType?: string) => {
        setLoading(true)
        try {
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('id', orderId)

            if (orderError) throw orderError

            if (orderType === 'dine-in' && tableId) {
                await supabase
                    .from('restaurant_tables')
                    .update({ status: 'available', current_order_id: null, waiter_id: null })
                    .eq('id', tableId)
            }

            toast.add('success', '✅ Order cancelled')
            return { success: true }
        } catch (error: any) {
            toast.add('error', `❌ ${error.message}`)
            return { success: false, error: error.message }
        } finally {
            setLoading(false)
        }
    }, [supabase, toast])

    // ✅ Mark receipt as printed
    const markPrinted = useCallback(async (orderId: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ receipt_printed: true })
                .eq('id', orderId)

            if (error) throw error
            toast.add('success', '✅ Marked as printed')
            return { success: true }
        } catch (error: any) {
            toast.add('error', `❌ ${error.message}`)
            return { success: false }
        }
    }, [supabase, toast])

    // ✅ Create order with items
    const createOrder = useCallback(async (orderData: any, items: any[]) => {
        setLoading(true)
        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single()

            if (orderError) throw orderError

            const orderItems = items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            if (orderData.order_type === 'dine-in' && orderData.table_id) {
                await supabase
                    .from('restaurant_tables')
                    .update({ status: 'occupied', waiter_id: orderData.waiter_id, current_order_id: order.id })
                    .eq('id', orderData.table_id)
            }

            if (orderData.waiter_id) {
                await supabase.rpc('increment_waiter_stats', {
                    p_waiter_id: orderData.waiter_id,
                    p_orders: 1,
                    p_revenue: orderData.total_amount
                })
            }

            toast.add('success', '✅ Order created!')
            return { success: true, order }
        } catch (error: any) {
            toast.add('error', `❌ ${error.message}`)
            return { success: false, error: error.message }
        } finally {
            setLoading(false)
        }
    }, [supabase, toast])

    return { completeOrder, cancelOrder, markPrinted, createOrder, loading }
}