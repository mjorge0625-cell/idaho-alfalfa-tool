import { createContext, useContext, useState, useEffect } from 'react'

const FarmContext = createContext(null)

const STORAGE_KEY = 'idaho-alfalfa-farm'

const defaultFarm = {
  farmerName: '',
  location: '',
  agriMetStation: null,
  crops: [],
}

function loadFarm() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultFarm, ...JSON.parse(stored) } : defaultFarm
  } catch {
    return defaultFarm
  }
}

export function FarmProvider({ children }) {
  const [farm, setFarm] = useState(loadFarm)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(farm))
  }, [farm])

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
    localStorage.removeItem(STORAGE_KEY)
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
