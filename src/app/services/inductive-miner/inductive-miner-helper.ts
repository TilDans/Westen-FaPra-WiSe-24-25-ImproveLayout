import { Injectable } from "@angular/core";
import { EventLog } from "src/app/classes/Datastructure/event-log/event-log";
import { TraceEvent } from "src/app/classes/Datastructure/event-log/trace-event";
import { Edge } from "src/app/classes/Datastructure/InductiveGraph/edgeElement";


@Injectable({
    providedIn: 'root',
})

export class InductiveMinerHelper {
    
    // Prüft, ob Set1 Subset von Set2 ist
    public isSubset(set1: Set<string>, set2: Set<string>): boolean {
        // Prüft, ob alle Elemente in set2 auch in set1 vorhanden sind
        return [...set2].every(element => set1.has(element));
    }

    public hasIntersection(A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);

        for (const e of A1Set) {
            if (A2Set.has(e)) {
                return true;
            }
        }
        return false;
    }

    public isUnion(eventlog: EventLog, A1: EventLog, A2: EventLog): boolean {
        const A1Set: Set<string> = this.parseEventlogToSet(A1);
        const A2Set: Set<string> = this.parseEventlogToSet(A2);
        
        const unionA1A2: Set<string>  = new Set([...A1Set, ...A2Set]);
        const uniqueActivities: Set<string>  = this.getUniqueActivities(eventlog);
        if (unionA1A2.size === uniqueActivities.size && [...unionA1A2].every((x) => uniqueActivities.has(x))) return true;
        
        return false
    }

    public parseEventlogToSet(eventlog: EventLog): Set<string> {
        let eventlogSet: Set<string> = new Set();
        for (const trace of eventlog.traces) {
            for (const traceevent of trace.events) {
                eventlogSet.add(traceevent.conceptName); 
            }
        }
        return eventlogSet;
    }

    // Gebe jeden direkten und indirekten Nachfolger eines Events zurück (rekursiv: DFS)
    public getAllReachableActivities(map: Map<string, string[]>, traceEvent: TraceEvent): Set<string> {
        const initialActivity: string = traceEvent.conceptName;
        const reachableActivities: Set<string> = new Set<string>();
        let isInitialActivityReachable: boolean = false;
        
        function dfs(activity: string) {
            if (reachableActivities.has(activity)) return;  // Wenn traceEvent bereits besucht, überspringe 
            reachableActivities.add(activity);
            
            const neighbors = map.get(activity);
            if (neighbors) {
                for (const neighbor of neighbors) {
                    if (neighbor === initialActivity) {
                        isInitialActivityReachable = true;  // Markiere, wenn der Ausgangszustand erreichbar ist
                    }
                    dfs(neighbor);  // Recursively visit neighbors
                }
            }
        }
        
        dfs(initialActivity);

        // Lösche den initialen Zustand aus den erreichbaren Zuständen, falls er nicht erreichbar ist
        if (!isInitialActivityReachable) {
            reachableActivities.delete(initialActivity);
        }

        return reachableActivities;
    }

    // Wandelt einen eventlog in eine Map vom Typ "Map<string, string[]>" um
    public parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
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
    public getUniqueActivities(eventlog: EventLog): Set<string> {
        const activities = new Set<string>();
        for (const trace of eventlog.traces) {
            trace.events.forEach(traceEvent => activities.add(traceEvent.conceptName));
        }
        return activities;
    }

    // Mappe START-Kanten an STOP-Kanten
    public mapEdgesStartToStop(edges: Edge[]): [string, string][] {
        let startEdges: Edge[] = [];
        let stopEdges: Edge[] = [];

        // Fülle Arrays mit START und STOP Kanten
        for (const edge of edges) {
            if (edge.start.id == 'play' && (edge.end)) startEdges.push(edge);
            if ((edge.start) && edge.end.id == 'stop') stopEdges.push(edge);
        }

        // Erzeuge Paare von START Kanten mit STOP Kanten
        let pairedEdges: [string, string][] = [];
        for (const startEdge of startEdges) {
            for (const stopEdge of stopEdges) {
                pairedEdges.push([startEdge.end.id, stopEdge.start.id]);
            }
        }

        return pairedEdges;
    }

    // Prüfe, ob es in 𝐷 für jede Aktivität in 𝐴1 eine Kante zu jeder Aktivität in 𝐴2 gibt
    public checkDirectNeighbors(eventlog: EventLog, A1: Set<string>, A2: Set<string>): boolean {
        const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventlog);
    
        // Überprüfe für jede Aktivität in A1
        for (const activityA1 of A1) {
            const neighborsA1 = eventlogMap.get(activityA1) || [];
    
            // Für jede Aktivität in A2 prüfen, ob eine Kante von der aktuellen Aktivität aus A1 zu dieser Aktivität existiert
            for (const activityA2 of A2) {
                if (!neighborsA1.includes(activityA2)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Prüfe, ob es für jede Aktivität in 𝐴1 es einen Weg in 𝐷 von 𝑝𝑙𝑎𝑦 über diese Aktivität nach 𝑠𝑡𝑜𝑝, der nur Aktivitäten aus 𝐴1 besucht, gibt
    public checkPathInSublog(eventlog: EventLog, activities: Set<string>): boolean {
        const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventlog);
    
        // Sammle Start- und Stop-Knoten
        const startEdges: Set<string> = new Set();
        const stopEdges: Set<string> = new Set();
        for (const trace of eventlog.traces) {
            if (activities.has(trace.events[0].conceptName)) {
                startEdges.add(trace.events[0].conceptName);
            }
            if (activities.has(trace.events[trace.events.length - 1].conceptName)) {
                stopEdges.add(trace.events[trace.events.length - 1].conceptName);
            }
        }
    
        // Prüfe jede Aktivität aus der zu prüfenden Menge
        for (const activity of activities) {
            let activityReached = false; // Wurde die Aktivität auf einem gültigen Pfad erreicht?
            let stopReached = false; // Kann nach Besuch der Aktivität ein Stop erreicht werden?
    
            const dfs = (current: string, visited: Set<string>, activityVisited: boolean): boolean => {
                if (visited.has(current)) return false;
                visited.add(current);
    
                // Markiere, ob die Aktivität erreicht wurde
                if (current === activity) activityReached = true;
    
                // Wenn ein Stop-Knoten erreicht wird und die Aktivität vorher besucht wurde
                if (stopEdges.has(current) && activityVisited) {
                    stopReached = true;
                    return true; // Ein gültiger Pfad wurde gefunden
                }
    
                // Besuche Nachbarn, solange sie in der erlaubten Aktivitätsmenge liegen
                for (const neighbor of eventlogMap.get(current) || []) {
                    if (activities.has(neighbor)) {
                        if (dfs(neighbor, visited, activityVisited || neighbor === activity)) {
                            return true;
                        }
                    }
                }
    
                return false;
            };
    
            // Starte DFS von allen Startknoten
            for (const start of startEdges) {
                const visited = new Set<string>();
                dfs(start, visited, false);
    
                // Falls ein gültiger Pfad gefunden wurde, prüfe die nächste Aktivität
                if (activityReached && stopReached) break;
            }
    
            // Wenn entweder die Aktivität nicht besucht wurde oder kein STOP-Knoten erreicht wurde
            if (!activityReached || !stopReached) return false;
        }
    
        return true; // Alle Aktivitäten wurden überprüft und erfüllen die Bedingung
    }
}