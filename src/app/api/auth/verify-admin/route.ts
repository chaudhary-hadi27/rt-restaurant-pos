// app/api/auth/verify-admin/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

        // For development, use a simple password check
        // In production, check against hashed password in database
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

        if (password === ADMIN_PASSWORD) {
            return NextResponse.json({ success: true });
        }

        // Alternative: Check against database
        // const supabase = createClient();
        // const { data: admin } = await supabase
        //   .from('admins')
        //   .select('password_hash')
        //   .eq('role', 'super_admin')
        //   .single();
        //
        // if (admin && bcrypt.compareSync(password, admin.password_hash)) {
        //   return NextResponse.json({ success: true });
        // }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}