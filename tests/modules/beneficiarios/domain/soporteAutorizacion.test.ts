import { describe, expect, it } from 'vitest'
import {
  motivoDeRechazo,
  TAMANO_MAXIMO_SOPORTE,
} from '@/modules/beneficiarios/domain/soporteAutorizacion.ts'

const UN_KB = 1024

describe('motivoDeRechazo', () => {
  it.each(['application/pdf', 'image/jpeg', 'image/png'])('acepta un archivo %s', (type) => {
    expect(motivoDeRechazo({ type, size: UN_KB })).toBeNull()
  })

  it.each(['image/heic', 'image/webp', 'text/plain', ''])('rechaza un archivo "%s"', (type) => {
    expect(motivoDeRechazo({ type, size: UN_KB })).toMatch(/JPG o PNG.*PDF/)
  })

  it('acepta justo 5 MB y rechaza un byte más', () => {
    expect(motivoDeRechazo({ type: 'image/jpeg', size: TAMANO_MAXIMO_SOPORTE })).toBeNull()
    expect(motivoDeRechazo({ type: 'image/jpeg', size: TAMANO_MAXIMO_SOPORTE + 1 })).toMatch(/5 MB/)
  })

  it('usa el mismo límite que el MER: 5 242 880 bytes', () => {
    expect(motivoDeRechazo({ type: 'application/pdf', size: 5_242_880 })).toBeNull()
    expect(motivoDeRechazo({ type: 'application/pdf', size: 5_242_881 })).not.toBeNull()
  })

  it('rechaza un archivo vacío', () => {
    expect(motivoDeRechazo({ type: 'application/pdf', size: 0 })).toMatch(/vacío/)
  })
})
