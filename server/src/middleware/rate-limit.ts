import rateLimit, {
    type RateLimitRequestHandler,
} from "express-rate-limit";

import { RATE_LIMIT_CONFIG } from "../config/rate-limit.js";


interface LimiterSettings {
    windowMs: number;
    max: number;
}

function createLimiter(
    settings: LimiterSettings,
): RateLimitRequestHandler {
    return rateLimit({
        windowMs: settings.windowMs,
        limit: settings.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, _next, options) => {
            const resetTime = (
                req as typeof req & {
                    rateLimit?: { resetTime?: Date };
                }
            ).rateLimit?.resetTime;

            const retryAfterSeconds = resetTime
                ? Math.max(
                      1,
                      Math.ceil(
                          (resetTime.getTime() - Date.now()) / 1000,
                      ),
                  )
                : Math.ceil(settings.windowMs / 1000);

            res.status(options.statusCode).json({
                error: {
                    code: "RATE_LIMITED",
                    message:
                        "Too many requests. Wait a moment and try again.",
                    details: { retryAfterSeconds },
                },
            });
        },
    });
}

export function createGeneralRateLimiter(): RateLimitRequestHandler {
    return createLimiter(RATE_LIMIT_CONFIG.general);
}

export function createUploadRateLimiter(): RateLimitRequestHandler {
    return createLimiter(RATE_LIMIT_CONFIG.upload);
}

export function createAiRateLimiter(): RateLimitRequestHandler {
    return createLimiter(RATE_LIMIT_CONFIG.ai);
}
