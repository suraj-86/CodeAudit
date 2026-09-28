import type {
    ErrorRequestHandler,
    NextFunction,
    Request,
    Response,
} from "express";
import multer from "multer";

interface ErrorEnvelope {
    error: {
        code: string;
        message: string;
        details: unknown;
    };
}

function sendError(
    res: Response,
    status: number,
    code: string,
    message: string,
    details: unknown = null,
): void {
    const body: ErrorEnvelope = {
        error: { code, message, details },
    };

    res.status(status).json(body);
}

/**
 * Maps a MulterError to the appropriate structured HTTP response.
 * Shared by every upload-accepting route so a malformed or oversized
 * upload never falls through to Express's default (HTML) error page.
 */
function handleMulterError(
    error: multer.MulterError,
    res: Response,
): void {
    switch (error.code) {
        case "LIMIT_FILE_SIZE":
            sendError(
                res,
                413,
                "FILE_TOO_LARGE",
                "One or more files exceed the maximum allowed file size.",
            );
            return;

        case "LIMIT_FILE_COUNT":
            sendError(
                res,
                413,
                "TOO_MANY_FILES",
                "The upload exceeds the maximum allowed file count.",
            );
            return;

        case "LIMIT_UNEXPECTED_FILE":
            sendError(
                res,
                400,
                "UNEXPECTED_FILE_FIELD",
                `Unexpected file field "${error.field ?? "unknown"}".`,
            );
            return;

        default:
            sendError(
                res,
                400,
                "MALFORMED_UPLOAD",
                error.message,
            );
            return;
    }
}

/**
 * Express error-handling middleware (four-argument signature is required
 * for Express to recognize it as such). Registered last, after every
 * route. In Express 5, thrown/rejected errors from async handlers are
 * forwarded here automatically, so this is the single backstop for:
 *
 *  - malformed uploads (MulterError) on any route that accepts files,
 *    even ones that don't handle it individually;
 *  - malformed JSON request bodies (a body-parser SyntaxError);
 *  - any other unexpected/unhandled error.
 *
 * It never leaks stack traces or internal error messages to the client;
 * unexpected errors are logged server-side and reported generically.
 */
export const errorHandler: ErrorRequestHandler = (
    error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
) => {
    if (res.headersSent) {
        return;
    }

    if (error instanceof multer.MulterError) {
        handleMulterError(error, res);
        return;
    }

    if (
        error instanceof SyntaxError &&
        "status" in error &&
        (error as SyntaxError & { status?: number }).status ===
            400 &&
        "body" in error
    ) {
        sendError(
            res,
            400,
            "MALFORMED_JSON",
            "The request body is not valid JSON.",
        );
        return;
    }

    console.error("Unhandled request error:", error);

    sendError(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "An unexpected error occurred.",
    );
};

/**
 * Registered after every route. Any request that reaches here matched
 * no route, so it's reported as a structured 404 instead of Express's
 * default HTML page.
 */
export function notFoundHandler(
    req: Request,
    res: Response,
): void {
    sendError(
        res,
        404,
        "NOT_FOUND",
        `No route matches ${req.method} ${req.path}.`,
    );
}
