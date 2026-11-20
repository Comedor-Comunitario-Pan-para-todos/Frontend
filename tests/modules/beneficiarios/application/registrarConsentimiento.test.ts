import { describe, expect, it } from 'vitest'
import { crearRegistrarConsentimiento } from '@/modules/beneficiarios/application/registrarConsentimiento.ts'
import { CONSENTIMIENTO, crearRepositorioDeConsentimientos } from '../consentimientosDePrueba.ts'
import { MARIA } from '../datosDePrueba.ts'

describe('registrarConsentimiento', () => {
  it('guarda la aceptación de la política vigente para esa persona', async () => {
    const repositorio = crearRepositorioDeConsentimientos()

    const consentimiento = await crearRegistrarConsentimiento({ repositorio })(MARIA.id)

    expect(consentimiento).toEqual(CONSENTIMIENTO)
    expect(repositorio.registrar).toHaveBeenCalledWith(MARIA.id, {
      version: 1,
      finalidad: 'ATENCION_ALIMENTARIA',
    })
  })
})
