import { crearCerrarSesion, type CerrarSesion } from '@/modules/auth/application/cerrarSesion.ts'
import { crearIniciarSesion, type IniciarSesion } from '@/modules/auth/application/iniciarSesion.ts'
import {
  crearRestaurarSesion,
  type RestaurarSesion,
} from '@/modules/auth/application/restaurarSesion.ts'
import { SesionLocalStorage } from '@/modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts'
import { AuthHttpRepository } from '@/modules/auth/infrastructure/http/AuthHttpRepository.ts'
import {
  crearAutorizarUsoDeImagen,
  type AutorizarUsoDeImagen,
} from '@/modules/beneficiarios/application/autorizarUsoDeImagen.ts'
import {
  crearBuscarBeneficiarios,
  type BuscarBeneficiarios,
} from '@/modules/beneficiarios/application/buscarBeneficiarios.ts'
import {
  crearCompletarDatosExtendidos,
  type CompletarDatosExtendidos,
} from '@/modules/beneficiarios/application/completarDatosExtendidos.ts'
import {
  crearConsultarBeneficiario,
  type ConsultarBeneficiario,
} from '@/modules/beneficiarios/application/consultarBeneficiario.ts'
import {
  crearActualizarDatos,
  type ActualizarDatos,
} from '@/modules/beneficiarios/application/actualizarDatos.ts'
import {
  crearConsultarHistorialDeImagen,
  type ConsultarHistorialDeImagen,
} from '@/modules/beneficiarios/application/consultarHistorialDeImagen.ts'
import {
  crearRegistrarConsentimiento,
  type RegistrarConsentimiento,
} from '@/modules/beneficiarios/application/registrarConsentimiento.ts'
import {
  crearRegistrarBeneficiario,
  type RegistrarBeneficiario,
} from '@/modules/beneficiarios/application/registrarBeneficiario.ts'
import {
  crearPrepararSoporte,
  type PrepararSoporte,
} from '@/modules/beneficiarios/application/prepararSoporte.ts'
import {
  crearRegistrarAutorizacionTutor,
  type RegistrarAutorizacionTutor,
} from '@/modules/beneficiarios/application/registrarAutorizacionTutor.ts'
import {
  crearRetirarUsoDeImagen,
  type RetirarUsoDeImagen,
} from '@/modules/beneficiarios/application/retirarUsoDeImagen.ts'
import {
  crearRevocarAutorizacionTutor,
  type RevocarAutorizacionTutor,
} from '@/modules/beneficiarios/application/revocarAutorizacionTutor.ts'
import {
  crearVerificarDuplicado,
  type VerificarDuplicado,
} from '@/modules/beneficiarios/application/verificarDuplicado.ts'
import { FotoNavegador } from '@/modules/beneficiarios/infrastructure/dispositivo/FotoNavegador.ts'
import { AutorizacionTutorHttpRepository } from '@/modules/beneficiarios/infrastructure/http/AutorizacionTutorHttpRepository.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import {
  crearConsultarGuiaInduccion,
  type ConsultarGuiaInduccion,
} from '@/modules/induccion/application/consultarGuiaInduccion.ts'
import {
  crearRegistrarLecturaModulo,
  type RegistrarLecturaModulo,
} from '@/modules/induccion/application/registrarLecturaModulo.ts'
import { InduccionHttpRepository } from '@/modules/induccion/infrastructure/http/InduccionHttpRepository.ts'
import { fechaDeHoy } from '@/shared/domain/fechaDeHoy.ts'
import {
  crearConsultarResumenExportacion,
  type ConsultarResumenExportacion,
} from '@/modules/reportes/application/consultarResumenExportacion.ts'
import {
  crearExportarPadron,
  type ExportarPadron,
} from '@/modules/reportes/application/exportarPadron.ts'
import { DescargaNavegador } from '@/modules/reportes/infrastructure/dispositivo/DescargaNavegador.ts'
import { ExportacionHttpRepository } from '@/modules/reportes/infrastructure/http/ExportacionHttpRepository.ts'
import {
  crearConsultarTurnosDeHoy,
  type ConsultarTurnosDeHoy,
} from '@/modules/turnos/application/consultarTurnosDeHoy.ts'
import {
  crearEntregarTurno,
  type EntregarTurno,
} from '@/modules/turnos/application/entregarTurno.ts'
import { TurnosHttpRepository } from '@/modules/turnos/infrastructure/http/TurnosHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import type { Entorno } from './entorno.ts'

