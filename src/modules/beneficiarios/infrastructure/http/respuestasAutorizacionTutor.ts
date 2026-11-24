import { z } from 'zod'
import type { AutorizacionTutor } from '@/modules/beneficiarios/domain/AutorizacionTutor.ts'
import { TIPOS_DOCUMENTO_TUTOR } from '@/modules/beneficiarios/domain/documento.ts'
import { PARENTESCOS } from '@/modules/beneficiarios/domain/parentesco.ts'
import { esquemaUsuarioDto } from './respuestasUsuario.ts'

// Contrato propuesto para RF-21 (ver docs/CONSENTIMIENTOS.md, sección 6).

const esquemaAutorizacionTutorDto = z.object({
  id: z.string().min(1),
  estado: z.enum(['ACTIVA', 'REVOCADA']),
  tutor: z.object({
    nombre: z.string(),
    parentesco: z.enum(PARENTESCOS),
    tipoDocumento: z.enum(TIPOS_DOCUMENTO_TUTOR).nullish(),
    numeroDocumento: z.string().nullish(),
    telefono: z.string().nullish(),
  }),
  aprobadaPor: esquemaUsuarioDto,
  fechaAprobacion: z.string(),
  revocadaEn: z.string().nullish(),
  revocadaPor: esquemaUsuarioDto.nullish(),
  motivoRevocacion: z.string().nullish(),
})

type AutorizacionTutorDto = z.infer<typeof esquemaAutorizacionTutorDto>

function aAutorizacionTutor({ tutor, ...dto }: AutorizacionTutorDto): AutorizacionTutor {
  return {
    id: dto.id,
    estado: dto.estado,
    tutor: {
      nombre: tutor.nombre,
      parentesco: tutor.parentesco,
      tipoDocumento: tutor.tipoDocumento ?? null,
      numeroDocumento: tutor.numeroDocumento ?? null,
      telefono: tutor.telefono ?? null,
    },
    aprobadaPor: dto.aprobadaPor.nombreCompleto,
    fechaAprobacion: dto.fechaAprobacion,
    revocadaEn: dto.revocadaEn ?? null,
    revocadaPor: dto.revocadaPor?.nombreCompleto ?? null,
    motivoRevocacion: dto.motivoRevocacion ?? null,
  }
}

export const esquemaAutorizacionTutor = esquemaAutorizacionTutorDto.transform(aAutorizacionTutor)
