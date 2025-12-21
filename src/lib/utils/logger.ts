const isDev = process.env.NODE_ENV === 'development'

export const logger = {
    error: (msg: string, data?: any) => {
        if (isDev) console.error(`❌ ${msg}`, data)
        // TODO: Send to error tracking (Sentry/LogRocket)
    },
    warn: (msg: string, data?: any) => {
        if (isDev) console.warn(`⚠️ ${msg}`, data)
    },
    info: (msg: string, data?: any) => {
        if (isDev) console.log(`ℹ️ ${msg}`, data)
    },
    success: (msg: string) => {
        if (isDev) console.log(`✅ ${msg}`)
    }
}