import { CustomArray } from "../../customArray";
import { CustomElement } from "../Elements/element";
import { InductivePetriNet } from "../inductivePetriNet";
import { PetriLayer } from "./petriLayer";


export class PetriLayerContainer extends CustomArray<PetriLayer> {

    constructor(firstElement: CustomElement, secondElement: CustomElement, thirdElement: CustomElement) {
        super();
        this[0] = new PetriLayer(firstElement);
        this[1] = new PetriLayer(secondElement);
        this[2] = new PetriLayer(thirdElement);
    }

    override remove(item: CustomElement) {
        const number = this.findIndex(petriLayer => petriLayer.includes(item));
        if(number !== -1) {
            this[number].remove(item);
        }
    }

    override updateElem(toRemove: CustomElement, toInsert: CustomElement): void {
        this[this.findIndex(petriLayer => petriLayer.includes(toRemove))].updateElem(toRemove, toInsert);
    }

    public getLayerCoordinates(layerIndex: number) {
        return {minX: this[layerIndex].minX, maxX: this[layerIndex].maxX};
    }

    public getCollidingLayer(xVal: number) {
        const xValMin = xVal - (InductivePetriNet.horizontalOffset / 2);
        const xValMax = xVal + (InductivePetriNet.horizontalOffset / 2);
        for (const layer of this) {
            if (layer.isValueInLayer(xVal) || layer.isValueInLayer(xValMin) || layer.isValueInLayer(xValMax)) {
                return this.indexOf(layer);
            }
        }
        return undefined;
    }

    // Layer bis zum genannten item nach hinten schieben sowie neues mit dem Element einfügen davor
    public insertToNewLayerBeforeCurrentElement(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.findIndex(petriLayer => petriLayer.includes(formerElement));
        if (layerIndex == -1) {
            console.log(`Something went wrong, element not contained within the layers`);
        } else {
            //Elemente von hinten an nach rechts schieben, jeweils auf index + 1.
            for (let i = this.length - 1; i >= layerIndex; i --) {
                this [i + 1] = this [i];
            }
            //vorheriges Element durch neues ersetzen
            this[layerIndex + 1][this[layerIndex + 1].indexOf(formerElement)] = replacingElement;
            //weiteres Element in neu erzeugtes Layer vor dem bisherigen einfügen
            this[layerIndex] = new PetriLayer(newElement);
        }
    }

    // Layer ab dem genannten item nach hinten schieben.
    public insertToNewLayerAfterCurrentElement(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.findIndex(petriLayer => petriLayer.includes(formerElement));
        if (layerIndex == -1) {
            console.log(`Something went wrong, element not contained within the layers`);
        } else if (layerIndex == this.length - 1) { //letztes Layer im Petrinetz
            //vorheriges Element durch neues ersetzen
            this[layerIndex][this[layerIndex].indexOf(formerElement)] = replacingElement;
            //neues Layer am Ende hinzufügen
            this.push(new PetriLayer(newElement));
        } else {
            //Elemente von hinten an nach rechts schieben, jeweils auf index + 1. Zuletzt wird layerIndex + 2 geschrieben.
            for (let i = this.length - 1; i > layerIndex; i --) {
                this [i + 1] = this [i];
            }
            //vorheriges Element durch neues ersetzen
            this[layerIndex][this[layerIndex].indexOf(formerElement)] = replacingElement;
            //weiteres Element in neu erzeugtes Layer einfügen
            this[layerIndex + 1] = new PetriLayer(newElement);
        }
    }

    // Layer ab dem genannten item nach hinten schieben.
    public insertToExistingLayerAfterCurrentElement(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.findIndex(petriLayer => petriLayer.includes(formerElement));
        if (layerIndex == -1) { //Element nicht vorhanden
            console.log(`Something went wrong, element not contained within the layers`);
        } else {
            //Index des gerade zu bearbeitenden Layers
            const currentLayer = this[layerIndex];
            //Index des zu bearbeitenden Elements
            const indexInLayer = currentLayer.indexOf(formerElement);
            if (indexInLayer == currentLayer.length - 1) { //Element befindet sich am Ende der Liste
                //vorheriges Element durch neues ersetzen
                currentLayer[indexInLayer] = replacingElement;
                //weiteres Element einfügen
                currentLayer.push(newElement);
            } else {
                //Elemente nach rechts schieben, letztes Element ist indexInLayer + 2.
                for (let i = currentLayer.length - 1; i > indexInLayer; i --) {
                    this [i + 1] = this [i];
                }
                //vorheriges Element durch neues ersetzen
                currentLayer[indexInLayer] = replacingElement;
                //weiteres Element in bestehendes Layer einfügen
                currentLayer[indexInLayer + 1] = newElement;
            }
        }
    }

}
