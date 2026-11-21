import { z } from 'zod'
import type { Consentimiento } from '@/modules/beneficiarios/domain/Consentimiento.ts'
import type { RegistroConsentimiento } from '@/modules/beneficiarios/domain/RegistroConsentimiento.ts'

// Contrato propuesto para RF-19 y RF-20 (ver docs/CONSENTIMIENTOS.md).

const esquemaUsuarioDto = z.object({ nombreCompleto: z.string() })

const esquemaConsentimientoDto = z.object({
  versionPolitica: z.number().int(),
  finalidad: z.string(),
  createdAt: z.string(),
  registradoPor: esquemaUsuarioDto,
})

const esquemaRegistroConsentimientoDto = esquemaConsentimientoDto.extend({
  revocadoEn: z.string().nullish(),
  revocadoPor: esquemaUsuarioDto.nullish(),
})

type ConsentimientoDto = z.infer<typeof esquemaConsentimientoDto>
type RegistroConsentimientoDto = z.infer<typeof esquemaRegistroConsentimientoDto>

function aConsentimiento(dto: ConsentimientoDto): Consentimiento {
  return {
    versionPolitica: dto.versionPolitica,
    finalidad: dto.finalidad,
    registradoEn: dto.createdAt,
    registradoPor: dto.registradoPor.nombreCompleto,
  }
}

function aRegistroConsentimiento(dto: RegistroConsentimientoDto): RegistroConsentimiento {
  return {
    ...aConsentimiento(dto),
    revocadoEn: dto.revocadoEn ?? null,
    revocadoPor: dto.revocadoPor?.nombreCompleto ?? null,
  }
}

export const esquemaConsentimiento = esquemaConsentimientoDto.transform(aConsentimiento)

export const esquemaRegistroConsentimiento =
  esquemaRegistroConsentimientoDto.transform(aRegistroConsentimiento)

export const esquemaHistorialConsentimiento = z.array(esquemaRegistroConsentimiento)
