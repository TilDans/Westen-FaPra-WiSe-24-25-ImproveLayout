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

    public insertToNewLayerBeforeElement(layerReference: CustomElement | number, newElement: CustomElement): void {
        let layerIndex: number;

        if (typeof layerReference === "number") {
            // If the argument is a layer index
            layerIndex = layerReference;
        } else {
            // If the argument is a formerElement
            layerIndex = this.getLayer(layerReference);
        }

        // Shift elements to the right from layerIndex onwards
        for (let i = this.length - 1; i >= layerIndex; i--) {
            this[i + 1] = this[i];
        }

        // Insert new element as a new PetriLayer at layerIndex
        this[layerIndex] = new PetriLayer(newElement);
    }

    public insertToNewLayerAfterElement(layerReference: number | CustomElement, newElement: CustomElement) {
        let layerIndex: number;

        if (typeof layerReference === "number") {
            // If the argument is a layer index
            layerIndex = layerReference;
        } else {
            // If the argument is a formerElement
            layerIndex = this.getLayer(layerReference);
        }

        for (let i = this.length - 1; i > layerIndex; i--) {
            this[i + 1] = this[i];
        }
        //weiteres Element in neu erzeugtes Layer einfügen
        this[layerIndex + 1] = new PetriLayer(newElement);
    }

    private getLayer(elem: CustomElement): number {
        return this.findIndex(petriLayer => petriLayer.includes(elem));
    }

    // Layer bis zum genannten item nach hinten schieben sowie neues mit dem Element einfügen davor
    public insertToNewLayerBeforeCurrentElementAndReplaceFormer(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.getLayer(formerElement);
        if (layerIndex == -1) {
            console.log(`Something went wrong, element not contained within the layers`);
        } else {
            this.insertToNewLayerBeforeElement(formerElement, newElement);
            //vorheriges Element durch neues ersetzen
            this.updateElem(formerElement, replacingElement);
        }
    }

    // Layer ab dem genannten item nach hinten schieben.
    public insertToNewLayerAfterCurrentElementAndReplaceFormer(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.getLayer(formerElement);
        if (layerIndex == -1) {
            console.log(`Something went wrong, element not contained within the layers`);
        } else if (layerIndex == this.length - 1) { //letztes Layer im Petrinetz
            //vorheriges Element durch neues ersetzen
            this.updateElem(formerElement, replacingElement);
            //neues Layer am Ende hinzufügen
            this.push(new PetriLayer(newElement));
        } else {
            //Elemente von hinten an nach rechts schieben, jeweils auf index + 1. Zuletzt wird layerIndex + 2 geschrieben.
            this.insertToNewLayerAfterElement(formerElement, newElement);
            //vorheriges Element durch neues ersetzen
            this.updateElem(formerElement, replacingElement);
        }
    }

    // Layer ab dem genannten item nach hinten schieben.
    public insertToExistingLayerAfterCurrentElementAndReplaceFormer(formerElement: CustomElement, replacingElement: CustomElement, newElement: CustomElement) {
        const layerIndex = this.getLayer(formerElement);
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
                    currentLayer[i + 1] = currentLayer[i];
                }
                //vorheriges Element durch neues ersetzen
                currentLayer[indexInLayer] = replacingElement;
                //weiteres Element in bestehendes Layer einfügen
                currentLayer[indexInLayer + 1] = newElement;
            }
        }
    }

}
