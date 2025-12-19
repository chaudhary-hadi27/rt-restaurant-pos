import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { contact, newPassword } = await request.json()

        if (!contact || !newPassword) {
            return NextResponse.json({ error: 'Contact and password required' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const supabase = await createClient()

        // ✅ Check if OTP was verified recently (within last 15 minutes)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

        const { data: verification, error } = await supabase
            .from('otp_verification')
            .select('*')
            .eq('contact', contact)
            .eq('verified', true)
            .gte('created_at', fifteenMinutesAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()  // ✅ Use maybeSingle()

        if (!verification || error) {
            return NextResponse.json({ error: 'Verification required' }, { status: 401 })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // ✅ FIXED: Update using OR condition properly
        const { error: updateError } = await supabase
            .from('admin_settings')
            .update({
                password_hash: hashedPassword,
                updated_at: new Date().toISOString()
            })
            .or(`phone.eq.${contact},email.eq.${contact}`)

        if (updateError) throw updateError

        // Invalidate used OTP
        await supabase
            .from('otp_verification')
            .delete()
            .eq('contact', contact)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Password reset error:', error)
        return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
    }
}