import { Gui } from './gui';
import { ENERGIES, BACKGROUND, SpectrumPoint } from './samples';
import picasso from "picasso.js";

const MIN_Y = -Math.log10(2);
const MAX_Y = Math.log10(20000);
const MIN_E = 0;
const MAX_E = ENERGIES[ENERGIES.length-1];

const X_LABEL = 'Energy / keV';
const Y_LABEL = 'Counts';

const X_AXIS_KEY = 'x-axis';
const X_LABEL_KEY = 'x-label';
const Y_AXIS_KEY = 'y-axis';
const Y_LABEL_KEY = 'y-label';
const GRID_KEY = 'grid';
const SPECTRUM_KEY = 'spectrum-line';
const BACKGROUND_KEY = 'background-line';

const FONT = 'Tahoma, Segoe UI, Verdana, sans-serif';


const YTICKS = Array(10).fill(0).flatMap(
    (_, exponent) => {
        return Array(10).fill(0).flatMap(
            (_, idx) => {
                const i = idx+1;
                return { value: Math.log10(i*Math.pow(10, exponent)), isMinor: i != 1 }
            }
        )
    }
);

const ENERGY_SCALE = 'energy';
const COUNTS_SCALE = 'counts';

const SCALES = {
    energy: {
        data: { field: ENERGY_SCALE },
        min: MIN_E,
        max: MAX_E,
        ticks: { distance: 100 },
        minorTicks: { count: 3 },
    },
    counts: {
        invert: true,
        data: { field: COUNTS_SCALE },
        min: MIN_Y,
        max: MAX_Y,
        ticks: { tight: false, values: YTICKS, },
    },
}
type SpectrumScales = typeof SCALES;

const COMPONENTS: picasso.ComponentTypes[] = [
    {
        type: 'axis',
        key: X_AXIS_KEY,
        scale: ENERGY_SCALE,
        layout: { dock: 'bottom', },
        settings: { labels: { fill: '#1a1a1a' }, line: {}, minorTicks: {}, ticks: {}},
    } as picasso.ComponentAxis,
    {
        type: 'text' as const,
        key: X_LABEL_KEY,
        text: X_LABEL,
        dock: 'bottom',
        fontSize: 14,
        font: FONT,
        x: { value: '50%' },  // Centered horizontally
        y: { value: '95%' },  // Position below the x-axis
        align: 'middle',
        style: { text: { fill: '#1a1a1a' }},
        settings: {},
    } as picasso.ComponentText,
    {
        type: 'axis' as const,
        key: Y_AXIS_KEY,
        scale: COUNTS_SCALE,
        layout: { dock: 'left', },
        formatter: 'logScaleFormatter',
        settings: { labels: { fill: '#1a1a1a' }, line: {}, minorTicks: {}, ticks: {}},
    } as picasso.ComponentAxis,
    {
        type: 'text' as const,
        key: Y_LABEL_KEY,
        text: Y_LABEL,
        dock: 'left',
        fontSize: 14,
        font: FONT,
        x: { value: '5%' },   // Position near the left side
        y: { value: '50%' },  // Centered vertically
        align: 'middle',
        rotate: 270,  // Rotate for vertical alignment
        style: { text: { fill: '#1a1a1a' }},
        settings: {},
    } as picasso.ComponentText,
    {
        type: 'grid-line',
        key: GRID_KEY,
        x: { scale: ENERGY_SCALE },
        y: { scale: COUNTS_SCALE },
        ticks: { show: true, stroke: '#ccc' },
        minorTicks: { show: true, stroke: '#e6e6e6'  },
        settings: {
            x: { scale: ENERGY_SCALE },
            y: { scale: COUNTS_SCALE },
        }
    } as picasso.ComponentGridLine,
    {
        type: 'line',
        key: BACKGROUND_KEY,
        data: {
            extract: {
                source: 'background',
                field: ENERGY_SCALE,
                props: { v: { field: COUNTS_SCALE }, },
            }
        },
        settings: {
            coordinates: {
                major: { scale: ENERGY_SCALE },
                minor: { scale: COUNTS_SCALE, ref: 'v' }
            },
            layers: {
                curve: 'monotone',
                line: { show: true, stroke: '#e08214', strokeWidth: 1.4 },
                area: { show: false },
            },
        },
    } as unknown as picasso.ComponentTypes,
    {
        type: 'line' as const,
        key: SPECTRUM_KEY,
        data: {
            extract: {
                field: ENERGY_SCALE,
                props: { v: { field: COUNTS_SCALE }, },
                source: 'measured',
            }
        },
        settings: {
            coordinates: {
                major: { scale: ENERGY_SCALE },
                minor: { scale: COUNTS_SCALE, ref: 'v' }
            },
            layers: {
                curve: 'monotone',
                line: { show: true, stroke: '#1a5fb4', strokeWidth: 1.4 },
                area: { show: false },
            },
        },
    } as unknown as picasso.ComponentTypes,
]

