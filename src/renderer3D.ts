// src/renderer3D.ts

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { config } from './constants.js';

/**
 * Renderer3D class handles the 3D rendering of the mycelial network
 * using Three.js for WebGL-based visualization.
 */
export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  
  // Store references to objects for updating
  private hyphaeSegments: Map<string, THREE.Line> = new Map();
  private nodeObjects: Map<number, THREE.Mesh> = new Map();
  
  // Material for hyphal segments
  private mainHyphaeMaterial: THREE.LineBasicMaterial;
  private secondaryHyphaeMaterial: THREE.LineBasicMaterial;
  
  // Environment visualization
  private nutrientGrid: THREE.Points | null = null;
  
  /**
   * Constructor initializes the 3D renderer
   * @param container HTML element to contain the renderer
   * @param width Initial width
   * @param height Initial height
   */
  constructor(container: HTMLElement, width: number, height: number) {
    this.container = container;
    
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // Black background
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      config.CAMERA_FOV, 
      width / height, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 0, config.CAMERA_DISTANCE);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Add orbit controls for camera manipulation
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    
    // Create materials for hyphal segments
    this.mainHyphaeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(`hsl(${config.BASE_HUE}, 0%, ${config.BASE_LIGHTNESS}%)`),
      linewidth: config.MAIN_LINE_WIDTH,
      opacity: config.MAIN_ALPHA,
      transparent: true,
    });
    
    this.secondaryHyphaeMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(`hsl(${config.BASE_HUE}, 0%, ${config.BASE_LIGHTNESS + config.LIGHTNESS_STEP * 2}%)`),
      linewidth: config.SECONDARY_LINE_WIDTH,
      opacity: config.SECONDARY_ALPHA,
      transparent: true,
    });
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
    
    // Add coordinate axes for reference (red = x, green = y, blue = z)
    const axesHelper = new THREE.AxesHelper(50);
    this.scene.add(axesHelper);
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Add a hyphal segment to the 3D scene
   * @param id Unique identifier for the segment
   * @param startPoint Start point (x, y, z)
   * @param endPoint End point (x, y, z)
   * @param type Growth type (main or secondary)
   * @param depth Branch depth
   * @param nutrientIntensity Nutrient intensity for coloring
   */
  public addHyphalSegment(
    id: string,
    startPoint: { x: number; y: number; z: number },
    endPoint: { x: number; y: number; z: number },
    type: 'main' | 'secondary',
    depth: number,
    nutrientIntensity: number = 0
  ): void {
    // Create geometry for the line segment
    const points = [
      new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z),
      new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z)
    ];
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create material based on type and nutrient intensity
    let material: THREE.LineBasicMaterial;
    
    if (type === 'main') {
      // For main hyphae, use nutrient-influenced color
      const hue = nutrientIntensity > 0.1 ? config.NUTRIENT_HUE : config.BASE_HUE;
      const saturation = nutrientIntensity * 100;
      const lightness = config.BASE_LIGHTNESS;
      
      material = new THREE.LineBasicMaterial({
        color: new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`),
        linewidth: config.MAIN_LINE_WIDTH,
        opacity: config.MAIN_ALPHA,
        transparent: true,
      });
    } else {
      // For secondary hyphae, use depth-influenced lightness
      const lightness = Math.min(100, config.BASE_LIGHTNESS + depth * config.LIGHTNESS_STEP);
      
      material = new THREE.LineBasicMaterial({
        color: new THREE.Color(`hsl(${config.BASE_HUE}, 0%, ${lightness}%)`),
        linewidth: config.SECONDARY_LINE_WIDTH,
        opacity: config.SECONDARY_ALPHA,
        transparent: true,
      });
    }
    
    // Create the line and add to scene
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    
    // Store reference for later updates
    this.hyphaeSegments.set(id, line);
  }
  
  /**
   * Add a node to the 3D scene
   * @param id Node ID
   * @param position Node position (x, y, z)
   * @param resource Resource level
   */
  public addNode(
    id: number,
    position: { x: number; y: number; z: number },
    resource: number
  ): void {
    // Scale node size based on resource
    const size = 0.5 + (resource / config.INITIAL_RESOURCE_PER_TIP) * 1.5;
    
    // Create geometry and material
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    
    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    this.scene.add(mesh);
    
    // Store reference
    this.nodeObjects.set(id, mesh);
  }
  
  /**
   * Update a node's appearance based on resource level
   * @param id Node ID
   * @param resource Resource level
   */
  public updateNodeResource(id: number, resource: number): void {
    const node = this.nodeObjects.get(id);
    if (node) {
      // Scale node size based on resource
      const size = 0.5 + (resource / config.INITIAL_RESOURCE_PER_TIP) * 1.5;
      
      // Update geometry
      node.scale.set(size, size, size);
      
      // Update color based on resource level
      const material = node.material as THREE.MeshBasicMaterial;
      const resourceRatio = resource / config.INITIAL_RESOURCE_PER_TIP;
      
      // Transition from white to green as resource increases
      const color = new THREE.Color();
      color.r = 1 - resourceRatio * 0.5;
      color.g = 1;
      color.b = 1 - resourceRatio * 0.8;
      
      material.color = color;
    }
  }
  
  /**
   * Visualize the nutrient environment in 3D
   * @param nutrientData 3D array of nutrient values
   * @param cellSize Size of each grid cell
   */
  public visualizeNutrientEnvironment(
    nutrientData: number[][][],
    cellSize: number
  ): void {
    // Remove previous visualization if it exists
    if (this.nutrientGrid) {
      this.scene.remove(this.nutrientGrid);
    }
    
    // Create points for each cell with significant nutrients
    const positions: number[] = [];
    const colors: number[] = [];
    
    // Process nutrient data
    for (let x = 0; x < nutrientData.length; x++) {
      for (let y = 0; y < nutrientData[x].length; y++) {
        for (let z = 0; z < nutrientData[x][y].length; z++) {
          const nutrient = nutrientData[x][y][z];
          
          // Only visualize cells with significant nutrients
          if (nutrient > config.BASE_NUTRIENT * 0.2) {
            // Calculate position
            const posX = (x - nutrientData.length / 2) * cellSize;
            const posY = (y - nutrientData[x].length / 2) * cellSize;
            const posZ = (z - nutrientData[x][y].length / 2) * cellSize;
            
            positions.push(posX, posY, posZ);
            
            // Calculate color (green with intensity based on nutrient level)
            const intensity = nutrient / config.BASE_NUTRIENT;
            colors.push(0, intensity, 0);
          }
        }
      }
    }
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: cellSize * 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
    });
    
    // Create points and add to scene
    this.nutrientGrid = new THREE.Points(geometry, material);
    this.scene.add(this.nutrientGrid);
  }
  
  /**
   * Clear all objects from the scene
   */
  public clear(): void {
    // Remove all hyphal segments
    for (const segment of this.hyphaeSegments.values()) {
      this.scene.remove(segment);
      segment.geometry.dispose();
      (segment.material as THREE.Material).dispose();
    }
    this.hyphaeSegments.clear();
    
    // Remove all nodes
    for (const node of this.nodeObjects.values()) {
      this.scene.remove(node);
      node.geometry.dispose();
      (node.material as THREE.Material).dispose();
    }
    this.nodeObjects.clear();
    
    // Remove nutrient grid
    if (this.nutrientGrid) {
      this.scene.remove(this.nutrientGrid);
      this.nutrientGrid.geometry.dispose();
      (this.nutrientGrid.material as THREE.Material).dispose();
      this.nutrientGrid = null;
    }
  }
  
  /**
   * Resize the renderer and update camera aspect ratio
   * @param width New width
   * @param height New height
   */
  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
  
  /**
   * Set the camera distance from the center
   * @param distance Camera distance
   */
  public setCameraDistance(distance: number): void {
    const direction = new THREE.Vector3();
    direction.subVectors(this.camera.position, new THREE.Vector3(0, 0, 0)).normalize();
    this.camera.position.copy(direction.multiplyScalar(distance));
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Set the camera field of view
   * @param fov Field of view in degrees
   */
  public setCameraFOV(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }
  
  /**
   * Render the scene
   */
  public render(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
