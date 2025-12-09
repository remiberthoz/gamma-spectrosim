/** ---------------------------------------------------------------------------
 *  Sensor data definitions
 *  ---------------------------------------------------------------------------
 *
 * Area under a gaussian is: A = H * FWHM / (0.3989 * 2.35)
 */

interface Sensor { name: string, ray_width: number, efficiency: number };

/**
 * Data from Performance of CdTe, HPGe and NaI(Tl) detectors for radioactivity measurements,
 * Applied Radiation and Isotopes Volume 60, Issue 1, January 2004, Pages 41-47
 *
 * Ray widht in keV (FWHM)
 */
const SENSORS: Sensor[] = [
    { name: "NaI(Tl), e=5%", ray_width: 30, efficiency: 5/100 },
    { name: "HPGe, e=0.8%", ray_width: 1, efficiency: 0.8/100 },
]

export { SENSORS };
