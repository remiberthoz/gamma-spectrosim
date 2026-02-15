# Gamma spectroscopy simulator

This program simulates a gamma spectrometer measuring various environmental samples.
It is designed for educational use in environmental science courses, where students learn to interpret gamma spectra, identify photopeaks, and relate them to radionuclides.

## Overview

The simulator generates synthetic gamma spectra based on radioisotope compositions reported in: *Examination of radioactive contamination in the soil-plant system and their transfer to selected animal tissues*. S. Chibowski, A. Gladysz. *Polish journal of environmental studies **8** (1)*, 19–23 (1999).

Gamma emission data (energies, intensities) are taken from [Laraweb (LNHB)](http://www.lnhb.fr/Laraweb/).

The focus of the simulation is to provide spectra that look realistic enough for pedagogical scenarios in environmental sciences. Only photopeaks are represented - no Compton continuum, backscatter features or other detailed detector effects. Temporal counting statistics are included and behave plausibly, but decay of isotopes over time is not implemented.

As a result, the simulator is not intended for nuclear physics education, but is sufficient to teach photopeak identification, time statistics and counting fluctuations, association of gamma ray energies with radioisotopes, and understanding activity levels through peak areas. With moderately complex samples, it is also possible to discuss the origin of radioisotopes: whether cosmogenic, primordial, or anthropogenic.

**First impression with students:**
- Measuring areas instead of peak height is not intuitive, even after a demonstration by the instructor. 
- Reading peak energies on the graph is difficult, even with the cursor indicator.
- There are too many peaks on the samples for students to perform the analysis alone. Even in groups, the teaching session should be organised by the instructor. I believe it would be good to perform a demonstration on one peak, and then assign each student two or three peaks to measure ; results are then pooled.
- Comparison of peak energy with Laraweb not fruitfull, the Laraweb database is way too exhaustive.

<img width="1675" height="803" alt="Screenshot 2025-12-09 at 18-51-56 ☢️ Gamma Spectroscopy Sim" src="https://github.com/user-attachments/assets/5a44c0f7-5baa-44c2-a0f4-8a5b272c9a35" />

## Features and limitations

- Multiple predefined samples:
    - Calibration sources (Cs-137 and Co-60)
    - Soil samples
    - Plant samples
- Basic detector selection:
    - NaI(Tl): wide peaks, high efficiency
    - HPGe: narrow peaks, low efficiency
- Spectra accumulate in real time
- Simple and lightweight web interface

---

- No energy calibration (fixed)
- Spectrum realism is qualitative, not experimental-grade

## Usage

Freely accessible at: TODO

## TODO

- Translate UI in english.
- Document code structure and usage instructions.
- Improve more!
