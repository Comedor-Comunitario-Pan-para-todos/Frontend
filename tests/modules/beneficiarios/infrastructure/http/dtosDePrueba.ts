import { CARLOS, MARIA } from '../../datosDePrueba.ts'

// Así responde el backend actual (entidad de TypeORM serializada por NestJS), sin los campos
// que propone RF-02.
export const DTO_MARIA = {
  id: MARIA.id,
  tipoDocumento: 'CC',
  numeroDocumento: '42185390',
  nombres: 'María Elena',
  apellidos: 'Restrepo',
  fechaNacimiento: '1958-03-15',
  barrio: 'El Poblado',
  telefono: null,
  createdAt: MARIA.registradoEn,
  updatedAt: '2026-11-03T10:00:00.000Z',
  deletedAt: null,
}

export const DTO_CARLOS = {
  id: CARLOS.id,
  tipoDocumento: null,
  numeroDocumento: null,
  nombres: 'Carlos Julio',
  apellidos: 'Morales Restrepo',
  fechaNacimiento: '2014-03-15',
  barrio: null,
  telefono: null,
  createdAt: CARLOS.registradoEn,
  updatedAt: CARLOS.registradoEn,
  deletedAt: null,
}
