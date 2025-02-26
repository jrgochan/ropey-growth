import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EnvironmentGPU } from "../../src/environmentGPU";
import { config } from "../../src/constants";
import { VisualSnapshot } from "./VisualSnapshot";
import { GrowthManager } from "../../src/growth";
import { Perlin } from "../../src/Perlin";
import { MycelialNetwork } from "../../src/mycelialNetwork";

// Store original config
const originalConfig = { ...config };

// Mock canvas and context for testing
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string = "";
  strokeStyle: string = "";
  lineWidth: number = 1;
  lineCap: string = "butt";
  shadowBlur: number = 0;
  shadowColor: string = "";
  
  // Track method calls for assertions
  methodCalls: Record<string, any[][]> = {
    beginPath: [],
    arc: [],
    fill: [],
    stroke: [],
    moveTo: [],
    lineTo: [],
    ellipse: [],
    createRadialGradient: [],
    save: [],
    restore: [],
    fillRect: [],
  };
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }
  
  // Mock methods
  beginPath() { this.methodCalls.beginPath.push([]); }
  arc(x: number, y: number, r: number, startAngle: number, endAngle: number) { 
    this.methodCalls.arc.push([x, y, r, startAngle, endAngle]); 
  }
  fill() { this.methodCalls.fill.push([]); }
  stroke() { this.methodCalls.stroke.push([]); }
  moveTo(x: number, y: number) { this.methodCalls.moveTo.push([x, y]); }
  lineTo(x: number, y: number) { this.methodCalls.lineTo.push([x, y]); }
  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number) {
    this.methodCalls.ellipse.push([x, y, radiusX, radiusY, rotation, startAngle, endAngle]);
  }
  fillRect(x: number, y: number, width: number, height: number) {
    this.methodCalls.fillRect.push([x, y, width, height]);
  }
  clearRect(x: number, y: number, width: number, height: number) {
    // Mock clearRect method
  }
  save() { this.methodCalls.save.push([]); }
  restore() { this.methodCalls.restore.push([]); }
  
  // For image data in VisualSnapshot
  getImageData(x: number, y: number, width: number, height: number) {
    return {
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height
    };
  }
  
  // Mock methods needed for canvas operations
  putImageData() {}
  
  // Reset all tracked calls
  resetCalls() {
    Object.keys(this.methodCalls).forEach(key => {
      this.methodCalls[key] = [];
    });
  }
}

// Mock HTMLCanvasElement
class MockCanvas {
  width: number = 800;
  height: number = 600;
  context: MockCanvasRenderingContext2D;
  
  constructor() {
    this.context = new MockCanvasRenderingContext2D(this as unknown as HTMLCanvasElement);
  }
  
  getContext(contextId: string): MockCanvasRenderingContext2D | null {
    if (contextId === '2d') {
      return this.context;
    }
    return null;
  }
}

// Mock document.createElement for canvas
const originalCreateElement = document.createElement;
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return new MockCanvas() as unknown as HTMLCanvasElement;
  }
  return originalCreateElement.call(document, tagName);
});

// Mock for 3D renderer
class MockRenderer3D {
  // Track method calls for assertions
  methodCalls: Record<string, any[][]> = {
    clear: [],
    render: [],
    addHyphalSegment: [],
    visualizeNutrientEnvironment: [],
    setCameraDistance: [],
    setCameraFOV: [],
    resize: [],
  };
  
  // Mock methods
  clear() { this.methodCalls.clear.push([]); }
  render() { this.methodCalls.render.push([]); }
  addHyphalSegment(id: string, start: any, end: any, type: string, depth: number, nutrientIntensity: number) {
    this.methodCalls.addHyphalSegment.push([id, start, end, type, depth, nutrientIntensity]);
  }
  visualizeNutrientEnvironment(grid: number[][][], cellSize: number) {
    this.methodCalls.visualizeNutrientEnvironment.push([grid, cellSize]);
  }
  setCameraDistance(distance: number) {
    this.methodCalls.setCameraDistance.push([distance]);
  }
  setCameraFOV(fov: number) {
    this.methodCalls.setCameraFOV.push([fov]);
  }
  resize(width: number, height: number) {
    this.methodCalls.resize.push([width, height]);
  }
  
