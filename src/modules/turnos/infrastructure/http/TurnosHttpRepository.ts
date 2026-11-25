import type { TurnosRepository } from '@/modules/turnos/application/ports/TurnosRepository.ts'
import { JornadaNoDisponible } from '@/modules/turnos/domain/JornadaNoDisponible.ts'
import type { Turno } from '@/modules/turnos/domain/Turno.ts'
import { TurnoYaEntregado } from '@/modules/turnos/domain/TurnoYaEntregado.ts'
import { turnoDeLaPersona } from '@/modules/turnos/domain/turnosDelDia.ts'
import { esErrorApi } from '@/shared/application/errores/ErrorApi.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import type { HttpClient } from '@/shared/infrastructure/http/HttpClient.ts'
import { esquemaTurno, esquemaTurnos } from './respuestasTurnos.ts'

const RUTA = '/turnos'

/** 409: la persona ya recibió turno hoy. */
const ESTADO_TURNO_REPETIDO = 409
/** 422: la jornada no está abierta o ya se entregaron todas las raciones. */
const ESTADO_JORNADA_NO_DISPONIBLE = 422

function estadoDe(error: unknown): number | undefined {
  return esErrorApi(error) ? error.estado : undefined
}

export class TurnosHttpRepository implements TurnosRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  consultarDeHoy(): Promise<Turno[]> {
    return this.#http.get(RUTA, { esquema: esquemaTurnos, params: { fecha: fechaDeHoy() } })
  }

  async entregar(idBeneficiario: string): Promise<Turno> {
    try {
      return await this.#http.post(
        RUTA,
        { beneficiarioId: idBeneficiario },
        { esquema: esquemaTurno },
      )
    } catch (error) {
      throw await this.#traducir(error, idBeneficiario)
    }
  }

  async #traducir(error: unknown, idBeneficiario: string): Promise<unknown> {
    const estado = estadoDe(error)
    if (estado === ESTADO_JORNADA_NO_DISPONIBLE) return new JornadaNoDisponible(error)
    if (estado !== ESTADO_TURNO_REPETIDO) return error

    // El 409 no trae el turno: se busca en la lista de hoy para mostrárselo otra vez.
    const anterior = turnoDeLaPersona(await this.consultarDeHoy(), idBeneficiario)
    return anterior ? new TurnoYaEntregado(anterior, error) : error
  }
}
