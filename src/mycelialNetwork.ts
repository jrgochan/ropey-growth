// src/mycelialNetwork.ts

/**
 * mycelialNetwork.ts
 *
 * Manages the mycelial network graph, handling resource flows.
 */

interface Node {
    id: number;
    x: number;
    y: number;
    resource: number;
    connections: number[]; // IDs of connected nodes
  }
  
  export class MycelialNetwork {
    private nodes: Map<number, Node> = new Map();
    private nextId: number = 0;
  
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
        connections: []
      });
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
  
    /**
     * Simulates resource flow between connected nodes.
     * Resources flow from nodes with higher resources to those with lower resources.
     */
    public flowResources(): void {
      const resourceChanges: Map<number, number> = new Map();
  
      this.nodes.forEach((node, id) => {
        node.connections.forEach(connId => {
          const connectedNode = this.nodes.get(connId);
          if (connectedNode) {
            if (node.resource > connectedNode.resource + 10) { // Threshold to prevent minimal flows
              const flow = (node.resource - connectedNode.resource) * RESOURCE_FLOW_RATE;
              resourceChanges.set(id, (resourceChanges.get(id) || 0) - flow);
              resourceChanges.set(connId, (resourceChanges.get(connId) || 0) + flow);
            }
          }
        });
      });
  
      // Apply resource changes
      resourceChanges.forEach((change, id) => {
        const node = this.nodes.get(id);
        if (node) {
          node.resource += change;
          // Clamp resource to non-negative values
          if (node.resource < 0) node.resource = 0;
          // Optionally, set a maximum resource limit
          if (node.resource > 1000) node.resource = 1000;
        }
      });
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
    public resetNetwork(): void {
      this.nodes.clear();
      this.nextId = 0;
    }
  }
  