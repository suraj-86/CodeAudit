import type { CorsOptions } from "cors";

/**
 * Builds the CORS configuration from CORS_ALLOWED_ORIGINS, a comma-
 * separated list of origins (e.g. "https://codeaudit.vercel.app"). When
 * unset, CORS stays wide open (reflects any origin) — the right default
 * for local development, where the frontend's origin is unpredictable
 * (a Vite dev port, a LAN address, etc.).
 *
 * In production this should be set explicitly to the real frontend
 * origin(s); an open CORS policy lets any website make authenticated-
 * looking requests to this API from a visitor's browser, which is a
 * meaningfully larger exposure for a public deployment than for a
 * machine only reachable on localhost.
 */
export function buildCorsOptions(): CorsOptions {
    const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();

    if (!raw) {
        return {};
    }

    const origins = raw
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

    return { origin: origins };
}
