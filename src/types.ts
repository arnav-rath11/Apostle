export interface Node {
  id: string;
}

export interface Edge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

export interface PathStep {
  title: string;
  timestamp: number;
}
