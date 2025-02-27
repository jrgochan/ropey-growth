// src/mycelialNetwork.ts

import { config } from "./constants.js"; // Import the config object
import { EnvironmentGPU } from "./environmentGPU.js";

/**
 * mycelialNetwork.ts
 *
 * Manages the mycelial network graph, handling resource flows and hyphal maturation.
 */

interface Edge {
  fromId: number;
  toId: number;
  maturity: number;       // 0-1 value representing hyphal wall maturity
  transportEfficiency: number; // How efficiently resources flow through this segment
  lastFlowAmount: number; // Amount of resource that flowed through this edge in last cycle
}

interface Node {
  id: number;
  x: number;
  y: number;
  resource: number;
  connections: number[]; // IDs of connected nodes
}

export class MycelialNetwork {
  private nodes: Map<number, Node> = new Map();
  private edges: Edge[] = []; // Store edges separately for efficiency tracking
  private nextId: number = 0;
  private envGPU: EnvironmentGPU | null = null; // Reference to environment for path usage recording

  /**
   * Sets the environment reference used for path usage recording.
   * @param env - The environment instance.
   */
  public setEnvironment(env: EnvironmentGPU): void {
    this.envGPU = env;
  }

  /**
   * Creates a new node in the network.
   * @param x - X-coordinate of the node.
   * @param y - Y-coordinate of the node.
   * @param resource - Initial resource of the node.
   * @returns The unique ID of the created node.
   */
  public createNode(x: number, y: number, resource: number): number {
    const id = this.nextId++;
    this.nodes.set(id, {
      id,
      x,
      y,
      resource,
      connections: [],
    });
    return id;
  }

