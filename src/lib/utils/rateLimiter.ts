// Simple in-memory rate limiter
const requests = new Map<string, number[]>()

export function rateLimit(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get existing requests for this identifier
    const userRequests = requests.get(identifier) || []

    // Filter out old requests outside the window
    const recentRequests = userRequests.filter(time => time > windowStart)

    // Check if limit exceeded
    if (recentRequests.length >= limit) {
        return false // Rate limit exceeded
    }

    // Add current request
    recentRequests.push(now)
    requests.set(identifier, recentRequests)

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
        cleanupOldEntries(windowStart)
    }

    return true // Request allowed
}

function cleanupOldEntries(windowStart: number) {
    for (const [key, times] of requests.entries()) {
        const recentTimes = times.filter(time => time > windowStart)
        if (recentTimes.length === 0) {
            requests.delete(key)
        } else {
            requests.set(key, recentTimes)
        }
    }
}

export function getRateLimitInfo(identifier: string, windowMs: number) {
    const now = Date.now()
    const windowStart = now - windowMs
    const userRequests = requests.get(identifier) || []
    const recentRequests = userRequests.filter(time => time > windowStart)

    return {
        count: recentRequests.length,
        resetAt: recentRequests.length > 0 ? recentRequests[0] + windowMs : now
    }
}