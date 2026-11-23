import { describe, expect, it, vi } from 'vitest'
import type { AutorizacionTutorRepository } from '@/modules/beneficiarios/application/ports/AutorizacionTutorRepository.ts'
import { crearRegistrarAutorizacionTutor } from '@/modules/beneficiarios/application/registrarAutorizacionTutor.ts'
import { crearRevocarAutorizacionTutor } from '@/modules/beneficiarios/application/revocarAutorizacionTutor.ts'
import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'
import { TUTOR_ACTIVO, TUTOR_REVOCADO } from '../consentimientosDePrueba.ts'
import { CARLOS } from '../datosDePrueba.ts'

function crearRepositorio(): AutorizacionTutorRepository {
  return {
    registrar: vi.fn().mockResolvedValue(TUTOR_ACTIVO),
    revocar: vi.fn().mockResolvedValue(TUTOR_REVOCADO),
  }
}

const SOPORTE = new File(['firma'], 'firma.jpg', { type: 'image/jpeg' })

describe('registrarAutorizacionTutor', () => {
  it('envía los datos del tutor limpios, con el soporte tal cual', async () => {
    const repositorio = crearRepositorio()
    const datos: NuevaAutorizacionTutor = {
      nombre: '  Luz   Marina  Díaz ',
      tipoDocumento: 'CC',
      numeroDocumento: '52.123.456',
      parentesco: 'MADRE',
      telefono: '310 123-4567',
      soporte: SOPORTE,
    }

    const autorizacion = await crearRegistrarAutorizacionTutor({ repositorio })(CARLOS.id, datos)

    expect(autorizacion).toEqual(TUTOR_ACTIVO)
    expect(repositorio.registrar).toHaveBeenCalledWith(CARLOS.id, {
      nombre: 'Luz Marina Díaz',
      tipoDocumento: 'CC',
      numeroDocumento: '52123456',
      parentesco: 'MADRE',
      telefono: '3101234567',
      soporte: SOPORTE,
    })
  })
})

describe('revocarAutorizacionTutor', () => {
  it('envía el motivo sin espacios sobrantes', async () => {
    const repositorio = crearRepositorio()

    const revocada = await crearRevocarAutorizacionTutor({ repositorio })(
      CARLOS.id,
      '  El acudiente   ya no está a cargo. ',
    )

    expect(revocada).toEqual(TUTOR_REVOCADO)
    expect(repositorio.revocar).toHaveBeenCalledWith(CARLOS.id, 'El acudiente ya no está a cargo.')
  })
})
