// El tutor es un adulto: no lleva tarjeta de identidad ni registro civil (MER, AutorizacionTutor).
export const TIPOS_DOCUMENTO_TUTOR = ['CC', 'CE', 'PPT', 'PASAPORTE'] as const

export type TipoDocumentoTutor = (typeof TIPOS_DOCUMENTO_TUTOR)[number]

const ETIQUETAS: Record<TipoDocumentoTutor, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por Protección Temporal',
  PASAPORTE: 'Pasaporte',
}

export function etiquetaDocumentoTutor(tipo: TipoDocumentoTutor): string {
  return ETIQUETAS[tipo]
}
