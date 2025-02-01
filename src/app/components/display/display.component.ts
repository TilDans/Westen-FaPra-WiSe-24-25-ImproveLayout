
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DisplayService } from '../../services/display.service';
import { catchError, of, Subscription, take } from 'rxjs';
import { SvgService } from '../../services/svg.service';
import { ExampleFileComponent } from "../example-file/example-file.component";
import { FileReaderService } from "../../services/file-reader.service";
import { HttpClient } from "@angular/common/http";
import { InductivePetriNet } from 'src/app/classes/Datastructure/InductiveGraph/inductivePetriNet';
import { InductiveMinerService } from "../../services/inductive-miner/inductive-miner.service";
import { TraceEvent } from "../../classes/Datastructure/event-log/trace-event";
import { Edge } from "../../classes/Datastructure/InductiveGraph/edgeElement";
import { DFGElement } from "../../classes/Datastructure/InductiveGraph/Elements/DFGElement";
import { IntersectionCalculatorService } from "../../services/intersection-calculator.service";
import svgPanZoom, { enableDblClickZoom } from 'svg-pan-zoom';
import { SvgLayoutService } from 'src/app/services/svg-layout.service';
import { SvgArrowService } from 'src/app/services/svg-arrow.service';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Cuts, Layout } from 'src/app/classes/Datastructure/enums';
import { PNMLWriterService } from 'src/app/services/file-export.service';
import { InductiveMinerHelper } from 'src/app/services/inductive-miner/inductive-miner-helper';
import { FallThroughService } from 'src/app/services/inductive-miner/fall-throughs';
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.css']
})
export class DisplayComponent implements OnDestroy {

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;

    @Output('fileContent') fileContent: EventEmitter<string>;
    @Output() selectedEventLogChange = new EventEmitter<EventLog>();

    //Bedingung, damit der Button zum Download angezeigt wird. Siehe draw Methode
    isPetriNetFinished: boolean = false;
    isDFGinNet = false;

    availableLayouts = Object.values(Layout); // Extract the enum values as an array
    selectedLayout: Layout = this._svgLayoutService.getLayout(); // Set a default layout

    private _sub: Subscription;
    private _petriNet: InductivePetriNet | undefined;
    private _leftMouseDown = false;
    private zoomInstance = svgPanZoom;
    isZoomed = false;
    zoomLevel: number = 0.5;

    private _markedEdges: SVGLineElement[] = [];
    // to keep track in which event log the lines are drawn
    private _selectedEventLog?: EventLog;
    private _previouslySelected?: EventLog;

    constructor(private _svgService: SvgService,

        private _displayService: DisplayService,
        private _fileReaderService: FileReaderService,
        private _inductiveMinerService: InductiveMinerService,
        private _inductiveMinerHelper: InductiveMinerHelper,
        private _http: HttpClient,
        private _intersectionCalculatorService: IntersectionCalculatorService,
        private _pnmlWriterService: PNMLWriterService,
        private _svgLayoutService: SvgLayoutService,
        private _svgArrowService: SvgArrowService,
        private _fallThroughService: FallThroughService,
        private _snackbar: MatSnackBar
    ) {

        this.fileContent = new EventEmitter<string>();

        this._sub = this._displayService.InductivePetriNet$.subscribe(newNet => {
            this.isDFGinNet = false;
            this._petriNet = newNet;
            this._petriNet.applyNewDFGLayout(this.selectedLayout);
            this.draw();
        });
    }

    ngOnDestroy(): void {
        this._sub.unsubscribe();
        this.fileContent.complete();
    }

    applyLayout() {
        this._petriNet!.applyNewDFGLayout(this.selectedLayout);
        this.draw();
    }

    private noDFGinNet() : boolean {
        if(this.isDFGinNet) {return false}
        this._snackbar.open('No PetriNet initialized yet', 'Close', {
            duration: 3000,
        })
        return true;
    }

    private netFinishedSnackbar() : boolean {
        if(!this.isPetriNetFinished) {return false}
        this._snackbar.open('PetriNet is finished. Please import next EventLog', 'Close', {
            duration: 3000,
        })
        return true;
    }

    applyLayoutToSelectedEventLog() {
        if (this.noDFGinNet()) return;
        if (this.netFinishedSnackbar()) return;
        if (this._selectedEventLog === undefined) {
            this._snackbar.open('No eventlog marked', 'Close', {
                duration: 3000,
            })
            return;
        }
        if (this.selectedLayout === Layout.Sugiyama) {
            return;
        }
        this._petriNet!.applyLayoutToSingleDFG(this._selectedEventLog!);
        this.draw();
    }

