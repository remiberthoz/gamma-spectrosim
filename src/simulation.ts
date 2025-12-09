import { ISOTOPES } from "./isotopes";
import { ENERGIES, BACKGROUND, SAMPLES, SpectrumPoint } from "./samples";
import { SENSORS } from "./sensors";


function drawFromPoisson(lambda: number): number {
    const step = 500;
    let lleft = lambda;
    let k = 0;
    let p = 1;
    do {
        k +=1;
        p *= Math.random();
        while (p < 1 && lleft > 0) {
            if (lleft > step) {
                p *= Math.exp(step);
                lleft -= step;
            } else {
                p *= Math.exp(lleft);
                lleft = 0;
            }
        }
    } while (p > 1);
    return k - 1;
}


function drawByInverseTransform(distributionAcc: SpectrumPoint[]): [number, number] {
    const value = Math.random() * distributionAcc[ENERGIES.length - 1].counts;
    for (let e = 0; e < ENERGIES.length; e++) {
        if (value < distributionAcc[e].counts)
            return [e, distributionAcc[e].energy];
    }
}


class Simulation {

    private _isPaused: boolean;
    private _displayedTime: number;
    private lastDecayTime: number;
    private totalCounts: number;
    private measuredSpectrum: SpectrumPoint[];
    private measuredSpectrumLog: SpectrumPoint[];
    private sampleSpectrum: SpectrumPoint[];
    private sampleSpectrumAcc: SpectrumPoint[];
    private _hash: number;

    constructor() {
        this._isPaused = false;
        this._displayedTime = 0;
        this.lastDecayTime = 0;
        this.totalCounts = 0;
        this.measuredSpectrum = ENERGIES.map(e => { return { energy: e, counts: 0 } });
        this.measuredSpectrumLog = ENERGIES.map(e => { return { energy: e, counts: -Infinity } });  // stored to avoid the need of recomputing the log of the whole spectrum when displaying the chart
        this.sampleSpectrum = ENERGIES.map(e => { return { energy: e, counts: 0 } });  // only the accumulated spectrum is usefull, this is stored in case we want to display it later
        this.sampleSpectrumAcc = ENERGIES.map(e => { return { energy: e, counts: 0 } });
        this._hash = Math.random();
    }

    get isPaused() {
        return this._isPaused;
    }

    togglePause() {
        this._isPaused = !this._isPaused;
    }

    get displayedTime() {
        return this._displayedTime;
    }

    get hash() {
        return this._hash;
    }

    updateSampleSpectrum(selectedSampleName: string, selectedSensorName: string) {
        const selectedSample = SAMPLES.flatMap(group => group.samples).find(sample => sample.name == selectedSampleName);
        const selectedSensor = SENSORS.find(sensor => sensor.name == selectedSensorName);
        // Set spectum to background level...
        for (let e = 0; e < ENERGIES.length; e++) {
            const background_height = BACKGROUND[e].counts;
            this.sampleSpectrum[e].counts = background_height;
        }
        // ...and add sample isotope peaks...
        for (let isotope of selectedSample.isotopes) {
            const isotope_data = ISOTOPES.find(it => it.name == isotope.name);
            const activity = isotope.mass * isotope_data.specificActivity;
            const rays = isotope_data.rays;
            for (let ray of rays) {
                const peak_integral = activity * ray.intensity/100 * selectedSensor.efficiency;
                const peak_width = selectedSensor.ray_width / 2;  // TODO: how to (really) link FWHM to sigma ?
                const C = peak_integral / (peak_width * Math.sqrt(2 * Math.PI));
                const w = 2 * Math.pow(peak_width, 2)
                const ray_spectrum = ENERGIES.map(e => C * Math.exp(-Math.pow(e - ray.energy, 2) / w));
                for (let i = 0; i < ENERGIES.length; i++) {
                    this.sampleSpectrum[i].counts += ray_spectrum[i];
                }
            }
        }
        // ...then compute accumulated spectrum
        this.sampleSpectrumAcc[0].counts = this.sampleSpectrum[0].counts;
        for (let i = 1; i < ENERGIES.length; i++) {
            this.sampleSpectrumAcc[i].counts = this.sampleSpectrumAcc[i-1].counts + this.sampleSpectrum[i].counts;
        }
    }

    performDecay(energyIndex: number, energy: number, timestamp: number, instantLog: boolean) {
        this.measuredSpectrum[energyIndex].counts += 1;
        this.measuredSpectrumLog[energyIndex].counts = Math.log10(this.measuredSpectrum[energyIndex].counts);
        this.totalCounts += 1;
        if (instantLog) {
            if (this._isPaused) return;
            const delay = timestamp - this.lastDecayTime;
            // below needs max() because the decays do not happen in order when not performed via timeout
            this.lastDecayTime = Math.max(this.lastDecayTime, timestamp);
        }
    }

    advanceTime(duration: number, withTimeouts: boolean, callback: (timestamp: number, delay: number, energy: number, energyIndex: number) => void, callback2: () => void) {
        const sampleCps = this.sampleSpectrumAcc[ENERGIES.length - 1].counts;
        const numberOfDecays = drawFromPoisson(sampleCps * duration);
        for (let i = 0; i < numberOfDecays; i++) {
            const decayDelay = Math.random() * duration;
            const [decayEnergyIndex, decayEnergy] = drawByInverseTransform(this.sampleSpectrumAcc);
            if (withTimeouts)
                setTimeout(callback, decayDelay * 1000, this._displayedTime + decayDelay, decayDelay, decayEnergy, decayEnergyIndex);
            else
                callback(this._displayedTime + decayDelay, decayDelay, decayEnergy, decayEnergyIndex);
        }
        this._displayedTime += duration;
        callback2();
    }

    reset() {
        for (let e = 0; e < ENERGIES.length; e++) {
            this.measuredSpectrum[e].counts = 0;
            this.measuredSpectrumLog[e].counts = -Infinity;
        }
        this._displayedTime = 0;
        this.totalCounts = 0;
        this._hash = Math.random();
    }
}

export { Simulation };
