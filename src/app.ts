import './style';

import { ENERGIES, SAMPLES } from './samples';
import { SENSORS } from './sensors';

import { Simulation } from './simulation';
import { GuiChart } from './guiChart'
import { GuiTable } from './guiTable';

window.onload = () => {

    /** -----------------------------------------------------------------------
     *  Get HTML handles, poppulate when necessary.
     *  -----------------------------------------------------------------------
     */

    const CHART = <HTMLTableElement> document.getElementById("chart");
    const LOG_TABLE = <HTMLTableElement> document.getElementById("log");

    const ONE_HOUR_BUTTON = document.getElementById("one-hour");
    const RESET_BUTTON = document.getElementById("reset");
    const PAUSE_BUTTON = document.getElementById("pause");
    // const EMIN_FIELD = <HTMLInputElement> document.getElementById("emin");
    // const EMAX_FIELD = <HTMLInputElement> document.getElementById("emax");
    const SENSOR_SELECTOR = <HTMLSelectElement> document.getElementById("detector");
    const SAMPLE_SELECTOR = <HTMLSelectElement> document.getElementById("sample");

    for (const sensor of SENSORS) {
        const option = document.createElement("option");
        option.value = sensor.name;
        option.innerHTML = sensor.name;
        SENSOR_SELECTOR.appendChild(option);
    }

    for (const sampleGroup of SAMPLES) {
        const group = document.createElement("optgroup");
        group.label = sampleGroup.name;
        for (const sample of sampleGroup.samples) {
            const option = document.createElement("option");
            option.value = sample.name;
            option.innerHTML = sample.name;
            group.appendChild(option);
        }
        SAMPLE_SELECTOR.appendChild(group);
    }

    const simulation = new Simulation();
    const table = new GuiTable(LOG_TABLE);
    const chart = new GuiChart(CHART);

    /** -----------------------------------------------------------------------
     *  Add listeners.
     *  -----------------------------------------------------------------------
     */

    function sampleChange() {
        const selectedSampleName = SAMPLE_SELECTOR.value;
        const selectedSensorName = SENSOR_SELECTOR.value;
        simulation.updateSampleSpectrum(selectedSampleName, selectedSensorName);
        simulation.reset();
        chart.resetData();
        chart.updateDisplay(0);
        table.resetData();
        table.updateDisplay(0);
    }

    // function energyAxisChange() {
    //     const emin = Number(EMIN_FIELD.value);
    //     const emax = Number(EMAX_FIELD.value);
    //     // if (emin != undefined) gui.emin = emin;
    //     // if (emax != undefined) gui.emax = emax;
    // }


    ONE_HOUR_BUTTON.onclick = () => {
        simulation.advanceTime(3600, false, (timestamp: number, delay: number, energy: number, energyIndex: number) => {
            chart.logDecay(timestamp, delay, energy, energyIndex);
            // table.resetData();
        }, () => {
            chart.updateDisplay(simulation.displayedTime)
            table.updateDisplay(simulation.displayedTime);
        });
    }

    RESET_BUTTON.onclick = () => {
        simulation.reset();
        chart.resetData();
        chart.updateDisplay(simulation.displayedTime);
        table.resetData();
        table.updateDisplay(simulation.displayedTime);
    }

    PAUSE_BUTTON.onclick = () => {
        simulation.togglePause();
        chart.setPause(simulation.isPaused);
        table.setPause(simulation.isPaused);
        PAUSE_BUTTON.classList.toggle("pause");
    }

    // EMIN_FIELD.onblur = energyAxisChange;
    // EMAX_FIELD.onblur = energyAxisChange;

    SAMPLE_SELECTOR.onchange = sampleChange;
    SENSOR_SELECTOR.onchange = sampleChange;

    /** -----------------------------------------------------------------------
     *  Initialize.
     *  -----------------------------------------------------------------------
     */

    sampleChange();
    chart.updateDisplay(simulation.displayedTime);
    table.updateDisplay(simulation.displayedTime);

    /** -----------------------------------------------------------------------
     *  Start main loop on interval.
     *  -----------------------------------------------------------------------
     */

    setInterval(() => {
        if (simulation.isPaused)
            return;
        const hash = simulation.hash;
        simulation.advanceTime(1, true, (timestamp: number, delay: number, energy: number, energyIndex: number) => {
            if (simulation.isPaused || simulation.hash != hash)
                return;
            chart.logDecay(timestamp, delay, energy, energyIndex);
            table.logDecay(timestamp, delay, energy, energyIndex);
            chart.updateDisplay(simulation.displayedTime);
            table.updateDisplay(simulation.displayedTime);
        }, () => {});
    }, 1000);

    /**
     * TODO:
     * - There is concurrency issue on logDecay (update of the table can overide each other)
     * - Allow update of selection rectangle while in pause
     * - Document selection rectangle option
     */
}

