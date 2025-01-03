import { TraceEvent } from "../../event-log/trace-event";
import { CustomElement } from "./element";

export class DFGElement extends CustomElement {
    private _traceEvent?: TraceEvent;

    constructor(traceEvent: TraceEvent) {
        super();
        this.id = traceEvent.conceptName;
        this._traceEvent = traceEvent;
    }

    get traceEvent(): TraceEvent {
        if (this._traceEvent) {
            return this._traceEvent;
        } else throw Error("no trace event");
    }

    set traceEvent(event: TraceEvent) {
        this._traceEvent = event;
    }

    public override registerSvg(svg: SVGElement) {
        this._svgElement = svg;
        this._svgElement.onmousedown = (event) => {
            this.processMouseDown(event);
        };
        this._svgElement.onmouseup = (event) => {
            this.processMouseUp(event);
        };
    }

    private processMouseDown(event: MouseEvent) {
        if (this._svgElement === undefined) {
            return;
        }
        this._svgElement.setAttribute('fill', 'red');
    }

    private processMouseUp(event: MouseEvent) {
        if (this._svgElement === undefined) {
            return;
        }
        this._svgElement.setAttribute('fill', 'black');
    }
    
    public override getCenterXY(): { x: number; y: number; } {
        let centerX = (this.x + this.getWidth()) / 2
        let centerY = (this.y + this.getHeight()) / 2
        return {x: centerX, y: centerY};
    }
}