// Yield loss breakpoints: [waterCutPct, moderateLossPct, severeLossPct]
// Base curves: Crookston et al. 2025; Montazar & Putnam 2020, 2023
// Re-calibrated against Idaho PDSI 2000–2025 (growing-season Apr–Sep avg):
//   25% cut ≈ PDSI -2.2  (moderate drought centroid; 9 of 26 Idaho seasons)
//   30% cut ≈ PDSI -2.7  (transition zone; 4–5 Idaho seasons in PDSI -2.5 to -3.0)
//   40% cut ≈ PDSI -3.6  (severe; 2021: PDSI -3.56, D2+ drought on 85% of Idaho)
//   50% cut ≈ PDSI -4.1  (extreme; 2001: PDSI -4.13, D3+ drought on 58% of Idaho)
const ALFALFA = [
  [0,   0,  0],
  [10,  2,  4],
  [25,  7, 16],
  [30, 11, 22],
  [40, 19, 34],
  [50, 38, 48],
]

// Corn / Potatoes (proxy): USDA/extension estimates
const CORN = [
  [0,  0,  0],
  [10, 5,  8],
  [25, 15, 25],
  [40, 30, 45],
  [50, 45, 65],
]

// Winter Wheat / Spring Barley / Dry Beans (proxy): USDA/extension estimates
const WHEAT = [
  [0,  0,  0],
  [10, 3,  5],
  [25, 10, 20],
  [40, 20, 35],
  [50, 30, 50],
]

function interpolate(x, x0, y0, x1, y1) {
  if (x1 === x0) return y0
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
}

function lossFromTable(table, waterCutPct, stressLevel) {
  const col = stressLevel === 'severe' ? 2 : 1
  const cut = Math.max(0, Math.min(100, waterCutPct))

  for (let i = 0; i < table.length - 1; i++) {
    if (cut >= table[i][0] && cut <= table[i + 1][0]) {
      return interpolate(cut, table[i][0], table[i][col], table[i + 1][0], table[i + 1][col])
    }
  }
  // beyond last point — extrapolate, capped at 100
  const n = table.length
  return Math.min(100, interpolate(cut, table[n - 2][0], table[n - 2][col], table[n - 1][0], table[n - 1][col]))
}

function tableForCrop(cropType) {
  switch (cropType) {
    case 'Corn':
    case 'Potatoes':
      return CORN
    case 'Winter Wheat':
    case 'Spring Barley':
    case 'Dry Beans':
      return WHEAT
    default:
      return ALFALFA
  }
}

/**
 * Returns yield loss percent for any supported crop type.
 * @param {string} cropType
 * @param {number} waterCutPct  0–100
 * @param {'moderate'|'severe'} stressLevel
 * @returns {number} yield loss percent (0–100)
 */
export function getYieldLoss(cropType, waterCutPct, stressLevel = 'moderate') {
  return lossFromTable(tableForCrop(cropType), waterCutPct, stressLevel)
}

// Alfalfa-only helpers kept for backward compatibility with Yield Calculator page
export function getYieldLossPct(waterCutPct, stressLevel = 'moderate') {
  return lossFromTable(ALFALFA, waterCutPct, stressLevel)
}

export function getYieldLossRange(waterCutPct) {
  return {
    moderate: lossFromTable(ALFALFA, waterCutPct, 'moderate'),
    severe:   lossFromTable(ALFALFA, waterCutPct, 'severe'),
  }
}

export const GRADE_PRICES = {
  utility:  222,
  good:     249,
  premium:  300,
  supreme:  315,
}
