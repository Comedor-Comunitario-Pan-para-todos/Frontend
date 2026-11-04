import { describe, expect, it } from 'vitest'
import { registrarAutorizacionTutor } from '@/modules/beneficiarios/application/registrarAutorizacionTutor.ts'
import type { DatosTutor } from '@/modules/beneficiarios/domain/autorizacionTutor.ts'
import { BeneficiarioEnMemoriaRepository } from '@/modules/beneficiarios/infrastructure/memoria/BeneficiarioEnMemoriaRepository.ts'
import { obtenerFechaHoy } from '@/shared/infrastructure/fechaHoy.ts'

const tutor: DatosTutor = {
  nombre: 'María López',
  documento: '1088123456',
  parentesco: 'MADRE',
  telefono: '3101234567',
}

function crearRepositorioConMenor() {
  return new BeneficiarioEnMemoriaRepository([
    { id: 1, aceptaUsoImagen: true, fechaNacimiento: '2014-03-15', autorizacionTutor: null },
  ])
}

describe('registrarAutorizacionTutor', () => {
  it('guarda los datos del tutor y la fecha de aprobación cuando el archivo es válido', async () => {
    const repositorio = crearRepositorioConMenor()
    const archivo = new File(['firma'], 'autorizacion.pdf', { type: 'application/pdf' })

    await registrarAutorizacionTutor(repositorio, 1, tutor, archivo)

    const autorizacion = await repositorio.obtenerAutorizacionTutor(1)
    expect(autorizacion).toEqual({ tutor, fechaAprobacion: obtenerFechaHoy() })

    const datos = await repositorio.obtenerDatosPermisoFoto(1)
    expect(datos.tieneAutorizacionTutor).toBe(true)
  })

  it('no registra la autorización si el archivo no es válido', async () => {
    const repositorio = crearRepositorioConMenor()
    const archivo = new File(['firma'], 'autorizacion.gif', { type: 'image/gif' })

    await expect(registrarAutorizacionTutor(repositorio, 1, tutor, archivo)).rejects.toThrow(
      'El archivo debe ser PDF, JPG o PNG.',
    )

    const autorizacion = await repositorio.obtenerAutorizacionTutor(1)
    expect(autorizacion).toBeNull()
  })
})
