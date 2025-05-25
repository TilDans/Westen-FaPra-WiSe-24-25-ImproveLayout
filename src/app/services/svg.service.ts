import {Injectable} from '@angular/core';
import {EventLog} from '../classes/Datastructure/event-log/event-log';
import {TraceEvent} from '../classes/Datastructure/event-log/trace-event';
import {DFGElement} from '../classes/Datastructure/InductiveGraph/Elements/DFGElement';
import {Place} from '../classes/Datastructure/InductiveGraph/Elements/place';
import {Edge} from '../classes/Datastructure/InductiveGraph/edgeElement';
import {SvgArrowService} from "./svg-arrow.service";
import { SvgLayoutService } from './svg-layout.service';
import { Transition } from '../classes/Datastructure/InductiveGraph/Elements/transition';
import { Layout, RecursiveType } from '../classes/Datastructure/enums';

@Injectable({
    providedIn: 'root'
})

export class SvgService {
    static placeRadius = 20;


    constructor(private readonly svgArrowService: SvgArrowService,
                private readonly svgLayoutService: SvgLayoutService
    ) {
    }

    applyNewDFGLayout(layout: Layout) {
        this.svgLayoutService.setLayout(layout);
    }

    public createSVGforRecursiveNode(id: number, type?: RecursiveType): SVGGElement {
        const group = this.createSvgElement('g') as SVGGElement;
        group.setAttribute('id', id.toString());
        group.classList.add('recursiveNode');
    
        // Add a rectangle as background/container
        const rectangle = this.createSvgElement('rect');
        rectangle.setAttribute('cx', '0');
        rectangle.setAttribute('cy', '0');
        if (type) {
            rectangle.classList.add(type.toString() + "-background");
            rectangle.classList.add("GraphElem-background");
        }
        group.append(rectangle);
    
        // Add label text in top-left corner
        if (type) {
            const label = this.createSvgElement('text');
            const fontSize = 30;
            let labeltext: string;
            switch (type) {
                case RecursiveType.ActivityOncePerTrace:
                    labeltext = type.toString() + " Fallthrough";
                    break;
                case RecursiveType.Flower:
                    labeltext = type.toString() + " Fallthrough";
                    break;
                case RecursiveType.Exclusive:
                    labeltext = type.toString() + " Cut";
                    break;
                case RecursiveType.Loop:
                    labeltext = type.toString() + " Cut";
                    break;
                case RecursiveType.Parallel:
                    labeltext = type.toString() + " Cut";
                    break;
                case RecursiveType.Sequence:
                    labeltext = type.toString() + " Cut";
                    break;
            }
            label.textContent = labeltext;
            label.setAttribute('x', '5'); // padding from left
            label.setAttribute('y', '18'); // vertically within top 30 units
            label.setAttribute('font-size', fontSize.toString());
            label.setAttribute('font-weight', 'bold'); // make text bold
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('text-anchor', 'start');
            label.classList.add('recursiveNode-label'); // optional class for styling
            const width = this.calcWidthOfText(labeltext, fontSize);
            group.setAttribute('minwidth', width.toString())
            group.append(label);
        }
    
        return group;
    }
    

    createSVGForPlace(placeToGen: Place) {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', placeToGen.id);
        svg.setAttribute('r', SvgService.placeRadius.toString());
        svg.setAttribute('class', 'place');
        placeToGen.registerSvg(svg);
    }

