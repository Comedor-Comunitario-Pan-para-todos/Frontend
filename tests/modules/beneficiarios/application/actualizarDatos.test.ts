import { describe, expect, it } from 'vitest'
import { crearActualizarDatos } from '@/modules/beneficiarios/application/actualizarDatos.ts'
import { crearRepositorioDePrueba, MARIA } from '../datosDePrueba.ts'

describe('actualizarDatos', () => {
  it('envía la actualización limpia y devuelve la ficha', async () => {
    const repositorio = crearRepositorioDePrueba()

    const ficha = await crearActualizarDatos({ repositorio })(MARIA.id, {
      nombres: ' María  Elena ',
      apellidos: 'Restrepo',
      fechaNacimiento: '1958-03-15',
      barrio: ' El Jardín ',
      sensibles: { documento: null, telefono: '315 123 4567', clasificacion: null },
    })

    expect(ficha).toEqual(MARIA)
    expect(repositorio.actualizarDatos).toHaveBeenCalledWith(MARIA.id, {
      nombres: 'María Elena',
      apellidos: 'Restrepo',
      fechaNacimiento: '1958-03-15',
      barrio: 'El Jardín',
      sensibles: { documento: null, telefono: '3151234567', clasificacion: null },
    })
  })
})
