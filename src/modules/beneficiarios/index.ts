// API pública del módulo: lo único que otros módulos pueden importar de `beneficiarios`.
export { iniciales, nombreCompleto, type Beneficiario } from './domain/Beneficiario.ts'
export { formatearFechaCalendario } from './domain/fechaCalendario.ts'
export { DocumentoBeneficiario } from './ui/beneficiario/DocumentoBeneficiario.tsx'
export { BuscadorBeneficiarios } from './ui/padron/BuscadorBeneficiarios.tsx'
export { usePadron, type Padron } from './ui/padron/usePadron.ts'
