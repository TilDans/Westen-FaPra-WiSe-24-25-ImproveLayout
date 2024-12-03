import { SvgService } from "src/app/services/svg.service";
import { EventLog } from "../event-log/event-log";
import { TraceEvent } from "../event-log/trace-event";
import { Edge } from "./edgeElement";
import { CustomElement } from "./Elements/element";


export class EventLogDFG extends CustomElement{
    eventLog: EventLog;
    dfgRepresentation: SVGGElement;
    
    constructor(private _svgService: SvgService, 
                        eventLog: EventLog) {
        super();
        this.eventLog = eventLog;
        const id = eventLog.traces.at(0)?.events.at(0)?.conceptName;
        if (id !== undefined) {
            this.id = id;
        }
        this.dfgRepresentation = this._svgService?.createSVGforEventLog(this.eventLog)
    }

    public override getSvg() : SVGGElement {
        return this.dfgRepresentation;
    }
}

