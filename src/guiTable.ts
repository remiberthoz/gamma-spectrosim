import { Gui } from './gui';
import { ENERGIES, SpectrumPoint } from './samples';

class GuiTable implements Gui {

    private DATA: { timestamp: string, delay: string, energy: string }[];
    private TABLE: HTMLTableElement;
    private LENGTH: number;
    private lastEntryTimestamp: number;

    constructor(table: HTMLTableElement) {
        this.TABLE = table;
        this.LENGTH = table.rows.length - 1;
        this.DATA = Array(this.LENGTH).map(_ => { return { timestamp: "\u00A0", delay: " ", energy: " " } });
        this.lastEntryTimestamp = undefined;
    }

    resetData () {
        this.DATA = Array(this.LENGTH).map(_ => { return { timestamp: "\u00A0", delay: " ", energy: " " } });
        this.lastEntryTimestamp = undefined;
    }

    setPause(isPaused: boolean) {}

    logDecay(timestamp: number, delay: number, energy: number, energyIndex: number) {
        this.DATA.splice(0, 0, {
            timestamp: timestamp.toFixed(3),
            delay: this.lastEntryTimestamp ? (timestamp - this.lastEntryTimestamp).toFixed(3) : "...",
            energy: energy.toFixed(1)
        });
        this.DATA.splice(this.LENGTH, 1);
        this.lastEntryTimestamp = timestamp;
    }

    updateDisplay(roundedTime: number) {
        for (let i = 0; i < this.LENGTH; i++) {
            if (this.DATA[i]) {
                this.TABLE.rows[1+i].cells[0].innerText = this.DATA[i].timestamp;
                this.TABLE.rows[1+i].cells[1].innerText = this.DATA[i].delay;
                this.TABLE.rows[1+i].cells[2].innerText = this.DATA[i].energy;
            } else {
                this.TABLE.rows[1+i].cells[0].innerText = "\u00A0";
                this.TABLE.rows[1+i].cells[1].innerText = "\u00A0";
                this.TABLE.rows[1+i].cells[2].innerText = "\u00A0";
            }
        }
    }
}

export { GuiTable };