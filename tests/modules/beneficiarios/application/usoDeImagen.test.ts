import { describe, expect, it, vi } from 'vitest'
import { crearAutorizarUsoDeImagen } from '@/modules/beneficiarios/application/autorizarUsoDeImagen.ts'
import { crearConsultarHistorialDeImagen } from '@/modules/beneficiarios/application/consultarHistorialDeImagen.ts'
import { crearRetirarUsoDeImagen } from '@/modules/beneficiarios/application/retirarUsoDeImagen.ts'
import {
  AUTORIZACION_IMAGEN,
  AUTORIZACION_IMAGEN_RETIRADA,
  crearRepositorioDeConsentimientos,
} from '../consentimientosDePrueba.ts'
import { MARIA } from '../datosDePrueba.ts'

describe('autorizarUsoDeImagen', () => {
  it('guarda la autorización de imagen con la política de imagen vigente', async () => {
    const repositorio = crearRepositorioDeConsentimientos()
    vi.mocked(repositorio.registrar).mockResolvedValue(AUTORIZACION_IMAGEN)

    const autorizacion = await crearAutorizarUsoDeImagen({ repositorio })(MARIA.id)

    expect(autorizacion).toEqual(AUTORIZACION_IMAGEN)
    expect(repositorio.registrar).toHaveBeenCalledWith(MARIA.id, {
      version: 1,
      finalidad: 'USO_IMAGEN',
    })
  })
})

describe('retirarUsoDeImagen', () => {
  it('retira solo la autorización de imagen, no la de datos', async () => {
    const repositorio = crearRepositorioDeConsentimientos()

    const retirada = await crearRetirarUsoDeImagen({ repositorio })(MARIA.id)

    expect(retirada).toEqual(AUTORIZACION_IMAGEN_RETIRADA)
    expect(repositorio.revocar).toHaveBeenCalledWith(MARIA.id, 'USO_IMAGEN')
  })
})

describe('consultarHistorialDeImagen', () => {
  it('pide solo los cambios de la autorización de imagen', async () => {
    const repositorio = crearRepositorioDeConsentimientos()
    vi.mocked(repositorio.consultarHistorial).mockResolvedValue([AUTORIZACION_IMAGEN_RETIRADA])

    const historial = await crearConsultarHistorialDeImagen({ repositorio })(MARIA.id)

    expect(historial).toEqual([AUTORIZACION_IMAGEN_RETIRADA])
    expect(repositorio.consultarHistorial).toHaveBeenCalledWith(MARIA.id, 'USO_IMAGEN')
  })
})
