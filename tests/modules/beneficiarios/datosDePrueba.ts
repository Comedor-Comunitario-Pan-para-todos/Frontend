import { vi } from 'vitest'
import type { BeneficiarioRepository } from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'

export const MARIA: Beneficiario = {
  id: '6f1c2b1e-0000-4000-8000-000000000001',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  documento: { tipo: 'CC', numero: '42185390' },
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  telefono: null,
  registradoEn: '2026-11-01T15:00:00.000Z',
}

export const CARLOS: Beneficiario = {
  id: '6f1c2b1e-0000-4000-8000-000000000002',
  nombres: 'Carlos Julio',
  apellidos: 'Morales Restrepo',
  documento: null,
  fechaNacimiento: '2014-03-15',
  barrio: null,
  telefono: null,
  registradoEn: '2026-11-02T16:30:00.000Z',
}

export function paginaCon(...beneficiarios: Beneficiario[]) {
  return { beneficiarios, total: beneficiarios.length, pagina: 1, totalPaginas: 1 }
}

/** Repositorio simulado: por defecto el padrón está vacío. */
export function crearRepositorioDePrueba(): BeneficiarioRepository {
  return {
    registrar: vi.fn().mockResolvedValue(MARIA),
    buscar: vi.fn().mockResolvedValue(paginaCon()),
    consultarPorId: vi.fn().mockResolvedValue(MARIA),
    buscarPorDocumento: vi.fn().mockResolvedValue(null),
  }
}
