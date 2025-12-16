import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import ThemeInitializer from "@/components/ThemeInitializer"

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
        {children}
        </body>
        </html>
    )
}