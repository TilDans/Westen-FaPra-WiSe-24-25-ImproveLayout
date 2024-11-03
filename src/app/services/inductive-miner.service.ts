import { Injectable } from '@angular/core';
import { EventLog } from '../classes/event-log/event-log';
import { Trace } from '../classes/event-log/trace';
import { TraceEvent } from '../classes/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor() {}

    public applyInductiveMiner(eventLog: EventLog, cutTraces: Trace[]): any {
    this.checkSequenceCut(eventLog, cutTraces); // WIP
    //checkExclusiveCut
    //...
    }


  // Aktuell geht man davon aus, dass ein cut in Form eines Arrays von Traces dargestellt wird (also ein eigner eventLog). 
  // Beispiel: cut: Trace[] = ['AB', 'AC'] / cut: Trace[] = ['BD', 'CD']
    private checkSequenceCut(eventLog: EventLog, cutTraces: Trace[]): EventLog[] { // Wir übergeben einen eventlog und einen cut-Vorschlag

    var cutPossible;
    for (const eventLogTrace of eventLog.traces) { // Traversiere durch jeden Trace im eventlog
        // Deklaration neuer, geteilter eventlogs
        let A1: EventLog;
        let A2: EventLog;
        cutPossible = false; // Hilfsvariable für Abbruchbedingung
        
        for (const cutTrace of cutTraces) { // Prüfe jeden cut-Vorschlag einzeln
            // Deklaration von Hilfsarrays, anhand dessen man später Bedingungen prüft
            let A1Helper: string[] = [];
            let A2Helper: string[] = [];

            // Überprüfe, ob akt. cut überhaupt im akt. eventlog trace ist
            const indexOfCutInTrace = eventLogTrace.events.toString().indexOf(cutTrace.events.toString()); 
            if (indexOfCutInTrace !== -1) { // wenn akt. cut-Vorschlag im akt. eventlog trace gefunden
        
                cutPossible = true;
                // Deklaration von TraceEvent Objekten
                let A1TraceEvent: TraceEvent[] = [];
                let A2TraceEvent: TraceEvent[] = [];

                // Konstruiere das linke TraceEvents
                // Traversiere dafür vom vom Anfang des akt. eventlog-traces bis zum INDEX DES JEWEILIGEN CUTS 
                for (let i = 0; i <= indexOfCutInTrace; i++) {
                    A1TraceEvent.push(new TraceEvent(eventLogTrace.events[i].conceptName))
                    A1Helper.push(eventLogTrace.events[i].conceptName); // Fülle Hilfsarray
                }
                // Konstruiere das rechte TraceEvents
                // Traversiere dafür vom INDEX DES JEWEILIGEN CUTS bis zum Ende des akt. eventlog-traces
                for (let i = indexOfCutInTrace; i < eventLogTrace.events.length; i++) {
                    A2TraceEvent.push(new TraceEvent(eventLogTrace.events[i].conceptName))
                    A2Helper.push(eventLogTrace.events[i].conceptName); // Fülle Hilfsarray
                }

                // A1 und A2 sollten keine Intersection haben
                if (A1Helper.some(r=> A2Helper.includes(r))) throw Error;
                // A1 und A2 sollten alle events umfassen
                const unionA1A2 = new Set([...A1Helper, ...A2Helper]);
                const uniqueActivities = this.getUniqueActivities(eventLog);
                // Prüfe Sets: 1. Gleiche Länge, 2. Einträge im ersten Set müssen im 2. vorhanden sein
                if (!(unionA1A2.size === uniqueActivities.size && [...unionA1A2].every((x) => uniqueActivities.has(x)))) throw Error;

                /*
                für jede Aktivität in 𝐴1 gibt es in 𝐷 einen Weg zu jeder Aktivität in 𝐴2,
                für keine Aktivität in 𝐴2 gibt es in 𝐷 einen Weg zu einer Aktivität in 𝐴1.
                */
               // Um Transitionen nachvollziehen zu können, um die Bedingungen zu prüfen, soll eine Map verwendet werden
                const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventLog);

                // TODO: Bedingungen prüfen (eigene Funktion?)


                break; // Wenn akt. cut in akt. trace gefunden, können restliche cuts im akt. trace übersprungen werden
            } 


        }; // End-Loop: Cut-Vorschläge
        if (!cutPossible) break; // Wenn in einem trace keiner der vorgeschlagenen Cuts zu finden war, Loop unterbrechen

        // TODO: Erstellte Traces u.U. in die eventlogs A1 und A2 pushen

    } // End-Loop: Traces in eventlog
    // Wenn in einem trace des eventlogs kein cut zu finden war, abbrechen
    if (!cutPossible) throw Error; // vorübergehend

    // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs / Wenn nicht, dann Error
    return [eventLog];
    }

    parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
        // Parse zunächst in ein Array von Strings
        let eventlogAsArray: string[] = [];

        for (const trace of eventlog.traces) {
            let helperTrace: string = '';
            for (const traceEvent of trace.events ) {
                helperTrace += traceEvent.conceptName;    
            }
            eventlogAsArray.push(helperTrace);
        };

        // Initialisiere eine Map
        const eventlogMap = new Map<string, string[]>();

        // Iteriere über jede Sequenz im Eventlog
        eventlogAsArray.forEach(trace => {
            // Iteriere über jeden Buchstaben im trace
            for (let i = 0; i < trace.length; i++) {
                const currentEvent = trace[i];

                // Falls das aktuelle Ereignis noch nicht in der Map ist, initialisiere es
                if (!eventlogMap.has(currentEvent)) {
                    eventlogMap.set(currentEvent, []);
                }

                // Falls es ein nachfolgendes Ereignis gibt, füge es der Liste der Transitionen hinzu
                if (i + 1 < trace.length) {
                    const nextEvent = trace[i + 1];
                    const currentTransitions = eventlogMap.get(currentEvent)!;

                    // Nur hinzufügen, wenn es noch nicht vorhanden ist
                    if (!currentTransitions.includes(nextEvent)) {
                        currentTransitions.push(nextEvent);
                    }
                }
            }
        });

        // Sortiere die Listen der Transitionen für konsistente Ausgaben
        eventlogMap.forEach((value, _) => {
            value.sort();
        });

        return eventlogMap;
}

    getUniqueActivities(eventlog: EventLog): Set<string> {
        const activities = new Set<string>();
        for (const trace of eventlog.traces) {
            trace.events.forEach(traceEvent => activities.add(traceEvent.conceptName));
        }
        return activities;
    }
}