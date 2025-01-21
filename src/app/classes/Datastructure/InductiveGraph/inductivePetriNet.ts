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
import { Cuts, Layout } from "../enums";
import { SvgLayoutService } from "src/app/services/svg-layout.service";
import { Trace } from "../event-log/trace";
import { TraceEvent } from "../event-log/trace-event";


export class InductivePetriNet{
    private _places: Place[]= new Array<Place>;
    private _transitions: Transition[] = new Array<Transition>;
    private _arcs: Edge[] = new Array<Edge>;
    private _eventLogDFGs?: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)
    private _petriLayersContained?: PetriLayerContainer;

    private _endPlaceIndex = 0;
    private _finished: boolean = false;

    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()), new SvgLayoutService());

    //OffSet sollte nicht frößer sein als kleinstes Element * 2 (Berechnung, ob ein Element in einem Layer ist)
    static horizontalOffset = 100;
    static verticalOffset = 200;

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

    public handleCutResult(cutType: Cuts, toRemove: EventLog, toInsertFirst: EventLog, toInsertSecond: EventLog) {
        const eventLogDFGToRemove = this._eventLogDFGs!.find(element => element.eventLog === toRemove)!;
        const eventLogDFGToInsertFirst = new EventLogDFG(this._svgService, toInsertFirst);
        const eventLogDFGToInsertSecond = new EventLogDFG(this._svgService, toInsertSecond);
        switch (cutType) {
            case Cuts.Sequence: 
                this.applySequenceCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
                break;
            case Cuts.Exclusive: 
                this.applyExclusiveCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
                break;
            case Cuts.Parallel: 
                this.applyParallelCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
                break;
            case Cuts.Loop: 
                this.applyLoopCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
                break;
            default:
                throw new Error(`Falscher Wert für Cut: ${cutType}`);
        }
    }

    //Elemente hintereinander
    public applySequenceCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        let isLoop = false;

        //für eingehende Kanten das erste einzufügende Element als Ziel setzen
        connecionsInNet.edgesToElem.forEach(edge => {
            if (edge.start.x > toRemove.x) isLoop = true;
            edge.end = toInsertFirst;
        });

        //Kanten und Stelle zur Verbindung der DFGs einfügen 1. -- 2.
        this.connectLogsByPlace(toInsertFirst, toInsertSecond);

        //für ausgehende Kanten das zweite einzufügende Element als Start setzen
        connecionsInNet.edgesFromElem.forEach(edge => {
            if (edge.end.x < toRemove.x) isLoop = true;
            edge.start = toInsertSecond;
        });

        if (!isLoop) {
            //Layout aktualisieren
            this._petriLayersContained?.insertToNewLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
        } else {
            this._petriLayersContained?.insertToNewLayerBeforeCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
        }
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
        this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);

        //zu entfernendes Element ersetzen und zweites Element an das Ende des Arrays pushen.
        this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
    }

    //vorgelagerte Stelle aufteilen, parallel laufen lassen (ggf. Hilfstransitionen einfügen)
    public applyParallelCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        let mockTransRequired = false;
        //eingehende Kanten 
        connecionsInNet.edgesToElem.forEach(edge => {
            const place = edge.start;
            const connectedToPlace = this.getConnectedArcs(place);
            if (connectedToPlace.edgesFromElem.length > 1) { 
                mockTransRequired = true;
            }
        });
        //ausgehende Kanten
        connecionsInNet.edgesFromElem.forEach(edge => {
            const place = edge.end;
            const connectedToPlace = this.getConnectedArcs(place);
            if (connectedToPlace.edgesToElem.length > 1) { 
                mockTransRequired = true;
            }
        });
        if (mockTransRequired) {
            // Stelle im Vorbereich des DFG hat mehr als eine ausgehende Kante oder eine im Nachbereich mehr als eine eingehende
            //zwei Transitionen um die einzufügenden Elemente herum erzeugen
            const mockTrans1 = this.genTransition();
            const mockTrans2 = this.genTransition();
            //je zwei Stellen im Vor- und Nachbereich der einzufügenden Elemente
            const prevPlace1 = this.genPlace();
            const prevPlace2 = this.genPlace();
            const postPlace1 = this.genPlace();
            const postPlace2 = this.genPlace();

            //Stellen des Vorbereichs mit künstlicher Transition verbinden
            connecionsInNet.edgesToElem.forEach(edge => {
                edge.end = mockTrans1;
            });
            //künstliche Transition mit Stellen im Vorbereich der einzufügenden Elemente verbinden
            this.genArc(mockTrans1, prevPlace1);
            this.genArc(mockTrans1, prevPlace2);
            //Stellen im Vorbereich mit den Elementen verbinden
            this.genArc(prevPlace1, toInsertFirst);
            this.genArc(prevPlace2, toInsertSecond);
            //Elemente mit Stellen im Nachbereich verbinden
            this.genArc(toInsertFirst, postPlace1);
            this.genArc(toInsertSecond, postPlace2);
            //Stellen im Nachbereich mit künstlicher Transition verbinden
            this.genArc(postPlace1, mockTrans2);
            this.genArc(postPlace2, mockTrans2);

            //jede Kante des zu löschenden Elements bei der künstlichen Transition starten
            connecionsInNet.edgesFromElem.forEach(edgeAfterElem => {
                edgeAfterElem.start = mockTrans2;
            });

            //vorherigen DFG durch die beiden neuen ersetzen
            this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);

            //künstliche Transitionen in neues Layer vor/nach dem DFG einfügen
            this._petriLayersContained!.insertToNewLayerBeforeElement(toRemove, mockTrans1);
            this._petriLayersContained!.insertToNewLayerAfterElement(toRemove, mockTrans2);
            //aktuellen DFG durch die beiden neu generierten ersetzen
            this._petriLayersContained!.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
        } else { // Stellen im Vorbereich haben nur eine ausgehende und solche im Nachbereich nur eine eingehende Kante
            //Für jede eingehende Kante die entsprechende Stelle duplizieren
            connecionsInNet.edgesToElem.forEach(edgeBeforeElem => {
                //Ende der aktuellen Kante auf das erste Element setzen
                const place = edgeBeforeElem.start;
                edgeBeforeElem.end = toInsertFirst;

                //neue Stelle erzeugen und so verbinden wie die andere, zusätzlich mit zweitem einzufügenden Element
                const newPlaceBeforeElems = this.genPlace();
                this.getConnectedArcs(place).edgesToElem.forEach(edge => {
                    this.genArc(edge.start, newPlaceBeforeElems);
                });
                this.genArc(newPlaceBeforeElems, toInsertSecond);
            });

            connecionsInNet.edgesFromElem.forEach(edgeAfterElem => {
                //Start der ausgehenden Kanten auf das erste Element setzen
                const place = edgeAfterElem.end;
                edgeAfterElem.start = toInsertFirst;

                //neue Stelle erzeugen und so verbinden wie die andere, zusätzlich mit zweitem einzufügenden Element
                const newPlaceAfterElems = this.genPlace();
                this.getConnectedArcs(place).edgesFromElem.forEach(edge => {
                    this.genArc(newPlaceAfterElems, edge.end);
                });
                this.genArc(toInsertSecond, newPlaceAfterElems);
            });

            this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
            this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
        }
                
    }

    //wie exclusive, nur werden die Kantenrichtungen im unteren Teil vertauscht.
    public applyLoopCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        //für eingehende Kanten das erste einzufügende Element als Ziel setzen
        connecionsInNet.edgesToElem.forEach(edge => {
            edge.end = toInsertFirst;
            this.genArc(toInsertSecond, edge.start);
        });

        //für ausgehende Kanten das zweite einzufügende Element als Start setzen
        connecionsInNet.edgesFromElem.forEach(edge => {
            edge.start = toInsertFirst;
            this.genArc(edge.end, toInsertSecond);
        });

        //Layout aktualisieren
        this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);

        //zu entfernendes Element ersetzen und zweites Element an das Ende des Arrays pushen.
        this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
    }

    private connectLogsByPlace(toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG) {
        const connectingPlace = this.genPlace();
        this.genArc(toInsertFirst, connectingPlace);
        this.genArc(connectingPlace, toInsertSecond);
    }

    private replaceDFGAndInsertNewDFG(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG) {
        this._eventLogDFGs![this._eventLogDFGs!.findIndex(elem => elem === toRemove)] = toInsertFirst;
        this._eventLogDFGs!.push(toInsertSecond);
    }

    public highlightSubsetInDFG(toHighlightIn: EventLog, subset: EventLog) {
        const eventLogDFGMarked = this._eventLogDFGs!.find(element => element.eventLog === toHighlightIn)!;
        //eventLogDFGMarked.removeColoring();
        const uniqueActivities = new Set<string>();
        if (subset && subset.traces) {
            subset.traces.forEach((trace: Trace) => {
                if (trace.events) {
                trace.events.forEach((event: TraceEvent) => {
                    if (event.conceptName) {
                    uniqueActivities.add(event.conceptName);
                    }
                });
                }
            });
        }
        const uniqueActivitiesArray = Array.from(uniqueActivities);
        eventLogDFGMarked.colorSubSet(uniqueActivitiesArray);
    }
    
    public removeHighlightingFromEventLogDFG(eventLogID: string) {
        const eventLogDFGToRemoveHighlightingFrom = this._eventLogDFGs!.find(element => element.id === eventLogID)?.colorSubSet([]);
    }

    //////////////////////////////////
    /* ----- CUT HANDLING END ----- */
    //////////////////////////////////

    public netFinished() {
        if (!this._finished) {
            const netFin = this._eventLogDFGs?.length === 0;
            if (netFin) {
                const stopTransToModify = this._transitions[this._transitions.findIndex(trans => trans.id === 'tStop')];
                stopTransToModify.id = ('t' + (this._transitions.length - 1).toString());
                this._svgService.createSVGForTransition(stopTransToModify);
                this._transitions.sort((a, b) => parseFloat(a.id.slice(1)) - parseFloat(b.id.slice(1)));
                this._finished = true;
            }
        }
    }

    public get finished() {
        return this._finished;
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

    applyNewDFGLayout(layout: Layout) {
        this._svgService.applyNewDFGLayout(layout);
        if(this._eventLogDFGs) {
            for (const elDfg of this._eventLogDFGs) {
                elDfg.updateLayout();
            }
        }
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
        if(!this._petriLayersContained) { return };
        this._petriLayersContained!.forEach(layer => {
            let yValInLayer = ((layer.length - 1) * InductivePetriNet.verticalOffset) + 50;
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
            if (place.id == 'p0' || place.id == 'p3') {
            } else {
                this.setPlacePosition(place, yOffset);
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

    private setPlacePosition(place: Place, yOffset: number) {
        const { edgesToElem: toPlace, edgesFromElem: fromPlace } = this.getConnectedArcs(place);
        //X und Y Werte für die Stellen berechnen.
        let xValToSet = 0;
        let yValToSet = 0;

        //Summiere alle x und y Werte der Elemente vor und nach der Stelle
        toPlace.forEach(edge => {
            const centerCoord = edge.start.getCenterXY();
            xValToSet += centerCoord.x;
            yValToSet += centerCoord.y;
        });
        fromPlace.forEach(edge => {
            const centerCoord = edge.end.getCenterXY();
            xValToSet += centerCoord.x;
            yValToSet += centerCoord.y;
        });
        //Teile die Summe durch die gesamte Anzahl der Elemente um die Stelle mittig zu platzieren
        const totalBeforeAndAfter = toPlace.length + fromPlace.length;
        xValToSet = xValToSet / totalBeforeAndAfter;
        yValToSet = yValToSet / totalBeforeAndAfter;

        const collidingLayer = this._petriLayersContained!.getCollidingLayer(xValToSet);
        if (collidingLayer) {
            let layerBeforePlace = -1;
            toPlace.forEach(edge => {
                const currStartElemLayer = this.getLayer(edge.start);
                layerBeforePlace = (currStartElemLayer > layerBeforePlace) ? currStartElemLayer : layerBeforePlace;
            });
            let maxLayerAfterPlace = -1;
            fromPlace.forEach(edge => {
                const currEndElemLayer = this.getLayer(edge.end);
                maxLayerAfterPlace = (currEndElemLayer > maxLayerAfterPlace) ? currEndElemLayer : maxLayerAfterPlace;
            });
            let collidingLayerCoordinates;
            if (layerBeforePlace >= collidingLayer && maxLayerAfterPlace > layerBeforePlace) {
                collidingLayerCoordinates = this._petriLayersContained!.getLayerCoordinates(layerBeforePlace);
                xValToSet = collidingLayerCoordinates.maxX + (InductivePetriNet.horizontalOffset / 2);
            } else {
                const collisionCoords = this._petriLayersContained!.getLayerCoordinates(collidingLayer);
                const middleOfCollidingLayer = (collisionCoords.minX + collisionCoords.maxX) / 2
                if (xValToSet <= middleOfCollidingLayer) {
                    xValToSet = collisionCoords.minX - (InductivePetriNet.horizontalOffset / 2);
                } else {
                    xValToSet = collisionCoords.maxX + (InductivePetriNet.horizontalOffset / 2);
                }
            }            
        }
        // Kollisionen auf der Mittellinie vermeiden, wenn Stelle dort nah dran liegt
        if (yOffset - 15 < yValToSet && yValToSet < yOffset + 15) {
            let followingLayer = true;
            //nur für Stellen, deren Layer nicht direkt aufeinander folgen
            for (const toEdge of toPlace) {
                for (const fromEdge of fromPlace) {
                    let test = Math.abs(this.getLayer(toEdge.start) - this.getLayer(fromEdge.end))
                    if (test > 1) {
                        followingLayer = false;
                    }
                }
            }
            if (!followingLayer){
                    yValToSet += 50;
            }
        }
        place.setXYonSVG(xValToSet, yValToSet);
    }

    private getLayer(element: CustomElement) {
        return this._petriLayersContained!.findIndex(layer => layer.includes(element));
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

    ///////////////////////////////////////////////
    /* ----- Element Generation / Deletion ----- */
    ///////////////////////////////////////////////

    private genArc(start: CustomElement, end: CustomElement) {
        const edgeToGen = new Edge(start, end);
        //this._svgService.createSVGForArc(edgeToGen);
        this._arcs.push(edgeToGen);
    }

    private dropArc(arcToDrop: Edge) {
        const index = this._arcs.findIndex((arc) => arc === arcToDrop);

        if (index !== -1) {
            this._arcs.splice(index, 1);
        }
    }

    private genPlace(name?: string) {
        const placeToGen = new Place('p' + (this._places.length).toString());
        this._svgService.createSVGForPlace(placeToGen);
        this._places.push(placeToGen);
        return placeToGen;
    }

    private genTransition(name?: string) {
        let transID = '';
        const transLength = this._transitions.length;
        if(transLength > 1) {
            transID= 't' + (this._transitions.length - 1).toString();
        } else if (transLength === 1){
            transID = 'tStop';
        } else {
            transID = 't0';
        };
        const transToGen = new Transition(transID, name || '');
        this._svgService.createSVGForTransition(transToGen);
        this._transitions.push(transToGen);
        return transToGen;
    }

    public handleBaseCases() {
        const baseCases = this._eventLogDFGs?.filter(dfg => dfg.eventLog.isBaseCase());
        if (baseCases) console.log("Found base cases: ", baseCases);
        baseCases?.forEach(dfg => {
            const transitionName = dfg.eventLog.traces[0]?.events[0]?.conceptName;
            const transition = transitionName ? this.genTransition(transitionName) : this.genTransition();
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
            this._petriLayersContained?.updateElem(dfg, transition);
        });
        this.netFinished();
    }
}
