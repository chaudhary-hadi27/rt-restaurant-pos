import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const { password } = await request.json()

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: admin, error } = await supabase
            .from('admin_settings')
            .select('password_hash')
            .limit(1)
            .maybeSingle()  // ✅ Use maybeSingle()

        if (!admin || error) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Verify password
        const isValid = await bcrypt.compare(password, admin.password_hash)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}