import { EventLog } from "../event-log/event-log";
import { TraceEvent } from "../event-log/trace-event";
import { DFGEdge } from "./edgeElement";

export class EventLogDFG {
    createGraph(): SVGElement {
        throw new Error("Method not implemented.");
    }
    eventLog: EventLog;
    nodes: Array<Element> = [];
    edges: Array<DFGEdge> = [];
    
    constructor(eventLog: EventLog) {
        this.eventLog = eventLog;
        this.createDFGForEventLog();
    }

    private createDFGForEventLog() {
        //for each traceEvent in eventLog
            //uniqueEvents.push(new Element(traceEvent))
    }


}

