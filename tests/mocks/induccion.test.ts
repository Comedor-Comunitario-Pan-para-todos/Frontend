import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handlers, USUARIOS_MOCK } from '@/mocks/handlers.ts'
import {
  MODULOS_INDUCCION,
  reiniciarInduccionMock,
  TEMA_QUE_FALLA_UNA_VEZ,
} from '@/mocks/induccion.ts'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { InduccionHttpRepository } from '@/modules/induccion/infrastructure/http/InduccionHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from './servidor.ts'

function repositorioDe(rol: Rol) {
  const usuario = USUARIOS_MOCK.find((u) => u.rol === rol && u.activo)!
  return new InduccionHttpRepository(
    new AxiosHttpClient({
      baseUrl: '/api',
      sesion: { obtenerToken: () => `mock-token.${usuario.id}`, alExpirarSesion: vi.fn() },
    }),
  )
}

describe('mocks de inducción', () => {
  beforeEach(() => {
    reiniciarInduccionMock()
    servidor.use(...handlers)
  })

  it('entrega los 4 temas, cada uno con sus puntos, y el voluntario ya leyó el primero', async () => {
    const guia = await repositorioDe('VOLUNTARIO').consultar()

    expect(guia.modulos.map((m) => m.id)).toEqual([
      'higiene',
      'trato-digno',
      'alimentos',
      'emergencias',
    ])
    expect(guia.modulos.every((m) => m.puntos.length > 0)).toBe(true)
    expect(guia.progreso.modulosLeidos).toEqual(['higiene'])
  })

  it('la guía dura unos 10 minutos en total', () => {
    const minutos = MODULOS_INDUCCION.reduce((suma, m) => suma + m.minutosLectura, 0)

    expect(minutos).toBeGreaterThanOrEqual(8)
    expect(minutos).toBeLessThanOrEqual(10)
  })

  it('guarda el avance de cada usuario por separado', async () => {
    await repositorioDe('COORDINADORA').registrarLectura('trato-digno', true)

    expect((await repositorioDe('COORDINADORA').consultar()).progreso.modulosLeidos).toEqual([
      'trato-digno',
    ])
    expect((await repositorioDe('VOLUNTARIO').consultar()).progreso.modulosLeidos).toEqual([
      'higiene',
    ])
  })

  it('permite desmarcar un tema', async () => {
    const progreso = await repositorioDe('VOLUNTARIO').registrarLectura('higiene', false)

    expect(progreso.modulosLeidos).toEqual([])
  })

  it('el primer guardado del tema de prueba falla y el reintento funciona', async () => {
    const repositorio = repositorioDe('VOLUNTARIO')

    await expect(repositorio.registrarLectura(TEMA_QUE_FALLA_UNA_VEZ, true)).rejects.toMatchObject({
      tipo: 'servidor',
    })
    const progreso = await repositorio.registrarLectura(TEMA_QUE_FALLA_UNA_VEZ, true)

    expect(progreso.modulosLeidos).toEqual(['higiene', TEMA_QUE_FALLA_UNA_VEZ])
  })

  it('responde 404 si el tema no existe', async () => {
    await expect(
      repositorioDe('VOLUNTARIO').registrarLectura('tema-inventado', true),
    ).rejects.toMatchObject({ tipo: 'no-encontrado' })
  })

  it.each<Rol>(['PRESIDENTE_JAC', 'DONANTE'])('%s no puede ver la guía', async (rol) => {
    await expect(repositorioDe(rol).consultar()).rejects.toMatchObject({ tipo: 'sin-permiso' })
  })
})
