import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { contact, otp } = await request.json()

        if (!contact || !otp) {
            return NextResponse.json({ error: 'Contact and OTP required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Find matching OTP
        const { data: verification, error } = await supabase
            .from('otp_verification')
            .select('*')
            .eq('contact', contact)
            .eq('otp_code', otp)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()  // ✅ Use maybeSingle()

        if (!verification || error) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 })
        }

        // Check expiry
        if (new Date(verification.expires_at) < new Date()) {
            return NextResponse.json({ error: 'OTP expired' }, { status: 400 })
        }

        // Mark as verified
        await supabase
            .from('otp_verification')
            .update({ verified: true })
            .eq('id', verification.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('OTP verification error:', error)
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }
}