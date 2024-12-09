export class CustomElement {
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
        this._x = value;
    }

    get y(): number {
        return this._y;
    }

    set y(value: number) {
        this._y = value;
    }

    public registerSvg(svg: SVGElement) {
        this._svgElement = svg;
    }

    public getSvg() {
        return this._svgElement
    }
}