    createSVGForTransition(transToGen: Transition) {
        const MINHEIGHT = 50;
        const MINWIDTH = 100;
        const fontSize = 16;

        const labelForTrans = transToGen.event;

        // Create the SVG rectangle
        const svg = this.createSvgElement('rect');
        svg.setAttribute('id', labelForTrans);
        svg.setAttribute('class', 'transitionStyle');

        // Create a temporary SVG text element to measure the label width
        const labelWidth = this.calcWidthOfText(labelForTrans, fontSize);

        // Calculate the rectangle dimensions
        const rectWidth = Math.max(labelWidth + 10, MINWIDTH); // Add padding and ensure min width of 50

        svg.setAttribute('width', rectWidth.toString());
        svg.setAttribute('height', MINHEIGHT.toString());

        // Create the SVG text element for the label
        const text = this.createSvgElement('text');
        text.textContent = labelForTrans;
        text.setAttribute('x', (rectWidth / 2).toString()); // Horizontal position
        text.setAttribute('y', (MINHEIGHT / 2).toString()); // Vertical position
        text.setAttribute('dominant-baseline', 'middle'); // Vertical alignment
        text.setAttribute('text-anchor', 'middle'); // Horizontal alignment
        text.setAttribute('font-size', fontSize.toString()); // Adjust font size if needed
        text.setAttribute('class', 'non-selectable'); // Add a class for non-selectable styles

        // Group the rectangle and the text together
        const group = this.createSvgElement('g');
        group.appendChild(svg);
        group.appendChild(text);
        group.setAttribute('width', rectWidth.toString());
        group.setAttribute('height', MINHEIGHT.toString());
        group.setAttribute('id', labelForTrans);
        group.classList.add('transition');

        // Register the group as the SVG element for the transition
        transToGen.registerSvg(group);
    }

    private calcWidthOfText(label: string, fontSize: number) {
        const tempText = this.createSvgElement('text') as SVGGraphicsElement;
        tempText.textContent = label;
        tempText.setAttribute('font-size', fontSize.toString()); // Adjust font size if needed

        // Append the text to the SVG temporarily to measure its width
        const tempSvg = this.createSvgElement('svg');
        tempSvg.appendChild(tempText);
        document.body.appendChild(tempSvg);
        const labelWidth = tempText.getBBox().width;
        document.body.removeChild(tempSvg);
        return labelWidth;
    }

    public createSVGForArc(edge: Edge) {
        const from = edge.start.getSvg()!;
        const to = edge.end.getSvg()!;
        const svg = this.createSvgForEdge(from, to);
        //svg an Kante hinterlegen
        edge.registerSvg(svg);
    }

