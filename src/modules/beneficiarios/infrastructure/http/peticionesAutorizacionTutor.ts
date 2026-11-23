import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'

export function aFormularioDeAutorizacionTutor(datos: NuevaAutorizacionTutor): FormData {
  const formulario = new FormData()
  formulario.append('nombre', datos.nombre)
  formulario.append('tipoDocumento', datos.tipoDocumento)
  formulario.append('numeroDocumento', datos.numeroDocumento)
  formulario.append('parentesco', datos.parentesco)
  formulario.append('telefono', datos.telefono)
  formulario.append('soporte', datos.soporte)
  return formulario
}
