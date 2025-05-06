import { CustomElement } from "./Elements/customElement";

export class Edge {

    private _start: CustomElement;
    private _end: CustomElement;

    private _svgElement: SVGElement | undefined;

    constructor(start: CustomElement, end: CustomElement) {
        this._start = start;
        this._end = end;
    }

    public get start(): CustomElement {
        return this._start;
    }
    public set start(value: CustomElement) {
        this._start = value;
    }
    public get end(): CustomElement {
        return this._end;
    }
    public set end(value: CustomElement) {
        this._end = value;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }

    public getSvg() {
        return this._svgElement
    }
}
