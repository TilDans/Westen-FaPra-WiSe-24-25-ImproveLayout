//#region Imports
import {EventLog} from "../event-log/event-log";
import {EventLogDFG} from "./Elements/eventLogDFG";
import {SvgService} from "src/app/services/svg.service";
import {Place} from "./Elements/place";
import {Transition} from "./Elements/transition";
import {Edge} from "./edgeElement";
import {CustomElement} from "./Elements/customElement";
import {SvgArrowService} from "../../../services/svg-arrow.service";
import {IntersectionCalculatorService} from "../../../services/intersection-calculator.service";
import { PetriLayerContainer } from "./PetriLayout/petriLayerContainer";
import { Cuts, Layout, LayoutDirection, PetriLayout, RecursiveType } from "../enums";
import { SvgLayoutService } from "src/app/services/svg-layout.service";
import { Trace } from "../event-log/trace";
import { TraceEvent } from "../event-log/trace-event";
import { RecursiveNode } from "./Elements/recursiveNode";
import { transition } from "@angular/animations";
//#endregion

export class InductivePetriNet{
    //#region Header
    _svgService : SvgService = new SvgService (new SvgArrowService(new IntersectionCalculatorService()), new SvgLayoutService());
    
    private _places: Place[]= new Array<Place>;
    private _transitions: Transition[] = new Array<Transition>;
    private _arcs: Edge[] = new Array<Edge>;
    private _eventLogDFGs?: EventLogDFG[]; //wenn diese hier eingefügt sind, sind sie fertig berechnet (Knoten, Kanten, Koordinaten, Größe)
    private _petriLayersContained?: PetriLayerContainer;
    private _rootNode: RecursiveNode = new RecursiveNode([], this._svgService, LayoutDirection.Horizontal);

    private _endPlaceIndex = 0;
    private _finished: boolean = false;


    //OffSet sollte nicht frößer sein als kleinstes Element * 2 (Berechnung, ob ein Element in einem Layer ist)
    static horizontalOffset = 150;
    static verticalOffset = 150;

    static chosenPetriLayout = PetriLayout.Recursive;

    constructor() {
        EventLogDFG.logCounter = 0; // counter der logs für neues Netz resetten
    }

    //#endregion
    
    ///////////////////////////////
    /* ----- Getter/Setter ----- */
    ///////////////////////////////
    //#region getters/setters

    public get Transitions() {
        return this._transitions;
    }

    public get Places() {
        return this._places;
    }

    public get Arcs() {
        return this._arcs;
    }

    public get finished() {
        return this._finished;
    }

    //#endregion
    
    ////////////////////////////////
    /* ----- INITIALIZATION ----- */
    ////////////////////////////////
    //#region Initialization
    
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

        this._rootNode = new RecursiveNode([playTrans, firstEventLogDFG, stopTrans], this._svgService, LayoutDirection.Horizontal);
        this._petriLayersContained = new PetriLayerContainer(playTrans, firstEventLogDFG, stopTrans);

