import { Gui } from './gui';
import { ENERGIES, SpectrumPoint } from './samples';

const picasso: any = require('picasso.js').default();
let Picasso: any;

const MIN_Y = -Math.log10(2);
const MAX_Y = Math.log10(20000);
const MIN_E = 0;
const MAX_E = ENERGIES[ENERGIES.length-1];

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
    private totalCounts: number;

    private lastMouseMoveTime: number;

    private CHART: HTMLElement;
    private PICASSO_CHART: any;
    private SVG: SVGSVGElement;
    private SVG_BBOX: DOMRect;
    private SVG_POINT: DOMPoint;

    private SVG_RANGE_START: { x: number, y: number };
    private SVG_RANGE_END: { x: number, y: number };
    private SVG_RANGE: { x0: number, y0: number, x1: number, y1: number };
    private DATA_RANGE: { e0: number, e1: number, c0: number, c1: number };
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

    private lastRoundedTime: number;

    constructor(chartElement: HTMLElement) {
        this.CHART = chartElement;
        this.spectrumLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
        this.totalCounts = 0;
        this.lastMouseMoveTime = 0;

        if (Picasso == undefined)
            Picasso = new picasso();
        picasso.formatter('logScaleFormatter', logScaleFormatter);

        COMPONENTS.find(c => c.key == TIMER_KEY).text = `Timer: 0 s | Counts: ${pad(0, 10)} | CPS: ${(0).toFixed(3)}`;

        this.PICASSO_CHART = Picasso.chart({
            element: this.CHART,
            settings: {
                data: { data: this.spectrumLog },
                scales: SCALES,
                // interactions: INTERACTIONS,
                components: COMPONENTS,
                interactions: [{ type: 'native', events: {
                    mousedown: (e: MouseEvent) => this.mouseDown(e),
                    mousemove: (e: MouseEvent) => this.mouseMove(e),
                    mouseup: (e: MouseEvent) => this.mouseUp(e),
                    wheel: (e: WheelEvent) => this.mouseWheel(e),
                }}]
            },
        });

        this.SVG = <SVGSVGElement> this.CHART.childNodes[COMPONENTS.findIndex(c => c.key == SPECTRUM_KEY)];
        this.SVG_BBOX = this.SVG.getBoundingClientRect();
        this.SVG_POINT = this.SVG.createSVGPoint();
        this.SVG_RANGE_START = { x: 0, y: 0 };
        this.SVG_RANGE_END = { x: 0, y: 0 };
        this.SVG_RANGE = { x0: 0, y0: 0, x1: 0, y1: 0 };
        this.DATA_RANGE = { e0: MIN_E, e1: MAX_E, c0: 0, c1: Math.pow(10, MAX_Y) };

        this.SVG_RANGE_VIZ_ID = "rangeIndicator";
        this.SVG_RANGE_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
        this.SVG_RANGE_VIZ.id = this.SVG_RANGE_VIZ_ID;
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'style', 'fill: #9fcfff; opacity: 0.2; stroke: #9fcfff; stroke-width: 2px;');
        this.SVG.appendChild(this.SVG_RANGE_VIZ);

        this.drawStartTime = -1;

        this.SVG_CURSOR_VIZ_ID = "cursorIndicator";
        this.SVG_CURSOR_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
        this.SVG_CURSOR_VIZ.id = this.SVG_CURSOR_VIZ_ID;
        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'r', '2');
        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'style', 'fill: white; stroke: none;');
        this.SVG.appendChild(this.SVG_CURSOR_VIZ);

        this.searchWidth = 200;

        this.SVG_PEAK_VIZ_ID = "peakIndicator";
        this.SVG_PEAK_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'line');
        this.SVG_PEAK_VIZ.id = this.SVG_PEAK_VIZ_ID;
        this.SVG_PEAK_VIZ.setAttributeNS(null, 'style', 'fill: none; stroke: white;');
        this.SVG.appendChild(this.SVG_PEAK_VIZ);

        this.SVG_PEAK_ENERGY_VIZ_ID = "peakTextIndicator";
        this.SVG_PEAK_ENERGY_VIZ = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        this.SVG_PEAK_ENERGY_VIZ.id = this.SVG_PEAK_ENERGY_VIZ_ID;
        this.SVG_PEAK_ENERGY_VIZ.setAttributeNS(null, 'fill', '#9fcfff');
        this.SVG.appendChild(this.SVG_PEAK_ENERGY_VIZ);
    }

    resetData() {
        this.spectrumLog = ENERGIES.map(e => { return { energy: e, counts: MIN_Y }});
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

    updateTexts() {
        const roundedTime = this.lastRoundedTime;
        const cps = roundedTime > 0 ? this.countsInRange()/roundedTime : 0;
        COMPONENTS.find(c => c.key == TIMER_KEY).text = `Timer: ${timeConversion(roundedTime)} | Counts: ${pad(this.countsInRange(), 10)} | CPS: ${cps.toFixed(3)}`;
        this.PICASSO_CHART.update({
            excludeFromUpdate: COMPONENTS.map(c => c.key).filter(k => !(k == TIMER_KEY || k == POINTER_KEY)),
        })
    }

    updateDisplay(roundedTime: number) {
        this.lastRoundedTime = roundedTime;
        const cps = roundedTime > 0 ? this.countsInRange()/roundedTime : 0;
        COMPONENTS.find(c => c.key == TIMER_KEY).text = `Timer: ${timeConversion(roundedTime)} | Counts: ${pad(this.countsInRange(), 10)} | CPS: ${cps.toFixed(3)}`;
        this.PICASSO_CHART.update({
            data: { data: this.spectrumLog },
            partialData: true,
            excludeFromUpdate: COMPONENTS.map(c => c.key).filter(k => !(k == SPECTRUM_KEY || k == TIMER_KEY)),
        })
    }

    countsInRange(): number {
        let countsInRange = 0;
        const bottomCounts = this.DATA_RANGE.c0;
        const topCounts = this.DATA_RANGE.c1;
        for (let e = 0; e < ENERGIES.length; e++) {
            if (!(this.DATA_RANGE.e0 < ENERGIES[e] && ENERGIES[e] < this.DATA_RANGE.e1))
                continue;
            const counts = Math.pow(10, this.spectrumLog[e].counts);
            if (counts < 1) continue;
            if (bottomCounts < counts) {
                if (counts < topCounts)
                    countsInRange += counts - bottomCounts;
                else
                    countsInRange += topCounts - bottomCounts;
            }
        }
        return Math.round(countsInRange);
    }

    mouseEventToSVGCoordinates(e: any): DOMPoint {
        this.SVG_POINT.x = e.clientX;
        this.SVG_POINT.y = e.clientY;
        const svgCoordinates = this.SVG_POINT.matrixTransform(this.SVG.getScreenCTM().inverse());
        return svgCoordinates;
    }

    SVGCoordinatesToDataCoordinates(svgCoordinates: { x: number, y: number }): { x: number, y: number } {
        const dataCoordinates = {
            x: svgCoordinates.x / this.SVG_BBOX.width * (MAX_E - MIN_E) + MIN_E,
            y: (this.SVG_BBOX.height - svgCoordinates.y) / this.SVG_BBOX.height * (MAX_Y - MIN_Y) + MIN_Y
        }
        dataCoordinates.y = dataCoordinates.y > 0 ? Math.pow(10, dataCoordinates.y) : 0;
        return dataCoordinates;
    }

    logspectrumCoordinatesToSVGCoordinated(logspectrumCoordinates: { energy: number, counts: number }): { x: number, y: number } {
        const svgCoordinates = {
            x: (logspectrumCoordinates.energy - MIN_E) * this.SVG_BBOX.width / (MAX_E - MIN_E),
            y: this.SVG_BBOX.height - (logspectrumCoordinates.counts - MIN_Y) * this.SVG_BBOX.height / (MAX_Y - MIN_Y),
        }
        return svgCoordinates;
    }

    mouseDown(e: MouseEvent) {
        this.drawStartTime = (new Date()).getTime();
        const pt = this.mouseEventToSVGCoordinates(e);
        this.SVG_RANGE_START.x = pt.x;
        this.SVG_RANGE_START.y = pt.y;
    }

    mouseMove(e: MouseEvent) {
        const now = (new Date()).getTime();
        if (now - this.lastMouseMoveTime < 5)
            return;
        this.lastMouseMoveTime = now;

        const cursorSvgCoordinates = this.mouseEventToSVGCoordinates(e);
        const cursorDataCoordinates = this.SVGCoordinatesToDataCoordinates({ x: cursorSvgCoordinates.x, y: cursorSvgCoordinates.y });

        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'cx', cursorSvgCoordinates.x.toString());
        this.SVG_CURSOR_VIZ.setAttributeNS(null, 'cy', cursorSvgCoordinates.y.toString());

        const cursorEnergyDistances = ENERGIES.map((e) => Math.abs(e - cursorDataCoordinates.x));
        const cursorEnergyIndex = cursorEnergyDistances.findIndex(e => e == Math.min(...cursorEnergyDistances));
        const localSpectrum = this.spectrumLog.slice(Math.max(0, cursorEnergyIndex-this.searchWidth/2), Math.min(ENERGIES.length, cursorEnergyIndex+this.searchWidth/2));
        const maxDataCoordinates = localSpectrum.sort((a, b) => b.counts - a.counts)[0];
        const maxSvgCoordinates = this.logspectrumCoordinatesToSVGCoordinated(maxDataCoordinates);

        this.SVG_PEAK_VIZ.setAttributeNS(null, 'x1', maxSvgCoordinates.x.toString());
        this.SVG_PEAK_VIZ.setAttributeNS(null, 'y1', maxSvgCoordinates.y.toString());
        this.SVG_PEAK_VIZ.setAttributeNS(null, 'x2', cursorSvgCoordinates.x.toString());
        this.SVG_PEAK_VIZ.setAttributeNS(null, 'y2', cursorSvgCoordinates.y.toString());

        this.SVG_PEAK_ENERGY_VIZ.setAttributeNS(null, 'x', cursorSvgCoordinates.x.toString());
        this.SVG_PEAK_ENERGY_VIZ.setAttributeNS(null, 'y', cursorSvgCoordinates.y.toString() + 10);
        this.SVG_PEAK_ENERGY_VIZ.textContent = maxDataCoordinates.energy.toFixed(0) + ' keV';

        COMPONENTS.find(c => c.key == POINTER_KEY).text = `x=${cursorDataCoordinates.x.toFixed(2)}, y=${cursorDataCoordinates.y.toFixed(0)}`;
        this.updateTexts();

        if (this.drawStartTime < 0)
            return;

        this.SVG_RANGE_END.x = cursorSvgCoordinates.x;
        this.SVG_RANGE_END.y = cursorSvgCoordinates.y;
        [this.SVG_RANGE.x0, this.SVG_RANGE.x1] = [Math.min(this.SVG_RANGE_START.x, this.SVG_RANGE_END.x), Math.max(this.SVG_RANGE_START.x, this.SVG_RANGE_END.x)];
        [this.SVG_RANGE.y0, this.SVG_RANGE.y1] = [Math.min(this.SVG_RANGE_START.y, this.SVG_RANGE_END.y), Math.max(this.SVG_RANGE_START.y, this.SVG_RANGE_END.y)];
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'x', this.SVG_RANGE.x0.toString());
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'y', this.SVG_RANGE.y0.toString());
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'width', (this.SVG_RANGE.x1 - this.SVG_RANGE.x0).toString());
        this.SVG_RANGE_VIZ.setAttributeNS(null, 'height', (this.SVG_RANGE.y1 - this.SVG_RANGE.y0).toString());
        this.SVG.appendChild(this.SVG_RANGE_VIZ);
    }

    mouseUp(e: MouseEvent) {
        const start = this.drawStartTime;
        const now = (new Date()).getTime();
        this.drawStartTime = -1;
        if (now - start < 100) {
            this.SVG.removeChild(this.SVG_RANGE_VIZ);
            this.DATA_RANGE = { e0: MIN_E, e1: MAX_E, c0: 0, c1: Math.pow(10, MAX_Y) };
            return;
        }
        const data0 = this.SVGCoordinatesToDataCoordinates({ x: this.SVG_RANGE.x0, y: this.SVG_RANGE.y0 });
        const data1 = this.SVGCoordinatesToDataCoordinates({ x: this.SVG_RANGE.x1, y: this.SVG_RANGE.y1 });
        this.DATA_RANGE.e0 = Math.min(data0.x, data1.x);
        this.DATA_RANGE.c0 = Math.floor(Math.min(data0.y, data1.y));
        this.DATA_RANGE.e1 = Math.max(data0.x, data1.x);
        this.DATA_RANGE.c1 = Math.floor(Math.max(data0.y, data1.y));
        this.updateTexts();
    }

    mouseWheel(e: WheelEvent) {
        this.searchWidth += e.deltaY > 0 ? -10 : 10;
        this.searchWidth = Math.max(1, Math.min(this.searchWidth, 500));
        e.preventDefault();
    }
}


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
        min: ENERGIES[0],
        max: ENERGIES[ENERGIES.length-1],
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

