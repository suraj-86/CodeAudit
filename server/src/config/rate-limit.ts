export const RATE_LIMIT_CONFIG = {
  general: {
    windowMs: 60 * 1000,
    max: 100,
  },
  upload: {
    windowMs: 60 * 1000,
    max: 10,
  },
} as const;