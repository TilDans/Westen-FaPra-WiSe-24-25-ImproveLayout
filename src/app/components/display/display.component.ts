import {Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild} from '@angular/core';
import {DisplayService} from '../../services/display.service';
import {catchError, of, Subscription, take} from 'rxjs';
import {SvgService} from '../../services/svg.service';
import {ExampleFileComponent} from "../example-file/example-file.component";
import {FileReaderService} from "../../services/file-reader.service";
import {HttpClient} from "@angular/common/http";
import {InductivePetriNet} from 'src/app/classes/Datastructure/InductiveGraph/inductivePetriNet';
import {InductiveMinerService} from "../../services/inductive-miner/inductive-miner.service";
import {TraceEvent} from "../../classes/Datastructure/event-log/trace-event";
import {Edge} from "../../classes/Datastructure/InductiveGraph/edgeElement";
import {DFGElement} from "../../classes/Datastructure/InductiveGraph/Elements/DFGElement";
import {IntersectionCalculatorService} from "../../services/intersection-calculator.service";
import { PNMLWriterService } from 'src/app/services/file-export.service';
import { Layout } from 'src/app/classes/Datastructure/enums';
import { SvgLayoutService } from 'src/app/services/svg-layout.service';
import { SvgArrowService } from 'src/app/services/svg-arrow.service';

@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.css']
})
export class DisplayComponent implements OnDestroy {

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;

    @Output('fileContent') fileContent: EventEmitter<string>;

    //Bedingung, damit der Button zum Download angezeigt wird. Siehe draw Methode
    isPetriNetFinished: boolean = false;

    availableLayouts = Object.values(Layout); // Extract the enum values as an array
    selectedLayout: Layout = this._svgLayoutService.getLayout(); // Set a default layout

    private _sub: Subscription;
    private _petriNet: InductivePetriNet | undefined;
    private _leftMouseDown = false;

    private _markedEdges: SVGLineElement[] = [];
    // to keep track in which event log the lines are drawn
    private _selectedEventLogId?: string;

    constructor(private _svgService: SvgService,
                private _displayService: DisplayService,
                private _fileReaderService: FileReaderService,
                private _inductiveMinerService: InductiveMinerService,
                private _http: HttpClient,
                private _intersectionCalculatorService: IntersectionCalculatorService,
                private _pnmlWriterService: PNMLWriterService,
                private _svgLayoutService: SvgLayoutService,
                private _svgArrowService: SvgArrowService,
    ) {

        this.fileContent = new EventEmitter<string>();

        this._sub = this._displayService.InductivePetriNet$.subscribe(newNet => {
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
        this._selectedEventLogId = undefined;

        this.clearDrawingArea();

        this._svgArrowService.appendArrowMarker(this.drawingArea.nativeElement);

        this.dropLines();
        this._petriNet?.handleBaseCases();
        try {
            const petriGraph = this._petriNet!.getSVGRepresentation();
            for (const node of petriGraph) {
                this.drawingArea.nativeElement.prepend(node);
            }
        } catch (error) {
            console.log('net not initialized yet')
        }
       
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
            this.removeAllDrawnLines();
            const {x, y} = this.calculateSvgCoordinates(e);
            this.drawingArea.nativeElement.appendChild(this._svgService.createDrawnLine(x, y));
        }
    }

    private calculateSvgCoordinates(e: MouseEvent) {
        const svgRect = this.drawingArea!.nativeElement.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const y = e.clientY - svgRect.top;
        return {x, y};
    }

    public processMouseUp(e: MouseEvent) {
        if (e.button === 0) {
            this._leftMouseDown = false;
            const drawnLine = this.drawingArea?.nativeElement.getElementsByClassName('drawn-line')[0] as SVGLineElement;
            if (drawnLine) {
                const allLines = this.getAllLines();
                const intersectingLines = allLines.filter(line => this.linesIntersect(drawnLine, line));
                for (const line of intersectingLines) {
                    if (!this.isInEventLog(line)) {
                        console.warn("Line is not in the same event log");
                        continue;
                    }
                    line.classList.add('selectedEdge');
                    this._markedEdges.push(line);
                }
            }
            this.removeAllDrawnLines();
        }
    }

    private isInEventLog(line: SVGLineElement): boolean {
        if (this._selectedEventLogId === undefined) {
            this._selectedEventLogId = line.parentElement?.getAttribute('id') || undefined;
            return this._selectedEventLogId !== undefined;
        }
        return this._selectedEventLogId === line.parentElement!.getAttribute('id');
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
            const {x, y} = this.calculateSvgCoordinates(e);
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', y.toString());
        }
    }

    public resetCut() {
        this._markedEdges.forEach(edge => {
            edge.classList.remove('selectedEdge');
        });
        this._markedEdges = [];
        this._selectedEventLogId = undefined;
    }

    public performCut() {
        if (this._markedEdges.length === 0 || this._selectedEventLogId === undefined) {
            alert('No edges marked')
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

        const eventLog = this._petriNet!.getMarkedEventLog(this._selectedEventLogId!);
        try {
            const result = this._inductiveMinerService.applyInductiveMiner(eventLog, markedEdges);
            console.log('cut result: ', result);
            this._petriNet?.handleCutResult(result.cutMade, eventLog, result.el[0], result.el[1])
            this.draw();
        } catch (Error) {
            console.log('no cut possible', Error);
        }
    }

    downloadPetriNet(type: string) {
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
}
