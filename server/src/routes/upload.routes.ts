import { Router } from "express";
import multer from "multer";

import { UPLOAD_LIMITS, SUPPORTED_LANGUAGES } from "../config/limits.js";
import { upload } from "../config/upload.js";
import { validateFileLanguage } from "../validation/file-validation.js";
import { validateTotalUploadSize } from "../validation/upload-validation.js";
import { uploadRateLimiter } from "../middleware/rate-limit.js";
import { compareFiles } from "../analysis/exact-match/compare.js";

const router = Router();

router.get("/languages", (_req, res) => {
  const languages = Object.entries(SUPPORTED_LANGUAGES).map(
    ([id, config]) => ({
      id,
      label: config.label,
      extensions: config.extensions,
    }),
  );

  res.status(200).json({
    languages,
  });
});

router.post(
  "/analyze/compare",
  upload.fields([
    { name: "fileA", maxCount: 1 },
    { name: "fileB", maxCount: 1 },
  ]),
  (req, res) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const fileA = files.fileA?.[0];
    const fileB = files.fileB?.[0];

    if (!fileA || !fileB) {
      res.status(400).json({
        error: {
          code: "FILES_REQUIRED",
          message: "Two source-code files are required for comparison.",
          details: null,
        },
      });
      return;
    }

    const result = compareFiles(fileA.buffer, fileB.buffer);

    res.status(200).json({
      files: [
        {
          name: fileA.originalname,
          hash: result.hashA,
        },
        {
          name: fileB.originalname,
          hash: result.hashB,
        },
      ],
      exactMatch: result.exactMatch,
    });
  },
);

router.post(
  "/uploads",
  uploadRateLimiter,
  (req, res, next) => {
    upload.array("files", UPLOAD_LIMITS.maxFiles)(
      req,
      res,
      (error) => {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({
              error: {
                code: "FILE_TOO_LARGE",
                message: "One or more files exceed the 1 MB file-size limit.",
                details: null,
              },
            });
            return;
          }

          if (error.code === "LIMIT_FILE_COUNT") {
            res.status(413).json({
              error: {
                code: "TOO_MANY_FILES",
                message: "The upload exceeds the maximum file count.",
                details: null,
              },
            });
            return;
          }

          res.status(400).json({
            error: {
              code: "MALFORMED_UPLOAD",
              message: error.message,
              details: null,
            },
          });
          return;
        }

        if (error) {
          next(error);
          return;
        }

        next();
      },
    );
  },
  (req, res) => {
    const language =
      typeof req.body.language === "string"
        ? req.body.language.trim().toLowerCase()
        : "";

    if (!language) {
      res.status(400).json({
        error: {
          code: "LANGUAGE_REQUIRED",
          message: "A programming language must be selected.",
          details: null,
        },
      });
      return;
    }

    if (!(language in SUPPORTED_LANGUAGES)) {
      res.status(400).json({
        error: {
          code: "UNSUPPORTED_LANGUAGE",
          message: "The selected language is not supported.",
          details: null,
        },
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        error: {
          code: "FILES_REQUIRED",
          message: "At least one source-code file must be uploaded.",
          details: null,
        },
      });
      return;
    }

    const invalidFiles = [];

    for (const file of files) {
      if (file.size === 0) {
        invalidFiles.push({
          name: file.originalname,
          reason: "Empty files are not allowed.",
        });

        continue;
      }

      const validation = validateFileLanguage(
        file.originalname,
        language,
      );

      if (!validation.valid) {
        invalidFiles.push({
          name: file.originalname,
          reason: validation.reason,
        });
      }
    }

    if (invalidFiles.length > 0) {
      res.status(400).json({
        error: {
          code: "UPLOAD_VALIDATION_FAILED",
          message: "One or more files failed validation.",
          details: {
            files: invalidFiles,
          },
        },
      });
      return;
    }

    const totalSizeValidation = validateTotalUploadSize(
      files.map((file) => file.size),
    );

    if (!totalSizeValidation.valid) {
      res.status(413).json({
        error: {
          code: "UPLOAD_SIZE_EXCEEDED",
          message: totalSizeValidation.reason,
          details: {
            maxTotalSourceBytes:
              UPLOAD_LIMITS.maxTotalSourceBytes,
          },
        },
      });
      return;
    }

    res.status(200).json({
      status: "accepted",
      language,
      fileCount: files.length,
      totalSizeBytes: files.reduce(
        (total, file) => total + file.size,
        0,
      ),
      files: files.map((file) => ({
        name: file.originalname,
        sizeBytes: file.size,
      })),
    });
  },
);

export default router;