function timeConversion(duration: number) {
  let portions: string[] = ["", "", ""];

  const s2h = 60 * 60;
  const hours = Math.trunc(duration / s2h);
  if (hours > 0) {
    portions[0] = hours + ' h';
    duration = duration - (hours * s2h);
  } else {
    portions[0] = "";
  }

  const msInMinute = 60;
  const minutes = Math.trunc(duration / msInMinute);
  if (minutes > 0) {
    portions[1] = minutes + ' min';
    duration = duration - (minutes * msInMinute);
  } else {
    portions[1] = "";
  }

  const seconds = Math.trunc(duration);
  if (seconds > 0) {
    portions[2] = seconds + ' s';
  } else {
    portions[2] = "";
  }

  return portions.join(' ');
}

function pad(num: number, size: number) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function logScaleFormatter() {
    return (value: number) => '1e' + value;
}


class GuiChart implements Gui {

    private spectrumLog: SpectrumPoint[];
    private backgroundLog: SpectrumPoint[];
    private totalCounts: number;

    private lastMouseMoveTime: number;

    private CHART: HTMLElement;
    private TIMER_EL: HTMLElement;
    private POINTER_EL: HTMLElement;
    private PICASSO_CHART: picasso.Chart;
    private SVG: SVGSVGElement;
    private SVG_BBOX: DOMRect;
    private SVG_POINT: DOMPoint;

    private SVG_RANGE_START: { x: number, y: number };
    private SVG_RANGE_END: { x: number, y: number };
    private SVG_RANGE: { x0: number, y0: number, x1: number, y1: number };
    private DATA_RANGE: { start: number, end: number, show: boolean };
    private SVG_RANGE_VIZ: SVGElement;
    private SVG_RANGE_VIZ_ID: string;
    private drawStartTime: number;

    private searchWidth: number;
    private SVG_CURSOR_VIZ: SVGElement;
    private SVG_CURSOR_VIZ_ID: string;
    private SVG_PEAK_VIZ: SVGElement;
    private SVG_PEAK_VIZ_ID: string;
    private SVG_PEAK_ENERGY_VIZ: SVGElement;
    private SVG_PEAK_ENERGY_VIZ_ID: string;

    private lastRoundedTime: number = 0;

    private settings: picasso.ChartSettings = {
        scales: SCALES,
        components: COMPONENTS,
        interactions: [{ type: 'native', enable: true, events: {
            mousedown: (e: MouseEvent) => this.mouseDown(e),
            mousemove: (e: MouseEvent) => this.mouseMove(e),
            mouseup: (e: MouseEvent) => this.mouseUp(e),
            wheel: (e: WheelEvent) => this.mouseWheel(e),
        }}],
        formatters: {
            logScaleFormatter: {
                type: 'logScaleFormatter',
                format: '',
            }
        }
    }

