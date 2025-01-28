import { Injectable } from '@angular/core';
import { InductiveMinerHelper } from './inductive-miner-helper';
import { ExclusiveCutChecker } from './cuts/exclusive-cut';
import { SequenceCutChecker } from './cuts/sequence-cut';
import { ParallelCutChecker } from './cuts/parallel-cut';
import { LoopCutChecker } from './cuts/loop-cut';
import { Edge } from 'src/app/classes/Datastructure/InductiveGraph/edgeElement';
import { EventLog } from 'src/app/classes/Datastructure/event-log/event-log';
import { Cuts } from 'src/app/classes/Datastructure/enums';
import { registerLocaleData } from '@angular/common';

@Injectable({
    providedIn: 'root',
})

export class InductiveMinerService {
    constructor(
        private helper: InductiveMinerHelper,
        private exclusiveCutChecker: ExclusiveCutChecker,
        private sequenceCutChecker: SequenceCutChecker,
        private parallelCutChecker: ParallelCutChecker,
        private loopCutChecker: LoopCutChecker
    ) {}

    public applyInductiveMiner(eventlog: EventLog, edges: Edge[]): {el: EventLog[], cutMade: Cuts} {

        const cutCheckers = [
            { checker: this.sequenceCutChecker.checkSequenceCut.bind(this.sequenceCutChecker), cutType: Cuts.Sequence },
            { checker: this.exclusiveCutChecker.checkExclusiveCut.bind(this.exclusiveCutChecker), cutType: Cuts.Exclusive },
            { checker: this.parallelCutChecker.checkParallelCut.bind(this.parallelCutChecker), cutType: Cuts.Parallel },
            { checker: this.loopCutChecker.checkLoopCut.bind(this.loopCutChecker), cutType: Cuts.Loop }
        ];

        for (const { checker, cutType } of cutCheckers) {
            console.log('checking for: ', cutType);
            const splitEventlogs = checker(eventlog, edges);
            if (splitEventlogs.length != 0) {
                return { el: splitEventlogs, cutMade: cutType };
            }
        }
        throw new Error ('no cut possible');
    }

    public checkInductiveMiner(eventlog: EventLog): false | Cuts {
        const uniqueActivities: Set<string> = this.helper.getUniqueActivities(eventlog);

        const cutCheckers = [
            { checker: this.sequenceCutChecker.sequenceCutConditionsChecker.bind(this.sequenceCutChecker) as any, cutType: Cuts.Sequence },
            { checker: this.exclusiveCutChecker.exclusiveCutConditionsChecker.bind(this.exclusiveCutChecker) as any, cutType: Cuts.Exclusive },
            { checker: this.parallelCutChecker.parallelCutConditionsChecker.bind(this.parallelCutChecker) as any, cutType: Cuts.Parallel },
            { checker: this.loopCutChecker.loopCutConditionsChecker.bind(this.loopCutChecker) as any, cutType: Cuts.Loop },
        ];

        for (const cutChecker of cutCheckers) {
            // Sonderfall: Loop Cut
            if (cutChecker.cutType == Cuts.Loop ) {
                let A1Play: Set<string> = new Set<string>();
                let A1Stop: Set<string> = new Set<string>();
                let A2Play: Set<string> = new Set<string>();
                let A2Stop: Set<string> = new Set<string>();

                // A1Play / A1Stop identifizieren
                for (const cTrace of eventlog.traces) {
                    A1Play.add(cTrace.events[0].conceptName);
                    A1Stop.add(cTrace.events[cTrace.events.length-1].conceptName);
                }

                // A2Play / A2Stop identifizieren
                for (const cTrace of eventlog.traces) {
                    let index: number = 0;
                    for (const cEvent of cTrace.events) {
                        // Wenn akt. Event zu A1Play gehört und nicht an erster Stelle steht: Das vorige Event ist A2Stop, wenn es nicht von A1Play ist
                        if (A1Play.has(cEvent.conceptName) && index != 0) {
                            if (!A1Play.has(cTrace.events[index-1].conceptName)) {
                                A2Stop.add(cTrace.events[index-1].conceptName)
                            }
                        }
                        // Wenn akt. Event zu A1Stop gehört und nicht an letzter Stelle steht: Das nächste Event ist A2Play, wenn es nicht von A1Stop ist
                        if (A1Stop.has(cEvent.conceptName) && index != cTrace.events.length-1 ) {
                            if (!A1Stop.has(cTrace.events[index+1].conceptName)) {
                                A2Play.add(cTrace.events[index+1].conceptName)
                            }
                        }
                        index++;
                    }
                }
                if (cutChecker.checker(eventlog, A1Play, A1Stop, A2Play, A2Stop).length > 0) return cutChecker.cutType; // Wenn etwas zurückgegeben wird, ist ein Cut möglich --> Kein Fall Through!

            } else {
                const allSubsets: [Set<string>, Set<string>][] = this.helper.generateSubsets(uniqueActivities);

                for (const [A1, A2] of allSubsets) {
                    // Überprüfen, ob die Teilmengen disjunkt und vollständig sind
                    if (A1.size + A2.size !== uniqueActivities.size) continue;

                    // Checker-Funktion aufrufen
                    if (cutChecker.checker(eventlog, A1, A2).length > 0) return cutChecker.cutType // Wenn etwas zurückgegeben wird, ist ein Cut möglich --> Kein Fall Through!
                }
            }
        }
        return false;
    }
}
