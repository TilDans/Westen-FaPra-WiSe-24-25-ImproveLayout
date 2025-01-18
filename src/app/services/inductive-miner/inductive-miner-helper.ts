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

    public hasIntersection(A1: Set<string>, A2: Set<string>): boolean {
        for (const e of A1) {
            if (A2.has(e)) {
                return true;
            }
        }
        return false;
    }

    public isUnion(eventlog: EventLog, A1: Set<string>, A2: Set<string>): boolean { 
        const unionA1A2: Set<string>  = new Set([...A1, ...A2]);
        const uniqueActivities: Set<string>  = this.getUniqueActivities(eventlog);
        if (unionA1A2.size === uniqueActivities.size && [...unionA1A2].every((x) => uniqueActivities.has(x))) return true;
        
        return false
    }

    // Gibt alle einzigartigen Akitivtäten aus einem eventlog zurück
    public getUniqueActivities(eventlog: EventLog): Set<string> {
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

    // Wandelt einen Eventlog in eine Map vom Typ "Map<string, string[]>" um
    public parseEventlogToNodes(eventlog: EventLog): Map<string, string[]> {
        const eventlogMap = new Map<string, string[]>();
    
        // Iteriere über jeden trace im Eventlog
        for (const trace of eventlog.traces) {
            // Iteriere über jedes traceEvent im aktuellen trace
            for (let i = 0; i < trace.events.length - 1; i++) {
                const currentEvent = trace.events[i].conceptName;
                const nextEvent = trace.events[i + 1].conceptName;
    
                // Falls das aktuelle traceEvent noch nicht in der Map ist, initialisiere es
                if (!eventlogMap.has(currentEvent)) {
                    eventlogMap.set(currentEvent, []);
                }
    
                // Füge das nächste Ereignis zu den Nachfolgern hinzu, falls es noch nicht enthalten ist
                const successors = eventlogMap.get(currentEvent)!;
                if (!successors.includes(nextEvent)) {
                    successors.push(nextEvent);
                }
            }
        }
    
        // Sortiere die Listen der Transitionen für konsistente Ausgaben
        eventlogMap.forEach((value, _) => {
            value.sort();
        });

        return eventlogMap;
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
                dfs(start, new Set<string>(), false);
    
                // Falls ein gültiger Pfad gefunden wurde, prüfe die nächste Aktivität
                if (activityReached && stopReached) break;
            }
    
            // Wenn entweder die Aktivität nicht besucht wurde oder kein STOP-Knoten erreicht wurde
            if (!activityReached || !stopReached) return false;
        }
    
        return true; // Alle Aktivitäten wurden überprüft und erfüllen die Bedingung
    }

    // Identifiziere alle Aktivitäten, die zwischen zwei Aktivitätsmengen liegen
    public getActivitiesInbetween(eventlog: EventLog, from: Set<string>, to: Set<string>): Set<string> {
        const eventlogMap: Map<string, string[]> = this.parseEventlogToNodes(eventlog);
        const inBetweenActivities = new Set<string>();

        const dfs = (current: string, visited: Set<string>): void => {
            // Zyklen vermeiden
            if (visited.has(current)) return;
            visited.add(current);
    
            const neighbors = eventlogMap.get(current) || []; // Direkte Nachfolger des aktuellen Knotens
    
            for (const neighbor of neighbors) {
                if (to.has(neighbor)) {
                    // Wenn Aktivität aus "to" erreicht, akt. Rekursion fertig
                    continue;
                }
    
                if (!inBetweenActivities.has(neighbor)) { // Wenn Aktivität aus "to" noch nicht erreicht, weitersuchen
                    inBetweenActivities.add(neighbor);
                    dfs(neighbor, visited);
                }
            }
    
            visited.delete(current); // Backtracking
        };

        // Suche von allen Elementen in "from"
        for (const cActivity of from) {
            if (eventlogMap.has(cActivity)) {
                dfs(cActivity, new Set<string>());
            }
        }

        return inBetweenActivities;
    }
}