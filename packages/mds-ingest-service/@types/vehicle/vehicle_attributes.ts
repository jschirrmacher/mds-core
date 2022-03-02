export const PROPULSION_TYPES = ['human', 'electric', 'electric_assist', 'hybrid', 'combustion'] as const
export type PROPULSION_TYPE = typeof PROPULSION_TYPES[number]

export const ACCESSIBILITY_OPTIONS = ['wheelchair_accessible'] as const
export type ACCESSIBILITY_OPTION = typeof ACCESSIBILITY_OPTIONS[number]

export const MODALITIES = ['micromobility', 'taxi', 'tnc'] as const
export type MODALITY = typeof MODALITIES[number]
