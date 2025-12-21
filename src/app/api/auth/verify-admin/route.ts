import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/utils/rateLimiter'

export async function POST(request: Request) {
    try {
        // Get IP for rate limiting
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

        // Rate limit: 5 attempts per 15 minutes
        if (!rateLimit(ip, 5, 15 * 60 * 1000)) {
            return NextResponse.json(
                { error: 'Too many login attempts. Please try again in 15 minutes.' },
                { status: 429 }
            )
        }

        const { password } = await request.json()

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 })
        }

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

        if (password === ADMIN_PASSWORD) {
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    } catch (error) {
        console.error('Auth error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}