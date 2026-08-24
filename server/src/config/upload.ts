import multer from "multer";

import { UPLOAD_LIMITS } from "./limits.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: UPLOAD_LIMITS.maxFileSizeBytes + 1,
    files: UPLOAD_LIMITS.maxFiles,
  },
});