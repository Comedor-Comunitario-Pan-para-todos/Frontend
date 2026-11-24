export const PARENTESCOS = ['MADRE', 'PADRE', 'ACUDIENTE', 'TUTOR_LEGAL'] as const

export type Parentesco = (typeof PARENTESCOS)[number]

const ETIQUETAS: Record<Parentesco, string> = {
  MADRE: 'Madre',
  PADRE: 'Padre',
  ACUDIENTE: 'Acudiente',
  TUTOR_LEGAL: 'Tutor legal',
}

export function etiquetaParentesco(parentesco: Parentesco): string {
  return ETIQUETAS[parentesco]
}
