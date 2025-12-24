// src/components/layout/UnifiedSidebar.tsx - FIXED VERSION
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
    UtensilsCrossed, LayoutGrid, ShoppingBag, Moon, Sun, Shield,
    Package, Users, ChefHat, Home, Command, Timer, History, Settings,
    Download, Database, Menu, MoreVertical, X
} from "lucide-react"
import { useTheme } from "@/lib/store/theme-store"
import StorageInfo from "@/components/ui/StorageInfo"

const NAV = {
    public: [
        { label: "Menu", icon: UtensilsCrossed, href: "/" },
        { label: "Tables", icon: LayoutGrid, href: "/tables" },
        { label: "Orders", icon: ShoppingBag, href: "/orders" },
        { label: "Attendance", icon: Timer, href: "/attendance" }
    ],
    admin: [
        { label: "Dashboard", icon: Home, href: "/admin" },
        { label: "Inventory", icon: Package, href: "/admin/inventory" },
        { label: "Menu", icon: ChefHat, href: "/admin/menu" },
        { label: "Waiters", icon: Users, href: "/admin/waiters" },
        { label: "Tables", icon: LayoutGrid, href: "/admin/tables" },
        { label: "Attendance", icon: Timer, href: "/admin/attendance" },
        { label: "History", icon: History, href: "/admin/history" },
        { label: "Settings", icon: Settings, href: "/admin/settings" }
    ]
}

