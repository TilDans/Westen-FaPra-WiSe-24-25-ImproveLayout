export class DFGEdge {
    start: Element;
    end: Element;
    private _svgElement: SVGElement | undefined;

    constructor(start: Element, end: Element) {
        this.start = start;
        this.end = end;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }
}
