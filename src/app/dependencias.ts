import { crearCerrarSesion, type CerrarSesion } from '@/modules/auth/application/cerrarSesion.ts'
import { crearIniciarSesion, type IniciarSesion } from '@/modules/auth/application/iniciarSesion.ts'
import {
  crearRestaurarSesion,
  type RestaurarSesion,
} from '@/modules/auth/application/restaurarSesion.ts'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'
import { AuthHttpRepository } from '@/modules/auth/infrastructure/http/AuthHttpRepository.ts'
import {
  crearBuscarBeneficiarios,
  type BuscarBeneficiarios,
} from '@/modules/beneficiarios/application/buscarBeneficiarios.ts'
import {
  crearConsultarBeneficiario,
  type ConsultarBeneficiario,
} from '@/modules/beneficiarios/application/consultarBeneficiario.ts'
import {
  crearRegistrarBeneficiario,
  type RegistrarBeneficiario,
} from '@/modules/beneficiarios/application/registrarBeneficiario.ts'
import {
  crearVerificarDuplicado,
  type VerificarDuplicado,
} from '@/modules/beneficiarios/application/verificarDuplicado.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import type { Entorno } from './entorno.ts'

export interface Dependencias {
  readonly iniciarSesion: IniciarSesion
  readonly restaurarSesion: RestaurarSesion
  readonly cerrarSesion: CerrarSesion
  readonly suscribirExpiracion: (oyente: () => void) => () => void
  readonly suscribirCambioDeToken: (oyente: (token: string | null) => void) => () => void
  readonly registrarBeneficiario: RegistrarBeneficiario
  readonly buscarBeneficiarios: BuscarBeneficiarios
  readonly consultarBeneficiario: ConsultarBeneficiario
  readonly verificarDuplicado: VerificarDuplicado
}

export function crearDependencias({ apiBaseUrl }: Pick<Entorno, 'apiBaseUrl'>): Dependencias {
  const almacen = new SesionLocalStorage()
  const oyentesExpiracion = new Set<() => void>()
  const http = new AxiosHttpClient({
    baseUrl: apiBaseUrl,
    sesion: {
      obtenerToken: () => almacen.obtenerToken(),
      alExpirarSesion: () => {
        almacen.borrarToken()
        oyentesExpiracion.forEach((oyente) => oyente())
      },
    },
  })
  const repositorio = new AuthHttpRepository(http)
  const beneficiarios = new BeneficiarioHttpRepository(http)

  return {
    iniciarSesion: crearIniciarSesion({ repositorio, almacen }),
    restaurarSesion: crearRestaurarSesion({ repositorio, almacen }),
    cerrarSesion: crearCerrarSesion({ almacen }),
    suscribirExpiracion: (oyente) => {
      oyentesExpiracion.add(oyente)
      return () => {
        oyentesExpiracion.delete(oyente)
      }
    },
    suscribirCambioDeToken: (oyente) => almacen.suscribirCambiosExternos(oyente),
    registrarBeneficiario: crearRegistrarBeneficiario({ repositorio: beneficiarios }),
    buscarBeneficiarios: crearBuscarBeneficiarios({ repositorio: beneficiarios }),
    consultarBeneficiario: crearConsultarBeneficiario({ repositorio: beneficiarios }),
    verificarDuplicado: crearVerificarDuplicado({ repositorio: beneficiarios }),
  }
}
