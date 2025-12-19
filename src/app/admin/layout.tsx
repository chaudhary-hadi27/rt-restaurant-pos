"use client"

import { useState, useEffect } from 'react'
import { Shield, Lock, Phone, Mail, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

const useAuth = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const request = async (url: string, data: any) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            if (res.ok) return { success: true }
            const err = await res.json()
            setError(err.error || 'Failed')
            return { success: false }
        } catch {
            setError('Network error')
            return { success: false }
        } finally {
            setLoading(false)
        }
    }

    return {
        isAuth: () => sessionStorage.getItem('admin_auth') === 'true',
        login: (password: string) => request('/api/auth/verify-admin', { password }).then(r => {
            if (r.success) sessionStorage.setItem('admin_auth', 'true')
            return r
        }),
        requestOTP: (contact: string, type: string) => request('/api/auth/request-otp', { contact, type }),
        verifyOTP: (contact: string, otp: string) => request('/api/auth/verify-otp', { contact, otp }),
        resetPass: (contact: string, newPassword: string) => request('/api/auth/reset-password', { contact, newPassword }),
        loading,
        error
    }
}

const Input = ({ icon: Icon, type = 'text', value, onChange, placeholder, error, show, onToggle }: any) => (
    <div className="relative">
        <Icon className="absolute left-3 top-3 w-5 h-5 text-[var(--muted)]" />
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full pl-11 pr-${onToggle ? '12' : '4'} py-3 bg-[var(--card)] border rounded-lg text-[var(--fg)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 ${
                error ? 'border-red-500 focus:ring-red-500' : 'border-[var(--border)] focus:ring-blue-600'
            }`}
        />
        {onToggle && (
            <button type="button" onClick={onToggle} className="absolute right-3 top-3 text-[var(--muted)]">
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        )}
        {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
)

const LoginForm = ({ onForgot, onSuccess }: any) => {
    const [pwd, setPwd] = useState('')
    const [show, setShow] = useState(false)
    const { login, loading, error } = useAuth()

    return (
        <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--fg)]">Admin Access</h2>
            </div>

            <div className="space-y-4">
                <Input
                    icon={Lock}
                    type={show ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e: any) => setPwd(e.target.value)}
                    placeholder="Enter password"
                    error={error}
                    show={show}
                    onToggle={() => setShow(!show)}
                />

                <button
                    onClick={() => login(pwd).then(r => r.success && onSuccess())}
                    disabled={loading || !pwd}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
                >
                    {loading ? 'Verifying...' : 'Access Panel'}
                </button>

                <button onClick={onForgot} className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                </button>
            </div>
        </div>
    )
}

const ForgotFlow = ({ onBack, onSuccess }: any) => {
    const [step, setStep] = useState(1) // 1=choose, 2=otp, 3=reset
    const [type, setType] = useState<'phone' | 'email'>('phone')
    const [contact, setContact] = useState('')
    const [otp, setOtp] = useState('')
    const [pwd, setPwd] = useState('')
    const [show, setShow] = useState(false)
    const { requestOTP, verifyOTP, resetPass, loading, error } = useAuth()

    return (
        <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 shadow-2xl">
            <button onClick={onBack} className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--fg)] mb-6">
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {step === 1 && (
                <>
                    <h2 className="text-2xl font-bold text-[var(--fg)] mb-6 text-center">Reset Password</h2>

                    <div className="space-y-3 mb-4">
                        {[
                            { id: 'phone', icon: Phone, label: 'Phone Number', desc: 'Receive OTP via SMS' },
                            { id: 'email', icon: Mail, label: 'Email Address', desc: 'Receive OTP via email' }
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setType(m.id as any)}
                                className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 ${
                                    type === m.id ? 'border-blue-600 bg-blue-600/10' : 'border-[var(--border)]'
                                }`}
                            >
                                <m.icon className="w-5 h-5 text-blue-600" />
                                <div className="text-left flex-1">
                                    <p className="text-[var(--fg)] font-medium">{m.label}</p>
                                    <p className="text-xs text-[var(--muted)]">{m.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <Input
                        icon={type === 'phone' ? Phone : Mail}
                        type={type === 'phone' ? 'tel' : 'email'}
                        value={contact}
                        onChange={(e: any) => setContact(e.target.value)}
                        placeholder={type === 'phone' ? '+92 300 1234567' : 'admin@restaurant.com'}
                        error={error}
                    />

                    <button
                        onClick={() => requestOTP(contact, type).then(r => r.success && setStep(2))}
                        disabled={loading || !contact}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </>
            )}

            {step === 2 && (
                <>
                    <h2 className="text-2xl font-bold text-[var(--fg)] mb-2 text-center">Enter OTP</h2>
                    <p className="text-[var(--muted)] mb-6 text-center">Code sent to {contact}</p>

                    <Input
                        icon={Lock}
                        value={otp}
                        onChange={(e: any) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        error={error}
                    />

                    <button
                        onClick={() => verifyOTP(contact, otp).then(r => r.success && setStep(3))}
                        disabled={loading || otp.length !== 6}
                        className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </>
            )}

            {step === 3 && (
                <>
                    <h2 className="text-2xl font-bold text-[var(--fg)] mb-6 text-center">New Password</h2>

                    <Input
                        icon={Lock}
                        type={show ? 'text' : 'password'}
                        value={pwd}
                        onChange={(e: any) => setPwd(e.target.value)}
                        placeholder="Enter new password (min 6)"
                        error={error}
                        show={show}
                        onToggle={() => setShow(!show)}
                    />

                    <button
                        onClick={() => resetPass(contact, pwd).then(r => r.success && onSuccess())}
                        disabled={loading || pwd.length < 6}
                        className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg font-semibold"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </>
            )}
        </div>
    )
}

const Success = ({ onContinue }: any) => (
    <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--fg)] mb-2">Password Reset!</h2>
        <p className="text-[var(--muted)] mb-6">Login with your new password</p>
        <button onClick={onContinue} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            Continue
        </button>
    </div>
)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [auth, setAuth] = useState(false)
    const [view, setView] = useState('login')

    useEffect(() => {
        setAuth(sessionStorage.getItem('admin_auth') === 'true')
    }, [])

    if (!auth) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)] p-4">
                {view === 'login' && <LoginForm onForgot={() => setView('forgot')} onSuccess={() => setAuth(true)} />}
                {view === 'forgot' && <ForgotFlow onBack={() => setView('login')} onSuccess={() => setView('success')} />}
                {view === 'success' && <Success onContinue={() => setView('login')} />}
            </div>
        )
    }

    return <div className="min-h-screen bg-[var(--bg)]">{children}</div>
}