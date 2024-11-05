import { EventLog } from "../event-log/event-log";
import { EventLogDFG } from "./eventLogDFG";

export class InductivePetriNet{
    places: string[]= ["first", "last"];
    transitions: string[] | undefined;
    arcs?: { [idPair: string]: number; } | undefined;
    eventLogDFGs?: EventLogDFG[];
    
    public InductivePetriNet(eventLog: EventLog) {
        this.eventLogDFGs = [new EventLogDFG(eventLog)];
    }

    public createSVGs (): Array<SVGElement> {
        //for each eventlogDFG: crateSVGs
        //for each places, transitions and arcs: create SVGs
        //add elements to one Array and return
        return [];
    }
}