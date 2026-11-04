export { esFechaValida, sumarPesos, validarInsumo } from './domain/insumoDonado.ts'
export type { InsumoDonado, PesoTotal, UnidadMedida } from './domain/insumoDonado.ts'
export { validarOferta } from './domain/ofertaDonacion.ts'
export type {
  DatosDonante,
  DatosNuevaOferta,
  EstadoOferta,
  InsumoOfertado,
  LogisticaEntrega,
  ModalidadTransporte,
  OfertaDonacion,
  UnidadEmpaque,
} from './domain/ofertaDonacion.ts'
export { puedeDecidirseOferta, puedeRecibirseOferta } from './domain/estadoOferta.ts'
export { validarRecepcion } from './domain/recepcionDonacion.ts'
export type { DatosRecepcion, TipoPeso } from './domain/recepcionDonacion.ts'