export interface Dependencias {
  readonly iniciarSesion: IniciarSesion
  readonly restaurarSesion: RestaurarSesion
  readonly cerrarSesion: CerrarSesion
  readonly suscribirExpiracion: (oyente: () => void) => () => void
  readonly suscribirCambioDeToken: (oyente: (token: string | null) => void) => () => void
  readonly registrarBeneficiario: RegistrarBeneficiario
  readonly completarDatosExtendidos: CompletarDatosExtendidos
  readonly actualizarDatos: ActualizarDatos
  readonly buscarBeneficiarios: BuscarBeneficiarios
  readonly consultarBeneficiario: ConsultarBeneficiario
  readonly verificarDuplicado: VerificarDuplicado
  readonly registrarConsentimiento: RegistrarConsentimiento
  readonly consultarGuiaInduccion: ConsultarGuiaInduccion
  readonly registrarLecturaModulo: RegistrarLecturaModulo
  readonly consultarResumenExportacion: ConsultarResumenExportacion
  readonly exportarPadron: ExportarPadron
  readonly autorizarUsoDeImagen: AutorizarUsoDeImagen
  readonly retirarUsoDeImagen: RetirarUsoDeImagen
  readonly consultarHistorialDeImagen: ConsultarHistorialDeImagen
  readonly registrarAutorizacionTutor: RegistrarAutorizacionTutor
  readonly revocarAutorizacionTutor: RevocarAutorizacionTutor
  readonly prepararSoporte: PrepararSoporte
  readonly consultarTurnosDeHoy: ConsultarTurnosDeHoy
  readonly entregarTurno: EntregarTurno
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
  const consentimientos = new ConsentimientoHttpRepository(http)
  const autorizacionesTutor = new AutorizacionTutorHttpRepository(http)
  const induccion = new InduccionHttpRepository(http)
  const exportaciones = new ExportacionHttpRepository(http)
  const turnos = new TurnosHttpRepository(http)
  const hoy = () => fechaDeHoy()

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
    completarDatosExtendidos: crearCompletarDatosExtendidos({ repositorio: beneficiarios }),
    actualizarDatos: crearActualizarDatos({ repositorio: beneficiarios }),
    buscarBeneficiarios: crearBuscarBeneficiarios({ repositorio: beneficiarios }),
    consultarBeneficiario: crearConsultarBeneficiario({ repositorio: beneficiarios }),
    verificarDuplicado: crearVerificarDuplicado({ repositorio: beneficiarios }),
    registrarConsentimiento: crearRegistrarConsentimiento({ repositorio: consentimientos }),
    consultarGuiaInduccion: crearConsultarGuiaInduccion({ repositorio: induccion }),
    registrarLecturaModulo: crearRegistrarLecturaModulo({ repositorio: induccion }),
    consultarResumenExportacion: crearConsultarResumenExportacion({
      repositorio: exportaciones,
      hoy,
    }),
    exportarPadron: crearExportarPadron({
      repositorio: exportaciones,
      descarga: new DescargaNavegador(),
      hoy,
    }),
    autorizarUsoDeImagen: crearAutorizarUsoDeImagen({ repositorio: consentimientos }),
    retirarUsoDeImagen: crearRetirarUsoDeImagen({ repositorio: consentimientos }),
    consultarHistorialDeImagen: crearConsultarHistorialDeImagen({ repositorio: consentimientos }),
    registrarAutorizacionTutor: crearRegistrarAutorizacionTutor({
      repositorio: autorizacionesTutor,
    }),
    revocarAutorizacionTutor: crearRevocarAutorizacionTutor({ repositorio: autorizacionesTutor }),
    prepararSoporte: crearPrepararSoporte({ foto: new FotoNavegador() }),
    consultarTurnosDeHoy: crearConsultarTurnosDeHoy({ repositorio: turnos }),
    entregarTurno: crearEntregarTurno({ repositorio: turnos }),
  }
}
