import type { Beneficiario } from '@/modules/beneficiarios/domain/Beneficiario.ts'
import { normalizarNumeroDocumento } from '@/modules/beneficiarios/domain/documento.ts'
import { esPosibleDuplicado } from '@/modules/beneficiarios/domain/duplicados.ts'
import type { BeneficiarioRepository } from './ports/BeneficiarioRepository.ts'

interface Dependencias {
  readonly repositorio: BeneficiarioRepository
}

/** Lo que se lleva escrito en el formulario; se verifica con lo que ya esté completo. */
export interface DatosPorVerificar {
  readonly numeroDocumento?: string
  readonly nombres?: string
  readonly apellidos?: string
  readonly fechaNacimiento?: string
}

export interface PosibleDuplicado {
  readonly motivo: 'documento' | 'nombre-y-fecha'
  readonly beneficiario: Beneficiario
}

export type VerificarDuplicado = (
  datos: DatosPorVerificar,
  signal?: AbortSignal,
) => Promise<PosibleDuplicado | null>

// El máximo que entrega el servidor en una sola página.
const MAXIMO_A_COMPARAR = 100

export function crearVerificarDuplicado({ repositorio }: Dependencias): VerificarDuplicado {
  async function porDocumento(numero: string, signal?: AbortSignal) {
    const beneficiario = await repositorio.buscarPorDocumento(numero, signal)
    return beneficiario && ({ motivo: 'documento', beneficiario } as const)
  }

  async function porNombreYFecha(
    identidad: Required<Omit<DatosPorVerificar, 'numeroDocumento'>>,
    signal?: AbortSignal,
  ) {
    // El servidor busca dentro de los nombres o de los apellidos, no en el nombre completo:
    // se pide por el primer apellido y la comparación exacta se hace aquí.
    const primerApellido = identidad.apellidos.split(' ')[0] ?? ''
    const { beneficiarios } = await repositorio.buscar(
      { texto: primerApellido, pagina: 1, porPagina: MAXIMO_A_COMPARAR },
      signal,
    )
    const beneficiario = beneficiarios.find((otro) => esPosibleDuplicado(identidad, otro))
    return beneficiario ? ({ motivo: 'nombre-y-fecha', beneficiario } as const) : null
  }

  return async (datos, signal) => {
    const numero = normalizarNumeroDocumento(datos.numeroDocumento ?? '')
    if (numero !== '') {
      const coincidencia = await porDocumento(numero, signal)
      if (coincidencia) return coincidencia
    }

    const nombres = datos.nombres?.trim() ?? ''
    const apellidos = datos.apellidos?.trim() ?? ''
    const fechaNacimiento = datos.fechaNacimiento ?? ''
    if (nombres === '' || apellidos === '' || fechaNacimiento === '') return null

    return porNombreYFecha({ nombres, apellidos, fechaNacimiento }, signal)
  }
}
