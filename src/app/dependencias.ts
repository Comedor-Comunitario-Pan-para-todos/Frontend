import { crearCerrarSesion, type CerrarSesion } from '@/modules/auth/application/cerrarSesion.ts'
import { crearIniciarSesion, type IniciarSesion } from '@/modules/auth/application/iniciarSesion.ts'
import {
  crearRestaurarSesion,
  type RestaurarSesion,
} from '@/modules/auth/application/restaurarSesion.ts'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'
import { AuthHttpRepository } from '@/modules/auth/infrastructure/http/AuthHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import type { Entorno } from './entorno.ts'

export interface Dependencias {
  readonly iniciarSesion: IniciarSesion
  readonly restaurarSesion: RestaurarSesion
  readonly cerrarSesion: CerrarSesion
}

export function crearDependencias({ apiBaseUrl }: Pick<Entorno, 'apiBaseUrl'>): Dependencias {
  const almacen = new SesionLocalStorage()
  const http = new AxiosHttpClient({
    baseUrl: apiBaseUrl,
    sesion: {
      obtenerToken: () => almacen.obtenerToken(),
      alExpirarSesion: () => almacen.borrarToken(),
    },
  })
  const repositorio = new AuthHttpRepository(http)

  return {
    iniciarSesion: crearIniciarSesion({ repositorio, almacen }),
    restaurarSesion: crearRestaurarSesion({ repositorio, almacen }),
    cerrarSesion: crearCerrarSesion({ almacen }),
  }
}
