// src/app/api/auth/verify-admin/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    try {
        // Get IP for rate limiting
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

        const { password } = await request.json()

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 })
        }

        const supabase = await createClient()

        // Get admin config
        const { data: config, error: configError } = await supabase
            .from('admin_config')
            .select('password_hash')
            .eq('id', 1)
            .single()

        if (configError) {
            console.error('Config fetch error:', configError)

            // If no config exists, create default one
            if (configError.code === 'PGRST116') {
                const defaultHash = await bcrypt.hash('admin123', 10)
                const { error: insertError } = await supabase
                    .from('admin_config')
                    .insert({ id: 1, password_hash: defaultHash })

                if (insertError) {
                    console.error('Failed to create default admin:', insertError)
                    return NextResponse.json({
                        error: 'Admin not configured. Please contact support.'
                    }, { status: 500 })
                }

                // Check if entered password matches default
                if (password === 'admin123') {
                    return NextResponse.json({ success: true })
                } else {
                    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
                }
            }

            return NextResponse.json({
                error: 'Configuration error'
            }, { status: 500 })
        }

        if (!config || !config.password_hash) {
            return NextResponse.json({
                error: 'Admin not configured'
            }, { status: 500 })
        }

        // Verify password
        const valid = await bcrypt.compare(password, config.password_hash)

        if (valid) {
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })

    } catch (error: any) {
        console.error('Auth error:', error)
        return NextResponse.json({
            error: 'Authentication failed: ' + (error.message || 'Unknown error')
        }, { status: 500 })
    }
}