// Research-based drought guidance per crop type.
// Sources: Fu et al. (2022) corn drought priming; Idaho Extension wheat/potato estimates.

const RISK_ORDER = ['low', 'moderate', 'high', 'critical']

function bumpRisk(level) {
  const i = RISK_ORDER.indexOf(level)
  return i < RISK_ORDER.length - 1 ? RISK_ORDER[i + 1] : 'critical'
}

function cornAdvice(cut) {
  if (cut < 15) return {
    riskLevel: 'low',
    topAction: 'Corn is moderately drought tolerant early season.',
    details: 'Mild early stress may actually prime the plant for later resilience (Fu et al., 2022). Monitor for heat stress compound effects and maintain soil moisture at field capacity through V6.',
  }
  if (cut <= 35) return {
    riskLevel: 'moderate',
    topAction: 'Protect the pollination window (silking stage) — this is your highest-priority irrigation event.',
    details: 'Water stress during tasseling and silking causes the largest yield losses — up to 50% per week of stress at that stage. If water is limited, defer deficit irrigation to vegetative or late dough stages instead.',
  }
  return {
    riskLevel: 'critical',
    topAction: 'Prioritize irrigation at silking and early grain fill over all other crop stages.',
    details: 'Severe drought during grain fill causes kernel abortion. Expect 45–65% yield loss. Consider reducing planted acres to concentrate available water on fewer, fully irrigated fields.',
  }
}

function wheatAdvice(cut) {
  if (cut < 15) return {
    riskLevel: 'low',
    topAction: 'Winter wheat is relatively drought tolerant under moderate deficit.',
    details: 'Idaho average yield holds well at this water cut level. Soil water stored from fall precipitation provides a buffer. Monitor for tip desiccation during extreme heat events.',
  }
  if (cut <= 30) return {
    riskLevel: 'moderate',
    topAction: 'Protect heading and grain fill — drought at Feekes 10.5 causes the highest loss per unit of stress.',
    details: 'Deficit irrigation before jointing is better tolerated than stress at flag leaf or heading. If rationing, cut back on tillering and elongation stages, not at heading.',
  }
  return {
    riskLevel: 'high',
    topAction: 'Consider adjusting seeding rate down 10–15% to reduce total crop water demand.',
    details: 'Yield loss at this level is 30–50%. Early-maturing varieties may reduce total season water demand. Prioritize irrigation at heading and grain fill if any water remains available.',
  }
}

function potatoAdvice(cut) {
  if (cut < 10) return {
    riskLevel: 'low',
    topAction: 'Even mild deficit reduces tuber size and marketable yield — maintain consistent soil moisture.',
    details: 'Potatoes are sensitive to water stress throughout the season. Idaho yields are among the highest in the U.S. due to careful irrigation management. Any water savings should come from non-critical vegetative stages.',
  }
  if (cut <= 25) return {
    riskLevel: 'high',
    topAction: 'Prioritize tuber initiation (6–8 weeks after emergence) and bulking — these represent 70% of yield potential.',
    details: 'Potatoes have shallow roots and water stress hits fast. Consider surge or drip irrigation to stretch limited water. Monitor soil moisture at 12-inch depth daily during bulking.',
  }
  return {
    riskLevel: 'critical',
    topAction: 'Reduce planted acres and concentrate all available water on fewer fields.',
    details: 'Expect 40–60% marketable yield loss and significant grade downgrades. Hollow heart and heat necrosis risk increases sharply at this deficit. Consult your buyer about grade tolerance before harvest.',
  }
}

function alfalfaAdvice(cut) {
  if (cut <= 10) return {
    riskLevel: 'low',
    topAction: 'Minimal impact — maintain standard cutting schedule.',
    details: 'Yield loss is under 2% at this water cut level. No major management changes needed. Monitor for compounding heat stress during peak summer cuts.',
  }
  if (cut <= 25) return {
    riskLevel: 'moderate',
    topAction: 'Prioritize irrigation on cuts 1–3, which represent 70%+ of annual yield.',
    details: 'Deficit irrigate late-season cuts. Consider harvesting cut 4 slightly early to boost quality grade. Expected yield loss is 6–15% (Crookston et al., 2025).',
  }
  if (cut <= 40) return {
    riskLevel: 'high',
    topAction: 'Run the Water Strategy calculator to compare triage vs. spread-thin.',
    details: 'Cutting at bud stage rather than 10% bloom recovers quality premiums even as tons drop. Raise cutting height by 1–2 inches to protect regrowth. Expected yield loss 18–32%.',
  }
  return {
    riskLevel: 'critical',
    topAction: 'Use triage — fully irrigate your best acres and fallow the rest.',
    details: 'Do not spread water thin across all acres at this deficit. Monitor soil moisture at 45–120 cm depth to protect stand survival. Expected yield loss 38–43%+.',
  }
}

/**
 * Returns drought guidance for a crop at a given water cut and stress level.
 * @param {string} cropType
 * @param {number} waterCutPct  0–100
 * @param {'moderate'|'severe'} severity
 * @returns {{ riskLevel: string, topAction: string, details: string }}
 */
export function getCropDroughtAdvice(cropType, waterCutPct, severity) {
  let advice

  switch (cropType) {
    case 'Corn':         advice = cornAdvice(waterCutPct);  break
    case 'Potatoes':     advice = potatoAdvice(waterCutPct); break
    case 'Winter Wheat': advice = wheatAdvice(waterCutPct); break
    case 'Spring Barley':
    case 'Dry Beans': {
      const base = wheatAdvice(waterCutPct)
      advice = {
        ...base,
        details: base.details + ` (Estimates use winter wheat as a proxy for ${cropType} — verify with your local extension office.)`,
      }
      break
    }
    default: advice = alfalfaAdvice(waterCutPct)
  }

  // Bump risk one tier when stress is severe (unless already critical)
  if (severity === 'severe' && advice.riskLevel !== 'critical') {
    advice = { ...advice, riskLevel: bumpRisk(advice.riskLevel) }
  }

  return advice
}

export const RISK_STYLES = {
  low:      { border: 'border-green-400',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800',   label: 'Low Risk'  },
  moderate: { border: 'border-amber-400',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-800',   label: 'Moderate'  },
  high:     { border: 'border-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800',  label: 'High Risk' },
  critical: { border: 'border-red-500',    bg: 'bg-red-50',    badge: 'bg-red-100 text-red-900',        label: 'Critical'  },
}
