import { Injectable } from '@angular/core';
import { CustomElement } from '../classes/Datastructure/InductiveGraph/Elements/element';
import { EventLog } from '../classes/Datastructure/event-log/event-log';
import { Trace } from '../classes/Datastructure/event-log/trace';
import { TraceEvent } from '../classes/Datastructure/event-log/trace-event';
import { InductivePetriNet } from '../classes/Datastructure/InductiveGraph/inductivePetriNet';
import { transition } from '@angular/animations';
import { DFGElement } from '../classes/Datastructure/InductiveGraph/Elements/DFGElement';

@Injectable({
    providedIn: 'root'
})
export class SvgService {
    //Delete when layout done
    offset = 0;

    //erstelle Gruppen von SVG Elementen für EventLogs
    public createSVGforEventLog(eventLog: EventLog): SVGGElement {
        const result: Array<SVGElement> = [];
        const uniqueEvents = new Set<TraceEvent>();
        const addedConceptNames = new Set<string>(); // To track unique concept names
        const edges = new Set<string>(); // To track unique edges as a string representation
        const svgElementsMap: { [key: string]: SVGElement } = {}; // Map to hold SVG elements by concept name
        const group = this.createSvgElement('g') as SVGGElement;


        // Add a rectangle as background/container
        const rectangle = this.createSvgElement('rect');
        rectangle.setAttribute('x', '0');
        rectangle.setAttribute('y', '0');
        rectangle.setAttribute('fill', 'lightblue'); // Example background color
        group.appendChild(rectangle);

        //Extract events and connections between those
        eventLog.traces.forEach(trace => {
            const events = trace.events;

            // Iterate through each event in the trace
            events.forEach((event, index) => {
                // Add the current event to the set of unique events
                if (!addedConceptNames.has(event.conceptName)) {
                    addedConceptNames.add(event.conceptName); // Mark this conceptName as added
                    uniqueEvents.add(event); // Store the TraceEvent itself
                }
                if (index == 0) {
                    const edgeKey = `playNodeInDFG->${event.conceptName}`; // Create a unique key for the edge

                    // Check if the edge has already been added
                    if (!edges.has(edgeKey)) {
                        edges.add(edgeKey); // Add the edge key to the set
                    }
                }
                // Create edges if there is a next event
                if (index < events.length - 1) {
                    const nextEvent = events[index + 1];
                    const edgeKey = `${event.conceptName}->${nextEvent.conceptName}`; // Create a unique key for the edge

                    // Check if the edge has already been added
                    if (!edges.has(edgeKey) && event.conceptName !== nextEvent.conceptName) {
                        edges.add(edgeKey); // Add the edge key to the set
                    }
                } else { //Index == events.length - 1 == highest index in array
                    const edgeKey = `${event.conceptName}->stopNodeInDFG`; // Create a unique key for the edge

                    // Check if the edge has already been added
                    if (!edges.has(edgeKey)) {
                        edges.add(edgeKey); // Add the edge key to the set
                    }
                }
            });
        });

        // Convert the unique events set to an array if needed
        const uniqueEventsArray = Array.from(uniqueEvents);

        // Convert edges set to an array of objects with from and to properties
        const edgesArray = Array.from(edges).map(edge => {
            const [from, to] = edge.split('->');
            return { from, to };
        });

        // Example output for debugging
        console.log('Unique Events:', uniqueEventsArray);
        console.log('Edges:', edgesArray);

        // Create SVG elements for each unique event and map them
        uniqueEvents.forEach(el => {
            const newElem = new DFGElement(el);
            const svgElement = this.createSvgForEvent(newElem); // Create SVG for each event
            group.appendChild(svgElement);
            svgElementsMap[el.conceptName] = svgElement; // Store the SVG element in the map
        });

        const svgStart = this.createStartSVG();
        group.appendChild(svgStart);
        svgElementsMap['playNodeInDFG'] = svgStart;
        const svgEnd = this.createEndSVG();
        group.appendChild(svgEnd);
        svgElementsMap['stopNodeInDFG'] = svgEnd;
        uniqueEventsArray.push(new TraceEvent('playNodeInDFG'));
        uniqueEventsArray.push(new TraceEvent('stopNodeInDFG'));

        console.log('Number of unique events:', uniqueEvents.size);

        const positions = this.applySpringEmbedderLayout(uniqueEventsArray, edgesArray);
        console.log("positions: ", positions);

        //group.setAttribute('transform', 'translate(200, 100)');
        // Update rectangle dimensions to encompass the layout
        const minX = Math.min(...Object.values(positions).map(pos => pos.x));
        const minY = Math.min(...Object.values(positions).map(pos => pos.y));
        const maxX = Math.max(...Object.values(positions).map(pos => pos.x));
        const maxY = Math.max(...Object.values(positions).map(pos => pos.y));

        rectangle.setAttribute('width', (maxX - minX + 100).toString()); // Add padding
        rectangle.setAttribute('height', (maxY - minY + 100).toString());

        // Apply the computed positions to the SVG elements
        Object.entries(positions).forEach(([conceptName, pos]) => {
            const svgElement = svgElementsMap[conceptName];
            if (svgElement) {
                svgElement.setAttribute('cx', (pos.x - minX + 50).toString());
                svgElement.setAttribute('cy', (pos.y - minY + 50).toString());
            }
        });


        // Draw edges based on edgesArray
        edgesArray.forEach(e => {
            const { from, to } = e;
            const fromElement = svgElementsMap[from]; // Get the corresponding SVG element for the "from" event
            const toElement = svgElementsMap[to]; // Get the corresponding SVG element for the "to" event

            if (fromElement && toElement) {
                const edgeSvg = this.createSvgForEdge(fromElement, toElement);
                group.appendChild(edgeSvg); // Append the edge to the result
            }
        });

        return group;
    }

