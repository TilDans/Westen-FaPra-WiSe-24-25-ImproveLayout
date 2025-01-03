import { EventLogDFG } from "./eventLogDFG";

export abstract class CustomElement {
    private _id: string = "";
    private _x: number;
    private _y: number;
    protected _svgElement: SVGElement | undefined;

    constructor() {
        this._x = 0;
        this._y = 0;
    }

    public get id(): string {
        return this._id;
    }
    public set id(value: string) {
        this._id = value;
    }

    get x(): number {
        return this._x;
    }

    set x(value: number) {
        //für Gruppenelementen (EventLogDFGs) ist ein Setzen des X Werts alleine nicht möglich.
        if (!(this instanceof EventLogDFG)){
            this._svgElement!.setAttribute('cx', value.toString());
        }
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        //für Gruppenelementen (EventLogDFGs) ist ein Setzen des Y Werts alleine nicht möglich.
        if (!(this instanceof EventLogDFG)){
            this._svgElement!.setAttribute('cy', value.toString());
        }
        this._y = value;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }

    public getSvg() {
        return this._svgElement
    }

    public getWidth(): number {
        return parseFloat(this._svgElement!.getAttribute('width') || '0');
    }
    public getHeight(): number {
        return parseFloat(this._svgElement!.getAttribute('height') || '0');
    }

    public setXYonSVG(xNew: number, yNew: number) {
        this._svgElement!.setAttribute('cx', xNew.toString());
        this._svgElement!.setAttribute('cy', yNew.toString());
    }

    public abstract getCenterXY(): { x: number, y: number} 

}
