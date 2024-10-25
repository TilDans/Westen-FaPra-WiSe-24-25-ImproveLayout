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

        eventLog.traces.forEach(trace => {
            trace.events.forEach(event => {
                if (!uniqueEvents.has(event.conceptName)) {
                    uniqueEvents.add(event.conceptName)
                }
            })
        });

        uniqueEvents.forEach(el => {
            result.push(this.createSvgForEvent(new Element(el)))
        });
        console.log(uniqueEvents.size)
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

    private createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
}
