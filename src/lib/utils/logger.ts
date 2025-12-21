const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    error: (msg: string, data?: any) => {
        if (isDev) console.error(`❌ ${msg}`, data) // ✅ Fixed: Added parentheses
        // TODO: Send to error tracking (Sentry/LogRocket)
    },
    warn: (msg: string, data?: any) => {
        if (isDev) console.warn(`⚠️ ${msg}`, data) // ✅ Fixed: Added parentheses
    },
    info: (msg: string, data?: any) => {
        if (isDev) console.log(`ℹ️ ${msg}`, data) // ✅ Fixed: Added parentheses
    },
    success: (msg: string) => {
        if (isDev) console.log(`✅ ${msg}`) // ✅ Fixed: Added parentheses
    }
}