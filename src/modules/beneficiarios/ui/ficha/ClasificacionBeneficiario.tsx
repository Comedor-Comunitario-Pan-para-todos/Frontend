import {
  descripcionGrupo,
  etiquetaSistemaClasificacion,
  type ClasificacionSocioeconomica,
} from '@/modules/beneficiarios/domain/clasificacionSocioeconomica.ts'

interface ClasificacionBeneficiarioProps {
  readonly clasificacion: ClasificacionSocioeconomica
}

export function ClasificacionBeneficiario({ clasificacion }: ClasificacionBeneficiarioProps) {
  return (
    <span className="flex flex-col">
      <span>{etiquetaSistemaClasificacion(clasificacion.sistema)}</span>
      <span className="text-label text-ink-secondary">
        <span className="font-mono">{clasificacion.grupo}</span> ·{' '}
        {descripcionGrupo(clasificacion.grupo)}
      </span>
    </span>
  )
}