    public processDropEvent(e: DragEvent) {
        e.preventDefault();

        const fileLocation = e.dataTransfer?.getData(ExampleFileComponent.META_DATA_CODE);

        if (fileLocation) {
            this.fetchFile(fileLocation);
        } else {
            this.readFile(e.dataTransfer?.files);
        }
    }

    public prevent(e: DragEvent) {
        // dragover must be prevented for drop to work
        e.preventDefault();
    }

    private fetchFile(link: string) {
        this._http.get(link, {
            responseType: 'text'
        }).pipe(
            catchError(err => {
                console.error('Error while fetching file from link', link, err);
                return of(undefined);
            }),
            take(1)
        ).subscribe(content => {
            this.emitFileContent(content);
        })
    }

    private readFile(files: FileList | undefined | null) {
        if (files === undefined || files === null || files.length === 0) {
            return;
        }
        this._fileReaderService.readFile(files[0]).pipe(take(1)).subscribe(content => {
            this.emitFileContent(content);
        });
    }

    private emitFileContent(content: string | undefined) {
        if (content === undefined) {
            return;
        }
        this.fileContent.emit(content);
    }

    private draw() {
        if (this.drawingArea === undefined) {
            console.debug('drawing area not ready yet')
            return;
        }

        this._markedEdges = [];

        this.clearDrawingArea();

        this._svgArrowService.appendArrowMarker(this.drawingArea.nativeElement);

        this.dropLines();
        this._petriNet?.handleBaseCases();
        try {
            const petriGraph = this._petriNet!.getSVGRepresentation();
            for (const node of petriGraph) {
                if (!this.isDFGinNet) {
                    this.isDFGinNet = true;
                }
                this.drawingArea.nativeElement.prepend(node);
            }
        } catch (error) {
            console.log('net not initialized yet')
        }

        this.setSelectedEventLog(this._selectedEventLog);
        // Netz nur herunterladbar, wenn fertig
        this.isPetriNetFinished = this._petriNet!.finished;
    }

    public dropLines() {
        const lines = Array.from(this.drawingArea!.nativeElement.getElementsByTagName('line'));
        lines.forEach(line => line.parentNode?.removeChild(line));
    }

    private clearDrawingArea() {
        const drawingArea = this.drawingArea?.nativeElement;
        if (drawingArea?.childElementCount === undefined) {
            return;
        }

        while (drawingArea.childElementCount > 0) {
            drawingArea.removeChild(drawingArea.lastChild as ChildNode);
        }
    }

    public processMouseDown(e: MouseEvent) {
        if (e.button === 0 && this.drawingArea) {
            this._leftMouseDown = true;
            const targetEventLog = this.isDomEventInEventLog(e);
            if (targetEventLog) {
                this.removeAllDrawnLines();
                const { x, y } = this.calculateSvgCoordinates(e);
                this.drawingArea.nativeElement.appendChild(this._svgService.createDrawnLine(x, y));
                const newEL = this._petriNet?.getEventLogByID(targetEventLog.getAttribute('id') || '');
                if (newEL) {
                    this.setSelectedEventLog(newEL);
                }
            } else {
                this.setSelectedEventLog();
            }
        }
    }

    public isDomEventInEventLog(e: Event) {
        let target = e.target;
        while (target) {
            if (target instanceof SVGElement) {
                if (target.classList.contains('canvas')) {
                    return false;
                } else {
                    if (target.classList.contains('eventLog')) {
                        return target;
                    }
                    target = target.parentNode;
                }
            }
        }
        return undefined;
    }

    private calculateSvgCoordinates(e: MouseEvent) {
        const svgRect = this.drawingArea!.nativeElement.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        return { x, y };
    }

    public processMouseUp(e: MouseEvent) {
        if (e.button === 0) {
            this._leftMouseDown = false;
            const drawnLine = this.drawingArea?.nativeElement.getElementsByClassName('drawn-line')[0] as SVGLineElement;
            let intersectionAndChange = false;
            if (drawnLine) {
                const allLines = this.getAllLines();
                const intersectingLines = allLines.filter(line => this.linesIntersect(drawnLine, line));
                for (const line of intersectingLines) {
                    if (!this.isInEventLog(line)) {
                        console.warn("Line is not in the same event log");
                        continue;
                    }
                    line.classList.add('selectedEdge');
                    if (this._markedEdges.indexOf(line) === -1) {
                        this._markedEdges.push(line);
                        intersectionAndChange = true;
                    }
                }
            }
            if (intersectionAndChange) {
                this.performCut(false);
            }
            this.removeAllDrawnLines();
        }
    }

