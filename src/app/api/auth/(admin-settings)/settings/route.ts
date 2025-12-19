import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: settings } = await supabase
            .from('admin_settings')
            .select('phone, email')
            .limit(1)
            .maybeSingle()

        return NextResponse.json(settings || { phone: '', email: '' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
    }
}