import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { phone, email, currentPassword, newPassword } = await request.json()

        const supabase = await createClient()

        // Get current admin
        const { data: admin } = await supabase
            .from('admin_settings')
            .select('*')
            .limit(1)
            .maybeSingle()

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
        }

        const updates: any = {}

        // Update contact info
        if (phone) updates.phone = phone
        if (email) updates.email = email

        // Update password if provided
        if (currentPassword && newPassword) {
            const isValid = await bcrypt.compare(currentPassword, admin.password_hash)

            if (!isValid) {
                return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 })
            }

            if (newPassword.length < 6) {
                return NextResponse.json({ error: 'New password too short' }, { status: 400 })
            }

            updates.password_hash = await bcrypt.hash(newPassword, 10)
        }

        // Update settings
        const { error } = await supabase
            .from('admin_settings')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', admin.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Update settings error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
