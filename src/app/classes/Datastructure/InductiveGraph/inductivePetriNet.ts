import {EventLog} from "../event-log/event-log";
import {EventLogDFG} from "./Elements/eventLogDFG";
import {SvgService} from "src/app/services/svg.service";
import {Place} from "./Elements/place";
import {Transition} from "./Elements/transition";
import {Edge} from "./edgeElement";
import {CustomElement} from "./Elements/element";
import {SvgArrowService} from "../../../services/svg-arrow.service";
import {IntersectionCalculatorService} from "../../../services/intersection-calculator.service";
import { PetriLayerContainer } from "./PetriLayout/petriLayerContainer";


export class InductivePetriNet{
    places: Place[]= new Array<Place>;
    transitions: Transition[] = new Array<Transition>;
    arcs: Edge[] = new Array<Edge>;
    eventLogDFGs: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)
    petriLayersContained: PetriLayerContainer;

    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()));

    static horizontalOffset = 150;
    static verticalOffset = 150;

    constructor(eventLog: EventLog) {
        EventLogDFG.logCounter = 0; // counter der logs für neues Netz resetten
        //zwei Stellen zum Start generieren und die entsprechenden Kanten einfügen
        this.eventLogDFGs = [new EventLogDFG(this._svgService, eventLog)];
        this.petriLayersContained = new PetriLayerContainer(this.eventLogDFGs[0]);
        this.genStartEndPlaceAndGenArcs();
    }

    public genStartEndPlaceAndGenArcs() {
        //Reihenfolge der Stellenerzeugung ist wichtig!!! Diese werden im Layout genutzt
        const start = this.genPlace('startPlace');
        start.x = InductivePetriNet.horizontalOffset/2;
        const end = this.genPlace('endPlace');
        const firstEventLogDFG = this.eventLogDFGs.at(0);
        if (firstEventLogDFG !== undefined){
            this.genArc(start, firstEventLogDFG);
            this.genArc(firstEventLogDFG, end);
        }
    }

    //bereits generierte Elemente verbinden
    private genArc(start: CustomElement, end: CustomElement) {
        const edgeToGen = new Edge(start, end);
        this._svgService.createSVGForArc(edgeToGen);
        this.arcs.push(edgeToGen);
    }

    private genPlace(name: string) {
        const placeToGen = new Place(name);
        this._svgService.createSVGForPlace(placeToGen);
        this.places.push(placeToGen);
        return placeToGen;
    }

    public getSVGRepresentation(): SVGElement[] {
        //Layout für das Petrinetz durchführen, Koordinaten für SVGs der Stellen, Transitionen und zugehöriger Kanten setzen.
        this.layoutPetriNet();
        const result: Array<SVGElement> = this.concatSVGReps();
        return result;
    }

    private layoutPetriNet() {        
        //maxY insgesamt bestimmen, um das gesamte Netz mittig platzieren zu können 
        let maxY = 0;
        this.petriLayersContained.forEach(layer => {
            let yValInLayer = layer.length * InductivePetriNet.verticalOffset;
            layer.forEach(element => {
                yValInLayer += element.getHeight();
            });
            maxY = (yValInLayer > maxY ? yValInLayer : maxY);
        });
        const yOffset = maxY / 2;

        //y Wert der Start- und Endstellen setzen
        // Start- und Endstelle wurden in dieser Reihenfolge erzeugt
        this.places[0].y = yOffset;
        this.places[1].y = yOffset;


        let currLayerXOffSet = InductivePetriNet.horizontalOffset;
        this.petriLayersContained.forEach(layer => {
            //Für jedes Layer Gesamthöhe und Breite berechnen und diese zentrieren
            let totalLayerHeight = layer.length * InductivePetriNet.verticalOffset;
            let layerMaxWidth = 0;
            layer.forEach(element => {
                layerMaxWidth = (element.getWidth() > layerMaxWidth ? element.getWidth() : layerMaxWidth);
                totalLayerHeight += element.getHeight();
            });
            //subtrahiere aktuelle von maximaler Höhe um die Differenz zu erhalten, teilen zum mittig platzieren.
            let currLayerYOffset = (maxY - totalLayerHeight / 2);
            
            //für jedes Element x und y Werte setzen
            layer.forEach(element => {
                const currElemHeight = element.getHeight();
                const currElemWidth = element.getWidth();
                let yValToSet = currLayerYOffset;
                let xValToSet = currLayerXOffSet + ((layerMaxWidth - currElemWidth) / 2);
                
                element.setXYonSVG(xValToSet, yValToSet);
                currLayerYOffset += (InductivePetriNet.verticalOffset + currElemHeight);
            });
            currLayerXOffSet += InductivePetriNet.horizontalOffset;
        });
        //alle Koordinaten der Layer gesetzt, daher kann nun die Endstelle horizontal platziert werden.
        this.places[1].x = currLayerXOffSet - (InductivePetriNet.horizontalOffset / 2);

        //Positionen der Stellen berechnen und setzen
        this.places.forEach(place => {
            if (place.id == 'startPlace' || place.id == 'endPlace') {
            } else {
                //bestimme alle Kanten, welche an der gegebenen Stelle enden und ziehe daraus die Elemente vor dieser Stelle
                const beforePlace = (this.arcs.filter(edge => edge.end == place)).map(arc => arc.start);
                //bestimme alle Kanten, welche an der gegebenen Stelle starten und ziehe daraus die Elemente nach dieser Stelle
                const afterPlace = (this.arcs.filter(edge => edge.start == place)).map(arc => arc.end);

                //X und Y Werte für die Stellen berechnen.

            }
        });
    }

    private concatSVGReps() {
        const result: Array<SVGElement> = [];
        this.eventLogDFGs.forEach(eventLogDFG => {
            result.push(eventLogDFG.getSvg());
        });
        this.transitions.forEach(transition => {
            const svgRep = transition.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        this.places.forEach(place => {
            const svgRep = place.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        this.arcs.forEach(arc => {
            const svgRep = arc.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        return result;
    }
}
