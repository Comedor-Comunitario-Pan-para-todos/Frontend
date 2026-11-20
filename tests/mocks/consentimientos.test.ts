import { beforeEach, describe, expect, it } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import {
  FINALIDAD_USO_IMAGEN,
  POLITICA_IMAGEN,
} from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { POLITICA_VIGENTE } from '@/modules/beneficiarios/domain/politicaVigente.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import { crearHttp, tokenDe } from './clienteDePrueba.ts'
import { servidor } from './servidor.ts'

// Personas sembradas en el mock.
const ID_MARIA = '00000000-0000-4000-8000-000000000001' // Adulta, ya aceptó la política de datos.
const ID_CARLOS = '00000000-0000-4000-8000-000000000002' // Menor de edad, nacido en 2014.
const ID_ROSA = '00000000-0000-4000-8000-000000000003' // Adulta, sin consentimientos.
const ID_INEXISTENTE = '00000000-0000-4000-8000-999999999999'

function consentimientos(rol: Rol = 'VOLUNTARIO') {
  return new ConsentimientoHttpRepository(crearHttp(tokenDe(rol)))
}

function ficha(id: string) {
  return new BeneficiarioHttpRepository(crearHttp(tokenDe('VOLUNTARIO'))).consultarPorId(id)
}

describe('mocks de consentimientos', () => {
  beforeEach(() => {
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  describe('consentimiento de datos (RF-19)', () => {
    it('lo guarda con la política aceptada y el nombre de quien lo tomó', async () => {
      const consentimiento = await consentimientos().registrar(ID_CARLOS, POLITICA_VIGENTE)

      expect(consentimiento).toMatchObject({
        versionPolitica: 1,
        finalidad: 'ATENCION_ALIMENTARIA',
        registradoPor: 'Voluntario de Prueba',
      })
    })

    it('si ya aceptó esa versión, devuelve el mismo y no crea otro', async () => {
      const primero = await consentimientos().registrar(ID_CARLOS, POLITICA_VIGENTE)

      const segundo = await consentimientos('COORDINADORA').registrar(ID_CARLOS, POLITICA_VIGENTE)

      expect(segundo).toEqual(primero)
    })

    it('responde 404 si la persona no existe', async () => {
      await expect(
        consentimientos().registrar(ID_INEXISTENTE, POLITICA_VIGENTE),
      ).rejects.toMatchObject({ tipo: 'no-encontrado' })
    })

    it('valida el cuerpo con los mensajes del backend', async () => {
      const respuesta = crearHttp(tokenDe('VOLUNTARIO')).post(
        `/beneficiarios/${ID_CARLOS}/consentimiento`,
        { versionPolitica: 0, firma: 'x' },
      )

      await expect(respuesta).rejects.toMatchObject({
        mensajesServidor: [
          'property firma should not exist',
          'La versión de la política debe ser un entero positivo',
          'La finalidad es requerida',
        ],
      })
    })

    it('rechaza una finalidad que no existe', async () => {
      const respuesta = crearHttp(tokenDe('VOLUNTARIO')).post(
        `/beneficiarios/${ID_ROSA}/consentimiento`,
        { versionPolitica: 1, finalidad: 'PUBLICIDAD' },
      )

      await expect(respuesta).rejects.toMatchObject({
        mensajesServidor: ['La finalidad debe ser ATENCION_ALIMENTARIA o USO_IMAGEN'],
      })
    })

    it('la ficha lo muestra después de guardarlo', async () => {
      const antes = await ficha(ID_CARLOS)

      const consentimiento = await consentimientos().registrar(ID_CARLOS, POLITICA_VIGENTE)

      expect(antes.consentimiento).toBeNull()
      await expect(ficha(ID_CARLOS)).resolves.toMatchObject({ consentimiento })
    })

    it('solo lo pueden tomar Coordinadora y Voluntario', async () => {
      await expect(
        consentimientos('DONANTE').registrar(ID_CARLOS, POLITICA_VIGENTE),
      ).rejects.toMatchObject({ tipo: 'sin-permiso' })
    })
  })

  describe('autorizar el uso de imagen (RF-20)', () => {
    it('guarda la autorización de un adulto y la ficha la muestra', async () => {
      const autorizacion = await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      expect(autorizacion).toMatchObject({
        versionPolitica: 1,
        finalidad: FINALIDAD_USO_IMAGEN,
        registradoPor: 'Voluntario de Prueba',
      })
      await expect(ficha(ID_ROSA)).resolves.toMatchObject({
        consentimiento: null,
        consentimientoImagen: autorizacion,
      })
    })

    it('no la acepta para un menor de edad: requiere la autorización del tutor', async () => {
      await expect(consentimientos().registrar(ID_CARLOS, POLITICA_IMAGEN)).rejects.toMatchObject({
        tipo: 'conflicto',
        mensajesServidor: [
          'El uso de imagen de un menor de edad requiere la autorización de su tutor',
        ],
      })
      await expect(ficha(ID_CARLOS)).resolves.toMatchObject({ consentimientoImagen: null })
    })

    it('no cambia el consentimiento de datos que ya tenía', async () => {
      const antes = await ficha(ID_MARIA)

      await consentimientos().registrar(ID_MARIA, POLITICA_IMAGEN)

      await expect(ficha(ID_MARIA)).resolves.toMatchObject({
        consentimiento: antes.consentimiento,
      })
    })
  })

  describe('retirar el uso de imagen (RF-20)', () => {
    it('marca cuándo y quién la retiró, y la ficha deja de mostrarla', async () => {
      const autorizacion = await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      const retirada = await consentimientos('COORDINADORA').revocar(ID_ROSA, FINALIDAD_USO_IMAGEN)

      expect(retirada).toMatchObject({
        ...autorizacion,
        revocadoEn: expect.any(String),
        revocadoPor: 'Coordinación de Prueba',
      })
      await expect(ficha(ID_ROSA)).resolves.toMatchObject({ consentimientoImagen: null })
    })

    it('responde 404 si no hay una autorización vigente', async () => {
      await expect(consentimientos().revocar(ID_ROSA, FINALIDAD_USO_IMAGEN)).rejects.toMatchObject({
        tipo: 'no-encontrado',
        mensajesServidor: ['No hay una autorización vigente con la finalidad USO_IMAGEN'],
      })
    })

    it('retira solo la de imagen, no el consentimiento de datos', async () => {
      const antes = await ficha(ID_MARIA)
      await consentimientos().registrar(ID_MARIA, POLITICA_IMAGEN)

      await consentimientos().revocar(ID_MARIA, FINALIDAD_USO_IMAGEN)

      await expect(ficha(ID_MARIA)).resolves.toMatchObject({
        consentimiento: antes.consentimiento,
        consentimientoImagen: null,
      })
    })

    it('después de retirarla se puede volver a autorizar', async () => {
      await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)
      await consentimientos().revocar(ID_ROSA, FINALIDAD_USO_IMAGEN)

      const nueva = await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      await expect(ficha(ID_ROSA)).resolves.toMatchObject({ consentimientoImagen: nueva })
    })

    it('valida el cuerpo con los mensajes del backend', async () => {
      const respuesta = crearHttp(tokenDe('VOLUNTARIO')).post(
        `/beneficiarios/${ID_ROSA}/consentimiento/revocacion`,
        { motivo: 'x' },
      )

      await expect(respuesta).rejects.toMatchObject({
        mensajesServidor: ['property motivo should not exist', 'La finalidad es requerida'],
      })
    })

    it('responde 404 si la persona no existe', async () => {
      await expect(
        consentimientos().revocar(ID_INEXISTENTE, FINALIDAD_USO_IMAGEN),
      ).rejects.toMatchObject({ tipo: 'no-encontrado' })
    })

    it('solo la pueden retirar Coordinadora y Voluntario', async () => {
      await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      await expect(
        consentimientos('DONANTE').revocar(ID_ROSA, FINALIDAD_USO_IMAGEN),
      ).rejects.toMatchObject({ tipo: 'sin-permiso' })
    })
  })

  describe('historial (RF-20)', () => {
    it('empieza vacío', async () => {
      await expect(
        consentimientos().consultarHistorial(ID_ROSA, FINALIDAD_USO_IMAGEN),
      ).resolves.toEqual([])
    })

    it('guarda cada cambio, el más reciente primero', async () => {
      await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)
      await consentimientos('COORDINADORA').revocar(ID_ROSA, FINALIDAD_USO_IMAGEN)
      await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      const historial = await consentimientos().consultarHistorial(ID_ROSA, FINALIDAD_USO_IMAGEN)

      expect(historial).toEqual([
        expect.objectContaining({ revocadoEn: null, revocadoPor: null }),
        expect.objectContaining({
          revocadoEn: expect.any(String),
          revocadoPor: 'Coordinación de Prueba',
        }),
      ])
    })

    it('solo trae la finalidad pedida', async () => {
      await consentimientos().registrar(ID_MARIA, POLITICA_IMAGEN)

      const historial = await consentimientos().consultarHistorial(ID_MARIA, FINALIDAD_USO_IMAGEN)

      expect(historial.map((r) => r.finalidad)).toEqual([FINALIDAD_USO_IMAGEN])
    })

    it('solo trae los de esa persona', async () => {
      await consentimientos().registrar(ID_MARIA, POLITICA_IMAGEN)

      await expect(
        consentimientos().consultarHistorial(ID_ROSA, FINALIDAD_USO_IMAGEN),
      ).resolves.toEqual([])
    })

    it('se borra al reiniciar el mock', async () => {
      await consentimientos().registrar(ID_ROSA, POLITICA_IMAGEN)

      reiniciarBeneficiariosMock()

      await expect(
        consentimientos().consultarHistorial(ID_ROSA, FINALIDAD_USO_IMAGEN),
      ).resolves.toEqual([])
    })

    it('rechaza parámetros que no conoce y finalidades que no existen', async () => {
      const http = crearHttp(tokenDe('VOLUNTARIO'))
      const ruta = `/beneficiarios/${ID_ROSA}/consentimientos`

      await expect(http.get(ruta, { params: { orden: 'asc' } })).rejects.toMatchObject({
        mensajesServidor: ['property orden should not exist'],
      })
      await expect(http.get(ruta, { params: { finalidad: 'PUBLICIDAD' } })).rejects.toMatchObject({
        mensajesServidor: ['La finalidad debe ser ATENCION_ALIMENTARIA o USO_IMAGEN'],
      })
    })

    it('responde 404 si la persona no existe', async () => {
      await expect(
        consentimientos().consultarHistorial(ID_INEXISTENTE, FINALIDAD_USO_IMAGEN),
      ).rejects.toMatchObject({ tipo: 'no-encontrado' })
    })

    it('solo lo pueden ver Coordinadora y Voluntario', async () => {
      await expect(
        consentimientos('DONANTE').consultarHistorial(ID_ROSA, FINALIDAD_USO_IMAGEN),
      ).rejects.toMatchObject({ tipo: 'sin-permiso' })
    })
  })
})
