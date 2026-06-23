import { createContext, useContext, useState } from 'react'

const FarmContext = createContext(null)

const defaultFarm = {
  farmerName: '',
  location: '',
  agriMetStation: null,
  crops: [],
}

export function FarmProvider({ children }) {
  const [farm, setFarm] = useState(defaultFarm)

  function updateFarm(updates) {
    setFarm(prev => ({ ...prev, ...updates }))
  }

  function addCrop(crop) {
    setFarm(prev => ({ ...prev, crops: [...prev.crops, { ...crop, id: Date.now() }] }))
  }

  function removeCrop(id) {
    setFarm(prev => ({ ...prev, crops: prev.crops.filter(c => c.id !== id) }))
  }

  function updateCrop(id, updates) {
    setFarm(prev => ({
      ...prev,
      crops: prev.crops.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
  }

  function resetFarm() {
    setFarm(defaultFarm)
  }

  return (
    <FarmContext.Provider value={{ farm, updateFarm, addCrop, removeCrop, updateCrop, resetFarm }}>
      {children}
    </FarmContext.Provider>
  )
}

export function useFarm() {
  const ctx = useContext(FarmContext)
  if (!ctx) throw new Error('useFarm must be used within FarmProvider')
  return ctx
}
