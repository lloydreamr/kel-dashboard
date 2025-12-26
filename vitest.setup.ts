import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for shadcn/ui components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
