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
import { Cuts } from "../enums";
import { last } from "rxjs";


export class InductivePetriNet{
    private _places: Place[]= new Array<Place>;
    private _transitions: Transition[] = new Array<Transition>;
    private _arcs: Edge[] = new Array<Edge>;
    private _eventLogDFGs?: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)
    private _petriLayersContained?: PetriLayerContainer;

    private _endPlaceIndex = 0;

    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()));

    static horizontalOffset = 150;
    static verticalOffset = 150;

    constructor() {
        EventLogDFG.logCounter = 0; // counter der logs für neues Netz resetten
    }

    public get Transitions() {
        return this._transitions;
    }

    public get Places() {
        return this._places;
    }

    public get Arcs() {
        return this._arcs;
    }

    ////////////////////////////////
    /* ----- INITIALIZATION ----- */
    ////////////////////////////////

    init(eventLog: EventLog): InductivePetriNet {
        //zwei Stellen zum Start generieren und die entsprechenden Kanten einfügen
        this._eventLogDFGs = [new EventLogDFG(this._svgService, eventLog)];
        this.genStartEndPlaceAndGenArcs();
        return this;
    }

    private genStartEndPlaceAndGenArcs() {
        //Reihenfolge der Stellenerzeugung ist wichtig!!! Diese werden im Layout genutzt
        const first = this.genPlace('firstPlace');
        first.x = InductivePetriNet.horizontalOffset / 2;
        const playTrans = this.genTransition('play');
        const second = this.genPlace('secondPlace');
        const firstEventLogDFG = this._eventLogDFGs![0];
        const secondToLast = this.genPlace('secondToLastPlace');
        const last = this.genPlace('lastPlace');
        this._endPlaceIndex = this._places.length - 1;

        const stopTrans = this.genTransition('stop');

        this._petriLayersContained = new PetriLayerContainer(playTrans, firstEventLogDFG, stopTrans);

        this.genArc(first, playTrans);
        this.genArc(playTrans, second);
        this.genArc(second, firstEventLogDFG);
        this.genArc(firstEventLogDFG, secondToLast);
        this.genArc(secondToLast, stopTrans);
        this.genArc(stopTrans, last);
    }

    ////////////////////////////////////
    /* ----- CUT HANDLING Start ----- */
    ////////////////////////////////////

    public handleCutResult(cutType: Cuts, toRemove: EventLog, toInsertFirst: EventLog, toInsertSecond: EventLog){
        const eventLogDFGToRemove = this._eventLogDFGs!.find(element => element.eventLog === toRemove)!;
        const eventLogDFGToInsertFirst = new EventLogDFG(this._svgService, toInsertFirst);
        const eventLogDFGToInsertSecond = new EventLogDFG(this._svgService, toInsertSecond);
        switch (cutType) {
            case Cuts.Sequence: return this.applySequenceCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
            case Cuts.Exclusive: return this.applyExclusiveCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
            case Cuts.Parallel: return this.applyParallelCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
            case Cuts.Loop: return this.applyLoopCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
            default:
                throw new Error(`Falscher Wert für Cut: ${cutType}`);
        }
    }

    //Elemente hintereinander
    public applySequenceCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        //für eingehende Kanten das erste einzufügende Element als Ziel setzen
        connecionsInNet.edgesToElem.forEach(edge => {
            edge.end = toInsertFirst;
        });

        //Kanten und Stelle zur Verbindung der DFGs einfügen 1. -- 2.
        this.connectLogsByPlace(toInsertFirst, toInsertSecond);

        //für ausgehende Kanten das zweite einzufügende Element als Start setzen
        connecionsInNet.edgesFromElem.forEach(edge => {
            edge.start = toInsertSecond;
        });

        //Layout aktualisieren
        this._petriLayersContained?.insertToNewLayerAfterCurrentElement(toRemove, toInsertFirst, toInsertSecond);

        //zu entfernendes Element ersetzen und zweites Element an das Ende des Arrays pushen.
        this._eventLogDFGs![this._eventLogDFGs!.findIndex(elem => elem === toRemove)] = toInsertFirst;
        this._eventLogDFGs!.push(toInsertSecond);
    }

    //Elemente übereinander
    public applyExclusiveCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        //für eingehende Kanten das erste einzufügende Element als Ziel setzen
        connecionsInNet.edgesToElem.forEach(edge => {
            edge.end = toInsertFirst;
            this.genArc(edge.start, toInsertSecond);
        });

        //für ausgehende Kanten das zweite einzufügende Element als Start setzen
        connecionsInNet.edgesFromElem.forEach(edge => {
            edge.start = toInsertFirst;
            this.genArc(toInsertSecond, edge.end);
        });

        //Layout aktualisieren
        this._petriLayersContained?.insertToExistingLayerAfterCurrentElement(toRemove, toInsertFirst, toInsertSecond);

        //zu entfernendes Element ersetzen und zweites Element an das Ende des Arrays pushen.
        this._eventLogDFGs![this._eventLogDFGs!.findIndex(elem => elem === toRemove)] = toInsertFirst;
        this._eventLogDFGs!.push(toInsertSecond);
    }

    //vorgelagerte Stelle aufteilen, parallel laufen lassen
    public applyParallelCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        throw new Error('Parallel Cut not implemented yet');
    }

    //??????????
    public applyLoopCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        throw new Error('Loop Cut not implemented yet');
    }

    private connectLogsByPlace(toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG) {
        const connectingPlace = this.genPlace();
        this.genArc(toInsertFirst, connectingPlace);
        this.genArc(connectingPlace, toInsertSecond);
    }

    //////////////////////////////////
    /* ----- CUT HANDLING END ----- */
    //////////////////////////////////

    public netFinished(): boolean {
        return (this._eventLogDFGs?.length == 0);
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

    private getConnectedArcs(node: CustomElement): {edgesToElem: Edge[], edgesFromElem: Edge[] } {
        //bestimme alle Kanten, welche an dem gegebenen Element enden und ziehe daraus die Elemente vor diesem
        const edgesToElem = (this._arcs.filter(edge => edge.end == node));
        //bestimme alle Kanten, welche an dem gegebenen Element starten und ziehe daraus die Elemente nach diesem
        const edgesFromElem = (this._arcs.filter(edge => edge.start == node));
        return {edgesToElem, edgesFromElem}
    }

    ////////////////////////////////////
    /* ----- Layout / Graphical ----- */
    ////////////////////////////////////

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
        for (let i = 0; i <= this._endPlaceIndex; i++) {
            this._places[i].y = yOffset;
        }

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
            layer.minX = currLayerXOffSet;
            layer.maxX = currLayerXOffSet + layerMaxWidth;
            currLayerXOffSet += (InductivePetriNet.horizontalOffset + layerMaxWidth);
        });
        //alle Koordinaten der Layer gesetzt, daher kann nun die Endstelle horizontal platziert werden.
        this._places[this._endPlaceIndex].x = currLayerXOffSet - (InductivePetriNet.horizontalOffset / 2);

        //Positionen der Stellen berechnen und setzen
        this._places.forEach(place => {
            if (place.id == 'firstPlace' || place.id == 'lastPlace') {
            } else {
                this.setPlacePosition(place);
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

    private setPlacePosition(place: Place) {
        const { edgesToElem: toPlace, edgesFromElem: fromPlace } = this.getConnectedArcs(place);
        //X und Y Werte für die Stellen berechnen.
        let xValToSet = 0;
        let yValToSet = 0;
        if (toPlace.length === 1 && fromPlace.length === 1) {
            //Element der eingehenden Kante liegt links des ausgehenden
            const before = toPlace[0].start;
            const after = fromPlace[0].end;
            xValToSet = (this._petriLayersContained![this._petriLayersContained!.findIndex(layer => layer.includes(after))].minX +
                        this._petriLayersContained![this._petriLayersContained!.findIndex(layer => layer.includes(before))].maxX) / 2;
            yValToSet = (before.getCenterXY().y + after.getCenterXY().y) / 2
        } else {
            //Summiere alle x und y Werte der Elemente vor und nach der Stelle
            toPlace.forEach(element => {
                const centerCoord = element.start.getCenterXY();
                xValToSet += centerCoord.x;
                yValToSet += centerCoord.y;
            });
            fromPlace.forEach(element => {
                const centerCoord = element.end.getCenterXY();
                xValToSet += centerCoord.x;
                yValToSet += centerCoord.y;
            });
            //Teile die Summe durch die gesamte Anzahl der Elemente um die Stelle mittig zu platzieren
            const totalBeforeAndAfter = toPlace.length + fromPlace.length;
            xValToSet = xValToSet / totalBeforeAndAfter;
            yValToSet = yValToSet / totalBeforeAndAfter;
        }
        place.setXYonSVG(xValToSet, yValToSet);
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

    ////////////////////////////////////
    /* ----- Element Generation ----- */
    ////////////////////////////////////

    private genArc(start: CustomElement, end: CustomElement) {
        const edgeToGen = new Edge(start, end);
        //this._svgService.createSVGForArc(edgeToGen);
        this._arcs.push(edgeToGen);
    }

    private genPlace(name?: string) {
        const placeToGen = new Place(name || 'p' + (this._places.length - 4).toString());
        this._svgService.createSVGForPlace(placeToGen);
        this._places.push(placeToGen);
        return placeToGen;
    }

    private genTransition(name?: string) {
        const transToGen = new Transition(name || 't' + (this._transitions.length - 2).toString());
        this._svgService.createSVGForTransition(transToGen);
        this._transitions.push(transToGen);
        return transToGen;
    }

    public handleBaseCases() {
        const baseCases = this._eventLogDFGs?.filter(dfg => dfg.eventLog.isBaseCase());
        console.log("Found base cases: ", baseCases);
        baseCases?.forEach(dfg => {
            const transitionName = dfg.eventLog.traces[0]?.events[0]?.conceptName || 'baseCase';
            const transition = this.genTransition(transitionName);
            //remove from dfgs
            const index = this._eventLogDFGs?.indexOf(dfg);
            this._eventLogDFGs?.splice(index!, 1);
            //connect the arcs to the transition
            const connectedArcs = this.getConnectedArcs(dfg);
            connectedArcs.edgesToElem.forEach(edge => {
                edge.end = transition;
            });
            connectedArcs.edgesFromElem.forEach(edge => {
                edge.start = transition;
            });

            //remove from petrilayers
            this._petriLayersContained?.replaceElement(dfg, transition);
        });
    }
}
