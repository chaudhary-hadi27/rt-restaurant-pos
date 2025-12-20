'use client'

import { useState } from 'react'
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'

interface PaymentModalProps {
    order: any
    onClose: () => void
    onSuccess: () => void
}

export default function PaymentModal({ order, onClose, onSuccess }: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash')
    const [amount, setAmount] = useState(order.total_amount.toString())
    const [cardDetails, setCardDetails] = useState({ last_digits: '', transaction_id: '' })
    const [onlineDetails, setOnlineDetails] = useState({ gateway: 'easypaisa', transaction_id: '' })
    const [processing, setProcessing] = useState(false)
    const [splitPayment, setSplitPayment] = useState(false)
    const [splits, setSplits] = useState<Array<{ amount: string; method: string; person: string }>>([
        { amount: '', method: 'cash', person: '' }
    ])
    const supabase = createClient()
    const toast = useToast()

    const balanceDue = order.total_amount - (order.paid_amount || 0)

    const processPayment = async () => {
        if (!splitPayment) {
            const amt = parseFloat(amount)
            if (isNaN(amt) || amt <= 0) {
                toast.add('error', '❌ Enter valid amount')
                return
            }
            if (amt > balanceDue) {
                toast.add('error', `❌ Amount exceeds balance due (PKR ${balanceDue})`)
                return
            }
            if (paymentMethod === 'card' && !cardDetails.last_digits) {
                toast.add('error', '❌ Enter card last 4 digits')
                return
            }
            if (paymentMethod === 'online' && !onlineDetails.transaction_id) {
                toast.add('error', '❌ Enter transaction ID')
                return
            }
        } else {
            const totalSplit = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0)
            if (totalSplit !== balanceDue) {
                toast.add('error', `❌ Split total (${totalSplit}) must equal balance (${balanceDue})`)
                return
            }
            if (splits.some(s => !s.amount || parseFloat(s.amount) <= 0)) {
                toast.add('error', '❌ All splits must have valid amounts')
                return
            }
        }

        setProcessing(true)

        try {
            if (!splitPayment) {
                // Single payment
                const paymentData: any = {
                    order_id: order.id,
                    amount: parseFloat(amount),
                    payment_method: paymentMethod,
                    payment_status: 'completed'
                }

                if (paymentMethod === 'card') {
                    paymentData.card_last_digits = cardDetails.last_digits
                    paymentData.transaction_id = cardDetails.transaction_id || `CARD-${Date.now()}`
                } else if (paymentMethod === 'online') {
                    paymentData.payment_gateway = onlineDetails.gateway
                    paymentData.transaction_id = onlineDetails.transaction_id
                }

                const { error } = await supabase.from('payments').insert(paymentData)
                if (error) throw error

                toast.add('success', '✅ Payment recorded successfully!')
            } else {
                // Split payment
                const mainPayment = await supabase
                    .from('payments')
                    .insert({
                        order_id: order.id,
                        amount: balanceDue,
                        payment_method: 'split',
                        payment_status: 'completed'
                    })
                    .select()
                    .single()

                if (mainPayment.error) throw mainPayment.error

                const splitData = splits.map(s => ({
                    payment_id: mainPayment.data.id,
                    split_amount: parseFloat(s.amount),
                    split_method: s.method,
                    person_name: s.person || null
                }))

                const { error: splitError } = await supabase.from('payment_splits').insert(splitData)
                if (splitError) throw splitError

                toast.add('success', '✅ Split payment recorded!')
            }

            onSuccess()
            onClose()
        } catch (error: any) {
            toast.add('error', `❌ ${error.message || 'Payment failed'}`)
        } finally {
            setProcessing(false)
        }
    }

    const addSplit = () => {
        setSplits([...splits, { amount: '', method: 'cash', person: '' }])
    }

    const removeSplit = (index: number) => {
        if (splits.length > 1) {
            setSplits(splits.filter((_, i) => i !== index))
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                    <div>
                        <h3 className="text-xl font-bold text-[var(--fg)]">Process Payment</h3>
                        <p className="text-sm text-[var(--muted)] mt-1">Order #{order.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-lg">
                        <X className="w-5 h-5 text-[var(--muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Order Summary */}
                    <div className="p-4 bg-[var(--bg)] rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted)]">Total Amount</span>
                            <span className="font-bold">PKR {order.total_amount.toLocaleString()}</span>
                        </div>
                        {order.paid_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--muted)]">Paid Amount</span>
                                <span className="text-green-600 font-bold">PKR {order.paid_amount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--border)]">
                            <span>Balance Due</span>
                            <span className="text-red-600">PKR {balanceDue.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Split Payment Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="split"
                            checked={splitPayment}
                            onChange={(e) => setSplitPayment(e.target.checked)}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <label htmlFor="split" className="text-sm font-medium cursor-pointer">
                            Split Payment (Multiple people)
                        </label>
                    </div>

                    {!splitPayment ? (
                        <>
                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium mb-3">Payment Method</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                            paymentMethod === 'cash' ? 'border-blue-600 bg-blue-600/20' : 'border-[var(--border)]'
                                        }`}
                                    >
                                        <Banknote className="w-6 h-6" />
                                        <span className="text-xs font-medium">Cash</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                            paymentMethod === 'card' ? 'border-blue-600 bg-blue-600/20' : 'border-[var(--border)]'
                                        }`}
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        <span className="text-xs font-medium">Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('online')}
                                        className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                                            paymentMethod === 'online' ? 'border-blue-600 bg-blue-600/20' : 'border-[var(--border)]'
                                        }`}
                                    >
                                        <Smartphone className="w-6 h-6" />
                                        <span className="text-xs font-medium">Online</span>
                                    </button>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Amount (PKR)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    max={balanceDue}
                                    className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            {/* Card Details */}
                            {paymentMethod === 'card' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Last 4 Digits</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            value={cardDetails.last_digits}
                                            onChange={(e) => setCardDetails({ ...cardDetails, last_digits: e.target.value })}
                                            placeholder="1234"
                                            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Transaction ID (Optional)</label>
                                        <input
                                            type="text"
                                            value={cardDetails.transaction_id}
                                            onChange={(e) => setCardDetails({ ...cardDetails, transaction_id: e.target.value })}
                                            placeholder="Auto-generated if empty"
                                            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Online Payment Details */}
                            {paymentMethod === 'online' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Payment Gateway</label>
                                        <select
                                            value={onlineDetails.gateway}
                                            onChange={(e) => setOnlineDetails({ ...onlineDetails, gateway: e.target.value })}
                                            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        >
                                            <option value="easypaisa">EasyPaisa</option>
                                            <option value="jazzcash">JazzCash</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Transaction ID</label>
                                        <input
                                            type="text"
                                            value={onlineDetails.transaction_id}
                                            onChange={(e) => setOnlineDetails({ ...onlineDetails, transaction_id: e.target.value })}
                                            placeholder="Enter transaction ID"
                                            className="w-full px-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3">
                            {splits.map((split, index) => (
                                <div key={index} className="p-3 bg-[var(--bg)] rounded-lg space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Person {index + 1}</span>
                                        {splits.length > 1 && (
                                            <button onClick={() => removeSplit(index)} className="text-xs text-red-600 hover:text-red-700">
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            placeholder="Amount"
                                            value={split.amount}
                                            onChange={(e) => {
                                                const newSplits = [...splits]
                                                newSplits[index].amount = e.target.value
                                                setSplits(newSplits)
                                            }}
                                            className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm"
                                        />
                                        <select
                                            value={split.method}
                                            onChange={(e) => {
                                                const newSplits = [...splits]
                                                newSplits[index].method = e.target.value
                                                setSplits(newSplits)
                                            }}
                                            className="px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="online">Online</option>
                                        </select>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Person name (optional)"
                                        value={split.person}
                                        onChange={(e) => {
                                            const newSplits = [...splits]
                                            newSplits[index].person = e.target.value
                                            setSplits(newSplits)
                                        }}
                                        className="w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-sm"
                                    />
                                </div>
                            ))}
                            <button onClick={addSplit} className="w-full py-2 border-2 border-dashed border-[var(--border)] rounded-lg text-sm font-medium hover:border-blue-600 hover:text-blue-600">
                                + Add Split
                            </button>
                            <div className="text-sm text-center">
                                Total Split: <span className="font-bold">PKR {splits.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-[var(--border)]">
                    <button onClick={onClose} className="flex-1 px-4 py-3 bg-[var(--bg)] text-[var(--fg)] rounded-lg hover:bg-[var(--border)] font-medium">
                        Cancel
                    </button>
                    <button
                        onClick={processPayment}
                        disabled={processing}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {processing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Process Payment
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}