    private applySpringEmbedderLayout(nodes: Array<TraceEvent>, edges: Array<{ from: string; to: string }>) {
        const positions: { [key: string]: { x: number; y: number } } = {};
        const width = 1000; // Canvas width
        const height = 800; // Canvas height
        const maxIterations = 300; // Number of iterations for the layout
        const k = 100; // Ideal edge length
        const repulsiveForce = 6000; // Force constant for repulsion
        const step = 0.3; // Step size for position updates

        // Initialize positions randomly within the canvas bounds
        nodes.forEach(node => {
            positions[node.conceptName] = {
                x: Math.random() * width,
                y: Math.random() * height,
            };
        });

        // Function to compute repulsive force between two nodes
        const computeRepulsiveForce = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
            const dx = pos1.x - pos2.x;
            const dy = pos1.y - pos2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
            const force = repulsiveForce / (dist * dist);
            return { fx: force * (dx / dist), fy: force * (dy / dist) };
        };

        // Function to compute attractive force along an edge
        const computeAttractiveForce = (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => {
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
            const force = (dist - k) / k;
            return { fx: force * (dx / dist), fy: force * (dy / dist) };
        };

        // Iteratively apply forces
        for (let i = 0; i < maxIterations; i++) {
            const forces: { [key: string]: { fx: number; fy: number } } = {};

            // Initialize forces to zeroS
            nodes.forEach(node => {
                forces[node.conceptName] = { fx: 0, fy: 0 };
            });

            // Compute repulsive forces
            for (let j = 0; j < nodes.length; j++) {
                for (let k = j + 1; k < nodes.length; k++) {
                    const nodeA = nodes[j];
                    const nodeB = nodes[k];
                    const force = computeRepulsiveForce(positions[nodeA.conceptName], positions[nodeB.conceptName]);
                    forces[nodeA.conceptName].fx += force.fx;
                    forces[nodeA.conceptName].fy += force.fy;
                    forces[nodeB.conceptName].fx -= force.fx;
                    forces[nodeB.conceptName].fy -= force.fy;
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
                const pos = positions[node.conceptName];
                const force = forces[node.conceptName];
                pos.x += force.fx * step;
                pos.y += force.fy * step;

                // Keep positions within bounds
                pos.x = Math.max(0, Math.min(width, pos.x));
                pos.y = Math.max(0, Math.min(height, pos.y));
            });
        }

        return positions;
    }

    private createSvgForEvent(element: DFGElement): SVGElement {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', element.id);
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('fill', 'black');

        element.registerSvg(svg);
        return svg;
    }

    private createStartSVG(): SVGElement {
        const svg = this.createSvgElement('circle');
        const currX = 50 + this.offset
        svg.setAttribute('id', 'play');
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('fill', 'green');
        return svg;
    }

    private createEndSVG(): SVGElement {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', 'stop');
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('fill', 'red');
        return svg;
    }

    private createSvgForEdge(from: SVGElement, to: SVGElement): SVGElement {

        const svg = this.createSvgElement('line');
        // Retrieve the x and y coordinates from the circle elements
        const fromX = parseFloat(from.getAttribute('cx') || '0');
        const fromY = parseFloat(from.getAttribute('cy') || '0');

        const toX = parseFloat(to.getAttribute('cx') || '0');
        const toY = parseFloat(to.getAttribute('cy') || '0');

        console.log('Creating edge from', from.id, 'to', to.id, 'with coordinates:', fromX, fromY, toX, toY);

        // Set line attributes using the coordinates
        svg.setAttribute('x1', fromX.toString());
        svg.setAttribute('y1', fromY.toString());
        svg.setAttribute('x2', toX.toString());
        svg.setAttribute('y2', toY.toString());
        svg.setAttribute('stroke', 'black');       // Line color
        svg.setAttribute('stroke-width', '2');     // Line thickness
        return svg;
    }

    private createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

}