    private isInEventLog(line: SVGLineElement): boolean {
        const eventLogID = line.parentElement?.getAttribute('id');
        if (eventLogID && eventLogID.startsWith('eventLogNumber')) {
            return this._selectedEventLog === this._petriNet?.getEventLogByID(eventLogID);
        }
        return false;
    }

    private getAllLines(): SVGLineElement[] {
        return Array.from(this.drawingArea?.nativeElement.getElementsByTagName('line') || []) as SVGLineElement[];
    }

    private linesIntersect(line1: SVGLineElement, line2: SVGLineElement): boolean {
        // Get the transformed points for each line
        const p1Line1 = this._intersectionCalculatorService.getAbsolutePoint(line1, 'x1', 'y1');
        const p2Line1 = this._intersectionCalculatorService.getAbsolutePoint(line1, 'x2', 'y2');
        const p1Line2 = this._intersectionCalculatorService.getAbsolutePoint(line2, 'x1', 'y1');
        const p2Line2 = this._intersectionCalculatorService.getAbsolutePoint(line2, 'x2', 'y2');

        return this._intersectionCalculatorService.calculateLineIntersection(
            p1Line1.x, p1Line1.y, p2Line1.x, p2Line1.y,
            p1Line2.x, p1Line2.y, p2Line2.x, p2Line2.y
        ) !== null;
    }

    private removeAllDrawnLines() {
        let lines = this.drawingArea?.nativeElement.getElementsByClassName('drawn-line');
        if (!lines) {
            return;
        }
        // need to save number of lines before removing them, because the collection gets smaller when removing
        const numberLines = lines.length;
        for (let i = 0; i < numberLines; i++) {
            lines[i].remove();
        }
    }

    public processMouseMove(e: MouseEvent) {
        if (this._leftMouseDown) {
            const line = this.drawingArea?.nativeElement.getElementsByClassName('drawn-line')[0];
            if (!line) {
                return;
            }
            const { x, y } = this.calculateSvgCoordinates(e);
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', y.toString());
        }
    }

    private setSelectedEventLog(eventLog?: EventLog) {
        if (eventLog) {
            if (eventLog !== this._previouslySelected && eventLog !== this._selectedEventLog) {
                this.resetCut();
            }
            this._selectedEventLog = eventLog;
            this._previouslySelected = undefined;
            this._petriNet!.selectDFG(this._selectedEventLog!);
        } else {
            if(this._selectedEventLog) {
                this._previouslySelected = this._selectedEventLog;
            }
            this._selectedEventLog = undefined;
            this._petriNet!.selectDFG();
        }
        this.selectedEventLogChange.emit(eventLog);
    }

    public get selectedEventLog() {
        return this._selectedEventLog;
    }

    public resetDFGNodeHighlighting() {
        this._petriNet!.removeHighlightingFromEventLogDFGNodes();
    }

    public resetCut() {
        if (this.noDFGinNet()) return;
        if (this.netFinishedSnackbar()) return;
        this.resetDFGNodeHighlighting();
        this._markedEdges.forEach(edge => {
            edge.classList.remove('selectedEdge');
        });
        this._markedEdges = [];
        this.setSelectedEventLog();
    }

