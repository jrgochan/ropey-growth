/**
 * Mock implementation of MycelialNetwork for testing purposes
 * Provides simplified network functionality for tests
 */

type Node = {
  id: number;
  x: number;
  y: number;
  resource: number;
  maturity: number;
  connections: number[];
};

type Edge = {
  source: number;
  target: number;
  efficiency: number;
  usage: number;
};

export class MockMycelialNetwork {
  private nodes: Map<number, Node> = new Map();
  private edges: Edge[] = [];
  private nextNodeId: number = 0;
  private environment: any = null;

  constructor() {}

  // Set environment reference
  public setEnvironment(environment: any): void {
    this.environment = environment;
  }

  // Create a new node and return its ID
  public createNode(x: number, y: number, resource: number = 0): number {
    const nodeId = this.nextNodeId++;
    this.nodes.set(nodeId, {
      id: nodeId,
      x,
      y,
      resource,
      maturity: 0,
      connections: []
    });
    return nodeId;
  }

  // Connect two nodes
  public connectNodes(sourceId: number, targetId: number): boolean {
    // Check if nodes exist
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return false;
    }

    // Check if already connected
    if (this.isConnected(sourceId, targetId)) {
      return false;
    }

    // Add connection to both nodes
    const sourceNode = this.nodes.get(sourceId)!;
    const targetNode = this.nodes.get(targetId)!;
    
    sourceNode.connections.push(targetId);
    targetNode.connections.push(sourceId);

    // Create edge
    this.edges.push({
      source: sourceId,
      target: targetId,
      efficiency: 0.5, // Initial efficiency
      usage: 0
    });

    return true;
  }

  // Check if two nodes are connected
  public isConnected(sourceId: number, targetId: number): boolean {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) {
      return false;
    }

    const sourceNode = this.nodes.get(sourceId)!;
    return sourceNode.connections.includes(targetId);
  }

  // Increase resource at a node
  public addResource(nodeId: number, amount: number): boolean {
    if (!this.nodes.has(nodeId)) {
      return false;
    }

    const node = this.nodes.get(nodeId)!;
    node.resource += amount;
    return true;
  }

  // Get resource at a node
  public getResource(nodeId: number): number {
    if (!this.nodes.has(nodeId)) {
      return 0;
    }

    return this.nodes.get(nodeId)!.resource;
  }

  // Find closest node to a point
  public findClosestNode(x: number, y: number, maxDistance: number = Infinity): number | undefined {
    let closestNode: number | undefined = undefined;
    let minDistance = maxDistance;

    for (const [id, node] of this.nodes.entries()) {
      const distance = Math.hypot(node.x - x, node.y - y);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = id;
      }
    }

    return closestNode;
  }

  // Flow resources through the network
  public flowResources(): void {
    // Make a copy of current resources to calculate flow
    const resourceCopy = new Map<number, number>();
    this.nodes.forEach((node, id) => {
      resourceCopy.set(id, node.resource);
    });

    // Flow resources along each edge
    this.edges.forEach(edge => {
      const sourceNode = this.nodes.get(edge.source)!;
      const targetNode = this.nodes.get(edge.target)!;
      
      // Calculate flow based on resource gradient
      const sourceResource = resourceCopy.get(edge.source)!;
      const targetResource = resourceCopy.get(edge.target)!;
      
      if (sourceResource > targetResource) {
        // Flow from source to target
        const flowAmount = (sourceResource - targetResource) * 0.1 * edge.efficiency;
        sourceNode.resource -= flowAmount;
        targetNode.resource += flowAmount;
        
        // Record usage
        edge.usage += flowAmount;
        if (this.environment) {
          this.environment.recordPathUsage(
            sourceNode.x, sourceNode.y, 
            targetNode.x, targetNode.y, 
            flowAmount
          );
        }
      } else if (targetResource > sourceResource) {
        // Flow from target to source
        const flowAmount = (targetResource - sourceResource) * 0.1 * edge.efficiency;
        targetNode.resource -= flowAmount;
        sourceNode.resource += flowAmount;
        
        // Record usage
        edge.usage += flowAmount;
        if (this.environment) {
          this.environment.recordPathUsage(
            targetNode.x, targetNode.y, 
            sourceNode.x, sourceNode.y, 
            flowAmount
          );
        }
      }
    });

    // Update edge efficiency based on usage
    this.edges.forEach(edge => {
      // Mature edges with high usage
      if (edge.usage > 0) {
        edge.efficiency = Math.min(1.0, edge.efficiency + edge.usage * 0.001);
      }
    });
  }

  // Get node count
  public getNodeCount(): number {
    return this.nodes.size;
  }

  // Get edge count
  public getEdgeCount(): number {
    return this.edges.length;
  }

  // Get total resources in the network
  public getTotalResources(): number {
    let total = 0;
    this.nodes.forEach(node => {
      total += node.resource;
    });
    return total;
  }

  // Get node by ID
  public getNode(nodeId: number): Node | undefined {
    return this.nodes.get(nodeId);
  }

  // Get all nodes
  public getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  // Get all edges
  public getAllEdges(): Edge[] {
    return this.edges;
  }
  
  // Reset the network by clearing all nodes, connections, and edges
  public resetNetwork(): void {
    this.nodes.clear();
    this.edges = [];
    this.nextNodeId = 0;
  }
}