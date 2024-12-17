import { SvgService } from "src/app/services/svg.service";
import { EventLog } from "../../event-log/event-log";
import { TraceEvent } from "../../event-log/trace-event";
import { Edge } from "../edgeElement";
import { CustomElement } from "./element";


export class EventLogDFG extends CustomElement{
    static logCounter: number = 0;
    eventLog: EventLog;

    
    constructor(private _svgService: SvgService, 
                        eventLog: EventLog) {
        super();
        this.eventLog = eventLog;
        this.id = 'eventLogNumber' + (EventLogDFG.logCounter).toString();
        EventLogDFG.logCounter ++;
        this._svgElement = this._svgService.createSVGforEventLog(this.eventLog, this.id)
    }

    public override getSvg() : SVGElement {
        return this._svgElement!;
    }

    public set dfgRepresentation(value: SVGElement) {
        this._svgElement = value;
    }

    override setXYonSVG(xNew: number, yNew: number) {
        this._svgElement!.setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')');
    }
}

