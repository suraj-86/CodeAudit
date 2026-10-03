import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Lets React's `act()` work correctly with fake timers and other
// out-of-render state updates in tests (see React's testing docs).
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// jsdom doesn't implement ResizeObserver (CodeDiffView uses it to switch
// the Monaco diff between side-by-side and inline mode). A no-op stub is
// enough for tests, which don't assert on real layout measurements.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

afterEach(() => {
  cleanup()
})
