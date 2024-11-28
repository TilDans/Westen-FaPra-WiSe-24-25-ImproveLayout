import { transition } from "@angular/animations";
import { EventLog } from "../event-log/event-log";
import { EventLogDFG } from "./eventLogDFG";
import { SvgService } from "src/app/services/svg.service";
import { Place } from "./Elements/place";
import { Transition } from "./Elements/transition";


export class InductivePetriNet{
    places: Place[]= new Array<Place>;
    transitions: Transition[] = new Array<Transition>;
    arcs?: { [idPair: string]: number; } | undefined;
    eventLogDFGs: EventLogDFG[];
    
    _svgService : SvgService = new SvgService ();
    
    constructor(eventLog: EventLog) {
        //zwei Stellen zum Start generieren und die entsprechenden Kanten einfügen
        this.eventLogDFGs = [new EventLogDFG(this._svgService, eventLog)];
    }

    public getSVGRepresentation(): SVGElement[] {
        const result: Array<SVGElement> = [];
        this.eventLogDFGs.forEach(eventLogDFG => {
            result.push(eventLogDFG.getDFG());
        });
        this.transitions.forEach(transition => {

        });
        this.places.forEach(place => {

        });
        /* petriNet.arcs.forEach(transition => {
            
        }); */



        return result;
    }
}