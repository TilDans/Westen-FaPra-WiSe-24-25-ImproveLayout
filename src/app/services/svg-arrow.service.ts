import {Injectable} from '@angular/core';
import {IntersectionCalculatorService} from "./intersection-calculator.service";

@Injectable({
    providedIn: 'root'
})
export class SvgArrowService {

    constructor(
        private readonly intersectionCalculatorService: IntersectionCalculatorService
    ) {
    }

    public appendArrowMarker(parent: SVGElement): void {
        const defs = parent.getElementsByTagName('defs')[0] || this.createDefsElement(parent);
        this.createMarker(defs, 'arrow', 'black');
        this.createMarker(defs, 'arrow-selected', 'red');
    }

    private createMarker(defs: SVGElement, id: string, fill: string) {
        const marker = this.createSvgElement('marker');
        marker.setAttribute('id', id);
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9'); // this is the size of the arrow head
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        marker.setAttribute('markerUnits', 'strokeWidth');
        defs.append(marker);

        const path = this.createSvgElement('path');
        path.setAttribute('d', 'M0,0 L0,6 L9,3 z');
        path.setAttribute('fill', fill);
        marker.appendChild(path);
    }

    public calculateIntersection(x1: number, y1: number, x2: number, y2: number, to: SVGElement): {
        x: number,
        y: number
    } {
        if (to instanceof SVGCircleElement) {
            return this.calculateCircleIntersection(x1, y1, x2, y2, to);
        } else if (to instanceof SVGGElement) {
            const {rectX, rectY} = this.getRectPosition(to);
            const rectWidth = parseFloat(to.getAttribute('width') || '0');
            const rectHeight = parseFloat(to.getAttribute('height') || '0');

            const lines = [
                {x1: rectX, y1: rectY, x2: rectX + rectWidth, y2: rectY},
                {x1: rectX + rectWidth, y1: rectY, x2: rectX + rectWidth, y2: rectY + rectHeight},
                {x1: rectX + rectWidth, y1: rectY + rectHeight, x2: rectX, y2: rectY + rectHeight},
                {x1: rectX, y1: rectY + rectHeight, x2: rectX, y2: rectY},
            ]

            for (const line of lines) {
                const intersection = this.intersectionCalculatorService.calculateLineIntersection(x1, y1, x2, y2, line.x1, line.y1, line.x2, line.y2)
                if (intersection) {
                    return intersection
                }
            }
            console.warn('could not find line intersection for rect', to)
        } else {
            console.warn('Unknown element type', to)
        }

        return {x: x2, y: y2}
    }

    private getRectPosition(to: SVGGElement): { rectY: number; rectX: number } {
        const bgRectangle = to.querySelector(".group-background");
        if(bgRectangle) {
            const x = parseFloat(bgRectangle.getAttribute('x') || '0');
            const y = parseFloat(bgRectangle.getAttribute('y') || '0')
            return {
                rectX: x,
                rectY: y
            }
        }

        console.warn('No background rectangle found for group. Position is probably inaccurate', to)

        const rectX = parseFloat(to.getAttribute('cx') || '0');
        const rectY = parseFloat(to.getAttribute('cy') || '0');
        return {rectX, rectY};
    }

    private calculateCircleIntersection(x1: number, y1: number, x2: number, y2: number, to: SVGCircleElement) {
        const cx = parseFloat(to.getAttribute('cx') || '0');
        const cy = parseFloat(to.getAttribute('cy') || '0');
        const r = parseFloat(to.getAttribute('r') || '0');

        const dx = x2 - x1;
        const dy = y2 - y1;

        const len = Math.sqrt(dx * dx + dy * dy);
        const unitDx = dx / len;
        const unitDy = dy / len;

        const intersectionX = cx - unitDx * r;
        const intersectionY = cy - unitDy * r;

        return {x: intersectionX, y: intersectionY};
    }

    private createDefsElement(parent: SVGElement) {
        const defs = this.createSvgElement('defs');
        parent.appendChild(defs);
        return defs
    }

    private createSvgElement(name: string): SVGElement {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
}