const X_LABEL = 'Energy / keV';
const Y_LABEL = 'Counts';

const X_AXIS_KEY = 'x-axis';
const X_LABEL_KEY = 'x-label';
const Y_AXIS_KEY = 'y-axis';
const Y_LABEL_KEY = 'y-label';
const TIMER_KEY = 'timer';
const POINTER_KEY = 'pointer';
const GRID_KEY = 'grid';
const SPECTRUM_KEY = 'spectrum-line';

const FONT = 'Segoe UI, Roboto, sans-serif';

const COMPONENTS = [
    {
        type: 'axis',
        key: X_AXIS_KEY,
        scale: ENERGY_SCALE,
        layout: { dock: 'bottom', },
        settings: { labels: { fill: '#d6e1ff' }},
    }, {
        type: 'text',
        key: X_LABEL_KEY,
        text: X_LABEL,
        dock: 'bottom',
        fontSize: 14,
        font: FONT,
        x: { value: '50%' },  // Centered horizontally
        y: { value: '95%' },  // Position below the x-axis
        align: 'middle',
        style: { text: { fill: '#d6e1ff' }},
    }, {
        type: 'axis',
        key: Y_AXIS_KEY,
        scale: COUNTS_SCALE,
        layout: { dock: 'left', },
        formatter: { type: 'logScaleFormatter', format: '', },
        settings: { labels: { fill: '#d6e1ff' }},
    }, {
        type: 'text',
        key: Y_LABEL_KEY,
        text: Y_LABEL,
        dock: 'left',
        fontSize: 14,
        font: FONT,
        x: { value: '5%' },   // Position near the left side
        y: { value: '50%' },  // Centered vertically
        align: 'middle',
        rotate: 270,  // Rotate for vertical alignment
        style: { text: { fill: '#d6e1ff' }},
    }, {
        type: 'text',
        key: TIMER_KEY,
        dock: 'top',
        text: '',
        style: { text: { fill: '#d6e1ff' }},
    }, {
        type: 'text',
        key: POINTER_KEY,
        dock: 'top',
        text: 'x=100 keV, y=1000',
        style: { text: { fill: '#d6e1ff' }},
    }, {
        type: 'grid-line',
        key: GRID_KEY,
        x: { scale: ENERGY_SCALE },
        y: { scale: COUNTS_SCALE },
        ticks: { show: true, stroke: '#fff5' },
        minorTicks: { show: true, stroke: '#fff2'  },
    }, {
        type: 'line',
        key: SPECTRUM_KEY,
        data: {
            extract: {
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
                line: { show: true, stroke: '#ccc' },
                area: { show: false },
            },
        },
    }
]

export { GuiChart };
