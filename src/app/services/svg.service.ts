import {Injectable} from '@angular/core';
import {Element} from '../classes/Datastructure/InductiveGraph/element';
import { EventLog } from '../classes/Datastructure/event-log/event-log';
import { Trace } from '../classes/Datastructure/event-log/trace';
import { TraceEvent } from '../classes/Datastructure/event-log/trace-event';
import { InductivePetriNet } from '../classes/Datastructure/InductiveGraph/inductivePetriNet';
import { transition } from '@angular/animations';

@Injectable({
    providedIn: 'root'
})
export class SvgService {
    //Delete when layout done
    offset = 0;


    public createSvgElements(petriNet: InductivePetriNet): Array<SVGElement> {
        const result: Array<SVGElement> = [];
        petriNet.eventLogDFGs.forEach(eventLogDFG => {
            result.push(this.createSVGforEventLog(eventLogDFG.eventLog))
        });
        petriNet.transitions.forEach(transition => {

        });
        petriNet.places.forEach(place => {

        });
        /* petriNet.arcs.forEach(transition => {
            
        }); */



        return result;
    }
    
    //erstelle Gruppen von SVG Elementen für EventLogs
    private createSVGforEventLog(eventLog: EventLog) : SVGGElement {
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
        //set at the end instead
        rectangle.setAttribute('width', '1000');
        rectangle.setAttribute('height', '100');
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
            group.appendChild(svgElement);
            svgElementsMap[el.conceptName] = svgElement; // Store the SVG element in the map
        });
    
        console.log('Number of unique events:', uniqueEvents.size);
    
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
    
    
        // TODO here could be the layouter
        //return Array [minX, maxX, minY, maxY]

        //set rectangle width and height
        group.setAttribute('transform', 'translate(200, 100)');

        return group;
    }

    private createSvgForEvent(element: Element): SVGElement {
        const svg = this.createSvgElement('circle');
        const currX = 50 + this.offset
        svg.setAttribute('id', element.id);
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
