// src/mycelialNetwork.ts

import { config } from "./constants.js"; // Import the config object

/**
 * mycelialNetwork.ts
 *
 * Manages the mycelial network graph, handling resource flows.
 */

interface Node {
  id: number;
  x: number;
  y: number;
  z: number; // Added z-coordinate for 3D
  resource: number;
  connections: number[]; // IDs of connected nodes
}

export class MycelialNetwork {
  private nodes: Map<number, Node> = new Map();
  private nextId: number = 0;
  private activeNodes: Set<number> = new Set(); // Track nodes with significant resources

  /**
   * Creates a new node in the network.
   * @param x - X-coordinate of the node.
   * @param y - Y-coordinate of the node.
   * @param z - Z-coordinate of the node (default: 0).
   * @param resource - Initial resource of the node.
   * @returns The unique ID of the created node.
   */
  public createNode(x: number, y: number, z: number = 0, resource: number = 0): number {
    // Support for backward compatibility with 2D calls
    if (arguments.length === 3) {
      resource = z;
      z = 0;
    }
    
    const id = this.nextId++;
    this.nodes.set(id, {
      id,
      x,
      y,
      z,
      resource,
      connections: [],
    });
    
    // Track nodes with resources
    if (resource > 0) {
      this.activeNodes.add(id);
    }
    
    return id;
  }

  /**
   * Connects two nodes in the network.
   * @param fromId - ID of the first node.
   * @param toId - ID of the second node.
   */
  public connectNodes(fromId: number, toId: number): void {
    const fromNode = this.nodes.get(fromId);
    const toNode = this.nodes.get(toId);
    if (fromNode && toNode) {
      fromNode.connections.push(toId);
      toNode.connections.push(fromId);
    }
  }

  // Cache for connection calculations
  private connectionCache: Map<number, number[]> = new Map();
  
  /**
   * Gets cached connections for a node
   * @param nodeId - ID of the node
   * @returns Array of connected node IDs
   */
  private getCachedConnections(nodeId: number): number[] {
    if (!this.connectionCache.has(nodeId)) {
      const node = this.nodes.get(nodeId);
      if (node) {
        // Filter out invalid connections
        const validConnections = node.connections.filter(id => this.nodes.has(id));
        this.connectionCache.set(nodeId, validConnections);
      } else {
        this.connectionCache.set(nodeId, []);
      }
    }
    return this.connectionCache.get(nodeId)!;
  }

  /**
   * Simulates resource flow between connected nodes.
   * Resources flow from nodes with higher resources to those with lower resources.
   * Highly optimized to only process nodes with significant resources.
   */
  public flowResources(): void {
    // Use a sparse update approach for better performance
    const resourceChanges: Map<number, number> = new Map();
    const newActiveNodes: Set<number> = new Set();
    
    // Process nodes in batches for better performance
    const batchSize = 100;
    const activeNodesArray = Array.from(this.activeNodes);
    
    for (let i = 0; i < activeNodesArray.length; i += batchSize) {
      const batch = activeNodesArray.slice(i, i + batchSize);
      
      for (const id of batch) {
        const node = this.nodes.get(id);
        if (!node) continue;
        
        // Skip nodes with minimal resources (increased threshold)
        if (node.resource < 2) continue;
        
        // Add this node to the new active set if it has resources
        if (node.resource > 0) {
          newActiveNodes.add(id);
        }
        
        // Get cached connections
        const connections = this.getCachedConnections(id);
        
        // Calculate total flow for this node
        let totalOutflow = 0;
        
        for (const connId of connections) {
          const connectedNode = this.nodes.get(connId);
          if (!connectedNode) continue;
          
          // Add connected node to active set if it has resources
          if (connectedNode.resource > 0) {
            newActiveNodes.add(connId);
          }
          
          // Only flow if difference is significant (increased threshold)
          const resourceDiff = node.resource - connectedNode.resource;
          if (resourceDiff > 10) {
            // Calculate flow with diminishing returns for very large differences
            const flow = Math.min(
              resourceDiff * config.RESOURCE_FLOW_RATE,
              node.resource * 0.3 // Cap at 30% of source node's resources
            );
            
            totalOutflow += flow;
            
            // Add to the target node's changes
            resourceChanges.set(
              connId,
              (resourceChanges.get(connId) || 0) + flow
            );
          }
        }
        
        // Apply total outflow to source node
        if (totalOutflow > 0) {
          resourceChanges.set(
            id,
            (resourceChanges.get(id) || 0) - totalOutflow
          );
        }
      }
    }

    // Apply resource changes in a single pass
    for (const [id, change] of resourceChanges) {
      const node = this.nodes.get(id);
      if (node) {
        node.resource += change;
        
        // Clamp resource to valid range
        node.resource = Math.max(0, Math.min(1000, node.resource));
        
        // Add to active nodes if it has resources
        if (node.resource > 0) {
          newActiveNodes.add(id);
        }
      }
    }
    
    // Update active nodes set
    this.activeNodes = newActiveNodes;
    
    // Clear connection cache periodically to handle network changes
    if (Math.random() < 0.01) { // 1% chance each frame
      this.connectionCache.clear();
    }
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
   * Resets the network by clearing all nodes and connections.
   */
  public reset(): void {
    this.nodes.clear();
    this.nextId = 0;
    this.activeNodes.clear();
    this.connectionCache.clear();
  }
}