  /**
   * Connects two nodes in the network with a new hyphal segment.
   * @param fromId - ID of the first node.
   * @param toId - ID of the second node.
   */
  public connectNodes(fromId: number, toId: number): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (fromNode && toNode) {
      // Add connection references in both nodes
      if (!fromNode.connections.includes(toId)) {
        fromNode.connections.push(toId);
      }
      if (!toNode.connections.includes(fromId)) {
        toNode.connections.push(fromId);
      }
      
      // Check if this edge already exists
      const existingEdge = this.edges.find(
        (e) => (e.fromId === fromId && e.toId === toId) || 
               (e.fromId === toId && e.toId === fromId)
      );
      
      if (!existingEdge) {
        // Create new edge if it doesn't exist
        this.edges.push({
          fromId,
          toId,
          maturity: 0, // New edges start immature
          transportEfficiency: 1.0, // Base efficiency
          lastFlowAmount: 0
        });
      }
    }
  }

  /**
   * Matures all hyphal segments in the network.
   * This increases their efficiency and transport capabilities.
   */
  public matureHyphae(): void {
    // Increase maturity of all edges based on how much they're used
    for (const edge of this.edges) {
      // Increase maturity based on recent flow activity
      // Enhanced maturation rate for higher flow paths to create more distinct transport routes
      // Increased base maturation rate to create more visible network
      const flowMultiplier = Math.min(5.0, 1.0 + (edge.lastFlowAmount / 20));
      const maturityIncrement = (edge.lastFlowAmount + 0.01) * config.HYPHAL_MATURATION_RATE * flowMultiplier;
      
      // Apply non-linear maturation for more pronounced main transport routes
      if (edge.maturity > 0.5) {
        // Mature edges mature faster (positive feedback loop)
        edge.maturity = Math.min(1.0, edge.maturity + maturityIncrement * 2.0);
      } else {
        // Added minimum maturation rate so all network edges mature over time
        edge.maturity = Math.min(1.0, edge.maturity + Math.max(maturityIncrement, 0.001));
      }
      
      // Update transport efficiency based on maturity - exponential improvement
      // Increased efficiency factor for more active network
      edge.transportEfficiency = 1.0 + (Math.pow(edge.maturity, 1.5) * (config.TRANSPORT_EFFICIENCY_FACTOR * 1.2 - 1.0));
    }
  }

  /**
   * Finds a specific edge between two nodes.
   * @param fromId - ID of the first node.
   * @param toId - ID of the second node.
   * @returns The edge object or undefined if not found.
   */
  private findEdge(fromId: number, toId: number): Edge | undefined {
    return this.edges.find(
      (e) => (e.fromId === fromId && e.toId === toId) || 
             (e.fromId === toId && e.toId === fromId)
    );
  }

  /**
   * Simulates resource flow between connected nodes.
   * Resources flow from nodes with higher resources to those with lower resources.
   * Flow is influenced by the maturity and efficiency of connecting hyphal segments.
   */
  public flowResources(): void {
    const resourceChanges: Map<number, number> = new Map();

    // Reset flow amounts for this cycle
    for (const edge of this.edges) {
      edge.lastFlowAmount = 0;
    }

    // For each node, calculate resource flows to its connections
    this.nodes.forEach((node, id) => {
      node.connections.forEach((connId) => {
        const connectedNode = this.nodes.get(connId);
        if (connectedNode) {
          // Only flow resources if there's a meaningful difference
          // Further reduced threshold to increase flow activity
          if (node.resource > connectedNode.resource + 2) {
            // Find the edge connecting these nodes
            const edge = this.findEdge(id, connId);
            if (edge) {
              // Calculate flow based on resource difference and edge efficiency
              const baseFlow = (node.resource - connectedNode.resource) * config.RESOURCE_FLOW_RATE;
              // Apply maturity bonus to transport efficiency to encourage main transport routes
              // Increased maturity bonus for more visible network formation
              const maturityBonus = 1 + (edge.maturity * 1.5);
              const adjustedFlow = baseFlow * edge.transportEfficiency * maturityBonus;
              
              // Record the flow for this edge
              edge.lastFlowAmount += adjustedFlow;
              
              // Apply the changes
              resourceChanges.set(id, (resourceChanges.get(id) || 0) - adjustedFlow);
              resourceChanges.set(connId, (resourceChanges.get(connId) || 0) + adjustedFlow);
              
              // Record path usage in the environment (for visualization)
              if (this.envGPU) {
                const fromNode = this.nodes.get(edge.fromId);
                const toNode = this.nodes.get(edge.toId);
                if (fromNode && toNode) {
                  // Calculate midpoint of this edge for recording path usage
                  const midX = (fromNode.x + toNode.x) / 2;
                  const midY = (fromNode.y + toNode.y) / 2;
                  
                  // Increase path usage recording for better visualization
                  this.envGPU.recordPathUsage(midX, midY, adjustedFlow * 2);
                  
                  // Record usage along the path, not just at midpoint
                  const numPoints = 3; // Record multiple points along the path
                  for (let i = 1; i < numPoints; i++) {
                    const t = i / (numPoints + 1);
                    const pathX = fromNode.x * (1-t) + toNode.x * t;
                    const pathY = fromNode.y * (1-t) + toNode.y * t;
                    this.envGPU.recordPathUsage(pathX, pathY, adjustedFlow);
                  }
                }
              }
            }
          }
        }
      });
    });

    // Apply all resource changes
    resourceChanges.forEach((change, id) => {
      const node = this.nodes.get(id);
      if (node) {
        node.resource += change;
        // Ensure resource values are valid
        if (node.resource < 0) node.resource = 0;
        // Set a maximum resource limit to prevent overflow
        if (node.resource > 3000) node.resource = 3000;
      }
    });
    
    // Add a small minimum resource to all nodes to prevent network die-off
    // This represents the base maintenance level in the real fungal network
    this.nodes.forEach((node) => {
      if (node.resource < 10) {
        node.resource = Math.max(node.resource, 10);
      }
    });
    
    // After flowing resources, mature the hyphal segments
    this.matureHyphae();
  }

  /**
   * Gets the maturity level of an edge between two nodes.
   * Used for visualizing thicker hyphae for mature segments.
   * @param fromId - ID of the first node.
   * @param toId - ID of the second node.
   * @returns The maturity level (0-1) or 0 if edge not found.
   */
  public getEdgeMaturity(fromId: number, toId: number): number {
    const edge = this.findEdge(fromId, toId);
    return edge ? edge.maturity : 0;
  }

  /**
   * Retrieves the resource level of a specific node.
   * @param id - ID of the node.
   * @returns The resource level of the node.
   */
  public getResource(id: number): number {
    const node = this.nodes.get(id);
    return node ? node.resource : 0;
  }

  /**
   * Gets the coordinates of a specific node.
   * @param id - ID of the node.
   * @returns The [x, y] coordinates or [0, 0] if node not found.
   */
  public getNodePosition(id: number): [number, number] {
    const node = this.nodes.get(id);
    return node ? [node.x, node.y] : [0, 0];
  }

  /**
   * Resets the network by clearing all nodes, connections, and edges.
   */
  public resetNetwork(): void {
    this.nodes.clear();
    this.edges = [];
    this.nextId = 0;
  }
}
