import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ThemeInitializer from "@/components/ThemeInitializer"
import PublicSidebar from "@/components/layout/PublicSidebar"
import ToastContainer from '@/components/ui/Toast'
import { AlertBell } from '@/lib/utils/inventory-alerts'

const geist = Geist({
    variable: "--font-geist",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: "Restaurant Management",
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
        <PublicSidebar />
        {/* FIXED: Proper margins for content */}
        <main className="lg:ml-16">
            {children}
        </main>
        </body>
        </html>
    )
}
