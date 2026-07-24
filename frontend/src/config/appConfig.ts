export const APP_CONFIG = {
  name: "MYPE Voz",
  slogan: "Tu negocio, más claro cada día",
  businessName: "Bodega Rosita",
} as const;

export const REGISTRANTS = ["Rosa", "Carlos", "María"] as const;
export type Registrant = (typeof REGISTRANTS)[number];
