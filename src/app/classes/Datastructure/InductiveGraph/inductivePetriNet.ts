import { transition } from "@angular/animations";
import { EventLog } from "../event-log/event-log";
import { EventLogDFG } from "./eventLogDFG";

export class InductivePetriNet{
    places: string[]= ["first", "last"];
    transitions: string[] = new Array<string>;
    arcs?: { [idPair: string]: number; } | undefined;
    eventLogDFGs: EventLogDFG[];
    
    constructor(eventLog: EventLog) {
        this.eventLogDFGs = [new EventLogDFG(eventLog)];
    }
}