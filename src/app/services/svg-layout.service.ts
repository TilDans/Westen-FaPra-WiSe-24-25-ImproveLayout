import { Injectable } from "@angular/core";
import { Layout } from "../classes/Datastructure/enums";

 
@Injectable({
     providedIn: 'root'
})

export class SvgLayoutService {
    private _chosenLayout: Layout = Layout.SpringEmbedder;

    public setLayout(layout: Layout) {
        this._chosenLayout = layout;
    }

    public getLayout() {
        return this._chosenLayout;
    }

    public applyLayout(nodes: Array<string>, edges: Array<{ from: string; to: string }>) {
        switch (this._chosenLayout) {
            case Layout.SpringEmbedder:
                return this.springEmbedder(nodes, edges);
            case Layout.Sugiyama:
                return this.Sugiyama(nodes, edges);
            default:
                throw new Error(`Falscher Wert für Layout: ${this._chosenLayout}`);
        }
    }

    private Sugiyama(
        nodes: string[], 
        edges: { from: string; to: string; }[]
    ): { [key: string]: { x: number; y: number; } } {
        const nodeIds = nodes;
        const nodeIdsWithIncomingEdges = new Set(edges.map((edge) => edge.to));
        const startNodeIds = nodeIds.filter(
            (nodeId) => !nodeIdsWithIncomingEdges.has(nodeId)
        );
        const columns = [
            nodes.filter((node) => startNodeIds.includes(node)),
        ];
        // Generate columns of nodes
        while (columns.flat().length < nodes.length) {
            const previousColumn = columns[columns.length - 1];
            
            let edgesWithStartElem = edges.filter((edge) => previousColumn.includes(edge.from))
            const nextColumnNodeIds = new Set(
                edgesWithStartElem.map((edge) => edge.to)
            );
            
            const nextColumn = nodes.filter((node) =>
                nextColumnNodeIds.has(node) && 
                columns.flat().indexOf(node) === -1
            );
    
            columns.push(nextColumn);
        }

        // Optimize node ordering within layers to reduce edge crossings
        let improved = true;
        const maxRuns = 5;
        let currRuns = 0;
        while (improved && (currRuns < maxRuns)) {
            improved = false;
    
            for (let i = 0; i < columns.length - 1; i++) {
                const column = columns[i];
                const nextColumn = columns[i + 1];
    
                const newOrder = [...nextColumn].sort((nodeA, nodeB) => {
                    const nodeAParents = edges
                        .filter((edge) => edge.to === nodeA)
                        .map((edge) => edge.from);
                    const nodeBParents = edges
                        .filter((edge) => edge.to === nodeB)
                        .map((edge) => edge.from);
    
                    const nodeAOrder = nodeAParents.map((parentId) =>
                        column.findIndex((node) => node === parentId)
                    );
                    const nodeBOrder = nodeBParents.map((parentId) =>
                        column.findIndex((node) => node === parentId)
                    );
    
                    const nodeAAvg = nodeAOrder.reduce((acc, val) => acc + val, 0) / nodeAOrder.length;
                    const nodeBAvg = nodeBOrder.reduce((acc, val) => acc + val, 0) / nodeBOrder.length;
    
                    return nodeAAvg - nodeBAvg;
                });
    
                if (JSON.stringify(newOrder) !== JSON.stringify(nextColumn)) {
                    improved = true;
                    columns[i + 1] = newOrder;
                }
            }
            currRuns++;
        }

        // Assign coordinates to nodes
        const nodePositions: { [key: string]: { x: number; y: number; } } = {};
        const columnSpacing = 75; // Horizontal spacing between columns
        const rowSpacing = 100;    // Vertical spacing between nodes in the same column
    
        columns.forEach((column, columnIndex) => {
            column.forEach((node, rowIndex) => {
                nodePositions[node] = {
                    x: rowIndex * columnSpacing,
                    y: columnIndex * rowSpacing
                };
            });
        });
        return nodePositions;
    }
    

    private springEmbedder(nodes: string[], edges: { from: string; to: string; }[]) {
        const positions: { [key: string]: { x: number; y: number; }; } = {};
        const width = 500; // Canvas width
        const height = 600; // Canvas height
        const maxIterations = 300; // Number of iterations for the layout
        const k = 100; // Ideal edge length
        const repulsiveForce = 1500; // Force constant for repulsion
        const step = 1; // Step size for position updates


        // Initialize positions randomly within the canvas bounds
        nodes.forEach(node => {
            positions[node] = {
                x: Math.random() * width,
                y: Math.random() * height,
            };
        });

        // Function to compute repulsive force between two nodes
        function computeRepulsiveForce (pos1: { x: number; y: number; }, pos2: { x: number; y: number; }) {
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
            const force = repulsiveForce / (dist * dist);
            return { fx: force * (dx / dist), fy: force * (dy / dist) };
        };

        // Function to compute attractive force along an edge
        function computeAttractiveForce (pos1: { x: number; y: number; }, pos2: { x: number; y: number; }) {
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
            const force = (dist - k) / k;
            return { fx: force * (dx / dist), fy: force * (dy / dist) };
        };

        // Iteratively apply forces
        for (let i = 0; i < maxIterations; i++) {
            const forces: { [key: string]: { fx: number; fy: number; }; } = {};

            // Initialize forces to zero
            nodes.forEach(node => {
                forces[node] = { fx: 0, fy: 0 };
            });

            // Compute repulsive forces
            for (let j = 0; j < nodes.length; j++) {
                for (let k = j + 1; k < nodes.length; k++) {
                    const nodeA = nodes[j];
                    const nodeB = nodes[k];
                    const force = computeRepulsiveForce(positions[nodeA], positions[nodeB]);
                    forces[nodeA].fx += force.fx;
                    forces[nodeA].fy += force.fy;
                    forces[nodeB].fx -= force.fx;
                    forces[nodeB].fy -= force.fy;
                }
            }

            // Compute attractive forces
            edges.forEach(edge => {
                const force = computeAttractiveForce(positions[edge.from], positions[edge.to]);
                forces[edge.from].fx += force.fx;
                forces[edge.from].fy += force.fy;
                forces[edge.to].fx -= force.fx;
                forces[edge.to].fy -= force.fy;
            });

            // Update positions based on forces
            nodes.forEach(node => {
                const pos = positions[node];
                const force = forces[node];
                pos.x += force.fx * step;
                pos.y += force.fy * step;

                // Keep positions within bounds
                pos.x = Math.max(0, Math.min(width, pos.x));
                pos.y = Math.max(0, Math.min(height, pos.y));
            });

            // Pull "play" nodes to the top and "stop" nodes to the bottom
            nodes.forEach(node => {
                if (node === "playNodeInDFG") {
                    positions[node].y = Math.min(positions[node].y, height * 0.2); // Pull to top 10% of the canvas
                } else if (node === "stopNodeInDFG") {
                    positions[node].y = Math.max(positions[node].y, height * 0.8); // Pull to bottom 10% of the canvas
                }
            });
        }
        return positions;
    }
}