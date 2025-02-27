/**
 * Mock implementation of HTML Canvas elements for testing rendering functionality
 * without requiring a browser environment.
 */

export class MockCanvasRenderingContext2D {
  private methodCalls: Record<string, any[][]> = {};
  public fillStyle: string = 'black';
  public strokeStyle: string = 'black';
  public lineWidth: number = 1;
  public shadowBlur: number = 0;
  public shadowColor: string = 'transparent';
  public globalAlpha: number = 1;

  constructor(public canvas: MockCanvas) {}

  private recordMethodCall(method: string, args: any[]): void {
    if (!this.methodCalls[method]) {
      this.methodCalls[method] = [];
    }
    this.methodCalls[method].push(args);
  }

  public getMethodCalls(method: string): any[][] {
    return this.methodCalls[method] || [];
  }

  public clearMethodCalls(): void {
    this.methodCalls = {};
  }

  // Basic shape methods
  public beginPath(): void {
    this.recordMethodCall('beginPath', []);
  }

  public closePath(): void {
    this.recordMethodCall('closePath', []);
  }

  public moveTo(x: number, y: number): void {
    this.recordMethodCall('moveTo', [x, y]);
  }

  public lineTo(x: number, y: number): void {
    this.recordMethodCall('lineTo', [x, y]);
  }

  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
    this.recordMethodCall('arc', [x, y, radius, startAngle, endAngle, counterclockwise]);
  }

  // Drawing methods
  public fill(): void {
    this.recordMethodCall('fill', []);
  }

  public stroke(): void {
    this.recordMethodCall('stroke', []);
  }

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.recordMethodCall('fillRect', [x, y, width, height]);
  }

  public strokeRect(x: number, y: number, width: number, height: number): void {
    this.recordMethodCall('strokeRect', [x, y, width, height]);
  }

  public clearRect(x: number, y: number, width: number, height: number): void {
    this.recordMethodCall('clearRect', [x, y, width, height]);
  }

  // Text methods
  public fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.recordMethodCall('fillText', [text, x, y, maxWidth]);
  }

  public strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    this.recordMethodCall('strokeText', [text, x, y, maxWidth]);
  }

  // Image methods
  public drawImage(image: any, dx: number, dy: number): void {
    this.recordMethodCall('drawImage', [image, dx, dy]);
  }

  // Get data methods (stubbed)
  public getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    this.recordMethodCall('getImageData', [sx, sy, sw, sh]);
    return {
      data: new Uint8ClampedArray(sw * sh * 4),
      width: sw,
      height: sh,
      colorSpace: 'srgb'
    };
  }

  // Path methods
  public clip(): void {
    this.recordMethodCall('clip', []);
  }

  // Transform methods
  public scale(x: number, y: number): void {
    this.recordMethodCall('scale', [x, y]);
  }

  public rotate(angle: number): void {
    this.recordMethodCall('rotate', [angle]);
  }

  public translate(x: number, y: number): void {
    this.recordMethodCall('translate', [x, y]);
  }

  public transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.recordMethodCall('transform', [a, b, c, d, e, f]);
  }

  public setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.recordMethodCall('setTransform', [a, b, c, d, e, f]);
  }

  public resetTransform(): void {
    this.recordMethodCall('resetTransform', []);
  }

  // State methods
  public save(): void {
    this.recordMethodCall('save', []);
  }

  public restore(): void {
    this.recordMethodCall('restore', []);
  }
}

export class MockCanvas {
  public width: number;
  public height: number;
  private context: MockCanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.context = new MockCanvasRenderingContext2D(this);
  }

  public getContext(contextType: string): MockCanvasRenderingContext2D {
    if (contextType !== '2d') {
      throw new Error(`Mock canvas only supports '2d' context, got: ${contextType}`);
    }
    return this.context;
  }

  public getMethodCalls(method: string): any[][] {
    return this.context.getMethodCalls(method);
  }

  public clearMethodCalls(): void {
    this.context.clearMethodCalls();
  }
}