import rateLimit from "express-rate-limit";

import { RATE_LIMIT_CONFIG } from "../config/rate-limit.js";

export const generalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.general.windowMs,
  limit: RATE_LIMIT_CONFIG.general.max,
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.upload.windowMs,
  limit: RATE_LIMIT_CONFIG.upload.max,
  standardHeaders: true,
  legacyHeaders: false,
});