    //erstelle Gruppen von SVG Elementen für EventLogs
    public createSVGforEventLog(eventLog: EventLog, id: string) : SVGGElement {
        const uniqueEvents = new Set<TraceEvent>();
        const addedConceptNames = new Set<string>(); // To track unique concept names
        const edges = new Set<string>(); // To track unique edges as a string representation
        const svgElementsMap: { [key: string]: SVGElement } = {}; // Map to hold SVG elements by concept name
        const group = this.createSvgElement('g') as SVGGElement;
        group.setAttribute('id', id);
        group.classList.add('eventLog');

        // Add a rectangle as background/container
        const rectangle = this.createSvgElement('rect');
        rectangle.setAttribute('cx', '0');
        rectangle.setAttribute('cy', '0');
        rectangle.classList.add('group-background')
        group.append(rectangle);

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
        const uniqueEventsArray = Array.from([...uniqueEvents]);

        // Convert edges set to an array of objects with from and to properties
        const edgesArray = Array.from(edges).map(edge => {
            const [from, to] = edge.split('->');
            return { from, to };
        });

        console.log('Unique Events:', uniqueEventsArray);
        console.log('Edges:', edgesArray);

        // Create SVG elements for each unique event and map them
        uniqueEvents.forEach(el => {
            const newElem = new DFGElement(el);
            const svgElement = this.createSvgForEvent(newElem); // Create SVG for each event
            //group.appendChild(svgElement);
            svgElementsMap[el.conceptName] = svgElement; // Store the SVG element in the map
        });

        //play und stop generieren
        const svgStart = this.createStartSVG();
        //group.appendChild(svgStart);
        svgElementsMap['playNodeInDFG'] = svgStart;
        const svgEnd = this.createEndSVG();
        //group.appendChild(svgEnd);
        svgElementsMap['stopNodeInDFG'] = svgEnd;
        uniqueEventsArray.push(new TraceEvent('playNodeInDFG'));
        uniqueEventsArray.push(new TraceEvent('stopNodeInDFG'));

        const conceptNameArray = uniqueEventsArray.map(event => event.conceptName);
        //const positions = this.applySpringEmbedderLayout(conceptNameArray, edgesArray);
        const positions = this.svgLayoutService.applyLayout(conceptNameArray, edgesArray);

        //group.setAttribute('transform', 'translate(200, 100)');
        // Update rectangle dimensions to encompass the layout
        const minX = Math.min(...Object.values(positions).map(pos => pos.x));
        const minY = Math.min(...Object.values(positions).map(pos => pos.y));
        const maxX = Math.max(...Object.values(positions).map(pos => pos.x));
        const maxY = Math.max(...Object.values(positions).map(pos => pos.y));

        const width = maxX - minX + 100;
        const height = maxY - minY + 100;
        rectangle.setAttribute('width', (width).toString()); // Add padding
        rectangle.setAttribute('height', (height).toString());
        group.setAttribute('width', (width).toString()); // Add padding
        group.setAttribute('height', (height).toString());

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
                group.append(edgeSvg); // Append the edge to the result
            }
        });
        //Append nodes after rectangle and edges to be displayed on top of these elements
        conceptNameArray.forEach(name => {
            group.append(svgElementsMap[name])
        })
        return group;
    }

    private createSvgForEvent(element: DFGElement): SVGElement {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', element.id);
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('class', 'dfgNode');

        element.registerSvg(svg);
        return svg;
    }

    private createStartSVG(): SVGElement {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', 'play');
        svg.setAttribute('class', 'playStop');
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('class', 'dfgPlayNode');
        return svg;
    }

    private createEndSVG(): SVGElement {
        const svg = this.createSvgElement('circle');
        svg.setAttribute('id', 'stop');
        svg.setAttribute('class', 'playStop');
        svg.setAttribute('cx', '0');
        svg.setAttribute('cy', `0`);
        svg.setAttribute('r', '15');
        svg.setAttribute('class', 'dfgStopNode');
        return svg;
    }

    private createSvgForEdge(from: SVGElement, to: SVGElement): SVGElement {
        const svg = this.createSvgElement('line');
        svg.setAttribute('id', from.id + ':' + to.id);
        svg.setAttribute('from', from.id);
        svg.setAttribute('to', to.id);

        // Retrieve the x and y coordinates from the circle elements
        const { x: fromX, y: fromY } = this.calculateStartEndCoordinate(from);
        const { x: toX, y: toY } = this.calculateStartEndCoordinate(to);

        const fromIntersection = this.svgArrowService.calculateIntersection(toX, toY, fromX, fromY, from);
        const toIntersection = this.svgArrowService.calculateIntersection(fromX, fromY, toX, toY, to);
        // Set line attributes using the coordinates
        svg.setAttribute('x1', fromIntersection.x.toString());
        svg.setAttribute('y1', fromIntersection.y.toString());
        svg.setAttribute('x2', toIntersection.x.toString());
        svg.setAttribute('y2', toIntersection.y.toString());
        svg.setAttribute('class', 'edge');
        return svg;
    }

    private calculateStartEndCoordinate(toCalc: SVGElement): {x: number, y: number} {
        var resX = 0;
        var resY = 0;
        if (toCalc.tagName.toLowerCase() === "g") {
            const x = parseFloat(toCalc.getAttribute('cx') || '0');
            const y = parseFloat(toCalc.getAttribute('cy') || '0');
            const hwidth = parseFloat(toCalc.getAttribute('width') || '0') / 2;
            const hheight = parseFloat(toCalc.getAttribute('height') || '0') / 2;
            resX = x + hwidth;
            resY = y + hheight;
        } else {
            resX = parseFloat(toCalc.getAttribute('cx') || '0');
            resY = parseFloat(toCalc.getAttribute('cy') || '0');
        }
        return {x: resX, y: resY};
    }

    private createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    public createDrawnLine(x: number, y: number) {
        const line = this.createSvgElement('line');
        line.setAttribute('x1', x.toString());
        line.setAttribute('y1', y.toString());
        line.setAttribute('x2', x.toString());
        line.setAttribute('y2', y.toString());
        line.setAttribute('class', 'drawn-line');
        return line;
    }


}
