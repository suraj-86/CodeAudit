import rateLimit, {
    type RateLimitRequestHandler,
} from "express-rate-limit";

import { RATE_LIMIT_CONFIG } from "../config/rate-limit.js";

/*
 * Each of these is a FACTORY, not a shared middleware instance.
 * express-rate-limit keys its counters to the middleware instance's own
 * internal store, so reusing one instance across multiple routes means
 * those routes silently share one request quota instead of each having
 * their own. Every route that wants its own independent budget must
 * call the factory itself, once, at module load.
 */

export function createGeneralRateLimiter(): RateLimitRequestHandler {
    return rateLimit({
        windowMs: RATE_LIMIT_CONFIG.general.windowMs,
        limit: RATE_LIMIT_CONFIG.general.max,
        standardHeaders: true,
        legacyHeaders: false,
    });
}

export function createUploadRateLimiter(): RateLimitRequestHandler {
    return rateLimit({
        windowMs: RATE_LIMIT_CONFIG.upload.windowMs,
        limit: RATE_LIMIT_CONFIG.upload.max,
        standardHeaders: true,
        legacyHeaders: false,
    });
}

export function createAiRateLimiter(): RateLimitRequestHandler {
    return rateLimit({
        windowMs: RATE_LIMIT_CONFIG.ai.windowMs,
        limit: RATE_LIMIT_CONFIG.ai.max,
        standardHeaders: true,
        legacyHeaders: false,
    });
}