    constructor(chartElement: HTMLElement, timerElement: HTMLElement, pointerElement: HTMLElement) {
        this.CHART = chartElement;
        this.TIMER_EL = timerElement;
        this.POINTER_EL = pointerElement;
        this.spectrumLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
        this.backgroundLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
        this.totalCounts = 0;
        this.lastMouseMoveTime = 0;

        picasso.formatter('logScaleFormatter', logScaleFormatter);

        this.TIMER_EL.textContent = `Timer: 0 s | Counts: ${pad(0, 10)} | CPS: ${(0).toFixed(3)}`;

        this.PICASSO_CHART = picasso.chart({
            data: [
                { key: 'measured', data: this.spectrumLog, type: '' },
                { key: 'background', data: this.backgroundLog, type: '' },
            ],
            element: this.CHART,
            settings: this.settings,
        });

        this.SVG = <SVGSVGElement> this.CHART.childNodes[COMPONENTS.findIndex(c => c.key == SPECTRUM_KEY)];
        this.SVG_BBOX = this.SVG.getBoundingClientRect();
        this.SVG_POINT = this.SVG.createSVGPoint();
        this.SVG_RANGE_START = { x: 0, y: 0 };
        this.SVG_RANGE_END = { x: 0, y: 0 };
        this.SVG_RANGE = { x0: 0, y0: 0, x1: 0, y1: 0 };
        this.DATA_RANGE = { start: MIN_E, end: MAX_E, show: false };

        this.SVG_RANGE_VIZ_ID = "rangeIndicator";
        this.SVG_RANGE_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        this.SVG_RANGE_VIZ.id = this.SVG_RANGE_VIZ_ID;
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'style', 'fill: #a5470f; opacity: 0.12; stroke: #a5470f; stroke-width: 2px;');
        this.SVG.appendChild(this.SVG_RANGE_VIZ);

        this.drawStartTime = -1;

