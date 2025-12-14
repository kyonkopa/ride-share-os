export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  batteryCapacity: number // kWh
}

export interface Location {
  latitude: number
  longitude: number
  address?: string
  timestamp: number
}

export interface Shift {
  id: string
  driverId: string
  vehicleId: string
  startTime: number
  endTime?: number
  startOdometer: number
  endOdometer?: number
  startRange: number // in kilometers
  endRange?: number // in kilometers
  startLocation: Location
  endLocation?: Location
  revenue?: number
  expenses?: number
  notes?: string
  status: "active" | "completed" | "cancelled" | "upcoming"
  createdAt: number
  updatedAt: number
}

export interface ClockOutData {
  odometer: number
  range: number // in kilometers
  location: Location
  revenue?: number
  expenses?: number
  notes?: string
}

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  isActive: boolean
  createdAt: number
}

export interface ShiftSummary {
  totalShifts: number
  totalHours: number
  totalRevenue: number
  totalDistance: number
  averageRangeUsage: number
}
