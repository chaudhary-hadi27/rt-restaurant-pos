import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ThemeInitializer from "@/components/ThemeInitializer"
import ToastContainer from '@/components/ui/Toast'
import CommandPaletteWrapper from '@/components/CommandPaletteWrapper'
import InstallPrompt from '@/components/InstallPrompt'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import OfflineInitializer from '@/components/OfflineInitializer'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] })

// ✅ FIX: Remove manifest from metadata
export const metadata: Metadata = {
    title: "RT Restaurant - Management System",
    description: "Professional restaurant management with offline support",
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'RT Restaurant'
    }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {/* ✅ FIX: Add manifest dynamically via script */}
            <script dangerouslySetInnerHTML={{
                __html: `
                    (function() {
                        const isAdmin = window.location.pathname.startsWith('/admin');
                        const manifest = isAdmin ? '/manifest-admin.json' : '/manifest-public.json';
                        const link = document.createElement('link');
                        link.rel = 'manifest';
                        link.href = manifest;
                        document.head.appendChild(link);
                    })();
                `
            }} />

            <link rel="apple-touch-icon" href="/icons/icon-192.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
            <link rel="icon" type="image/png" sizes="48x48" href="/icons/icon-48.png" />
            <link rel="shortcut icon" href="/icons/favicon.ico" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />

            {/* Service Worker Registration */}
            <script dangerouslySetInnerHTML={{
                __html: `
                    if('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                            navigator.serviceWorker.register('/sw.js')
                                .then(function(reg) { console.log('✅ SW registered'); })
                                .catch(function(err) { console.log('❌ SW failed:', err); });
                        });
                    }
                `
            }} />
        </head>
        <body className={`${geist.variable} antialiased`}>
        <ErrorBoundary>
            <ThemeInitializer />
            <OfflineInitializer />
            <ToastContainer />
            <OfflineIndicator />
            <CommandPaletteWrapper />
            <InstallPrompt />
            <main className="lg:ml-16 min-h-screen">{children}</main>
        </ErrorBoundary>
        </body>
        </html>
    )
}