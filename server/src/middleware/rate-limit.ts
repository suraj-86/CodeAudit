import rateLimit, {
    type RateLimitRequestHandler,
} from "express-rate-limit";

import { RATE_LIMIT_CONFIG } from "../config/rate-limit.js";

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
