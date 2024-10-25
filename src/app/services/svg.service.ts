import {Injectable} from '@angular/core';
import {Diagram} from '../classes/diagram/diagram';
import {Element} from '../classes/diagram/element';
import { EventLog } from '../classes/event-log/event-log';
import { Trace } from '../classes/event-log/trace';
import { TraceEvent } from '../classes/event-log/trace-event';

@Injectable({
    providedIn: 'root'
})
export class SvgService {
    offset = 0;

    /* public createSvgElements(diagram: Diagram): Array<SVGElement> {
        const result: Array<SVGElement> = [];
        diagram.elements.forEach(el => {
            result.push(this.createSvgForElement(el))
        });
        return result;
    } */
    public createSvgElements(eventLog: EventLog): Array<SVGElement> {
        const result: Array<SVGElement> = [];
        const uniqueEvents = new Set<string>();
        const edges = new Set<string>(); // To track unique edges as a string representation
        const svgElementsMap: { [key: string]: SVGElement } = {}; // Map to hold SVG elements by concept name
    
        eventLog.traces.forEach(trace => {
            const events = trace.events;
    
            // Iterate through each event in the trace
            events.forEach((event, index) => {
                // Add the current event to the set of unique events
                uniqueEvents.add(event.conceptName);
    
                // Create edges if there is a next event
                if (index < events.length - 1) {
                    const nextEvent = events[index + 1];
                    const edgeKey = `${event.conceptName}->${nextEvent.conceptName}`; // Create a unique key for the edge
    
                    // Check if the edge has already been added
                    if (!edges.has(edgeKey) && event.conceptName !== nextEvent.conceptName) {
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
            const newElem = new Element(el);
            const svgElement = this.createSvgForEvent(newElem); // Create SVG for each event
            result.push(svgElement);
            svgElementsMap[el] = svgElement; // Store the SVG element in the map
        });
    
        console.log('Number of unique events:', uniqueEvents.size);
    
        // Draw edges based on edgesArray
        edgesArray.forEach(e => {
            const { from, to } = e;
            const fromElement = svgElementsMap[from]; // Get the corresponding SVG element for the "from" event
            const toElement = svgElementsMap[to]; // Get the corresponding SVG element for the "to" event
    
            if (fromElement && toElement) {
                const edgeSvg = this.createSvgForEdge(fromElement, toElement);
                result.push(edgeSvg); // Append the edge to the result
            }
        });
    
        console.log('Total SVG elements:', result.length);
    
        // TODO here could be the layouter
    
        return result;
    }
        

    private createSvgForEvent(element: Element): SVGElement {
        const svg = this.createSvgElement('circle');
        const currX = 50 + this.offset
        svg.setAttribute('cx', currX.toString());
        svg.setAttribute('cy', `50`);
        svg.setAttribute('r', '15');
        svg.setAttribute('fill', 'black');

        element.registerSvg(svg);
        this.offset += 50;
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
