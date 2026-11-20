import type { Consentimiento } from './Consentimiento.ts'

// Una entrada del historial: la autorización y, si la persona la retiró, cuándo y quién lo anotó.
export interface RegistroConsentimiento extends Consentimiento {
  readonly revocadoEn: string | null
  readonly revocadoPor: string | null
}
