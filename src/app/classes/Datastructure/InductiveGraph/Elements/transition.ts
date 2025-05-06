import { CustomElement } from "./customElement";

export class Transition extends CustomElement {

    private _event: string;
    
    constructor(id:string, name: string) {
        super();
        this.id = id;
        this._event = name;
    }

    override setXYonSVG(xNew: number, yNew: number) {
        this.x = xNew;
        this.y = yNew;

        this._svgElement!.setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')');
        this._svgElement!.setAttribute('cx', xNew.toString());
        this._svgElement!.setAttribute('cy', yNew.toString());
    }
    
    public override getCenterXY(): { x: number; y: number; } {
        let centerX = (this.x + (this.getWidth() / 2));
        let centerY = (this.y + (this.getHeight() / 2));
        return {x: centerX, y: centerY};
    }

    public get event() {
        return this._event;
    }
}