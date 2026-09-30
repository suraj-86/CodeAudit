/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for API requests. Defaults to "/api". */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Set in src/test/setup.ts so React's act() works with fake timers in tests. */
// eslint-disable-next-line no-var
var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
