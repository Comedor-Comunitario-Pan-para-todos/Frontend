import { z } from 'zod'
import type { PaginaBeneficiarios } from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import {
  esGrupoClasificacion,
  SISTEMAS_CLASIFICACION,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'
import { NIVELES_CAPTURA, type NivelCaptura } from '@/modules/beneficiarios/domain/nivelCaptura.ts'
import { esquemaConsentimiento } from './respuestasConsentimiento.ts'

// Lo que entrega el backend y cómo se traduce al dominio. `nivel` y `clasificacion` son del
// contrato propuesto para RF-02 (ver docs/BENEFICIARIOS.md).

const FECHA_CALENDARIO = /^\d{4}-\d{2}-\d{2}/

// Una clasificación que la app no reconoce se ignora en vez de rechazar toda la ficha.
const esquemaClasificacionDto = z
  .object({
    sistema: z.enum(SISTEMAS_CLASIFICACION),
    grupo: z.string().refine(esGrupoClasificacion),
  })
  .nullish()
  .catch(null)

const esquemaBeneficiarioDto = z.object({
  id: z.string().min(1),
  nivel: z.enum(NIVELES_CAPTURA).nullish(),
  tipoDocumento: z.string().nullish(),
  numeroDocumento: z.string().nullish(),
  nombres: z.string(),
  apellidos: z.string(),
  fechaNacimiento: z.string().regex(FECHA_CALENDARIO),
  barrio: z.string().nullish(),
  telefono: z.string().nullish(),
  clasificacion: esquemaClasificacionDto,
  createdAt: z.string(),
  // Un consentimiento que no se puede leer cuenta como pendiente: se vuelve a pedir.
  consentimiento: esquemaConsentimiento.nullish().catch(null),
})

type BeneficiarioDto = z.infer<typeof esquemaBeneficiarioDto>

function deducirNivel(dto: BeneficiarioDto): NivelCaptura {
  if (dto.nivel) return dto.nivel
  return dto.numeroDocumento || dto.telefono ? 'EXTENDIDO' : 'BASICO'
}

function aBeneficiario(dto: BeneficiarioDto): Beneficiario {
  return {
    id: dto.id,
    nivel: deducirNivel(dto),
    nombres: dto.nombres,
    apellidos: dto.apellidos,
    documento: dto.numeroDocumento
      ? { tipo: dto.tipoDocumento ?? '', numero: dto.numeroDocumento }
      : null,
    fechaNacimiento: dto.fechaNacimiento.slice(0, 10),
    barrio: dto.barrio || null,
    telefono: dto.telefono || null,
    clasificacion: dto.clasificacion ?? null,
    registradoEn: dto.createdAt,
    consentimiento: dto.consentimiento ?? null,
  }
}

export const esquemaBeneficiario = esquemaBeneficiarioDto.transform(aBeneficiario)

export const esquemaPagina = z
  .object({
    data: z.array(esquemaBeneficiario),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      totalPages: z.number(),
    }),
  })
  .transform(({ data, meta }): PaginaBeneficiarios => ({
    beneficiarios: data,
    total: meta.total,
    pagina: meta.page,
    totalPaginas: meta.totalPages,
  }))

export const esquemaValidacionDocumento = z
  .object({ beneficiario: esquemaBeneficiario.nullable() })
  .transform(({ beneficiario }) => beneficiario)
