import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { useFarm } from '../context/FarmContext'

// ── helpers ─────────────────────────────────────────────────────────────────

function num(v) {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

/**
 * Compute per-acre ownership and operating costs for one machine.
 * @param {object} eq   - equipment inputs
 * @param {object} cfg  - global settings
 * @param {boolean} isPower - true = power unit (has fuel)
 */
function calcCosts(eq, cfg, isPower) {
  const value      = num(eq.value)
  const salvage    = num(eq.salvage)
  const life       = num(eq.life) || 1
  const yearsOwned = num(eq.yearsOwned)
  const hours      = num(eq.hours) || 1
  const hp         = isPower ? num(eq.hp) : 0
  const acres      = num(cfg.acres) || 1
  const wage       = num(cfg.wage)
  const fuelPrice  = num(cfg.fuelPrice)
  const intRate    = num(cfg.interestRate) / 100
  const insRate    = num(cfg.insurance)    / 100
  const taxRate    = num(cfg.taxes)        / 100
  const housingRate= num(cfg.housing)      / 100

  // Ownership ($/yr)
  const depreciation = (value - salvage) / life
  const interest     = ((value + salvage) / 2) * intRate
  const insurance    = value * insRate
  const taxes        = value * taxRate
  const housing      = value * housingRate
  const ownershipYr  = depreciation + interest + insurance + taxes + housing

  // Operating ($/yr)
  const fuel   = isPower ? hp * 0.044 * fuelPrice * hours : 0
  const repair = value * 0.02 * (yearsOwned / life)
  const labor  = wage * hours

  const operatingYr = fuel + repair + labor

  const totalYr = ownershipYr + operatingYr

  return {
    depreciation: depreciation / acres,
    interest:     interest     / acres,
    insurance:    insurance    / acres,
    taxes:        taxes        / acres,
    housing:      housing      / acres,
    ownershipPerAcre:  ownershipYr  / acres,
    fuel:         fuel          / acres,
    repair:       repair        / acres,
    labor:        labor         / acres,
    operatingPerAcre:  operatingYr  / acres,
    totalPerAcre:      totalYr      / acres,
  }
}

// ── sub-components ───────────────────────────────────────────────────────────

function FieldInput({ label, value, onChange, prefix, suffix, step = 'any', min = '0' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#27500A]">
        {prefix && <span className="bg-gray-50 border-r border-gray-300 px-2 py-2 text-xs text-gray-400">{prefix}</span>}
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-2 py-2 text-sm focus:outline-none min-w-0"
        />
        {suffix && <span className="bg-gray-50 border-l border-gray-300 px-2 py-2 text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  )
}

function EquipmentCard({ title, eq, setEq, isPower }) {
  function set(field) {
    return val => setEq(prev => ({ ...prev, [field]: val }))
  }
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
      <h2 className="font-bold text-[#27500A] text-base">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        <FieldInput label="Equipment Value ($)"    prefix="$" value={eq.value}      onChange={set('value')} />
        <FieldInput label="Salvage Value ($)"      prefix="$" value={eq.salvage}    onChange={set('salvage')} />
        <FieldInput label="Useful Life (yrs)"      suffix="yr" value={eq.life}      onChange={set('life')} min="1" />
        <FieldInput label="Years Owned"            suffix="yr" value={eq.yearsOwned} onChange={set('yearsOwned')} />
        <FieldInput label="Annual Oper. Hours"     suffix="hr" value={eq.hours}     onChange={set('hours')} min="1" />
        {isPower && (
          <FieldInput label="Engine HP"            suffix="HP" value={eq.hp}        onChange={set('hp')} />
        )}
      </div>
    </div>
  )
}

// ── cost table ───────────────────────────────────────────────────────────────

function fmt(n) {
  return n.toFixed(2)
}

function CostTable({ power, implement }) {
  const total = {
    depreciation:    power.depreciation    + implement.depreciation,
    interest:        power.interest        + implement.interest,
    insurance:       power.insurance       + implement.insurance,
    taxes:           power.taxes           + implement.taxes,
    housing:         power.housing         + implement.housing,
    ownershipPerAcre: power.ownershipPerAcre + implement.ownershipPerAcre,
    fuel:            power.fuel            + implement.fuel,
    repair:          power.repair          + implement.repair,
    labor:           power.labor           + implement.labor,
    operatingPerAcre: power.operatingPerAcre + implement.operatingPerAcre,
    totalPerAcre:    power.totalPerAcre    + implement.totalPerAcre,
  }

  const rows = [
    { label: 'Depreciation',     key: 'depreciation',    section: 'own' },
    { label: 'Interest',         key: 'interest',        section: 'own' },
    { label: 'Insurance',        key: 'insurance',       section: 'own' },
    { label: 'Taxes',            key: 'taxes',           section: 'own' },
    { label: 'Housing',          key: 'housing',         section: 'own' },
    { label: 'Fuel',             key: 'fuel',            section: 'op'  },
    { label: 'Repairs',          key: 'repair',          section: 'op'  },
    { label: 'Labor',            key: 'labor',           section: 'op'  },
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <h2 className="font-bold text-[#27500A] text-base">Cost Summary ($/acre)</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#27500A] text-white">
              <th className="text-left px-4 py-2.5 font-semibold w-40">Item</th>
              <th className="text-right px-4 py-2.5 font-semibold">Power Unit</th>
              <th className="text-right px-4 py-2.5 font-semibold">Implement</th>
              <th className="text-right px-4 py-2.5 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Ownership block */}
            <tr className="bg-[#EFF5E8]">
              <td colSpan={4} className="px-4 py-1.5 text-xs font-bold text-[#27500A] uppercase tracking-wide">
                Ownership Costs
              </td>
            </tr>
            {rows.filter(r => r.section === 'own').map(({ label, key }) => (
              <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{label}</td>
                <td className="px-4 py-2 text-right text-gray-800">${fmt(power[key])}</td>
                <td className="px-4 py-2 text-right text-gray-800">${fmt(implement[key])}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-800">${fmt(total[key])}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-[#27500A] bg-[#EFF5E8] font-semibold">
              <td className="px-4 py-2 text-[#27500A]">Total Ownership</td>
              <td className="px-4 py-2 text-right text-[#27500A]">${fmt(power.ownershipPerAcre)}</td>
              <td className="px-4 py-2 text-right text-[#27500A]">${fmt(implement.ownershipPerAcre)}</td>
              <td className="px-4 py-2 text-right text-[#27500A]">${fmt(total.ownershipPerAcre)}</td>
            </tr>

            {/* Operating block */}
            <tr className="bg-amber-50">
              <td colSpan={4} className="px-4 py-1.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
                Operating Costs
              </td>
            </tr>
            {rows.filter(r => r.section === 'op').map(({ label, key }) => (
              <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{label}</td>
                <td className="px-4 py-2 text-right text-gray-800">${fmt(power[key])}</td>
                <td className="px-4 py-2 text-right text-gray-800">${fmt(implement[key])}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-800">${fmt(total[key])}</td>
              </tr>
            ))}
            <tr className="border-b-2 border-amber-400 bg-amber-50 font-semibold">
              <td className="px-4 py-2 text-amber-800">Total Operating</td>
              <td className="px-4 py-2 text-right text-amber-800">${fmt(power.operatingPerAcre)}</td>
              <td className="px-4 py-2 text-right text-amber-800">${fmt(implement.operatingPerAcre)}</td>
              <td className="px-4 py-2 text-right text-amber-800">${fmt(total.operatingPerAcre)}</td>
            </tr>

            {/* Grand total */}
            <tr className="bg-[#27500A] text-white font-bold text-base">
              <td className="px-4 py-3">Total Cost / Acre</td>
              <td className="px-4 py-3 text-right">${fmt(power.totalPerAcre)}</td>
              <td className="px-4 py-3 text-right">${fmt(implement.totalPerAcre)}</td>
              <td className="px-4 py-3 text-right">${fmt(total.totalPerAcre)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  acres:        '500',
  wage:         '20',
  fuelPrice:    '4',
  interestRate: '9',
  insurance:    '0.5',
  taxes:        '1.4',
  housing:      '1.0',
}

const DEFAULT_POWER = {
  value:      '180000',
  salvage:    '40000',
  life:       '10',
  yearsOwned: '5',
  hours:      '800',
  hp:         '180',
}

const DEFAULT_IMPLEMENT = {
  value:      '45000',
  salvage:    '8000',
  life:       '12',
  yearsOwned: '4',
  hours:      '400',
}

export default function MachineryCost() {
  const { farm } = useFarm()
  const [cfg, setCfg]   = useState({ ...DEFAULT_SETTINGS, acres: farm.crops.reduce((s, c) => s + (Number(c.acres) || 0), 0) || DEFAULT_SETTINGS.acres })
  const [power, setPower]         = useState(DEFAULT_POWER)
  const [implement, setImplement] = useState(DEFAULT_IMPLEMENT)

  function setCfgField(field) {
    return val => setCfg(prev => ({ ...prev, [field]: val }))
  }

  const powerCosts     = calcCosts(power, cfg, true)
  const implementCosts = calcCosts(implement, cfg, false)

  return (
    <div className="flex-1">
      <PageHeader
        title="Machinery Cost Calculator"
        subtitle="Estimate per-acre ownership and operating costs for a power unit and implement pair."
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Settings */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">Settings</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FieldInput label="Operating Acres"   suffix="ac"  value={cfg.acres}        onChange={setCfgField('acres')} min="1" />
            <FieldInput label="Operator Wage"     prefix="$" suffix="/hr" value={cfg.wage}    onChange={setCfgField('wage')} />
            <FieldInput label="Fuel Cost"         prefix="$" suffix="/gal" value={cfg.fuelPrice} onChange={setCfgField('fuelPrice')} step="0.01" />
            <FieldInput label="Interest Rate"     suffix="%"   value={cfg.interestRate} onChange={setCfgField('interestRate')} step="0.1" />
            <FieldInput label="Insurance"         suffix="%"   value={cfg.insurance}    onChange={setCfgField('insurance')} step="0.1" />
            <FieldInput label="Taxes"             suffix="%"   value={cfg.taxes}        onChange={setCfgField('taxes')} step="0.1" />
            <FieldInput label="Housing"           suffix="%"   value={cfg.housing}      onChange={setCfgField('housing')} step="0.1" />
          </div>
        </section>

        {/* Equipment inputs — two columns on wider screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EquipmentCard title="Power Unit (Tractor)" eq={power}     setEq={setPower}     isPower={true}  />
          <EquipmentCard title="Implement"            eq={implement} setEq={setImplement} isPower={false} />
        </div>

        {/* Results table */}
        <CostTable power={powerCosts} implement={implementCosts} />

        <p className="text-xs text-gray-400 px-1">
          Fuel consumption estimated at 0.044 gal/HP-hr (ASABE standard). Repair factor 2% of list value per year of wear.
          All costs expressed per acre based on operating acreage entered above.
        </p>
      </div>
    </div>
  )
}
