import { z } from 'zod'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'

// Contrato propuesto para RF-19 (ver docs/CONSENTIMIENTOS.md).

const esquemaConsentimientoDto = z.object({
  versionPolitica: z.number().int(),
  finalidad: z.string(),
  createdAt: z.string(),
  registradoPor: z.object({ nombreCompleto: z.string() }),
})

type ConsentimientoDto = z.infer<typeof esquemaConsentimientoDto>

function aConsentimiento(dto: ConsentimientoDto): Consentimiento {
  return {
    versionPolitica: dto.versionPolitica,
    finalidad: dto.finalidad,
    registradoEn: dto.createdAt,
    registradoPor: dto.registradoPor.nombreCompleto,
  }
}

export const esquemaConsentimiento = esquemaConsentimientoDto.transform(aConsentimiento)
