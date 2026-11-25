import type { CriteriosBusqueda } from '@/modules/beneficiarios/application/ports/BeneficiarioRepository.ts'
import type { ActualizacionDeDatos } from '@/modules/beneficiarios/domain/ActualizacionDeDatos.ts'
import type {
  DatosExtendidos,
  NuevoBeneficiario,
} from '@/modules/beneficiarios/domain/NuevoBeneficiario.ts'

export function aCuerpoDeRegistro(datos: NuevoBeneficiario) {
  const basicos = {
    nivel: datos.nivel,
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    fechaNacimiento: datos.fechaNacimiento,
    barrio: datos.barrio ?? undefined,
  }

  if (datos.nivel === 'BASICO') return basicos

  return { ...basicos, ...camposExtendidos(datos) }
}

export function aCuerpoDeDatosExtendidos(datos: DatosExtendidos) {
  return { nivel: 'EXTENDIDO', ...camposExtendidos(datos) }
}

export function aCuerpoDeActualizacion(actualizacion: ActualizacionDeDatos) {
  const basicos = {
    nombres: actualizacion.nombres,
    apellidos: actualizacion.apellidos,
    fechaNacimiento: actualizacion.fechaNacimiento,
    barrio: actualizacion.barrio,
  }
  const { sensibles } = actualizacion

  if (sensibles === null) return basicos

  return {
    ...basicos,
    tipoDocumento: sensibles.documento?.tipo ?? null,
    numeroDocumento: sensibles.documento?.numero ?? null,
    telefono: sensibles.telefono,
    clasificacion: sensibles.clasificacion,
  }
}

function camposExtendidos(datos: DatosExtendidos) {
  return {
    tipoDocumento: datos.documento?.tipo,
    numeroDocumento: datos.documento?.numero,
    telefono: datos.telefono ?? undefined,
    clasificacion: datos.clasificacion ?? undefined,
  }
}

export function aParametrosDeBusqueda(criterios: CriteriosBusqueda) {
  return {
    search: criterios.texto === '' ? undefined : criterios.texto,
    page: criterios.pagina,
    limit: criterios.porPagina,
  }
}
