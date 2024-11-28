import { SvgService } from "src/app/services/svg.service";
import { EventLog } from "../event-log/event-log";
import { TraceEvent } from "../event-log/trace-event";
import { DFGEdge } from "./edgeElement";


export class EventLogDFG {
    eventLog: EventLog;
    dfgRepresentation: SVGGElement;
    
    constructor(private _svgService: SvgService, 
                        eventLog: EventLog) {
        this.eventLog = eventLog;
        this.dfgRepresentation = this._svgService?.createSVGforEventLog(this.eventLog)
    }

    public getDFG() : SVGGElement {
        return this.dfgRepresentation;
    }
}

