export interface Coords { lat: number; lng: number }

// Approximate centre-point coordinates for each Maharashtra district
export const DISTRICT_COORDS: Record<string, Coords> = {
  Pune:        { lat: 18.52,  lng: 73.86  },
  Nashik:      { lat: 19.99,  lng: 73.79  },
  Ahmednagar:  { lat: 19.09,  lng: 74.74  },
  Solapur:     { lat: 17.68,  lng: 75.90  },
  Satara:      { lat: 17.69,  lng: 74.00  },
  Sangli:      { lat: 16.86,  lng: 74.56  },
  Kolhapur:    { lat: 16.70,  lng: 74.24  },
  Aurangabad:  { lat: 19.88,  lng: 75.34  },
  Latur:       { lat: 18.40,  lng: 76.56  },
  Nanded:      { lat: 19.15,  lng: 77.32  },
  Jalgaon:     { lat: 21.00,  lng: 75.56  },
  Yavatmal:    { lat: 20.39,  lng: 78.12  },
  Amravati:    { lat: 20.93,  lng: 77.75  },
  Nagpur:      { lat: 21.15,  lng: 79.09  },
  Dhule:       { lat: 20.90,  lng: 74.78  },
  Nandurbar:   { lat: 21.37,  lng: 74.25  },
  Raigad:      { lat: 18.52,  lng: 73.18  },
  // Centre of Maharashtra as ultimate fallback
  Other:       { lat: 19.75,  lng: 75.71  },
};
