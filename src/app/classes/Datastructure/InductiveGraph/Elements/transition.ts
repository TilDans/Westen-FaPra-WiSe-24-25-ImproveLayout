import { CustomElement } from "./element";

export class Transition extends CustomElement {
    
    public override getCenterXY(): { x: number; y: number; } {
        let centerX = (this.x + (this.getWidth() / 2));
        let centerY = (this.y + (this.getHeight() / 2));
        return {x: centerX, y: centerY};
    }
}