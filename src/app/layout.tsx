import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ThemeInitializer from "@/components/ThemeInitializer"
import UnifiedSidebar from "@/components/layout/UnifiedSidebar"
import ToastContainer from '@/components/ui/Toast'

const geist = Geist({
    variable: "--font-geist",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "RT Restaurant - Management System",
    description: "Professional restaurant management system",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${geist.variable} antialiased`}>
        <ThemeInitializer />
        <ToastContainer />
        <UnifiedSidebar />

        {/* Main Content with proper margin */}
        <main className="lg:ml-16 min-h-screen">
            {children}
        </main>
        </body>
        </html>
    )
}