        this.genArc(first, playTrans);
        this.genArc(playTrans, second);
        this.genArc(second, firstEventLogDFG);
        this.genArc(firstEventLogDFG, secondToLast);
        this.genArc(secondToLast, stopTrans);
        this.genArc(stopTrans, last);
    }

    //#endregion
    //+//
    ////////////////////////////////////
    /* ----- CUT HANDLING Start ----- */
    ////////////////////////////////////
    //#region Cut handling

    public handleCutResult(cutType: Cuts, toRemove: EventLog, toInsertFirst: EventLog, toInsertSecond: EventLog) {
        const eventLogDFGToRemove = this.getDFGByEventLog(toRemove)!;
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
                this.applyParallelCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond, RecursiveType.Parallel);
                break;
            case Cuts.Loop: 
                this.applyLoopCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond);
                break;
            default:
                throw new Error(`Falscher Wert für Cut: ${cutType}`);
        }
    }

    public handleFlowerModelFallThrough(toRemove: EventLog, toInsertEventLogs: EventLog[]) {
        const eventLogDFGToRemove = this._eventLogDFGs!.find(element => element.eventLog === toRemove)!;
        const connecionsInNet = this.getConnectedArcs(eventLogDFGToRemove);

        //mock Elemente generieren
        const mockTrans1 = this.genTransition();
        const mockTrans2 = this.genTransition();
        const mockPlace = this.genPlace();

        const connectedPlaces : Place[] = [];

        //Verbindungen für mock Elemente aktualisieren
        connecionsInNet.edgesToElem.forEach(edge => {
            edge.end = mockTrans1;
            connectedPlaces.push(edge.start);
        });
        connecionsInNet.edgesFromElem.forEach(edge => {
            edge.start = mockTrans2;
            connectedPlaces.push(edge.end);
        });
        this.genArc(mockTrans1, mockPlace);
        this.genArc(mockPlace, mockTrans2);

        
        //neue EventLogs verarbeiten (DFGs generieren und verbinden)
        const newEventLogDFGs: EventLogDFG[] = [];
        for (const eventLog of toInsertEventLogs) {
            const newEL = new EventLogDFG(this._svgService, eventLog);
            newEventLogDFGs.push(newEL);
            this._eventLogDFGs?.push(newEL);
            this.genArc(mockPlace, newEL);
            this.genArc(newEL, mockPlace);
        }
        
        //eventLogDFGs in Layout einfügen
        const halfOfLength = Math.round(newEventLogDFGs.length / 2);
        const firstQuarter = Math.round(halfOfLength / 2);
        const thirdQuarter = (halfOfLength + firstQuarter);
        
        switch (InductivePetriNet.chosenPetriLayout) {
            case PetriLayout.Before:
                //mock Transitionen in Layout einfügen wie Sequence Cut
                this._petriLayersContained?.insertToNewLayerAfterCurrentElementAndReplaceFormer(eventLogDFGToRemove, mockTrans1, mockTrans2);
                
                //erstes Viertel über mocktrans 1
                for (let i = 0; i < firstQuarter; i++) {
                    this._petriLayersContained?.insertToExistingLayerBeforeCurrentElement(mockTrans1, newEventLogDFGs[i]);
                }
                
                //zweites Viertel unter mocktrans 1
                for (let i = firstQuarter; i < halfOfLength; i++) {
                    this._petriLayersContained?.insertToExistingLayerAfterCurrentElement(mockTrans1, newEventLogDFGs[i]);
                }
        
                //drittes Viertel über mocktrans 2
                for (let i = halfOfLength; i < thirdQuarter; i++) {
                    this._petriLayersContained?.insertToExistingLayerBeforeCurrentElement(mockTrans2, newEventLogDFGs[i]);
                }
                
                //viertes Viertel unter mocktrans 2
                for (let i = thirdQuarter; i < newEventLogDFGs.length; i++) {
                    this._petriLayersContained?.insertToExistingLayerAfterCurrentElement(mockTrans2, newEventLogDFGs[i]);
                }
                break;
            case PetriLayout.Recursive:
                const firstVertical: CustomElement[] = [];
                const secondVertical: CustomElement[] = [];

                //erstes Viertel über mocktrans 1
                for (let i = 0; i < firstQuarter; i++) {
                    firstVertical.push(newEventLogDFGs[i])
                }
                
                firstVertical.push(mockTrans1);

                //zweites Viertel unter mocktrans 1
                for (let i = firstQuarter; i < halfOfLength; i++) {
                    firstVertical.push(newEventLogDFGs[i])
                }
        
                //drittes Viertel über mocktrans 2
                for (let i = halfOfLength; i < thirdQuarter; i++) {
                    secondVertical.push(newEventLogDFGs[i])
                }
                
                secondVertical.push(mockTrans2);
                
                //viertes Viertel unter mocktrans 2
                for (let i = thirdQuarter; i < newEventLogDFGs.length; i++) {
                    secondVertical.push(newEventLogDFGs[i])
                }

                const firstVerticalNode = new RecursiveNode(firstVertical, this._svgService, LayoutDirection.Vertical);
                const secondVerticalNode = new RecursiveNode(secondVertical, this._svgService, LayoutDirection.Vertical);
                const newOuterNode = new RecursiveNode([firstVerticalNode, secondVerticalNode], this._svgService, LayoutDirection.Horizontal, RecursiveType.Flower, true);
                connectedPlaces.forEach(place => newOuterNode.registerPlace(place));
                this._rootNode.replaceWithCustomElement(eventLogDFGToRemove, newOuterNode);
                break;
        }
        this._eventLogDFGs?.splice(this._eventLogDFGs.indexOf(eventLogDFGToRemove),1);
    }

    public handleActivityOncePerTraceFallThrough(toRemove: EventLog, toInsertFirst: EventLog, toInsertSecond: EventLog) {
        const eventLogDFGToRemove = this.getDFGByEventLog(toRemove)!;
        const eventLogDFGToInsertFirst = new EventLogDFG(this._svgService, toInsertFirst);
        const eventLogDFGToInsertSecond = new EventLogDFG(this._svgService, toInsertSecond);
        
        this.applyParallelCut(eventLogDFGToRemove, eventLogDFGToInsertFirst, eventLogDFGToInsertSecond, RecursiveType.ActivityOncePerTrace);
    }

    //Elemente hintereinander
    public applySequenceCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        let isWithinLoopRedo = false;

        //für eingehende Kanten das erste einzufügende Element als Ziel setzen
        connecionsInNet.edgesToElem.forEach(edge => {
            if (edge.start.x > toRemove.x) isWithinLoopRedo = true;
            edge.end = toInsertFirst;
        });

        //Kanten und Stelle zur Verbindung der DFGs einfügen 1. -- 2.
        this.connectLogsByPlace(toInsertFirst, toInsertSecond);

        //für ausgehende Kanten das zweite einzufügende Element als Start setzen
        connecionsInNet.edgesFromElem.forEach(edge => {
            if (edge.end.x < toRemove.x) isWithinLoopRedo = true;
            edge.start = toInsertSecond;
        });

        switch (InductivePetriNet.chosenPetriLayout) {
            case PetriLayout.Before:
                if (!isWithinLoopRedo) {
                    //Layout aktualisieren
                    this._petriLayersContained?.insertToNewLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                } else {
                    this._petriLayersContained?.insertToNewLayerBeforeCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                }
                break;
            case PetriLayout.Recursive:
                const parent = this._rootNode.getParentNode(toRemove)!;
                const parentType = parent.getType();
                const sameType: boolean = parentType === RecursiveType.Sequence;
                let newNode: RecursiveNode;
                if (isWithinLoopRedo) {
                    newNode = new RecursiveNode([toInsertSecond, toInsertFirst], this._svgService, LayoutDirection.Horizontal, RecursiveType.Sequence, !sameType);                    
                } else {
                    newNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Horizontal, RecursiveType.Sequence, !sameType);
                }
                this._rootNode.replaceWithCustomElement(toRemove, newNode);
                break;
        }

        this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
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

        switch (InductivePetriNet.chosenPetriLayout) {
            case PetriLayout.Before:
                //Layout aktualisieren
                this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                break;
            case PetriLayout.Recursive:
                const parent = this._rootNode.getParentNode(toRemove)!;
                const parentType = parent.getType();
                const sameType: boolean = parentType === RecursiveType.Exclusive;
                const newNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Vertical, RecursiveType.Exclusive, !sameType);
                if (parent.getLayoutDirection() !== LayoutDirection.Vertical) {
                    connecionsInNet.edgesToElem.forEach(edge => {
                        parent.deRegisterPlace(edge.start)
                        newNode.registerPlace(edge.start);
                    });
                    connecionsInNet.edgesFromElem.forEach(edge => {
                        parent.deRegisterPlace(edge.end)
                        newNode.registerPlace(edge.end);
                    });
                }
                this._rootNode.replaceWithCustomElement(toRemove, newNode);
                break;
        }
        

        //zu entfernendes Element ersetzen und zweites Element an das Ende des Arrays pushen.
        this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
    }

    //vorgelagerte Stelle aufteilen, parallel laufen lassen (ggf. Hilfstransitionen einfügen)
    public applyParallelCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG, type: RecursiveType){
        //Verbundene Kanten finden
        const connecionsInNet = this.getConnectedArcs(toRemove);

        let isWithinLoopRedo = false;

        let mockTransRequired = false;
        //eingehende Kanten 
        connecionsInNet.edgesToElem.forEach(edge => {
            if (edge.start.x > toRemove.x) isWithinLoopRedo = true;
            const place = edge.start;
            const connectedToPlace = this.getConnectedArcs(place);
            if (connectedToPlace.edgesFromElem.length > 1) { 
                mockTransRequired = true;
            }
        });
        //ausgehende Kanten
        connecionsInNet.edgesFromElem.forEach(edge => {
            if (edge.end.x < toRemove.x) isWithinLoopRedo = true;
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
            
            
            switch (InductivePetriNet.chosenPetriLayout) {
                case PetriLayout.Before:
                    //künstliche Transitionen in neues Layer vor/nach dem DFG einfügen
                    this._petriLayersContained!.insertToNewLayerBeforeElement(toRemove, mockTrans1);
                    this._petriLayersContained!.insertToNewLayerAfterElement(toRemove, mockTrans2);
                    //aktuellen DFG durch die beiden neu generierten ersetzen
                    this._petriLayersContained!.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                    break;
                case PetriLayout.Recursive:
                    const parent = this._rootNode.getParentNode(toRemove)!;
                    const parentType = parent.getType();
                    const sameType: boolean = parentType === type;
                    const newInnerNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Vertical, type, false);
                    newInnerNode.registerPlace(prevPlace1)
                    newInnerNode.registerPlace(prevPlace2)
                    newInnerNode.registerPlace(postPlace1)
                    newInnerNode.registerPlace(postPlace2)
                    let newOuterNode: RecursiveNode;
                    if (!isWithinLoopRedo) {
                        newOuterNode = new RecursiveNode([mockTrans1, newInnerNode, mockTrans2], this._svgService, LayoutDirection.Horizontal, type, !sameType);
                    } else {
                        newOuterNode = new RecursiveNode([mockTrans2, newInnerNode, mockTrans1], this._svgService, LayoutDirection.Horizontal, type, !sameType);
                    }
                    if (parent.getLayoutDirection() !== LayoutDirection.Vertical) {
                        connecionsInNet.edgesToElem.forEach(edge => {
                            newOuterNode.registerPlace(edge.start);
                            parent.deRegisterPlace(edge.start);
                        });
                        connecionsInNet.edgesFromElem.forEach(edge => {
                            newOuterNode.registerPlace(edge.end);
                            parent.deRegisterPlace(edge.end);
                        });
                    }
                    this._rootNode.replaceWithCustomElement(toRemove, newOuterNode);
                    break;
            }
        } else { // Stellen im Vorbereich haben nur eine ausgehende und solche im Nachbereich nur eine eingehende Kante
            const connectedPlacesBefore: Place [] = [];
            const connectedPlacesAfter: Place [] = [];
            const newPlacesBefore: Place [] = [];
            const newPlacesAfter: Place [] = [];
            //Für jede eingehende Kante die entsprechende Stelle duplizieren
            connecionsInNet.edgesToElem.forEach(edgeBeforeElem => {
                //Ende der aktuellen Kante auf das erste Element setzen
                const place = edgeBeforeElem.start;
                connectedPlacesBefore.push(place);
                edgeBeforeElem.end = toInsertFirst;

                //neue Stelle erzeugen und so verbinden wie die andere, zusätzlich mit zweitem einzufügenden Element
                const newPlaceBeforeElems = this.genPlace();
                newPlacesBefore.push(newPlaceBeforeElems);
                this.getConnectedArcs(place).edgesToElem.forEach(edge => {
                    this.genArc(edge.start, newPlaceBeforeElems);
                });
                this.genArc(newPlaceBeforeElems, toInsertSecond);
            });

            connecionsInNet.edgesFromElem.forEach(edgeAfterElem => {
                //Start der ausgehenden Kanten auf das erste Element setzen
                const place = edgeAfterElem.end;
                connectedPlacesAfter.push(place);
                edgeAfterElem.start = toInsertFirst;

                //neue Stelle erzeugen und so verbinden wie die andere, zusätzlich mit zweitem einzufügenden Element
                const newPlaceAfterElems = this.genPlace();
                newPlacesAfter.push(newPlaceAfterElems);
                this.getConnectedArcs(place).edgesFromElem.forEach(edge => {
                    this.genArc(newPlaceAfterElems, edge.end);
                });
                this.genArc(toInsertSecond, newPlaceAfterElems);
            });

            this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
            switch (InductivePetriNet.chosenPetriLayout) {
                case PetriLayout.Before:
                    this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                    break;
                case PetriLayout.Recursive:
                    const parent = this._rootNode.getParentNode(toRemove)!;
                    const parentType = parent.getType();
                    const sameType: boolean = parentType === type;
                    const newNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Vertical, type, !sameType);
                    if (parent.getLayoutDirection() !== LayoutDirection.Vertical) {
                        connectedPlacesBefore.forEach(place =>{
                            newNode.registerPlace(place);
                            parent.deRegisterPlace(place);
                        })
                        connectedPlacesAfter.forEach(place => {
                            newNode.registerPlace(place);
                            parent.deRegisterPlace(place);
                        })
                        newPlacesBefore.forEach(place =>{
                            newNode.registerPlace(place);
                        })
                        newPlacesAfter.forEach(place =>{
                            newNode.registerPlace(place);
                        })
                    } else {
                        newPlacesBefore.forEach(place =>{
                            parent.registerPlace(place);
                        })
                        newPlacesAfter.forEach(place =>{
                            parent.registerPlace(place);
                        })
                    }
                    
                    this._rootNode.replaceWithCustomElement(toRemove, newNode);
                    break;
            }
        }
    }

    //wie exclusive, nur werden die Kantenrichtungen im unteren Teil vertauscht.
    public applyLoopCut(toRemove: EventLogDFG, toInsertFirst: EventLogDFG, toInsertSecond: EventLogDFG){
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
            //je eine Stelle im Vor- und Nachbereich der einzufügenden Elemente
            const prevPlace = this.genPlace();
            const postPlace = this.genPlace();

            //Stellen des Vorbereichs mit künstlicher Transition verbinden
            connecionsInNet.edgesToElem.forEach(edge => {
                edge.end = mockTrans1;
            });
            //künstliche Transition mit Stelle im Vorbereich der einzufügenden Elemente verbinden
            this.genArc(mockTrans1, prevPlace);
            //Stelle im Vorbereich mit den Elementen verbinden
            this.genArc(prevPlace, toInsertFirst);
            //Elemente mit Stellen im Nachbereich verbinden
            this.genArc(toInsertFirst, postPlace);
            this.genArc(postPlace, toInsertSecond);
            this.genArc(toInsertSecond, prevPlace);
            //Stellen im Nachbereich mit künstlicher Transition verbinden
            this.genArc(postPlace, mockTrans2);

            //jede Kante des zu löschenden Elements bei der künstlichen Transition starten
            connecionsInNet.edgesFromElem.forEach(edgeAfterElem => {
                edgeAfterElem.start = mockTrans2;
            });

            //vorherigen DFG durch die beiden neuen ersetzen
            this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);
            
            switch (InductivePetriNet.chosenPetriLayout) {
                case PetriLayout.Before:
                    throw new Error;
                    break;
                case PetriLayout.Recursive:
                    const parent = this._rootNode.getParentNode(toRemove)!;
                    const parentType = parent.getType();
                    const sameType: boolean = parentType === RecursiveType.Loop;
                    const newInnerNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Vertical, RecursiveType.Loop, false);
                    newInnerNode.registerPlace(prevPlace);
                    newInnerNode.registerPlace(postPlace);
                    const newOuterNode = new RecursiveNode([mockTrans1, newInnerNode, mockTrans2], this._svgService, LayoutDirection.Horizontal, RecursiveType.Loop, !sameType);
                    if (parent.getLayoutDirection() !== LayoutDirection.Vertical) {
                        connecionsInNet.edgesToElem.forEach(edge => {
                            parent.deRegisterPlace(edge.start)
                            newOuterNode.registerPlace(edge.start);
                        });
                        connecionsInNet.edgesFromElem.forEach(edge => {
                            parent.deRegisterPlace(edge.end)
                            newOuterNode.registerPlace(edge.end);
                        });
                    }
                    this._rootNode.replaceWithCustomElement(toRemove, newOuterNode);
                    break;
            }
        } else { 
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

            //vorherigen DFG durch die beiden neuen ersetzen
            this.replaceDFGAndInsertNewDFG(toRemove, toInsertFirst, toInsertSecond);

            switch (InductivePetriNet.chosenPetriLayout) {
                case PetriLayout.Before:
                    //Layout aktualisieren
                    this._petriLayersContained?.insertToExistingLayerAfterCurrentElementAndReplaceFormer(toRemove, toInsertFirst, toInsertSecond);
                    break;
                case PetriLayout.Recursive:
                    const parent = this._rootNode.getParentNode(toRemove)!;
                    const parentType = parent.getType();
                    const sameType: boolean = parentType === RecursiveType.Loop;
                    const newNode = new RecursiveNode([toInsertFirst, toInsertSecond], this._svgService, LayoutDirection.Vertical, RecursiveType.Loop, !sameType);
                    if (parent.getLayoutDirection() !== LayoutDirection.Vertical) {
                        connecionsInNet.edgesToElem.forEach(edge => {
                            newNode.registerPlace(edge.start);
                            parent.deRegisterPlace(edge.start);
                        });
                        connecionsInNet.edgesFromElem.forEach(edge => {
                            newNode.registerPlace(edge.end);
                            parent.deRegisterPlace(edge.end);
                        });
                    }
                    this._rootNode.replaceWithCustomElement(toRemove, newNode);
                    break;
            }
        }
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

    //#endregion

    /////////////////////////////////////
    /* ----- Other Methods Start ----- */
    /////////////////////////////////////
    //#region Further Methods

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

    private getConnectedArcs(node: CustomElement): {edgesToElem: Edge[], edgesFromElem: Edge[] } {
        //bestimme alle Kanten, welche an dem gegebenen Element enden und ziehe daraus die Elemente vor diesem
        const edgesToElem = (this._arcs.filter(edge => edge.end == node));
        //bestimme alle Kanten, welche an dem gegebenen Element starten und ziehe daraus die Elemente nach diesem
        const edgesFromElem = (this._arcs.filter(edge => edge.start == node));
        return {edgesToElem, edgesFromElem}
    }

    private getDFGByEventLog(eventLogToFind: EventLog) {
        return this._eventLogDFGs!.find(element => element.eventLog === eventLogToFind)!;
    }
    
    public getEventLogByID(eventLogID: string) {
        for (const eventLog of this._eventLogDFGs!) {
            if (eventLog?.id === eventLogID) {
                return eventLog?.eventLog;
            }
        }
        // should not happen
        throw new Error('No event log found for id ' + eventLogID);
    }

    //#endregion

    ////////////////////////////////////
    /* ----- Layout / Graphical ----- */
    ////////////////////////////////////
    //#region Layout / Graphical

    applyNewDFGLayout(layout: Layout) {
        this._svgService.applyNewDFGLayout(layout);
        if(this._eventLogDFGs) {
            for (const elDfg of this._eventLogDFGs) {
                elDfg.updateLayout();
            }
        }
    }

    public applyLayoutToSingleDFG(eventLog: EventLog) {
        this.getDFGByEventLog(eventLog).updateLayout();
    }

    public highlightSubsetInDFG(toHighlightIn: EventLog, subset: EventLog) {
        const eventLogDFGMarked = this.getDFGByEventLog(toHighlightIn)!;
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
    
    public removeHighlightingFromEventLogDFGNodes() {
        this._eventLogDFGs!.forEach(el => {
            el.colorSubSet([]);
        });
    }

    public selectDFG(eventLog?: EventLog) {
        this._eventLogDFGs?.forEach(eventLogDFG => eventLogDFG.removeHighlight())
        if (eventLog) {
            this.getDFGByEventLog(eventLog)?.highlight();
        }
    }
    
    public getSVGRepresentation(): SVGElement[] {
        //Layout für das Petrinetz durchführen, Koordinaten für SVGs der Stellen, Transitionen und zugehöriger Kanten setzen.
        switch (InductivePetriNet.chosenPetriLayout) {
            case PetriLayout.Before:
                this.layoutPetriNet(); 
                break;
            case PetriLayout.Recursive:
                this.layoutRecursivePetriNet(); 
                break;
            default:
                break;
        }
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
        const connectedElems: CustomElement[] = [];
        //X und Y Werte für die Stellen berechnen.
        let xValToSet = 0;
        let yValToSet = 0;

        //Summiere alle x und y Werte der Elemente vor und nach der Stelle
        toPlace.forEach(edge => {
            connectedElems.push(edge.start)
            const centerCoord = edge.start.getCenterXY();
            xValToSet += centerCoord.x;
            yValToSet += centerCoord.y;
        });
        fromPlace.forEach(edge => {
            connectedElems.push(edge.end)
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
            let minLayerAfterPlace = -1;
            fromPlace.forEach(edge => {
                const currEndElemLayer = this.getLayer(edge.end);
                maxLayerAfterPlace = (currEndElemLayer > maxLayerAfterPlace) ? currEndElemLayer : maxLayerAfterPlace;
                minLayerAfterPlace = (currEndElemLayer < maxLayerAfterPlace) ? currEndElemLayer : maxLayerAfterPlace;
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
        
        if (toPlace.length === 1 && fromPlace.length === 1) {
            const toPlaceX = toPlace[0].start.getCenterXY().x;
            const fromPlaceX = fromPlace[0].end.getCenterXY().x;
            const toPlaceY = toPlace[0].start.getCenterXY().y;
            const fromPlaceY = fromPlace[0].end.getCenterXY().y;
        
            // Calculate differences
            const xOffsetBetweenNodes = fromPlaceX - toPlaceX;
            const yOffsetBetweenNodes = fromPlaceY - toPlaceY;
        
            if (xOffsetBetweenNodes !== 0) {
                const slope = yOffsetBetweenNodes / xOffsetBetweenNodes;
        
                //Wert berechnen y = mx + b
                yValToSet = toPlaceY + slope * (xValToSet - toPlaceX);
            }
        }
        
        // Kollisionen auf der Mittellinie vermeiden, wenn Stelle dort nah dran liegt
        if (yOffset - 15 < yValToSet && yValToSet < yOffset + 15) {
            let moreThanOneApart = true;
            //nur für Stellen, deren Layer nicht direkt aufeinander folgen
            for (const connectedElem of connectedElems) {
                for (const connectedElemTwo of connectedElems) {
                    let test = Math.abs(this.getLayer(connectedElem) - this.getLayer(connectedElemTwo))
                    if (test > 1) {
                        moreThanOneApart = false;
                    }
                }   
            }
            if (!moreThanOneApart){
                    yValToSet += 50;
            }
        }
        place.setXYonSVG(xValToSet, yValToSet);
    }

    private getLayer(element: CustomElement) {
        return this._petriLayersContained!.findIndex(layer => layer.includes(element));
    }

    private layoutRecursivePetriNet() {
        this._rootNode.layoutRecursive(InductivePetriNet.horizontalOffset, 0);
        const yOffset = this._rootNode.getHeight() / 2;

        //y Wert der Start- und Endstellen setzen
        for (let i = 0; i <= this._endPlaceIndex; i++) {
            this._places[i].y = yOffset;
        }

        this._places[0].x = (InductivePetriNet.horizontalOffset / 2);
        this._places[this._endPlaceIndex].x = this._rootNode.getWidth() + (InductivePetriNet.horizontalOffset * 3 / 2);
        
        type Rect = [number, number, number, number];
        const rectDimensions: Rect[] = [];
        this._eventLogDFGs?.forEach(elDFG => {
            const posX = elDFG.x
            const posY = elDFG.y
            rectDimensions.push([posX, posX + elDFG.getWidth(), posY, posY + elDFG.getHeight()])
        })
        this._transitions?.forEach(transition => {
            const posX = transition.x
            const posY = transition.y
            rectDimensions.push([posX, posX + transition.getWidth(), posY, posY + transition.getHeight()])
        })

        //Positionen der Stellen berechnen und setzen
        this._places.forEach(place => {
            if (place.id == 'p0' || place.id == 'p3') {
            } else {
                this.setPlacePositionRecursive(place, yOffset, rectDimensions);
            }
        });

        this._rootNode.setXonPlaces();

        
        const connectedToPlayTrans = this.getConnectedArcs(this._transitions.filter(transition => transition.event === "play")[0]);
        const connectedToStopTrans = this.getConnectedArcs(this._transitions.filter(transition => transition.event === "stop")[0]);
        if (connectedToPlayTrans != undefined && connectedToStopTrans != undefined) {
            if (connectedToPlayTrans.edgesFromElem.length === 1) {
                const yValForConnected = connectedToPlayTrans.edgesFromElem.reduce((sum, edge) => sum + edge.end.y, 0)
                const playTrans = this._transitions.filter(transition => transition.event === "play")[0];
                playTrans.setXYonSVG(playTrans.x, yValForConnected - (playTrans.getHeight() / 2));
                this._places[0].y = yValForConnected;
                console.log("set y on elems")
            }
            if (connectedToStopTrans.edgesToElem.length === 1) {
                const yValForConnected = connectedToStopTrans.edgesToElem.reduce((sum, edge) => sum + edge.start.y, 0)
                const stopTrans = this._transitions.filter(transition => transition.event === "stop")[0];
                stopTrans.setXYonSVG(stopTrans.x, yValForConnected - (stopTrans.getHeight() / 2));
                this._places[this._endPlaceIndex].y = yValForConnected;
            }
        }

        this._places.forEach(place => {
            //Kanten erzeugen nachdem die Positionen berechFwurden.
            // Stellen sind nicht mit Stellen verbunden! Daher für aus- und eingegende Kanten Verbindungen einfügen
            this._arcs.filter(edge => edge.start == place || edge.end == place).forEach(
                edge => this._svgService.createSVGForArc(edge)
            );
        })
    }

    private setPlacePositionRecursive(place: Place, yOffset: number, rectDimensions: [number, number, number, number][]) {
        const { edgesToElem: toPlace, edgesFromElem: fromPlace } = this.getConnectedArcs(place);
        //X und Y Werte für die Stellen berechnen.
        let xValToSet = 0;
        let yValToSet = 0;

        //TODO Gewichtung korrigieren

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
    
        const resolved = this.handlePlaceRectCollision(xValToSet, yValToSet, rectDimensions);
        place.setXYonSVG(resolved.x, resolved.y);
    }

    private handlePlaceRectCollision(
        x: number,
        y: number,
        rectDimensions: [number, number, number, number][]
    ): { x: number; y: number } {
        const placeRadius = SvgService.placeRadius; 
        const padding = 50; 

        const placeToRect = (cx: number, cy: number): [number, number, number, number] => [
            cx - placeRadius - (padding / 3),
            cx + placeRadius + (padding / 3),
            cy - placeRadius - (padding / 3),
            cy + placeRadius + (padding / 3)
        ];
    
        const isCollision = (r1: [number, number, number, number], r2: [number, number, number, number]) => {
            return !(r1[1] < r2[0] || r1[0] > r2[1] || r1[3] < r2[2] || r1[2] > r2[3]);
        };
    
        let currentX = x;
        let currentY = y;
    
        const placeRect = placeToRect(currentX, currentY);
    
        for (const rect of rectDimensions) {
            if (!isCollision(placeRect, rect)) continue;
            console.log(`collision with ${rect}`)
            const [rx1, rx2, ry1, ry2] = rect;
            const rWidth = rx2 - rx1;
            const rHeight = ry2 - ry1;

            const thirdX = rWidth / 3;
            const thirdY = rHeight / 3;

            const leftEdge = rx1 + thirdX;
            const rightEdge = rx2 - thirdX;
            const topEdge = ry1 + thirdY;
            const bottomEdge = ry2 - thirdY;

            // Decide push direction
            let moveX = 0;
            let moveY = 0;

            if (currentX < leftEdge) {
                moveX = -1;
            } else if (currentX > rightEdge) {
                moveX = 1;
            } // else center third => no X move

            if (currentY < topEdge) {
                moveY = -1;
            } else if (currentY > bottomEdge) {
                moveY = 1;
            } // else center third => no Y move

            // Move in the determined direction(s)
            if (moveX !== 0) {
                currentX = moveX < 0
                    ? rx1 - placeRadius - padding
                    : rx2 + placeRadius + padding;
            }

            if (moveY !== 0) {
                currentY = moveY < 0
                    ? ry1 - placeRadius - padding
                    : ry2 + placeRadius + padding;
            }
            if (moveY !== 0 || moveX !== 0) console.log(`moved place from (${x}, ${y}) to (${currentX}, ${currentY})`)
        }
        return { x: currentX, y: currentY };
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
        if (RecursiveNode.colouredBoxes) {
            result.push(...this._rootNode.getSvgReps()!)
        }
        return result;
    }

    //#endregion

    ///////////////////////////////////////////////
    /* ----- Element Generation / Deletion ----- */
    ///////////////////////////////////////////////
    //#region Element Generation

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
        const transToGen = new Transition(transID, name || transID);
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

            switch (InductivePetriNet.chosenPetriLayout) {
                case PetriLayout.Before:
                    //remove from petrilayers
                    this._petriLayersContained?.updateElem(dfg, transition);
                    break;
                case PetriLayout.Recursive:
                    this._rootNode.replaceWithCustomElement(dfg, transition);
                    break;
            }
        });
        this.netFinished();
    }

    //#endregion

}