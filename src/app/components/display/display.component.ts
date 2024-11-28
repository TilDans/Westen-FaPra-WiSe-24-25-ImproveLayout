import {Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild} from '@angular/core';
import {DisplayService} from '../../services/display.service';
import {catchError, of, Subscription, take} from 'rxjs';
import {SvgService} from '../../services/svg.service';
import {ExampleFileComponent} from "../example-file/example-file.component";
import {FileReaderService} from "../../services/file-reader.service";
import {HttpClient} from "@angular/common/http";
import {EventLog} from 'src/app/classes/Datastructure/event-log/event-log';
import {InductivePetriNet} from 'src/app/classes/Datastructure/InductiveGraph/inductivePetriNet';

@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.css']
})
export class DisplayComponent implements OnDestroy {

    @ViewChild('drawingArea') drawingArea: ElementRef<SVGElement> | undefined;

    @Output('fileContent') fileContent: EventEmitter<string>;

    private _sub: Subscription;
    private _petriNet: InductivePetriNet | undefined;
    private _leftMouseDown = false;

    private _markedEdges: SVGLineElement[] = [];

    constructor(private _svgService: SvgService,
                private _displayService: DisplayService,
                private _fileReaderService: FileReaderService,
                private _http: HttpClient) {

        this.fileContent = new EventEmitter<string>();

        this._sub = this._displayService.InductivePetriNet$.subscribe(log => {
            console.log('new log');

            this._petriNet = log;
            this.draw();
        });
    }

    ngOnDestroy(): void {
        this._sub.unsubscribe();
        this.fileContent.complete();
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

        this.clearDrawingArea();
        var petriGraph = new Array<SVGElement>;
        if (this._petriNet) {
            petriGraph = this._svgService?.createSvgElements(this._petriNet);
        }
        //petriGraph = {(places), (transitions), arcs, (dfgs)}
        if (petriGraph && Array.isArray(petriGraph)) {  // or ensure it's an iterable
            try {
                for (const node of petriGraph) {
                    this.drawingArea.nativeElement.appendChild(node);
                }
            } catch (error) {
                console.error("Error appending petriGraph:", error);
            }
        } else {
            console.warn("No valid petriGraph found to append.");
        }
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
            if(drawnLine) {
                const allLines = this.getAllLines();
                const intersectingLines = allLines.filter(line => this.linesIntersect(drawnLine, line));
                intersectingLines.forEach(line => line.setAttribute('stroke', 'red'));
                this._markedEdges.push(...intersectingLines);
            }
            this.removeAllDrawnLines();
        }
    }

    private getAllLines(): SVGLineElement[] {
        return Array.from(this.drawingArea?.nativeElement.getElementsByTagName('line') || []) as SVGLineElement[];
    }

    private linesIntersect(line1: SVGLineElement, line2: SVGLineElement): boolean {
        const x1 = parseFloat(line1.getAttribute('x1')!);
        const y1 = parseFloat(line1.getAttribute('y1')!);
        const x2 = parseFloat(line1.getAttribute('x2')!);
        const y2 = parseFloat(line1.getAttribute('y2')!);

        const x3 = parseFloat(line2.getAttribute('x1')!);
        const y3 = parseFloat(line2.getAttribute('y1')!);
        const x4 = parseFloat(line2.getAttribute('x2')!);
        const y4 = parseFloat(line2.getAttribute('y2')!);

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) return false;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
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
        this._markedEdges.forEach(edge => edge.setAttribute('stroke', 'black'));
        this._markedEdges = [];
    }

    public performCut() {

    }
}
