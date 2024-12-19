import { SvgService } from "src/app/services/svg.service";
import { EventLog } from "../../event-log/event-log";
import { TraceEvent } from "../../event-log/trace-event";
import { Edge } from "../edgeElement";
import { CustomElement } from "./element";


export class EventLogDFG extends CustomElement{
    static logCounter: number = 0;
    eventLog: EventLog;

    
    constructor(private _svgService: SvgService, 
                        eventLog: EventLog) {
        super();
        this.eventLog = eventLog;
        this.id = 'eventLogNumber' + (EventLogDFG.logCounter).toString();
        EventLogDFG.logCounter ++;
        this._svgElement = this._svgService.createSVGforEventLog(this.eventLog, this.id)
    }

    public override getSvg() : SVGElement {
        return this._svgElement!;
    }

    public set dfgRepresentation(value: SVGElement) {
        this._svgElement = value;
    }

    override setXYonSVG(xNew: number, yNew: number) {
        this.x = xNew;
        this.y = yNew;

        //Variante A: Ausnutzen von transform translate bzgl der Gruppe
        this._svgElement!.setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')');
        this._svgElement!.setAttribute('cx', xNew.toString());
        this._svgElement!.setAttribute('cy', yNew.toString());


        //Variante B: OffSet der einzelnen Elemente und des Rectangles einzeln
        /* const container = Array.from(this._svgElement!.children!);
        container.forEach(element => {
            console.log(xNew, yNew);
            //x und y koordinaten der enthaltenen Elemente anpassen
            const xInRectangle = parseFloat(element.getAttribute('cx') || '0');
            const yInRectangle = parseFloat(element.getAttribute('cy') || '0');
            element.setAttribute('cx', (xInRectangle + xNew).toString());
            element.setAttribute('cy', (yInRectangle + yNew).toString());
        });
        const rects = this._svgElement!.getElementsByTagName('rect');
        rects[0].setAttribute('transform', 'translate(' + xNew + ',' + yNew + ')'); */
    }
    
    public override getCenterXY(): { x: number; y: number; } {
        let centerX = (this.x + this.getWidth()) / 2
        let centerY = (this.y + this.getHeight()) / 2
        return {x: centerX, y: centerY};
    }
}

