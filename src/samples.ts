/** ---------------------------------------------------------------------------
 *  Sample data definitions
 *  ---------------------------------------------------------------------------
 */

const Emax = 2000;
const dE = 1;
const ENERGIES: number[] = Array(Emax/dE).fill(0).map((_, index) => index*dE);

interface SampleIsotope { name: string, mass: number };
interface Sample { name: string, isotopes: SampleIsotope[] };
interface SampleGroup { name: string, samples: Sample[] };

interface SpectrumPoint { energy: number, counts: number };

/**
 * Mass values in grams.
 */
const SAMPLES: SampleGroup[] = [
    { name: "Sources de calibration", samples: [
        { name: "Césium-137 @ 0.1 kBq (prod. 2025)", isotopes: [
            { name: "137Cs", mass: 3.10896937665e-11 },
        ] },
        { name: "Cobalt-60 @ 0.1 kBq (prod. 2025)", isotopes: [
            { name: "60Co", mass: 239.097169090e-14 },
        ] },
        { name: "Cobalt-60 @ 0.1 kBq (prod. 2020)", isotopes: [
            { name: "60Co", mass: 239.097169090e-14/2 },
        ] },
        { name: "Cobalt-60 @ 0.1 kBq (prod. 2015)", isotopes: [
            { name: "60Co", mass: 239.097169090e-14/4 },
        ] },
    ] },
    /**
     * Data from: Examination of radioactive contamination in the soil-plant system and their transfer to selected animal tissues,
     * Polish Journal of Environmental Studies Vol. 8, No. 1 (1999), 19-23,
     * https://www.pjoes.com/pdf-87212-21071?filename=Examination%20of.pdf
     * Source data is Bq/kg, converted here to g per 100 g of sample.
     */
    { name: "Région E : Elizowka", samples: [
        { name: "Sol de champ de pommes de terre, Elizowka (100 g)", isotopes: [
            { name: "228Ac", mass: 3.773128552424719e-17 },
            { name: "7Be", mass: 0.0 },
            { name: "134Cs", mass: 0.0 },
            { name: "137Cs", mass: 6.653194466034509e-13 },
            { name: "40K", mass: 0.00024748201438848925 },
            { name: "210Pb", mass: 1.2954465231203673e-12 },
            { name: "212Pb", mass: 6.127927787720799e-17 },
            { name: "214Pb", mass: 1.5399900645802287e-18 },
            { name: "226Ra", mass: 1.8562055768179336e-10 },
            { name: "228Th", mass: 1.6021625898331906e-13 },
            { name: "234Th", mass: 4.844169487568578e-15 },
            { name: "208Tl", mass: 1.0422380691168404e-19 },
            { name: "210Tl", mass: 0.0 },
            { name: "212Bi", mass: 6.179671647297547e-18 },
            { name: "214Bi", mass: 1.2302070645554202e-18 },
        ]},
        { name: "Tiges de pommes de terre, Elizowka (100 g)", isotopes: [
            { name: "228Ac", mass: 1.100495827790543e-17 },
            { name: "7Be", mass: 6.962757344436734e-16 },
            { name: "134Cs", mass: 0.0 },
            { name: "137Cs", mass: 1.1503186693611069e-13 },
            { name: "40K", mass: 0.000329761453994699 },
            { name: "210Pb", mass: 2.174373455700671e-12 },
            { name: "212Pb", mass: 4.6688973620729905e-18 },
            { name: "214Pb", mass: 3.7257824143070045e-19 },
            { name: "226Ra", mass: 1.0278840896664846e-10 },
            { name: "228Th", mass: 1.6318322674226942e-13 },
            { name: "234Th", mass: 5.065950741216295e-15 },
            { name: "208Tl", mass: 2.2856098006948256e-20 },
            { name: "210Tl", mass: 4.7058823529411764e-21 },
            { name: "212Bi", mass: 0.0 },
            { name: "214Bi", mass: 0.0 },
        ]},
    ] },
    { name: "Région F : Fajslawice", samples: [
        { name: "Sol de champ de pommes de terre, Fajslawice (100 g)", isotopes: [
            { name: "228Ac", mass: 1.3786431249244166e-17 },
            { name: "7Be", mass: 0.0 },
            { name: "134Cs", mass: 4.1826128782650527e-16 },
            { name: "137Cs", mass: 5.005440696409141e-13 },
            { name: "40K", mass: 9.534267322983719e-05 },
            { name: "210Pb", mass: 4.871161313095658e-13 },
            { name: "212Pb", mass: 2.2566337250019454e-17 },
            { name: "214Pb", mass: 5.133300215267429e-19 },
            { name: "226Ra", mass: 6.916347731000547e-11 },
            { name: "228Th", mass: 4.813081031186128e-14 },
            { name: "234Th", mass: 1.6225049608964634e-15 },
            { name: "208Tl", mass: 3.565551289083928e-20 },
            { name: "210Tl", mass: 0.0 },
            { name: "212Bi", mass: 1.8077845415974914e-18 },
            { name: "214Bi", mass: 4.019488428745432e-19 },
        ]},
        { name: "Tiges de pommes de terre, Fajslawice (100 g)", isotopes: [
            { name: "228Ac", mass: 9.190954166162778e-18 },
            { name: "7Be", mass: 1.0417148585087516e-15 },
            { name: "134Cs", mass: 0.0 },
            { name: "137Cs", mass: 2.5804445826208617e-13 },
            { name: "40K", mass: 0.0001911397198031049 },
            { name: "210Pb", mass: 3.0038828097423223e-12 },
            { name: "212Pb", mass: 1.478484164656447e-17 },
            { name: "214Pb", mass: 3.1462162609703597e-19 },
            { name: "226Ra", mass: 7.162383816293057e-11 },
            { name: "228Th", mass: 4.7141821058877835e-14 },
            { name: "234Th", mass: 1.0738881755573714e-15 },
            { name: "208Tl", mass: 2.5598829767782043e-20 },
            { name: "210Tl", mass: 0.0 },
            { name: "212Bi", mass: 0.0 },
            { name: "214Bi", mass: 2.92326431181486e-19 },
        ]},
    ] },
]


/** ---------------------------------------------------------------------------
 *  Background data definitions
 *  ---------------------------------------------------------------------------
 *
 * Extracted from polynomial fit on data from ... ?
 */

const backgroundPolynomialTerms = [-2.8053382757189411e+002, 4.5384829593483815e+001, -3.5518017564844373e-001, 1.2163717655074482e-003, -2.3194397232981911e-006, 2.6624483639030862e-009, -1.8248947062494507e-012, 6.1899908542457358e-016, 5.9208265786960357e-020, -1.6356117078016354e-022, 7.7686780238269212e-026, -1.8978303939866555e-029, 2.4596838895338473e-033, -1.3418123401803528e-037];

function reconstructBackgroundCounts(energy: number) {
    let counts = 0;
    for (let exponent = 0; exponent < backgroundPolynomialTerms.length; exponent++) {
        counts += backgroundPolynomialTerms[exponent] * Math.pow(energy, exponent);
    }
    // add extra peak at low energies, that was not fitted by the polynomial (X-rays peak maybe ?)
    counts += 10000 * Math.exp(-energy/10);
    // scale output to ms, data in paper was on 48h
    // TODO: scale down by 4 helps to see isotope peaks, but this is not the best way to do.
    return Math.max(0, counts) / (48*3600)/4;
}

const BACKGROUND = ENERGIES.map(e => { return { energy: e, counts: reconstructBackgroundCounts(e) }});


export { ENERGIES, BACKGROUND, SAMPLES, SpectrumPoint };
