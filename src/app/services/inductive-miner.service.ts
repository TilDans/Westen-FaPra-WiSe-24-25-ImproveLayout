import { Injectable } from '@angular/core';
import { EventLog } from '../classes/event-log/event-log';
import { Trace } from '../classes/event-log/trace';
import { TraceEvent } from '../classes/event-log/trace-event';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor() {}

    public applyInductiveMiner(eventLog: EventLog, edges: Trace[]): any {
    const splitEventlogs: EventLog[] = this.checkSequenceCut(eventLog, edges); // WIP
    //checkExclusiveCut
    //...
    }


  // Aktuell geht man davon aus, dass ein cut in Form eines Arrays von Traces dargestellt wird (also ein eigner eventLog). 
  // Beispiel: cut: Trace[] = ['AB', 'AC'] / cut: Trace[] = ['BD', 'CD']
    private checkSequenceCut(eventLog: EventLog, edges: Trace[]): EventLog[] { // Wir übergeben einen eventlog und einen cut-Vorschlag

    // Deklaration neuer, geteilter eventlogs
    let A1: EventLog = new EventLog([]);
    let A2: EventLog = new EventLog([]);

    var cutPossible: boolean = false; // Abbruchbedingung, wenn in einem Trace keine Kante gefunden wurde
    let usedEdges: Set<Trace> = new Set<Trace>; // Hilfsvariable, um zu prüfen, ob alle übergebenen Kanten verwendet wurden
    const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventLog); // Map, um später Bedingungen prüfen zu können

    for (const eventLogTrace of eventLog.traces) { // Traversiere durch jeden Trace im eventlog
        cutPossible = false; // Initial ist noch keine Kante im akt. trace im eventlog gefunden
        
        // Deklaration von traces zum Befüllen geteilter eventlogs
        let A1Trace: Trace = new Trace([]);
        let A2Trace: Trace = new Trace([]);

        for (const cEdge of edges) { // Prüfe jede Kante einzeln
            
            // Überprüfe, ob akt. Kante im akt. eventlog trace ist
            const indexOfCutInTrace = eventLogTrace.events.toString().indexOf(cEdge.events.toString()); 

            if (indexOfCutInTrace !== -1) { // wenn akt. cut-Vorschlag im akt. eventlog trace gefunden
                cutPossible = true;
                usedEdges.add(cEdge);

                // Deklaration von helperSets, anhand dessen man später Bedingungen prüft
                let A1HelperSet: Set<string> = new Set();
                let A2HelperSet: Set<string> = new Set();
    
                // Fülle den linken Trace
                // Traversiere dafür vom vom Anfang des akt. eventlog-traces bis zum INDEX DES JEWEILIGEN CUTS 
                for (let i = 0; i <= indexOfCutInTrace; i++) {
                    A1Trace.events.push(new TraceEvent(eventLogTrace.events[i].conceptName))
                    A1HelperSet.add(eventLogTrace.events[i].conceptName); // Fülle helperSets
                }

                // Fülle den rechten Trace
                // Traversiere dafür vom INDEX DES JEWEILIGEN CUTS bis zum Ende des akt. eventlog-traces
                for (let i = indexOfCutInTrace; i < eventLogTrace.events.length; i++) {
                    A2Trace.events.push(new TraceEvent(eventLogTrace.events[i].conceptName))
                    A2HelperSet.add(eventLogTrace.events[i].conceptName); // Fülle helperSets
                }

                // A1 und A2 dürfen keine intersection haben
                for (const e of A1HelperSet) {
                    if (A2HelperSet.has(e)) {
                        throw Error;
                    }
                }
                // A1 und A2 sollten alle events umfassen
                const unionA1A2: Set<string>  = new Set([...A1HelperSet, ...A2HelperSet]);
                const uniqueActivities: Set<string>  = this.getUniqueActivities(eventLog);
                if (!this.compareSets(unionA1A2, uniqueActivities)) throw Error;

                /*
                1. für jede Aktivität in 𝐴1 gibt es in 𝐷 einen Weg zu jeder Aktivität in 𝐴2,
                2. für keine Aktivität in 𝐴2 gibt es in 𝐷 einen Weg zu einer Aktivität in 𝐴1.
                */
                // 1:
                for (const cEvent of A1Trace.events) {
                    const reachableActivities = this.getAllReachableActivities(eventlogMap, cEvent);
                    if (!(this.compareSets(reachableActivities, A2HelperSet))) throw Error; // Alle erreichbaren Aktivitäten müssen in A2 sein!
                }

                // 2:
                for (const cEvent of A2Trace.events) {
                    const reachableActivities = this.getAllReachableActivities(eventlogMap, cEvent);
                    if (this.compareSets(reachableActivities, A1HelperSet)) throw Error; // Alle erreichbaren Aktivitäten müssen in A1 sein!
                }

                break; // Wenn akt. Kante in akt. trace gefunden, können restliche Kanten im akt. trace übersprungen werden
            } 

        }; // End-Loop: Cut-Vorschläge
        if (!cutPossible) throw Error; // Wenn in einem trace keiner der vorgeschlagenen Kanten zu finden war, Loop unterbrechen

        // Befülle neue, geteilte eventlogs mit konstruierten traces
        A1.traces.push(A1Trace);
        A2.traces.push(A2Trace)

    } // End-Loop: Traces in eventlog
    // ###Redundant: if (!cutPossible) throw Error;

    // Wenn einer der Kanten nicht im Eventlog zu finden war, abbrechen:
    let originalEdges: Set<Trace> = new Set(edges);
    if (!(usedEdges.size === originalEdges.size && [...usedEdges].every((x) => originalEdges.has(x)))) throw Error; // Konvertiere Kanten zu Set und vergleiche

    // Wenn alle Bedingungen erfolgreich: Returne zwei eventlogs
    return [A1, A2];
    }

    // Gebe jeden direkten und indirekten Nachfolger eines Events zurück (rekursiv: DFS)
    private getAllReachableActivities(map: Map<string, string[]>, traceEvent: TraceEvent): Set<string> {
        const reachableActivities = new Set<string>();
        
        function dfs(activity: string) {
            if (reachableActivities.has(activity)) return;  // Wenn traceEvent bereits besucht, überspringe 
            reachableActivities.add(activity);
            
            const neighbors = map.get(activity);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    dfs(neighbor);  // Recursively visit neighbors
                }
            }
        }
        
        dfs(traceEvent.conceptName);
        return reachableActivities;
    }

    // Wandelt einen eventlog in eine Map vom Typ "Map<string, string[]>" um
    private parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
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

    // Gibt alle einzigartigen Akitivtäten aus einem eventlog zurück
    private getUniqueActivities(eventlog: EventLog): Set<string> {
        const activities = new Set<string>();
        for (const trace of eventlog.traces) {
            trace.events.forEach(traceEvent => activities.add(traceEvent.conceptName));
        }
        return activities;
    }

    //Vergleicht zwei Sets
    //Return true, wenn die Sets identisch sind
    private compareSets(a: Set<string>, b: Set<string>): boolean {
        // Prüfe Sets: 1. Gleiche Länge, 2. Einträge im ersten Set müssen im 2. vorhanden sein
        if (!(a.size === b.size && [...a].every((x) => b.has(x)))) return true;
        return false;
    }
}