import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ThemeInitializer from "@/components/ThemeInitializer"
import ToastContainer from '@/components/ui/Toast'
import CommandPaletteWrapper from '@/components/CommandPaletteWrapper'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
        <ErrorBoundary>
            <ThemeInitializer />
            <ToastContainer />
            <CommandPaletteWrapper />

            <main className="lg:ml-16 min-h-screen">
                {children}
            </main>
        </ErrorBoundary>
        </body>
        </html>
    )
}