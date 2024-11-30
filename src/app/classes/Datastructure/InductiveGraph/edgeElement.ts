import { DFGElement } from "./Elements/DFGElement";

export class DFGEdge {

    start: DFGElement;
    end: DFGElement;

    private _svgElement: SVGElement | undefined;

    constructor(start: DFGElement, end: DFGElement) {
        this.start = start;
        this.end = end;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }
}
