import { SvgService } from "src/app/services/svg.service";
import { EventLog } from "../event-log/event-log";
import { TraceEvent } from "../event-log/trace-event";
import { Edge } from "./edgeElement";
import { CustomElement } from "./Elements/element";


export class EventLogDFG extends CustomElement{
    static logCounter: number = 0;
    eventLog: EventLog;
    private _dfgRepresentation: SVGGElement;

    
    constructor(private _svgService: SvgService, 
                        eventLog: EventLog) {
        super();
        this.eventLog = eventLog;
        this.id = 'eventLogNumber' + (EventLogDFG.logCounter).toString();
        EventLogDFG.logCounter ++;
        this._dfgRepresentation = this._svgService?.createSVGforEventLog(this.eventLog, this.id)
    }

    public override getSvg() : SVGGElement {
        return this._dfgRepresentation;
    }

    public set dfgRepresentation(value: SVGGElement) {
        this._dfgRepresentation = value;
    }

    setXYonSVG(xNew: number, yNew: number) {
        this._dfgRepresentation.setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')');
    }

    getWidth(): number {
        const element = this._dfgRepresentation.getAttribute('width');
        return parseFloat(element || '0');
    }
    getHeight(): number {
        const element = this._dfgRepresentation.getAttribute('height');
        return parseFloat(element || '0');
    }
}

