export const UPLOAD_LIMITS = {
  maxFileSizeBytes: 1 * 1024 * 1024,
  maxFiles: 100,
  maxTotalSourceBytes: 100 * 1024 * 1024,
} as const;

export const SUPPORTED_LANGUAGES = {
  python: {
    label: "Python",
    extensions: [".py"],
  },
  c: {
    label: "C",
    extensions: [".c", ".h"],
  },
  cpp: {
    label: "C++",
    extensions: [".cpp", ".cc", ".cxx", ".hpp"],
  },
  java: {
    label: "Java",
    extensions: [".java"],
  },
  javascript: {
    label: "JavaScript",
    extensions: [".js", ".jsx"],
  },
  typescript: {
    label: "TypeScript",
    extensions: [".ts", ".tsx"],
  },
} as const;