export default function UnifiedSidebar({ onCommandOpen }: { onCommandOpen?: () => void }) {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()

    const [open, setOpen] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [showStorage, setShowStorage] = useState(false)
    const [installPrompt, setInstallPrompt] = useState<any>(null)
    const [showMoreMenu, setShowMoreMenu] = useState(false)

    useEffect(() => setHydrated(true), [])
    useEffect(() => setOpen(false), [pathname])

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault()
            setInstallPrompt(e)
        }
        window.addEventListener("beforeinstallprompt", handler)
        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!installPrompt) return
        installPrompt.prompt()
        const { outcome } = await installPrompt.userChoice
        if (outcome === "accepted") setInstallPrompt(null)
    }

    if (!hydrated) return null

    const isAdmin = pathname.startsWith("/admin")
    const items = isAdmin ? NAV.admin : NAV.public

    const TOOLTIP_CLASS = "hidden lg:block absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-[70]"

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg active:scale-95 transition-all"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Overlay */}
            {open && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Main Sidebar - NO ANIMATIONS */}
            <aside
                className={`fixed top-0 left-0 h-screen w-16 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-50 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
                style={{ transition: 'none' }}
            >
                {/* Logo */}
                <Link
                    href={isAdmin ? "/admin" : "/"}
                    className="h-16 flex items-center justify-center border-b border-[var(--border)] flex-shrink-0"
                    onClick={() => setOpen(false)}
                >
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                        RT
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto scrollbar-hide">
                    {items.map(item => {
                        const Icon = item.icon
                        const active = pathname === item.href || (item.href !== "/" && item.href !== "/admin" && pathname.startsWith(item.href))

                        return (
                            <div key={item.href} className="relative group">
                                <Link
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="block"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 ${
                                        active
                                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg"
                                            : "text-[var(--muted)] bg-[var(--bg)]"
                                    }`} style={{ transition: 'none' }}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </Link>

                                {/* Desktop Tooltip */}
                                <span className={TOOLTIP_CLASS}>
                                    {item.label}
                                </span>

                                {/* Mobile Label */}
                                <span className="lg:hidden block text-center text-[10px] font-medium mt-0.5 text-[var(--muted)] truncate px-1">
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-[var(--border)] space-y-1 flex-shrink-0">
                    {/* Command Palette */}
                    <div className="relative group">
                        <button
                            onClick={() => {
                                onCommandOpen?.()
                                setOpen(false)
                            }}
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--muted)] bg-[var(--bg)] active:scale-95"
                            style={{ transition: 'none' }}
                        >
                            <Command className="w-5 h-5" />
                        </button>
                        <span className={TOOLTIP_CLASS}>Quick Actions</span>
                        <span className="lg:hidden block text-center text-[10px] font-medium mt-0.5 text-[var(--muted)]">
                            Quick
                        </span>
                    </div>

                    {/* Theme Toggle */}
                    <div className="relative group">
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--bg)] active:scale-95"
                            style={{ transition: 'none' }}
                        >
                            {theme === "dark" ? (
                                <Sun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <Moon className="w-5 h-5 text-blue-600" />
                            )}
                        </button>
                        <span className={TOOLTIP_CLASS}>
                            {theme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                        <span className="lg:hidden block text-center text-[10px] font-medium mt-0.5 text-[var(--muted)]">
                            Theme
                        </span>
                    </div>

                    {/* More Menu Button */}
                    <div className="relative group">
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center active:scale-95 ${
                                showMoreMenu
                                    ? 'bg-blue-600 text-white'
                                    : 'text-[var(--muted)] bg-[var(--bg)]'
                            }`}
                            style={{ transition: 'none' }}
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>
                        <span className={TOOLTIP_CLASS}>More Options</span>
                        <span className="lg:hidden block text-center text-[10px] font-medium mt-0.5 text-[var(--muted)]">
                            More
                        </span>
                    </div>
                </div>
            </aside>

            {/* More Menu Popup */}
            {showMoreMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setShowMoreMenu(false)}
                    />

                    {/* Menu */}
                    <div className="fixed left-20 bottom-4 z-[70] w-64 bg-[var(--card)] border-2 border-blue-600/50 rounded-xl shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                            <h3 className="font-bold text-[var(--fg)]">More Options</h3>
                            <button
                                onClick={() => setShowMoreMenu(false)}
                                className="p-1 rounded-lg"
                            >
                                <X className="w-4 h-4 text-[var(--muted)]" />
                            </button>
                        </div>

                        {/* Options */}
                        <div className="p-2">
                            {/* Storage Info */}
                            <button
                                onClick={() => {
                                    setShowStorage(true)
                                    setShowMoreMenu(false)
                                    setOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
                                    <Database className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-[var(--fg)]">Storage Info</p>
                                    <p className="text-xs text-[var(--muted)]">View cache & data</p>
                                </div>
                            </button>

                            {/* ✅ Install PWA - ALWAYS SHOW */}
                            <button
                                onClick={() => {
                                    if (installPrompt) {
                                        handleInstall()
                                    } else {
                                        alert('App is already installed or not available for installation')
                                    }
                                    setShowMoreMenu(false)
                                    setOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                            >
                                <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                                    <Download className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-[var(--fg)]">Install App</p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {installPrompt ? 'Use offline' : 'Already installed'}
                                    </p>
                                </div>
                            </button>

                            {/* Switch Context */}
                            <Link
                                href={isAdmin ? "/" : "/admin"}
                                onClick={() => {
                                    setShowMoreMenu(false)
                                    setOpen(false)
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    isAdmin ? 'bg-orange-600/10' : 'bg-blue-600/10'
                                }`}>
                                    {isAdmin ? (
                                        <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                                    ) : (
                                        <Shield className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm text-[var(--fg)]">
                                        {isAdmin ? 'Restaurant View' : 'Admin Panel'}
                                    </p>
                                    <p className="text-xs text-[var(--muted)]">
                                        {isAdmin ? 'Switch to public' : 'Manage restaurant'}
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg)] rounded-b-xl">
                            <p className="text-xs text-center text-[var(--muted)]">
                                {isAdmin ? '🛡️ Admin Mode' : '🍽️ Restaurant Mode'}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Storage Info Modal */}
            <StorageInfo
                open={showStorage}
                onClose={() => setShowStorage(false)}
            />
        </>
    )
}