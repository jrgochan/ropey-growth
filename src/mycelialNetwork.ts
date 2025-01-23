/***************************************************
 * mycelialNetwork.ts
 *
 * A graph representing the mycelial network:
 * - Nodes = hyphal junctions (positions)
 * - Edges = hyphal segments
 * 
 * We track resource each node has. Edges allow 
 * resource flow. 
 ***************************************************/

import { RESOURCE_FLOW_RATE, INITIAL_RESOURCE_PER_TIP } from "./constants.js";

export interface NetworkNode {
  id: number;
  x: number;
  y: number;
  resource: number;     // how much nutrient resource is stored here
  neighbors: number[];  // IDs of connected nodes
}

export interface NetworkEdge {
  a: number; // nodeId
  b: number; // nodeId
}

let nodeCounter = 0;

export class MycelialNetwork {
  private nodes: Map<number, NetworkNode>;
  private edges: NetworkEdge[];

  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  /**
   * Creates a new node in the network, returns its ID.
   */
  public createNode(x: number, y: number, resource: number = INITIAL_RESOURCE_PER_TIP): number {
    const node: NetworkNode = {
      id: nodeCounter++,
      x, y,
      resource,
      neighbors: []
    };
    this.nodes.set(node.id, node);
    return node.id;
  }

  /**
   * Connects two nodes with an edge (bidirectional).
   */
  public connectNodes(idA: number, idB: number) {
    if (idA === idB) return;
    const nodeA = this.nodes.get(idA);
    const nodeB = this.nodes.get(idB);
    if (!nodeA || !nodeB) return;

    // Avoid duplicate edges
    if (!nodeA.neighbors.includes(idB)) {
      nodeA.neighbors.push(idB);
    }
    if (!nodeB.neighbors.includes(idA)) {
      nodeB.neighbors.push(idA);
    }
    this.edges.push({ a: idA, b: idB });
  }

  /**
   * Returns the node by ID
   */
  public getNode(id: number): NetworkNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Resource distribution:
   * Each edge tries to equalize resource between the nodes,
   * limited by RESOURCE_FLOW_RATE.
   */
  public flowResources() {
    // We can do multiple passes if we want more thorough flow.
    for (const edge of this.edges) {
      const nA = this.nodes.get(edge.a);
      const nB = this.nodes.get(edge.b);
      if (!nA || !nB) continue;

      // Attempt partial equalization
      const avg = (nA.resource + nB.resource) / 2;
      // Move resource from each node towards the avg
      // limited by RESOURCE_FLOW_RATE
      const deltaA = (avg - nA.resource) * RESOURCE_FLOW_RATE;
      const deltaB = (avg - nB.resource) * RESOURCE_FLOW_RATE;

      nA.resource += deltaA;
      nB.resource += deltaB;
    }
  }
}
