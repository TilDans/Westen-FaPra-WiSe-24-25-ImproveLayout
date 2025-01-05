import { Injectable } from '@angular/core';
import { create } from 'xmlbuilder2';
import { InductivePetriNet } from '../classes/Datastructure/InductiveGraph/inductivePetriNet';

@Injectable({
    providedIn: 'root'
})

export class PNMLWriterService {
    private xmlDoc: any; // The XML document structure


    public createPnmlForPetriNet(petriNet: InductivePetriNet): string {
        this.xmlDoc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('pnml')
        .ele('net');

        //Transitionen hinzufügen
        petriNet.Transitions.forEach(transition => {
            this.addTransition(transition.id, transition.id, transition.x.toString(), transition.y.toString())
        });
        //Stellen hinzufügen
        petriNet.Places.forEach(place => {
            if (petriNet.Places.indexOf(place) == 0) {
                this.addPlace(place.id, place.id, place.x.toString(), place.y.toString(), '1')
            } else {
                this.addPlace(place.id, place.id, place.x.toString(), place.y.toString(), '0')
            }
        });
        //Kanten hinzufügen
        let i = 0;
        petriNet.Arcs.forEach(arc => {
            this.addArc(('arc' + i), arc.start.id, arc.end.id)
            i++;
        });
        
        try {
            const xmlString = this.xmlDoc.end({ prettyPrint: true });
            return xmlString;
        } catch (error) {
            console.error(`Error writing XML document: ${error}`);
            return '';
        }
    }

    addTransition(id: string, label: string, xPosition: string, yPosition: string) {
        this.xmlDoc
        .ele('transition', { id })
        .ele('name')
        .ele('text')
        .txt(label)
        .up()
        .up()
        .ele('graphics')
        .ele('position', { x: xPosition, y: yPosition })
        .up()
        .up()
        .up();
    }

    addPlace(id: string, label: string, xPosition: string, yPosition: string, initialMarking: string) {
        this.xmlDoc
        .ele('place', { id })
        .ele('name')
        .ele('text')
        .txt(label)
        .up()
        .up()
        .ele('initialMarking')
        .ele('text')
        .txt(initialMarking)
        .up()
        .up()
        .ele('graphics')
        .ele('position', { x: xPosition, y: yPosition })
        .up()
        .up()
        .up();
    }

    addArc(id: string, source: string, target: string) {
        this.xmlDoc
        .ele('arc', { id, source, target })
        .up();
    }
}