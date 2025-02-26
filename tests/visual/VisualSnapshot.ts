/**
 * VisualSnapshot.ts
 * 
 * Provides utilities for capturing and comparing visual snapshots of canvas renderings
 * to help with regression testing of the mycelial growth simulation.
 */

export class VisualSnapshot {
    private pixelData: Uint8ClampedArray;
    private width: number;
    private height: number;
    private timestamp: number;
  
    /**
     * Creates a new snapshot of a canvas context
     * 
     * @param ctx The canvas rendering context to snapshot
     * @param width The width of the canvas
     * @param height The height of the canvas
     */
    constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
      this.width = width;
      this.height = height;
      this.timestamp = Date.now();
      this.pixelData = ctx.getImageData(0, 0, width, height).data;
    }
  
    /**
     * Compares this snapshot with another and returns the difference percentage
     * 
     * @param other The snapshot to compare against
     * @returns The percentage of pixels that differ (0-100)
     */
    public compareTo(other: VisualSnapshot): number {
      if (this.width !== other.width || this.height !== other.height) {
        throw new Error('Cannot compare snapshots of different dimensions');
      }
  
      let differentPixels = 0;
      const totalPixels = this.width * this.height;
  
      // Compare pixel data (RGBA values)
      for (let i = 0; i < this.pixelData.length; i += 4) {
        const r1 = this.pixelData[i];
        const g1 = this.pixelData[i + 1];
        const b1 = this.pixelData[i + 2];
        const a1 = this.pixelData[i + 3];
  
        const r2 = other.pixelData[i];
        const g2 = other.pixelData[i + 1];
        const b2 = other.pixelData[i + 2];
        const a2 = other.pixelData[i + 3];
  
        // Check if pixels are different (with some tolerance)
        if (
          Math.abs(r1 - r2) > 5 ||
          Math.abs(g1 - g2) > 5 ||
          Math.abs(b1 - b2) > 5 ||
          Math.abs(a1 - a2) > 5
        ) {
          differentPixels++;
        }
      }
  
      return (differentPixels / totalPixels) * 100;
    }
  
    /**
     * Creates a difference map between two snapshots
     * 
     * @param other The snapshot to compare against
     * @returns An ImageData object highlighting the differences
     */
    public createDiffMap(other: VisualSnapshot): ImageData {
      if (this.width !== other.width || this.height !== other.height) {
        throw new Error('Cannot compare snapshots of different dimensions');
      }
  
      const diffData = new Uint8ClampedArray(this.pixelData.length);
  
      // Create a diff map where:
      // - Black (0,0,0) = pixels are the same
      // - Red (255,0,0) = pixels are different
      for (let i = 0; i < this.pixelData.length; i += 4) {
        const r1 = this.pixelData[i];
        const g1 = this.pixelData[i + 1];
        const b1 = this.pixelData[i + 2];
        const a1 = this.pixelData[i + 3];
  
        const r2 = other.pixelData[i];
        const g2 = other.pixelData[i + 1];
        const b2 = other.pixelData[i + 2];
        const a2 = other.pixelData[i + 3];
  
        // Check if pixels are different (with some tolerance)
        if (
          Math.abs(r1 - r2) > 5 ||
          Math.abs(g1 - g2) > 5 ||
          Math.abs(b1 - b2) > 5 ||
          Math.abs(a1 - a2) > 5
        ) {
          // Mark as red for different
          diffData[i] = 255;     // R
          diffData[i + 1] = 0;   // G
          diffData[i + 2] = 0;   // B
          diffData[i + 3] = 255; // A
        } else {
          // Mark as black for same
          diffData[i] = 0;       // R
          diffData[i + 1] = 0;   // G
          diffData[i + 2] = 0;   // B
          diffData[i + 3] = 255; // A
        }
      }
  
      return new ImageData(diffData, this.width, this.height);
    }
  
    /**
     * Saves the snapshot to a data URL
     * 
     * @returns A base64 encoded data URL of the snapshot image
     */
    public toDataURL(): string {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        throw new Error('Failed to get 2D context for temporary canvas');
      }
      
      const imageData = new ImageData(this.pixelData, this.width, this.height);
      tempCtx.putImageData(imageData, 0, 0);
      
      return tempCanvas.toDataURL('image/png');
    }
  
    /**
     * Returns metrics about this snapshot
     */
    public getMetrics(): { width: number; height: number; timestamp: number } {
      return {
        width: this.width,
        height: this.height,
        timestamp: this.timestamp,
      };
    }
  }