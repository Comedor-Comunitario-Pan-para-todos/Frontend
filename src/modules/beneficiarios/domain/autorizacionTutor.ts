export type Parentesco = 'MADRE' | 'PADRE' | 'ACUDIENTE' | 'TUTOR_LEGAL'

export interface DatosTutor {
  nombre: string
  documento: string
  parentesco: Parentesco
  telefono: string
}

export interface AutorizacionTutor {
  tutor: DatosTutor
  fechaAprobacion: string
}
