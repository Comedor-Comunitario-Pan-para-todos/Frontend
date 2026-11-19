import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers, USUARIOS_MOCK } from '@/mocks/handlers.ts'
import { DESDE_SERVIDOR_CAIDO } from '@/mocks/reportes.ts'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { ExportacionHttpRepository } from '@/modules/reportes/infrastructure/http/ExportacionHttpRepository.ts'
import { AxiosHttpClient } from '@/shared/infrastructure/http/AxiosHttpClient.ts'
import { servidor } from './servidor.ts'

const NOVIEMBRE = { desde: '2026-11-01', hasta: '2026-11-19' }

function repositorioDe(rol: Rol) {
  const token = `mock-token.${USUARIOS_MOCK.find((u) => u.rol === rol && u.activo)!.id}`
  return new ExportacionHttpRepository(
    new AxiosHttpClient({
      baseUrl: '/api',
      sesion: { obtenerToken: () => token, alExpirarSesion: vi.fn() },
    }),
  )
}

async function texto(contenido: Blob): Promise<string> {
  // El ZIP del mock no comprime: el XML de la hoja se lee tal cual dentro del archivo.
  return new TextDecoder().decode(await contenido.arrayBuffer())
}

describe('mock de exportaciones', () => {
  beforeEach(() => {
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  it('cuenta a quienes asistieron en el rango y a quienes no autorizaron', async () => {
    const resumen = await repositorioDe('COORDINADORA').consultarResumen(NOVIEMBRE)

    expect(resumen).toEqual({ asistieron: 24, incluidas: 20, excluidas: 4 })
  })

  it('antes de que el comedor empezara a atender no hay nadie', async () => {
    const resumen = await repositorioDe('COORDINADORA').consultarResumen({
      desde: '2026-01-01',
      hasta: '2026-01-05',
    })

    expect(resumen).toEqual({ asistieron: 0, incluidas: 0, excluidas: 0 })
  })

  it.each<Rol>(['VOLUNTARIO', 'PRESIDENTE_JAC', 'DONANTE'])('responde 403 a %s', async (rol) => {
    await expect(repositorioDe(rol).consultarResumen(NOVIEMBRE)).rejects.toMatchObject({
      tipo: 'sin-permiso',
    })
    await expect(repositorioDe(rol).generarPadron(NOVIEMBRE)).rejects.toMatchObject({
      tipo: 'sin-permiso',
    })
  })

  it('rechaza un rango al revés como lo haría la validación del backend', async () => {
    await expect(
      repositorioDe('COORDINADORA').consultarResumen({ desde: '2026-11-19', hasta: '2026-11-01' }),
    ).rejects.toMatchObject({ tipo: 'validacion' })
  })

  it('entrega un .xlsx con una fila por persona incluida', async () => {
    const archivo = await repositorioDe('COORDINADORA').generarPadron(NOVIEMBRE)
    const contenido = await texto(archivo.contenido)

    expect(archivo.nombre).toBe('padron-beneficiarios_2026-11-01_a_2026-11-19.xlsx')
    expect(contenido.startsWith('PK')).toBe(true)
    expect(contenido).toContain('<t>Visitas en el rango</t>')
    // Encabezado más las 20 personas que autorizaron.
    expect(contenido.match(/<row /g)).toHaveLength(21)
  })

  it(`con inicio ${DESDE_SERVIDOR_CAIDO} simula un servidor caído`, async () => {
    await expect(
      repositorioDe('COORDINADORA').generarPadron({
        desde: DESDE_SERVIDOR_CAIDO,
        hasta: '2026-11-19',
      }),
    ).rejects.toMatchObject({ tipo: 'servidor' })
  })

  it('no genera un archivo vacío', async () => {
    await expect(
      repositorioDe('COORDINADORA').generarPadron({ desde: '2026-01-01', hasta: '2026-01-05' }),
    ).rejects.toMatchObject({ tipo: 'conflicto' })
  })
})
