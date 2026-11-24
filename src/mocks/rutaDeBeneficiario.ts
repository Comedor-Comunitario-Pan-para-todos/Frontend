import { demora } from './demora.ts'
import { esUuid } from './lecturaDePeticion.ts'
import { beneficiarioNoEncontrado, idInvalido } from './respuestasNest.ts'

interface Dependencias<Beneficiario> {
  /** Responde 401 o 403 como los guards del backend; `null` si el usuario puede continuar. */
  readonly rechazoDeAcceso: (request: Request) => Response | null
  readonly buscarBeneficiario: (id: string) => Beneficiario | undefined
}

/** Lo que revisan las rutas de un beneficiario antes de empezar: acceso, id válido y que exista. */
export function crearBeneficiarioDeLaRuta<Beneficiario>({
  rechazoDeAcceso,
  buscarBeneficiario,
}: Dependencias<Beneficiario>) {
  return async (request: Request, idEnRuta: unknown) => {
    await demora()
    const rechazo = rechazoDeAcceso(request)
    if (rechazo) return { rechazo }

    const id = String(idEnRuta)
    if (!esUuid(id)) return { rechazo: idInvalido() }
    const beneficiario = buscarBeneficiario(id)
    if (!beneficiario) return { rechazo: beneficiarioNoEncontrado(id) }
    return { id, beneficiario }
  }
}
