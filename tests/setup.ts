import { beforeEach, afterEach, vi } from 'vitest';

// Mock for canvas and GPU context
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string = '';
  strokeStyle: string = '';
  lineWidth: number = 1;
  shadowBlur: number = 0;
  shadowColor: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  beginPath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  fill() {}
  stroke() {}
  clearRect() {}
  fillRect() {}
}

// Setup global mocks
beforeEach(() => {
  // Mock window
  global.window = {
    ...global.window,
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    requestAnimationFrame: vi.fn().mockImplementation((callback) => {
      return setTimeout(() => callback(Date.now()), 0);
    }),
    cancelAnimationFrame: vi.fn().mockImplementation((id) => {
      clearTimeout(id);
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };

  // Mock canvas
  global.HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D(global.HTMLCanvasElement.prototype as any);
    }
    return null;
  });

  // Mock for GPU.js
  vi.mock('gpu.js', () => {
    return {
      GPU: vi.fn().mockImplementation(() => {
        return {
          createKernel: vi.fn().mockImplementation((fn) => {
            const mockKernel = vi.fn();
            mockKernel.setOutput = vi.fn().mockReturnValue(mockKernel);
            mockKernel.setLoopMaxIterations = vi.fn().mockReturnValue(mockKernel);
            mockKernel.setConstants = vi.fn().mockReturnValue(mockKernel);
            return mockKernel;
          }),
        };
      }),
    };
  });

  // Mock dat.gui
  vi.mock('dat.gui', () => {
    const GUI = vi.fn().mockImplementation(() => {
      return {
        add: vi.fn().mockReturnValue({
          name: vi.fn().mockReturnThis(),
          onChange: vi.fn().mockReturnThis(),
          step: vi.fn().mockReturnThis(),
        }),
        addColor: vi.fn().mockReturnValue({
          name: vi.fn().mockReturnThis(),
          onChange: vi.fn().mockReturnThis(),
        }),
        addFolder: vi.fn().mockImplementation(() => {
          return {
            add: vi.fn().mockReturnValue({
              name: vi.fn().mockReturnThis(),
              onChange: vi.fn().mockReturnThis(),
              step: vi.fn().mockReturnThis(),
            }),
            open: vi.fn(),
            close: vi.fn(),
          };
        }),
        open: vi.fn(),
        close: vi.fn(),
      };
    });
    return { GUI };
  });
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});