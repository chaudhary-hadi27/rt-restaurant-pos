import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const { contact, type } = await request.json()
        const supabase = await createClient()
        const column = type === 'phone' ? 'phone' : 'email'

        const { data: admin, error } = await supabase
            .from('admin_settings')
            .select(column)
            .eq(column, contact)
            .maybeSingle()

        if (!admin || error) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = new Date(Date.now() + 10 * 60 * 1000)

        const { error: insertError } = await supabase
            .from('otp_verification')
            .insert({
                contact,
                otp_code: otp,
                expires_at: expires.toISOString()
            })

        if (insertError) throw insertError

        // TODO: Integrate SMS/Email service (Twilio, SendGrid, etc.)
        // For demo: OTP is generated but not sent

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
    }
}