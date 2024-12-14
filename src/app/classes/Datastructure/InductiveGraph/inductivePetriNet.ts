import {EventLog} from "../event-log/event-log";
import {EventLogDFG} from "./eventLogDFG";
import {SvgService} from "src/app/services/svg.service";
import {Place} from "./Elements/place";
import {Transition} from "./Elements/transition";
import {Edge} from "./edgeElement";
import {CustomElement} from "./Elements/element";
import {SvgArrowService} from "../../../services/svg-arrow.service";
import {IntersectionCalculatorService} from "../../../services/intersection-calculator.service";


export class InductivePetriNet{
    places: Place[]= new Array<Place>;
    transitions: Transition[] = new Array<Transition>;
    arcs: Edge[] = new Array<Edge>;
    eventLogDFGs: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)

    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()));

    constructor(eventLog: EventLog) {
        EventLogDFG.logCounter = 0; // counter der logs für neues Netz resetten
        //zwei Stellen zum Start generieren und die entsprechenden Kanten einfügen
        this.eventLogDFGs = [new EventLogDFG(this._svgService, eventLog)];
        this.genStartEndPlaceAndGenArcs();
    }

    public genStartEndPlaceAndGenArcs() {
        const start = this.genPlace('p' + (this.places.length).toString());
        const end = this.genPlace('p' + (this.places.length).toString());
        const firstEventLogDFG = this.eventLogDFGs.at(0);
        if (firstEventLogDFG !== undefined){
            this.genArc(start, firstEventLogDFG);
            this.genArc(firstEventLogDFG, end);
        }
    }

    private genArc(start: CustomElement, end: CustomElement) {
        const edgeToGen = new Edge(start, end);
        this._svgService.createSVGForArc(edgeToGen);
        this.arcs.push(edgeToGen);
    }

    private genPlace(name: string) {
        const placeToGen = new Place();
        placeToGen.id = name;
        this._svgService.createSVGForPlace(placeToGen);
        this.places.push(placeToGen);
        return placeToGen;
    }

    public getSVGRepresentation(): SVGElement[] {
        //Layout für das Petrinetz durchführen, Koordinaten für SVGs der Stellen, Transitionen und zugehöriger Kanten setzen.
        const result: Array<SVGElement> = [];

        this.eventLogDFGs.forEach(eventLogDFG => {
            result.push(eventLogDFG.getSvg());
        });
        this.transitions.forEach(transition => {
            const svgRep = transition.getSvg();
            if (svgRep != undefined){
                result.push(svgRep);
            }
        });
        this.places.forEach(place => {
            const svgRep = place.getSvg();
            if (svgRep != undefined){
                result.push(svgRep);
            }
        });
        this.arcs.forEach(arc => {
            const svgRep = arc.getSvg();
            if (svgRep != undefined){
                result.push(svgRep);
            }
        });


        return result;
    }
}
