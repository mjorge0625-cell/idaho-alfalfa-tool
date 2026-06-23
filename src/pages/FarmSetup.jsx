import { useState } from 'react'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'
import AgriMetStationSelector from '../components/AgriMetStationSelector'

// USDA Idaho state averages; null = manual entry (Alfalfa priced by grade)
const CROP_DEFAULTS = {
  'Alfalfa':      { unit: 'ton', baselineYield: '',    pricePerUnit: '' },
  'Corn':         { unit: 'bu',  baselineYield: '180', pricePerUnit: '4.50' },
  'Winter Wheat': { unit: 'bu',  baselineYield: '70',  pricePerUnit: '5.50' },
  'Spring Barley':{ unit: 'bu',  baselineYield: '85',  pricePerUnit: '4.80' },
  'Potatoes':     { unit: 'cwt', baselineYield: '400', pricePerUnit: '8.50' },
  'Dry Beans':    { unit: 'cwt', baselineYield: '20',  pricePerUnit: '30' },
}

const CROP_TYPES = Object.keys(CROP_DEFAULTS)

const blankCrop = {
  cropType: 'Alfalfa',
  acres: '',
  baselineYield: '',
  pricePerUnit: '',
  unit: 'ton',
  machineryCoastPerAcre: '',
  fertilizerCostPerAcre: '',
  pesticideCostPerAcre: '',
  seedCostPerAcre: '',
}

export default function FarmSetup() {
  const { farm, updateFarm, addCrop, removeCrop } = useFarm()
  const [newCrop, setNewCrop] = useState(blankCrop)
  const [saved, setSaved] = useState(false)

  function handleInfoSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCropTypeChange(cropType) {
    const defaults = CROP_DEFAULTS[cropType] || {}
    setNewCrop(c => ({
      ...c,
      cropType,
      unit: defaults.unit ?? c.unit,
      baselineYield: defaults.baselineYield ?? '',
      pricePerUnit: defaults.pricePerUnit ?? '',
    }))
  }

  function handleAddCrop(e) {
    e.preventDefault()
    if (!newCrop.cropType || !newCrop.acres) return
    addCrop(newCrop)
    setNewCrop(blankCrop)
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]'

  return (
    <div className="flex-1">
      <PageHeader
        title="Farm Setup"
        subtitle="Enter your operation details once — all calculators will use this data."
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Basic info */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#27500A] text-base">Operation Info</h2>
          <form onSubmit={handleInfoSave} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (optional)</label>
              <input type="text" value={farm.farmerName}
                onChange={e => updateFarm({ farmerName: e.target.value })}
                placeholder="e.g. Smith Farms"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County / Location</label>
              <input type="text" value={farm.location}
                onChange={e => updateFarm({ location: e.target.value })}
                placeholder="e.g. Twin Falls County, ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nearest AgriMet Station</label>
              <AgriMetStationSelector
                value={farm.agriMetStation}
                onChange={station => updateFarm({ agriMetStation: station })}
              />
            </div>
            <button type="submit"
              className="bg-[#27500A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3a7010] transition-colors">
              {saved ? '✓ Saved' : 'Save Info'}
            </button>
          </form>
        </section>

        {/* Crop list */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#27500A] text-base">Crops in Your Operation</h2>

          {farm.crops.length === 0 && (
            <p className="text-sm text-gray-400 italic">No crops added yet.</p>
          )}

          <div className="space-y-2">
            {farm.crops.map(crop => (
              <div key={crop.id} className="flex items-center justify-between bg-[#EFF5E8] rounded-lg px-3 py-2.5">
                <div className="text-sm">
                  <span className="font-semibold text-[#27500A]">{crop.cropType}</span>
                  <span className="text-gray-500 ml-2">{crop.acres} ac</span>
                  {crop.baselineYield && (
                    <span className="text-gray-500 ml-2">· {crop.baselineYield} {crop.unit}/ac</span>
                  )}
                  {crop.pricePerUnit && (
                    <span className="text-gray-500 ml-2">· ${crop.pricePerUnit}/{crop.unit}</span>
                  )}
                </div>
                <button onClick={() => removeCrop(crop.id)}
                  className="text-red-400 hover:text-red-600 text-xs ml-2 shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Add crop form */}
          <form onSubmit={handleAddCrop} className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Add a Crop</h3>

            {/* Crop type + acres */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Crop Type</label>
                <select value={newCrop.cropType}
                  onChange={e => handleCropTypeChange(e.target.value)}
                  className={inputCls}>
                  {CROP_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Acres</label>
                <input type="number" min="0" value={newCrop.acres} required
                  onChange={e => setNewCrop(c => ({ ...c, acres: e.target.value }))}
                  placeholder="e.g. 150" className={inputCls} />
              </div>
            </div>

            {/* Yield + price */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Baseline Yield</label>
                <input type="number" min="0" step="0.1" value={newCrop.baselineYield}
                  onChange={e => setNewCrop(c => ({ ...c, baselineYield: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unit</label>
                <input type="text" value={newCrop.unit} readOnly
                  className={`${inputCls} bg-gray-50 text-gray-500`} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price / Unit ($)</label>
                <input type="number" min="0" step="0.01" value={newCrop.pricePerUnit}
                  onChange={e => setNewCrop(c => ({ ...c, pricePerUnit: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>

            {newCrop.cropType !== 'Alfalfa' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
                Estimates based on USDA Idaho averages. Enter your actual numbers for best results.
              </p>
            )}

            {/* Cost inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Machinery Cost / ac ($)</label>
                <input type="number" min="0" step="0.01" value={newCrop.machineryCoastPerAcre}
                  onChange={e => setNewCrop(c => ({ ...c, machineryCoastPerAcre: e.target.value }))}
                  placeholder="e.g. 85" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fertilizer Cost / ac ($)</label>
                <input type="number" min="0" step="0.01" value={newCrop.fertilizerCostPerAcre}
                  onChange={e => setNewCrop(c => ({ ...c, fertilizerCostPerAcre: e.target.value }))}
                  placeholder="e.g. 60" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Pesticide Cost / ac ($)</label>
                <input type="number" min="0" step="0.01" value={newCrop.pesticideCostPerAcre}
                  onChange={e => setNewCrop(c => ({ ...c, pesticideCostPerAcre: e.target.value }))}
                  placeholder="e.g. 25" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Seed Cost / ac ($)</label>
                <input type="number" min="0" step="0.01" value={newCrop.seedCostPerAcre}
                  onChange={e => setNewCrop(c => ({ ...c, seedCostPerAcre: e.target.value }))}
                  placeholder="e.g. 30" className={inputCls} />
              </div>
            </div>

            <button type="submit"
              className="bg-[#F1B300] text-[#27500A] font-bold px-4 py-2 rounded-lg text-sm hover:bg-[#C99700] transition-colors">
              + Add Crop
            </button>
            {localStorage.getItem('hasSeenOnboarding') && (
              <p className="text-xs text-gray-400">
                You can add multiple crops — each one will appear in your Dashboard.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