    public performCut(applyResultToPetriNet: boolean) {
        if (this.noDFGinNet()) return;
        if (this.netFinishedSnackbar()) return;
        if (this._markedEdges.length === 0) { //if any edge is marked, an event log is or was selected
            this._snackbar.open('No edges marked', 'Close', {
                duration: 3000,
            })
            return;
        }

        const markedEdges: Edge[] = []
        for (const edge of this._markedEdges) {
            const from = edge.getAttribute('from')
            const to = edge.getAttribute('to')
            if (from === null || to === null) {
                console.log('from or to is null', edge)
                continue;
            }

            markedEdges.push(new Edge(new DFGElement(new TraceEvent(from)), new DFGElement(new TraceEvent(to))));
        }
        console.log('markedEdges: ', markedEdges)

        let eventLogToCutIn;
        if (this._selectedEventLog) {
            eventLogToCutIn = this._selectedEventLog;
        } else {
            eventLogToCutIn = this._previouslySelected;
        }

        if (applyResultToPetriNet) {
            try {
                const result = this._inductiveMinerService.applyInductiveMiner(eventLogToCutIn!, markedEdges);
                console.log('cut result: ', result);
                this._petriNet?.handleCutResult(result.cutMade, eventLogToCutIn!, result.el[0], result.el[1])
                this.draw();
                this._snackbar.open(`Executed ${result.cutMade} Cut`, 'Close', {
                    duration: 3000,
                })
            } catch (Error) {
                console.log('no cut possible', Error);
                this._snackbar.open('No Cut possible', 'Close', {
                    duration: 3000,
                })
            }
        } else {
            try { // always an eventlog selected
                const result = this._inductiveMinerService.applyInductiveMiner(this._selectedEventLog!, markedEdges);
                this._petriNet?.highlightSubsetInDFG(this._selectedEventLog!, result.el[0]);
            } catch (Error) {
                this.resetDFGNodeHighlighting();
            }
        }
    }

    public applyFallThrough() {
        if (this.noDFGinNet()) return;
        if (this.netFinishedSnackbar()) return;
        if (this._selectedEventLog === undefined) {
            this._snackbar.open('No eventlog marked', 'Close', {
                duration: 3000,
            })
            return;
        }

        // Prüfe, ob ein Cut möglich ist
        const cutResult = this._inductiveMinerService.checkInductiveMiner(this._selectedEventLog);
        if (cutResult) {
            this._snackbar.open(`No Fall Through possible. Possible cut: ${cutResult}`, 'Close', {
                duration: 3000,
            })
            return;
        } 

        let result: EventLog[] = [];
        result = this._fallThroughService.getActivityOncePerTrace(this._selectedEventLog);
        if (result.length != 0) { // ActivityOncePerTrace erfolgreich
            this._petriNet?.handleCutResult(Cuts.Parallel, this._selectedEventLog, result[0], result[1])
            this._snackbar.open(`ActivityOncePerTrace Fall Through applied`, 'Close', {
                duration: 3000,
            })
        } else { // Flower Model
            result = this._fallThroughService.getFlowerModel(this._selectedEventLog);
            this._petriNet?.handleFlowerModelFallThrough(this._selectedEventLog, result)
            this._snackbar.open(`Flower Model Fall Through applied`, 'Close', {
                duration: 3000,
            })
        }
        
        this.draw();
        return;
    }

    downloadPetriNet(type: string) {
        if (this.noDFGinNet()) return;
        if (!this.isPetriNetFinished) {
            this._snackbar.open('Petri net not finished yet', 'Close', {
                duration: 3000,
            })
            return;
        }
        const link = document.createElement('a');
        let content = 'type didn\'t match available export format';
        if (type === 'pnml') {
            content = this._pnmlWriterService.createPnmlForPetriNet(this._petriNet!);
            link.download = 'output.pnml';
        } else if (type === 'json') {
            content = this._pnmlWriterService.createJSONForPetriNet(this._petriNet!);
            link.download = 'output.json';
        }
        const blob = new Blob([content]);
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }

    applyZoom() {

        if (this.drawingArea != null) {
            this.zoomInstance = svgPanZoom(this.drawingArea.nativeElement, {
                // viewportSelector: '.svg-pan-zoom_viewport'
                panEnabled: false
                , controlIconsEnabled: true
                , zoomEnabled: true
                , dblClickZoomEnabled: false
                , mouseWheelZoomEnabled: true
                , preventMouseEventsDefault: true
                , zoomScaleSensitivity: 0.2
                , minZoom: 0.5
                , maxZoom: 10
                , fit: true
                , contain: false
                , center: true
                , refreshRate: 'auto'
                , beforeZoom: function () { }
                , onZoom: function () { }
                , beforePan: function (odPan, newPan) {
                    const isLeftMouseClick = svgPanZoom;

                    if (this.panEnabled) {
                        return false;
                    }
                    return newPan;
                }
                , onPan: function () { }
                , onUpdatedCTM: function () { }

            });
        }
    }

    onClick(e: MouseEvent) {
        this.zoomLevel = this.zoomLevel + 0.5;
        this.isZoomed = !this.isZoomed;
        this.applyZoom()

    }
}
