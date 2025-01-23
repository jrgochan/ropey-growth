/***************************************************
 * mycelialNetwork.ts
 *
 * A graph for hypha nodes, storing resources
 * and edges for resource flow.
 ***************************************************/

import { RESOURCE_FLOW_RATE, INITIAL_RESOURCE_PER_TIP } from "./constants.js";

export interface NetworkNode {
  id: number;
  x: number;
  y: number;
  resource: number;
  neighbors: number[];
}

export interface NetworkEdge {
  a: number;
  b: number;
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
   * Creates a new node at the specified (x, y) position.
   * @param x - X-coordinate in pixels.
   * @param y - Y-coordinate in pixels.
   * @param resource - Initial resource value.
   * @returns The ID of the newly created node.
   */
  public createNode(x: number, y: number, resource = INITIAL_RESOURCE_PER_TIP): number {
    const nodeId = nodeCounter++;
    this.nodes.set(nodeId, {
      id: nodeId,
      x,
      y,
      resource,
      neighbors: []
    });
    return nodeId;
  }

  /**
   * Connects two nodes by their IDs, ensuring no duplicate connections.
   * @param a - ID of the first node.
   * @param b - ID of the second node.
   */
  public connectNodes(a: number, b: number) {
    if (a === b) return;
    const nodeA = this.nodes.get(a);
    const nodeB = this.nodes.get(b);
    if (!nodeA || !nodeB) return;

    if (!nodeA.neighbors.includes(b)) nodeA.neighbors.push(b);
    if (!nodeB.neighbors.includes(a)) nodeB.neighbors.push(a);
    this.edges.push({ a, b });
  }

  /**
   * Retrieves a node by its ID.
   * @param id - ID of the node.
   * @returns The NetworkNode object or undefined if not found.
   */
  public getNode(id: number): NetworkNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Retrieves all nodes in the network.
   * @returns An array of NetworkNode objects.
   */
  public getAllNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Simulates resource flow between connected nodes.
   */
  public flowResources() {
    for (const edge of this.edges) {
      const nA = this.nodes.get(edge.a);
      const nB = this.nodes.get(edge.b);
      if (!nA || !nB) continue;

      const avg = (nA.resource + nB.resource) / 2;
      const deltaA = (avg - nA.resource) * RESOURCE_FLOW_RATE;
      const deltaB = (avg - nB.resource) * RESOURCE_FLOW_RATE;
      nA.resource += deltaA;
      nB.resource += deltaB;
    }
  }
}
