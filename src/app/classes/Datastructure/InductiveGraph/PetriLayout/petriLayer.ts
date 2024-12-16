import { BehaviorSubject } from "rxjs";
import { CustomElement } from "../Elements/element";

export class PetriLayer extends Array<CustomElement>{
    private _maxWidth = 0;

    constructor(element: CustomElement) {
        super(element);
        this._maxWidth = parseFloat(element.getSvg()!.getAttribute('width')!);
        new Proxy(this, {
            set: (target, property, value) => {
                target[property as any] = value;
                if (!isNaN(Number(property))) {
                    //sollte bei Änderung des Arrays aufgerufen werden 
                    this.calcMaxMinWidth();
                }
                return true;
            }
        });
    }

    // neues minMax kalkulieren
    calcMaxMinWidth() {        
        this.forEach( element => {
            const currWidth = parseFloat(element.getSvg()!.getAttribute('width')!);
            if (currWidth > this._maxWidth) {
                this._maxWidth = currWidth;
            }
        })
    }
}