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
        /*
         * express-rate-limit's default 429 body is plain text. Use the
         * API's standard error envelope instead, with a retry hint the
         * frontend can show as a countdown.
         */
        handler: (req, res, _next, options) => {
            // express-rate-limit attaches its counters to the request, but
            // its published types don't augment Express's Request.
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
