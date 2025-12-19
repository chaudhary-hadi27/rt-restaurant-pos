// src/components/ui/ResponsiveStatsGrid.tsx
'use client'

import { LucideIcon } from 'lucide-react'
import React, { ReactElement } from 'react'

// ✅ FIXED: Proper type definition for icon
interface StatCard {
    label: string
    value: string | number
    icon?: string | LucideIcon | ReactElement // ✅ Accept all types
    color?: string
    trend?: number
    subtext?: string
    onClick?: () => void
    active?: boolean
}

interface ResponsiveStatsGridProps {
    stats: StatCard[]
    columns?: {
        mobile?: number
        tablet?: number
        desktop?: number
    }
}

export default function ResponsiveStatsGrid({
                                                stats,
                                                columns = { mobile: 2, tablet: 3, desktop: 4 }
                                            }: ResponsiveStatsGridProps) {
    return (
        <div className={`grid grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop} gap-3 sm:gap-4`}>
            {stats.map((stat, idx) => {
                // ✅ FIXED: Proper icon rendering
                const renderIcon = () => {
                    if (!stat.icon) return null

                    // Check if it's a component (function) or element
                    if (typeof stat.icon === 'function') {
                        const IconComp = stat.icon as LucideIcon
                        return (
                            <IconComp
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                style={{ color: stat.color || '#3b82f6' }}
                            />
                        )
                    }

                    // It's already a React element
                    return stat.icon
                }

                return (
                    <button
                        key={idx}
                        onClick={stat.onClick}
                        disabled={!stat.onClick}
                        className={`p-4 sm:p-5 rounded-lg border transition-all text-left ${
                            stat.active
                                ? 'bg-blue-600/10 border-blue-600 shadow-lg'
                                : 'bg-[var(--card)] border-[var(--border)] hover:border-[var(--fg)]'
                        } ${stat.onClick ? 'cursor-pointer hover:shadow-lg' : 'cursor-default'}`}
                    >
                        {/* Icon */}
                        {stat.icon && (
                            <div className="mb-3">
                                {renderIcon()}
                            </div>
                        )}

                        {/* Label */}
                        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2 line-clamp-1">
                            {stat.label}
                        </p>

                        {/* Value & Trend */}
                        <div className="flex items-end justify-between gap-2">
                            <p className="text-2xl sm:text-3xl font-bold text-[var(--fg)] truncate">
                                {stat.value}
                            </p>

                            {stat.trend !== undefined && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    stat.trend > 0
                                        ? 'bg-green-500/20 text-green-600'
                                        : 'bg-red-500/20 text-red-600'
                                }`}>
                  {stat.trend > 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                </span>
                            )}
                        </div>

                        {/* Subtext */}
                        {stat.subtext && (
                            <p className="text-xs text-[var(--muted)] mt-2 line-clamp-1">
                                {stat.subtext}
                            </p>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

// 🎯 PRE-BUILT STAT VARIANTS

// Compact Stats (for dashboards)
export function CompactStats({ stats }: { stats: StatCard[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="p-3 sm:p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
                >
                    <p className="text-xs text-[var(--muted)] mb-1 truncate">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--fg)] truncate">{stat.value}</p>
                </div>
            ))}
        </div>
    )
}

// ✅ FIXED: Large Feature Stats
export function FeatureStats({ stats }: { stats: StatCard[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat, idx) => {
                // ✅ FIXED: Proper icon rendering for feature stats
                const renderFeatureIcon = () => {
                    if (!stat.icon) return null

                    if (typeof stat.icon === 'function') {
                        const IconComp = stat.icon as LucideIcon
                        return <IconComp className="w-8 h-8 text-blue-600" />
                    }

                    return stat.icon
                }

                return (
                    <div
                        key={idx}
                        className="p-6 sm:p-8 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-600/30 rounded-xl text-center"
                    >
                        {stat.icon && (
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/20 flex items-center justify-center">
                                {renderFeatureIcon()}
                            </div>
                        )}
                        <p className="text-4xl sm:text-5xl font-bold text-[var(--fg)] mb-2">{stat.value}</p>
                        <p className="text-sm text-[var(--muted)] uppercase tracking-wider">{stat.label}</p>
                    </div>
                )
            })}
        </div>
    )
}