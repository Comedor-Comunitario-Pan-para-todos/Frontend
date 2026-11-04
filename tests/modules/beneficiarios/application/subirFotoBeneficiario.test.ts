import { describe, expect, it } from 'vitest'
import { subirFotoBeneficiario } from '@/modules/beneficiarios/application/subirFotoBeneficiario.ts'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/autorizacionTutor.ts'
import { BeneficiarioEnMemoriaRepository } from '@/modules/beneficiarios/infrastructure/memoria/BeneficiarioEnMemoriaRepository.ts'

const HOY = '2026-11-04'
const foto = new File(['imagen'], 'foto.jpg', { type: 'image/jpeg' })

const autorizacion: AutorizacionTutor = {
  tutor: { nombre: 'María López', documento: '1088123456', parentesco: 'MADRE', telefono: '3101234567' },
  fechaAprobacion: '2026-11-01',
}

describe('subirFotoBeneficiario', () => {
  it('no sube la foto de un menor sin autorización del tutor', async () => {
    const repositorio = new BeneficiarioEnMemoriaRepository([
      { id: 1, aceptaUsoImagen: true, fechaNacimiento: '2014-03-15', autorizacionTutor: null },
    ])

    await expect(subirFotoBeneficiario(repositorio, 1, foto, HOY)).rejects.toThrow()
    expect(repositorio.fotosSubidas).toEqual([])
  })

  it('sube la foto de un menor con autorización del tutor', async () => {
    const repositorio = new BeneficiarioEnMemoriaRepository([
      { id: 1, aceptaUsoImagen: true, fechaNacimiento: '2014-03-15', autorizacionTutor: autorizacion },
    ])

    await subirFotoBeneficiario(repositorio, 1, foto, HOY)

    expect(repositorio.fotosSubidas).toEqual(['foto.jpg'])
  })

  it('sube la foto de un adulto que aceptó el uso de imagen', async () => {
    const repositorio = new BeneficiarioEnMemoriaRepository([
      { id: 2, aceptaUsoImagen: true, fechaNacimiento: '1990-07-20', autorizacionTutor: null },
    ])

    await subirFotoBeneficiario(repositorio, 2, foto, HOY)

    expect(repositorio.fotosSubidas).toEqual(['foto.jpg'])
  })
})
