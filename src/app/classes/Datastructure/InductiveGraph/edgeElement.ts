import { DFGElement } from "./Elements/DFGElement";
import { CustomElement } from "./Elements/element";

export class Edge {

    start: CustomElement;
    end: CustomElement;

    private _svgElement: SVGElement | undefined;

    constructor(start: CustomElement, end: CustomElement) {
        this.start = start;
        this.end = end;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }

    public getSvg() {
        return this._svgElement
    }
}
