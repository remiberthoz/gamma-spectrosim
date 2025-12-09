interface Gui {
    resetData: () => void;
    setPause: (paused: boolean) => void;
    logDecay: (timestamp: number, delay: number, energy: number, energyIndex: number) => void;
    updateDisplay: (roundedTime: number) => void;
}

export { Gui };