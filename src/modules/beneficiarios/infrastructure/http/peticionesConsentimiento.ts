import type { PoliticaDeDatos } from '@/modules/beneficiarios/domain/politicaVigente.ts'

export function aCuerpoDeConsentimiento(politica: PoliticaDeDatos) {
  return { versionPolitica: politica.version, finalidad: politica.finalidad }
}