        this.SVG_CURSOR_VIZ_ID = "cursorIndicator";
        this.SVG_CURSOR_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        this.SVG_CURSOR_VIZ.id = this.SVG_CURSOR_VIZ_ID;
        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'r', '2');
        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'style', 'fill: #1a1a1a; stroke: none;');
        this.SVG.appendChild(this.SVG_CURSOR_VIZ);

        this.searchWidth = 200;

        this.SVG_PEAK_VIZ_ID = "peakIndicator";
        this.SVG_PEAK_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.SVG_PEAK_VIZ.id = this.SVG_PEAK_VIZ_ID;
        this.SVG_PEAK_VIZ.setAttributeNS(null, 'style', 'fill: none; stroke: #a5470f;');
        this.SVG.appendChild(this.SVG_PEAK_VIZ);

        this.SVG_PEAK_ENERGY_VIZ_ID = "peakTextIndicator";
        this.SVG_PEAK_ENERGY_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        this.SVG_PEAK_ENERGY_VIZ.id = this.SVG_PEAK_ENERGY_VIZ_ID;
        this.SVG_PEAK_ENERGY_VIZ.setAttributeNS(null, 'fill', '#a5470f');
        this.SVG.appendChild(this.SVG_PEAK_ENERGY_VIZ);

        let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
        window.addEventListener('resize', () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.SVG = <SVGSVGElement> this.CHART.childNodes[COMPONENTS.findIndex(c => c.key == SPECTRUM_KEY)];
                this.SVG_BBOX = this.SVG.getBoundingClientRect();
                this.PICASSO_CHART.update({
                    excludeFromUpdate: COMPONENTS.map(c => c.key),
                });
            }, 100);
        });
    }

    resetData() {
        this.spectrumLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
        this.backgroundLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
        this.totalCounts = 0;
    }

    setPause(isPaused: boolean) {}

    logDecay(timestamp: number, delay: number, energy: number, energyIndex: number) {
        if (this.spectrumLog[energyIndex].counts == MIN_Y)
            this.spectrumLog[energyIndex].counts = Math.log10(1);
        else
            this.spectrumLog[energyIndex].counts = Math.log10(Math.pow(10, this.spectrumLog[energyIndex].counts) + 1);
        this.totalCounts += 1;
    }

    logDecayBackground(timestamp: number, delay: number, energy: number, energyIndex: number) {
        if (this.backgroundLog[energyIndex].counts == MIN_Y)
            this.backgroundLog[energyIndex].counts = Math.log10(1);
        else
            this.backgroundLog[energyIndex].counts = Math.log10(Math.pow(10, this.backgroundLog[energyIndex].counts) + 1);
    }

    refreshTimerReadout() {
        const roundedTime = this.lastRoundedTime;
        const cps = roundedTime > 0 ? this.countsInRange()/roundedTime : 0;
        this.TIMER_EL.textContent = `Timer: ${timeConversion(roundedTime)} | Counts: ${pad(this.countsInRange(), 10)} | CPS: ${cps.toFixed(3)}`;
    }

    updateDisplay(roundedTime: number) {
        this.lastRoundedTime = roundedTime;
        this.refreshTimerReadout();
        this.PICASSO_CHART.update({
            data: [
                { key: 'measured', data: this.spectrumLog },
                { key: 'background', data: this.backgroundLog },
            ],
            partialData: true,
            excludeFromUpdate: COMPONENTS.map(c => c.key).filter(k => k != SPECTRUM_KEY && k != BACKGROUND_KEY),
        })
    }

    countsInRange(): number {
        let countsInRange = 0;
        const [start, end] = [Math.min, Math.max].map(f => f(this.DATA_RANGE.start, this.DATA_RANGE.end));
        for (let e = 0; e < ENERGIES.length; e++) {
            if (!(start < ENERGIES[e] && ENERGIES[e] < end))
                continue;
            const sample = Math.pow(10, this.spectrumLog[e].counts);
            const background = Math.pow(10, this.backgroundLog[e].counts);
            const counts = sample - background;
            if (counts < 1)
                continue;
            countsInRange += counts;
        }
        return Math.round(countsInRange);
    }

    mouseEventToSVGCoordinates(e: any): DOMPoint {
        this.SVG_POINT.x = e.clientX;
        this.SVG_POINT.y = e.clientY;
        const svgCoordinates = this.SVG_POINT.matrixTransform(this.SVG.getScreenCTM()!.inverse());
        return svgCoordinates;
    }

    SVGCoordinatesToDataCoordinates(svgCoordinates: { x: number, y: number }): { x: number, y: number } {
        const dataCoordinates = {
            x: svgCoordinates.x / this.SVG_BBOX.width * (this.settings.scales.energy.max - this.settings.scales.energy.min) + this.settings.scales.energy.min,
            y: (this.SVG_BBOX.height - svgCoordinates.y) / this.SVG_BBOX.height * (MAX_Y - MIN_Y) + MIN_Y
        }
        dataCoordinates.y = dataCoordinates.y > 0 ? Math.pow(10, dataCoordinates.y) : 0;
        return dataCoordinates;
    }

    dataCoordinatesToSVGCoordinates(data: { energy: number, counts: number }): { x: number, y: number } {
        const svgCoordinates = {
            x: (data.energy - this.settings.scales.energy.min) * this.SVG_BBOX.width / (this.settings.scales.energy.max - this.settings.scales.energy.min),
            y: this.SVG_BBOX.height - (Math.log10(data.counts) - MIN_Y) * this.SVG_BBOX.height / (MAX_Y - MIN_Y),
        }
        return svgCoordinates;
    }

    logspectrumCoordinatesToSVGCoordinates(logspectrumCoordinates: { energy: number, counts: number }): { x: number, y: number } {
        const svgCoordinates = {
            x: (logspectrumCoordinates.energy - this.settings.scales.energy.min) * this.SVG_BBOX.width / (this.settings.scales.energy.max - this.settings.scales.energy.min),
            y: this.SVG_BBOX.height - (logspectrumCoordinates.counts - MIN_Y) * this.SVG_BBOX.height / (MAX_Y - MIN_Y),
        }
        return svgCoordinates;
    }

    updateSelectionRange(start?: number, end?: number) {
        if (start) {
            this.DATA_RANGE.start = start;
            this.DATA_RANGE.end = start;
        }
        if (end && this.drawStartTime > 0) {
            this.DATA_RANGE.end = end;
            this.DATA_RANGE.show = true;
        }

        if (!this.DATA_RANGE.show) 
            return;

        const [left, right] = [Math.min, Math.max].map(f => f(this.DATA_RANGE.start, this.DATA_RANGE.end));

        const xLeft = this.dataCoordinatesToSVGCoordinates({ energy: left, counts: 0 }).x;
        const xRight = this.dataCoordinatesToSVGCoordinates({ energy: right, counts: 0 }).x;

        this.SVG_RANGE_VIZ.setAttributeNS(null, 'x', xLeft.toString());
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'width', (xRight - xLeft).toString());

        this.SVG_RANGE_VIZ.setAttributeNS(null, 'y', '0');
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'height', this.SVG_BBOX.height.toString());

        this.SVG.appendChild(this.SVG_RANGE_VIZ);

        this.refreshTimerReadout();
    }

    mouseDown(e: MouseEvent) {
        e.preventDefault();
        this.drawStartTime = (new Date()).getTime();
        const cursorSvgCoordinates = this.mouseEventToSVGCoordinates(e);
        const cursorDataCoordinates = this.SVGCoordinatesToDataCoordinates(cursorSvgCoordinates);
        this.updateSelectionRange(cursorDataCoordinates.x, undefined);
    }

    mouseMove(e: MouseEvent) {
        e.preventDefault();
        const now = (new Date()).getTime();
        if (now - this.lastMouseMoveTime < 5)
            return;
        this.lastMouseMoveTime = now;

        const cursorSvgCoordinates = this.mouseEventToSVGCoordinates(e);
        const cursorDataCoordinates = this.SVGCoordinatesToDataCoordinates(cursorSvgCoordinates);
        this.POINTER_EL.textContent = `x=${cursorDataCoordinates.x.toFixed(2)}, y=${cursorDataCoordinates.y.toFixed(0)}`;

        this.updateSelectionRange(undefined, cursorDataCoordinates.x);
    }

    mouseUp(e: MouseEvent) {
        const start = this.drawStartTime;
        const now = (new Date()).getTime();
        this.drawStartTime = -1;
        if (now - start < 100) {
            this.SVG.removeChild(this.SVG_RANGE_VIZ);
            this.DATA_RANGE = { start: MIN_E, end: MAX_E, show: false };
            return;
        }
        
        [this.DATA_RANGE.start, this.DATA_RANGE.end] = [Math.min, Math.max].map(f => f(this.DATA_RANGE.start, this.DATA_RANGE.end));

        const cursorSvgCoordinates = this.mouseEventToSVGCoordinates(e);
        const cursorDataCoordinates = this.SVGCoordinatesToDataCoordinates(cursorSvgCoordinates);
        this.updateSelectionRange(undefined, cursorDataCoordinates.x);

        this.refreshTimerReadout();
    }

    mouseWheel(e: WheelEvent) {
        e.preventDefault();
        const target = this.SVGCoordinatesToDataCoordinates(this.mouseEventToSVGCoordinates(e)).x;
        const energies = (this.settings.scales as SpectrumScales).energy;
        
        const range = energies.max - energies.min;
        const center = (energies.min + energies.max)/2;

        if (e.deltaY < 0) {
            const newRange = range * 0.90;
            const newTarget = (target + center*10)/11;
            energies.min = newTarget - newRange/2;
            energies.max = newTarget + newRange/2
        } else if (e.deltaY > 0) {
            const newRange = range * 1.1;
            energies.min = center - newRange/2;
            energies.max = center + newRange/2
        }

        this.PICASSO_CHART.update({
            settings: this.settings,
        });

        this.updateSelectionRange();
    }
}

export { GuiChart };
