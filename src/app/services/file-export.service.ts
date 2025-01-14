import { Injectable } from '@angular/core';
import { create } from 'xmlbuilder2';
import { InductivePetriNet } from '../classes/Datastructure/InductiveGraph/inductivePetriNet';

@Injectable({
    providedIn: 'root'
})

export class PNMLWriterService {
    private xmlDoc: any; // The XML document structure

    ///////////////////////
    /// * CREATE PNML * ///
    ///////////////////////
    
    public createJSONForPetriNet(petriNet: InductivePetriNet): string {
        const jsonFormat: any = {
            places: petriNet.Places.map((p) => p.id),
            transitions: petriNet.Transitions.map((t) => t.id),
            arcs: {},
            actions: [...new Set(petriNet.Transitions.map((t) => t.event).filter(Boolean))], // Unique non-null labels
            labels: {},
            marking: {"p0": 1},
            layout: {},
        };
    
        // Process arcs
        petriNet.Arcs.forEach((arc) => {
            const key = `${arc.start.id},${arc.end.id}`;
            jsonFormat.arcs[key] = 1;
        });
    
        // Process labels
        petriNet.Transitions.forEach((t) => {
            if (t.event) {
                jsonFormat.labels[t.id] = t.event;
            }
        });
    
        // Generate layout
        petriNet.Places.forEach((place) => {
            jsonFormat.layout[place.id] = place.getCenterXY();
        });

        petriNet.Transitions.forEach((transition) => {
            jsonFormat.layout[transition.id] = transition.getCenterXY();
        });

        // Convert to JSON string with modified formatting
        let jsonString = JSON.stringify(jsonFormat, null, 4);

        // Fix for places and transitions arrays to be single-line
        jsonString = jsonString.replace(/"places": \[\s+([\s\S]*?)\s+\]/, (match, p1) => {
            const singleLinePlaces = p1.trim().replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ');
            return `"places": [${singleLinePlaces}]`;
        })
        .replace(/"transitions": \[\s+([\s\S]*?)\s+\]/, (match, p1) => {
            const singleLineTransitions = p1.trim().replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ');
            return `"transitions": [${singleLineTransitions}]`;
        })
        .replace(/"actions": \[\s+([\s\S]*?)\s+\]/, (match, p1) => {
            const singleLineActions = p1.trim().replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ');
            return `"actions": [${singleLineActions}]`;
        });
        return jsonString;
    }


    ///////////////////////
    /// * CREATE PNML * ///
    ///////////////////////

    public createPnmlForPetriNet(petriNet: InductivePetriNet): string {
        this.xmlDoc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('pnml')
        .ele('net');

        //Transitionen hinzufügen
        petriNet.Transitions.forEach(transition => {
            this.addTransition(transition.id, transition.event, transition.getCenterXY().x.toString(), transition.getCenterXY().y.toString())
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
        petriNet.Arcs.forEach((arc, index) => {
            this.addArc(('arc' + index), arc.start.id, arc.end.id)
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
        .ele('inscription')
        .ele('text')
        .txt('1')
        .up()
        .up()
        .up();
    }
}