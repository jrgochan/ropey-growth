import { describe, it, expect, beforeEach } from "vitest";
import { MycelialNetwork } from "../../src/mycelialNetwork";

// Fix for the missing RESOURCE_FLOW_RATE constant in mycelialNetwork.ts
// Update the import in the file later
import { config } from "../../src/constants";
const RESOURCE_FLOW_RATE = config.RESOURCE_FLOW_RATE;

describe("MycelialNetwork", () => {
  let network: MycelialNetwork;

  beforeEach(() => {
    network = new MycelialNetwork();
  });

  it("should create a 2D node with the correct properties (backward compatibility)", () => {
    const x = 100;
    const y = 200;
    const resource = 500;

    const nodeId = network.createNode(x, y, resource);

    expect(nodeId).toBe(0); // First node should have ID 0
    expect(network.getResource(nodeId)).toBe(resource);
  });
  
  it("should create a 3D node with the correct properties", () => {
    const x = 100;
    const y = 200;
    const z = 50;
    const resource = 500;

    const nodeId = network.createNode(x, y, z, resource);

    expect(nodeId).toBe(0); // First node should have ID 0
    expect(network.getResource(nodeId)).toBe(resource);
  });

  it("should create multiple 3D nodes with incremental IDs", () => {
    const node1 = network.createNode(100, 100, 10, 500);
    const node2 = network.createNode(200, 200, 20, 500);
    const node3 = network.createNode(300, 300, 30, 500);

    expect(node1).toBe(0);
    expect(node2).toBe(1);
    expect(node3).toBe(2);
  });

  it("should connect 3D nodes correctly", () => {
    const node1 = network.createNode(100, 100, 10, 500);
    const node2 = network.createNode(200, 200, 20, 500);

    network.connectNodes(node1, node2);

    // We can indirectly test if nodes are connected by flowing resources between them
    // Initially both nodes have the same resource, so no flow should occur
    network.flowResources();

    expect(network.getResource(node1)).toBe(500);
    expect(network.getResource(node2)).toBe(500);
  });

  it("should flow resources from higher resource nodes to lower resource nodes in 3D", () => {
    const node1 = network.createNode(100, 100, 10, 1000);
    const node2 = network.createNode(200, 200, 20, 500);

    network.connectNodes(node1, node2);
    network.flowResources();

    // After flow, node1 should have less and node2 should have more
    expect(network.getResource(node1)).toBeLessThan(1000);
    expect(network.getResource(node2)).toBeGreaterThan(500);
  });

  it("should not flow resources if the difference is below threshold in 3D", () => {
    const node1 = network.createNode(100, 100, 10, 505);
    const node2 = network.createNode(200, 200, 20, 500);

    network.connectNodes(node1, node2);
    network.flowResources();

    // Difference is only 5, which is below the 10 threshold mentioned in the code
    expect(network.getResource(node1)).toBe(505);
    expect(network.getResource(node2)).toBe(500);
  });

  it("should reset the network correctly", () => {
    network.createNode(100, 100, 10, 500);
    network.createNode(200, 200, 20, 500);

    network.resetNetwork();

    // After reset, creating a new node should start with ID 0 again
    const newNodeId = network.createNode(300, 300, 30, 500);
    expect(newNodeId).toBe(0);
  });

  it("should handle resource flowing correctly in a complex 3D network", () => {
    // Create a network with a central node connected to multiple peripheral nodes
    const centerNode = network.createNode(100, 100, 10, 1000);

    const node1 = network.createNode(200, 200, 20, 300);
    const node2 = network.createNode(0, 200, 30, 200);
    const node3 = network.createNode(200, 0, 40, 100);

    network.connectNodes(centerNode, node1);
    network.connectNodes(centerNode, node2);
    network.connectNodes(centerNode, node3);

    // Flow resources multiple times to see the effect
    for (let i = 0; i < 5; i++) {
      network.flowResources();
    }

    // After multiple flows, resources should be more evenly distributed
    expect(network.getResource(centerNode)).toBeLessThan(1000);
    expect(network.getResource(node1)).toBeGreaterThan(300);
    expect(network.getResource(node2)).toBeGreaterThan(200);
    expect(network.getResource(node3)).toBeGreaterThan(100);
  });
  
  it("should handle a mixed 2D and 3D network", () => {
    // Create a network with both 2D and 3D nodes
    const node2D1 = network.createNode(100, 100, 500); // 2D node (z=0 by default)
    const node2D2 = network.createNode(200, 200, 300); // 2D node (z=0 by default)
    const node3D1 = network.createNode(150, 150, 50, 700); // 3D node with explicit z
    
    // Connect the nodes
    network.connectNodes(node2D1, node3D1);
    network.connectNodes(node3D1, node2D2);
    
    // Flow resources
    network.flowResources();
    
    // Check that resources flow correctly regardless of 2D or 3D
    expect(network.getResource(node2D1)).toBeLessThan(500);
    expect(network.getResource(node3D1)).toBeLessThan(700);
    expect(network.getResource(node2D2)).toBeGreaterThan(300);
  });
});
