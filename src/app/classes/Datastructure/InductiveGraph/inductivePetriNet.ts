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
    private _places: Place[]= new Array<Place>;
    private _transitions: Transition[] = new Array<Transition>;
    private _arcs: Edge[] = new Array<Edge>;
    private _eventLogDFGs?: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)
    private _petriLayersContained?: PetriLayerContainer;

    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()));

    static horizontalOffset = 150;
    static verticalOffset = 150;

    constructor() {
        EventLogDFG.logCounter = 0; // counter der logs für neues Netz resetten
    }

    init(eventLog: EventLog): InductivePetriNet {
        //zwei Stellen zum Start generieren und die entsprechenden Kanten einfügen
        this._eventLogDFGs = [new EventLogDFG(this._svgService, eventLog)];
        this._petriLayersContained = new PetriLayerContainer(this._eventLogDFGs[0]);
        this.genStartEndPlaceAndGenArcs();
        return this;
    }

    public getMarkedEventLog(eventLogID: string) {
        for (const eventLog of this._eventLogDFGs!) {
            if (eventLog?.id === eventLogID) {
                return eventLog?.eventLog;
            }
        }
        // should not happen
        throw new Error('No event log found for id ' + eventLogID);
    }

    public genStartEndPlaceAndGenArcs() {
        //Reihenfolge der Stellenerzeugung ist wichtig!!! Diese werden im Layout genutzt
        const start = this.genPlace('startPlace');
        start.x = InductivePetriNet.horizontalOffset/2;
        const end = this.genPlace('endPlace');
        const firstEventLogDFG = this._eventLogDFGs![0];
        if (firstEventLogDFG !== undefined){
            this.genArc(start, firstEventLogDFG);
            this.genArc(firstEventLogDFG, end);
        }
    }

    //bereits generierte Elemente verbinden
    private genArc(start: CustomElement, end: CustomElement) {
        const edgeToGen = new Edge(start, end);
        //this._svgService.createSVGForArc(edgeToGen);
        this._arcs.push(edgeToGen);
    }

    private genPlace(name: string) {
        const placeToGen = new Place(name);
        this._svgService.createSVGForPlace(placeToGen);
        this._places.push(placeToGen);
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
        this._petriLayersContained!.forEach(layer => {
            let yValInLayer = layer.length * InductivePetriNet.verticalOffset;
            layer.forEach(element => {
                yValInLayer += element.getHeight();
            });
            maxY = (yValInLayer > maxY ? yValInLayer : maxY);
        });
        const yOffset = maxY / 2;
        //y Wert der Start- und Endstellen setzen
        // Start- und Endstelle wurden in dieser Reihenfolge erzeugt
        this._places[0].y = yOffset;
        this._places[1].y = yOffset;


        let currLayerXOffSet = InductivePetriNet.horizontalOffset;
        this._petriLayersContained!.forEach(layer => {
            //Für jedes Layer Gesamthöhe und Breite berechnen und diese zentrieren
            let totalLayerHeight = layer.length * InductivePetriNet.verticalOffset;
            let layerMaxWidth = 0;
            layer.forEach(element => {
                layerMaxWidth = (element.getWidth() > layerMaxWidth ? element.getWidth() : layerMaxWidth);
                totalLayerHeight += element.getHeight();
            });
            //subtrahiere aktuelle von maximaler Höhe um die Differenz zu erhalten, teilen zum mittig platzieren.
            let currLayerYOffset = (((maxY - totalLayerHeight) / 2) + (InductivePetriNet.verticalOffset / 2));
            
            //für jedes Element x und y Werte setzen
            layer.forEach(element => {
                const currElemHeight = element.getHeight();
                const currElemWidth = element.getWidth();
                let yValToSet = currLayerYOffset;
                let xValToSet = currLayerXOffSet + ((layerMaxWidth - currElemWidth) / 2);
                
                element.setXYonSVG(xValToSet, yValToSet);
                currLayerYOffset += (InductivePetriNet.verticalOffset + currElemHeight);
            });
            currLayerXOffSet += (InductivePetriNet.horizontalOffset + layerMaxWidth);
        });
        //alle Koordinaten der Layer gesetzt, daher kann nun die Endstelle horizontal platziert werden.
        this._places[1].x = currLayerXOffSet - (InductivePetriNet.horizontalOffset / 2);

        //Positionen der Stellen berechnen und setzen
        this._places.forEach(place => {
            if (place.id == 'startPlace' || place.id == 'endPlace') {
            } else {
                //bestimme alle Kanten, welche an der gegebenen Stelle enden und ziehe daraus die Elemente vor dieser Stelle
                const beforePlace = (this._arcs.filter(edge => edge.end == place)).map(arc => arc.start);
                //bestimme alle Kanten, welche an der gegebenen Stelle starten und ziehe daraus die Elemente nach dieser Stelle
                const afterPlace = (this._arcs.filter(edge => edge.start == place)).map(arc => arc.end);
                //X und Y Werte für die Stellen berechnen.
                let xValToSet = 0;
                let yValToSet = 0;
                //Summiere alle x und y Werte der Elemente vor und nach der Stelle
                beforePlace.forEach(element => {
                    const centerCoord = element.getCenterXY();
                    xValToSet += centerCoord.x;
                    yValToSet += centerCoord.y;
                });
                afterPlace.forEach(element => {
                    const centerCoord = element.getCenterXY();
                    xValToSet += centerCoord.x;
                    yValToSet += centerCoord.y;
                });
                //Teile die Summe durch die gesamte Anzahl der Elemente um die Stelle mittig zu platzieren
                const totalBeforeAndAfter = beforePlace.length + afterPlace.length;
                xValToSet = xValToSet / totalBeforeAndAfter;
                yValToSet = yValToSet / totalBeforeAndAfter;
            }
        });
        this._places.forEach(place => {
            //Kanten erzeugen nachdem die Positionen berechnet wurden.
            // Stellen sind nicht mit Stellen verbunden! Daher für aus- und eingegende Kanten Verbindungen einfügen
            this._arcs.filter(edge => edge.start == place || edge.end == place).forEach(
                edge => this._svgService.createSVGForArc(edge)
            );
        })
    }

    private concatSVGReps() {
        const result: Array<SVGElement> = [];
        this._eventLogDFGs!.forEach(eventLogDFG => {
            result.push(eventLogDFG.getSvg());
        });
        this._transitions.forEach(transition => {
            const svgRep = transition.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        this._places.forEach(place => {
            const svgRep = place.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        this._arcs.forEach(arc => {
            const svgRep = arc.getSvg();
            if (svgRep != undefined) {
                result.push(svgRep);
            }
        });
        return result;
    }
}
