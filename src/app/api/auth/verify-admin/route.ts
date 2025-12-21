import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/utils/rateLimiter'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

        if (!rateLimit(ip, 5, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: 'Too many attempts. Try again in 15 minutes.' },
                { status: 429 }
            )
        }

        const { password } = await request.json()
        if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

        const supabase = await createClient()
        const { data: config } = await supabase
            .from('admin_config')
            .select('password_hash')
            .single()

        if (!config) {
            return NextResponse.json({ error: 'Admin not configured' }, { status: 500 })
        }

        const valid = await bcrypt.compare(password, config.password_hash)
        if (valid) {
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}