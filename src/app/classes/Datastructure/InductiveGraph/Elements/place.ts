import { CustomElement } from "./element";

export class Place extends CustomElement {
    constructor(name: string) {
        super();
        this.id = name;
    }

    public override getCenterXY(): { x: number; y: number; } {
        return {x: this.x, y: this.y};
    }
}