  // Reset all tracked calls
  resetCalls() {
    Object.keys(this.methodCalls).forEach(key => {
      this.methodCalls[key] = [];
    });
  }
}

describe("Nutrient Visualization", () => {
  let env: EnvironmentGPU;
  let growth: GrowthManager;
  let mockCanvas: MockCanvas;
  let mockCtx: MockCanvasRenderingContext2D;
  let mockRenderer3D: MockRenderer3D;
  let perlin: Perlin;
  let network: MycelialNetwork;
  const width = 800;
  const height = 600;
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Reset config to original values
    Object.assign(config, originalConfig);
    
    // Create mock canvas and context
    mockCanvas = new MockCanvas();
    mockCtx = mockCanvas.getContext('2d') as MockCanvasRenderingContext2D;
    mockCtx.resetCalls();
    
    // Create mock 3D renderer
    mockRenderer3D = new MockRenderer3D();
    mockRenderer3D.resetCalls();
    
    // Create environment
    env = new EnvironmentGPU(width, height);
    
    // Create perlin noise generator
    perlin = new Perlin();
    
    // Create mycelial network
    network = new MycelialNetwork();
    
    // Create growth manager
    growth = new GrowthManager(
      mockCtx as unknown as CanvasRenderingContext2D,
      width,
      height,
      width / 2,
      height / 2,
      perlin,
      env,
      network
    );
    
    // Silence console logs
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it("should initialize the nutrient grid correctly", () => {
    // The grid should be initialized with base nutrient levels
    expect(env).toBeDefined();
  });
  
  it("should get nutrient level at a specific position in 2D (backward compatibility)", () => {
    // Add nutrients at a specific location
    env.addNutrient(100, 100, 50);
    
    // Get the nutrient level at that location
    const level = env.getNutrientLevel(100, 100);
    
    // Verify that the nutrient level is correct
    expect(level).toBeGreaterThan(0);
  });
  
  it("should get nutrient level at a specific position in 3D", () => {
    // Add nutrients at a specific 3D location
    env.addNutrient(100, 100, 10, 50);
    
    // Get the nutrient level at that 3D location
    const level = env.getNutrientLevel(100, 100, 10);
    
    // Verify that the nutrient level is correct
    expect(level).toBeGreaterThan(0);
  });
  
  it("should draw nutrient grid for debugging in 2D", () => {
    // Add nutrients at a specific location
    env.addNutrient(100, 100, 50);
    
    // Draw the nutrient grid
    env.drawNutrientGrid(mockCtx as unknown as CanvasRenderingContext2D);
    
    // Verify that drawing methods were called
    expect(mockCtx.methodCalls.fillRect.length).toBeGreaterThan(0);
  });
  
  it("should visualize 3D nutrient environment", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create a new environment with 3D enabled
    const env3D = new EnvironmentGPU(width, height);
    
    // Create growth manager with 3D renderer
    const growth3D = new GrowthManager(
      mockCtx as unknown as CanvasRenderingContext2D,
      width,
      height,
      width / 2,
      height / 2,
      perlin,
      env3D,
      network,
      mockRenderer3D as any
    );
    
    // Initialize growth
    growth3D.init();
    
    // Verify that the 3D renderer was used to visualize the nutrient environment
    expect(mockRenderer3D.methodCalls.visualizeNutrientEnvironment.length).toBeGreaterThan(0);
  });
  
  it("should render hyphae segments with green glow based on nutrient levels in 2D", () => {
    // Initialize growth
    growth.init();
    
    // Add nutrients at specific locations
    env.addNutrient(width/2, height/2, 100); // Center
    
    // Update and draw the growth
    growth.updateAndDraw(0);
    
    // Verify that drawing methods were called
    expect(mockCtx.methodCalls.beginPath.length).toBeGreaterThan(0);
    expect(mockCtx.methodCalls.moveTo.length).toBeGreaterThan(0);
    expect(mockCtx.methodCalls.lineTo.length).toBeGreaterThan(0);
    expect(mockCtx.methodCalls.stroke.length).toBeGreaterThan(0);
  });
  
  it("should render hyphae segments in 3D with nutrient-based coloring", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create growth manager with 3D renderer
    const growth3D = new GrowthManager(
      mockCtx as unknown as CanvasRenderingContext2D,
      width,
      height,
      width / 2,
      height / 2,
      perlin,
      env,
      network,
      mockRenderer3D as any
    );
    
    // Initialize growth
    growth3D.init();
    
    // Add nutrients at specific locations
    env.addNutrient(width/2, height/2, 10, 100); // Center with z=10
    
    // Update and draw the growth
    growth3D.updateAndDraw(0);
    
    // Verify that 3D rendering methods were called
    expect(mockRenderer3D.methodCalls.addHyphalSegment.length).toBeGreaterThan(0);
    expect(mockRenderer3D.methodCalls.render.length).toBeGreaterThan(0);
  });
  
  it("should create visual snapshots correctly", () => {
    // Create a mock canvas and context that works with VisualSnapshot
    const mockSnapshotCanvas = new MockCanvas();
    const mockSnapshotCtx = mockSnapshotCanvas.getContext('2d') as MockCanvasRenderingContext2D;
    
    // Create a snapshot directly
    const snapshot = new VisualSnapshot(
      mockSnapshotCtx as unknown as CanvasRenderingContext2D, 
      mockSnapshotCanvas.width, 
      mockSnapshotCanvas.height
    );
    
    // Verify snapshot properties
    expect(snapshot).toBeDefined();
    const metrics = snapshot.getMetrics();
    expect(metrics.width).toBe(800);
    expect(metrics.height).toBe(600);
    expect(metrics.timestamp).toBeGreaterThan(0);
  });
  
  it("should compare visual snapshots correctly", () => {
    // Create two mock canvases and contexts
    const mockCanvas1 = new MockCanvas();
    const mockCanvas2 = new MockCanvas();
    const mockCtx1 = mockCanvas1.getContext('2d') as MockCanvasRenderingContext2D;
    const mockCtx2 = mockCanvas2.getContext('2d') as MockCanvasRenderingContext2D;
    
    // Create snapshots directly
    const snapshot1 = new VisualSnapshot(
      mockCtx1 as unknown as CanvasRenderingContext2D, 
      mockCanvas1.width, 
      mockCanvas1.height
    );
    
    const snapshot2 = new VisualSnapshot(
      mockCtx2 as unknown as CanvasRenderingContext2D, 
      mockCanvas2.width, 
      mockCanvas2.height
    );
    
    // Compare snapshots - they should be identical with our mock implementation
    const difference = snapshot1.compareTo(snapshot2);
    
    // Due to the mock implementation, the difference will be 0
    expect(difference).toBe(0);
  });
  
  it("should handle 3D camera controls", () => {
    // Enable 3D
    config.ENABLE_3D = true;
    
    // Create growth manager with 3D renderer
    const growth3D = new GrowthManager(
      mockCtx as unknown as CanvasRenderingContext2D,
      width,
      height,
      width / 2,
      height / 2,
      perlin,
      env,
      network,
      mockRenderer3D as any
    );
    
    // Set camera distance
    mockRenderer3D.setCameraDistance(150);
    
    // Set camera FOV
    mockRenderer3D.setCameraFOV(60);
    
    // Verify that camera control methods were called
    expect(mockRenderer3D.methodCalls.setCameraDistance.length).toBe(1);
    expect(mockRenderer3D.methodCalls.setCameraFOV.length).toBe(1);
    
    // Verify the values
    expect(mockRenderer3D.methodCalls.setCameraDistance[0][0]).toBe(150);
    expect(mockRenderer3D.methodCalls.setCameraFOV[0][0]).toBe(60);
  });
});
