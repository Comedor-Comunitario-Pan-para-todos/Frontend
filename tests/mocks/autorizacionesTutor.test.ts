import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reiniciarBeneficiariosMock } from '@/mocks/beneficiarios.ts'
import { handlers } from '@/mocks/handlers.ts'
import type { NuevaAutorizacionTutor } from '@/modules/beneficiarios/domain/NuevaAutorizacionTutor.ts'
import { POLITICA_IMAGEN } from '@/modules/beneficiarios/domain/politicaImagen.ts'
import { AutorizacionTutorHttpRepository } from '@/modules/beneficiarios/infrastructure/http/AutorizacionTutorHttpRepository.ts'
import { BeneficiarioHttpRepository } from '@/modules/beneficiarios/infrastructure/http/BeneficiarioHttpRepository.ts'
import { ConsentimientoHttpRepository } from '@/modules/beneficiarios/infrastructure/http/ConsentimientoHttpRepository.ts'
import { crearHttp, tokenDe } from './clienteDePrueba.ts'
import { servidor } from './servidor.ts'

const ID_MARIA = '00000000-0000-4000-8000-000000000001'
const ID_CARLOS = '00000000-0000-4000-8000-000000000002'
const MOTIVO = 'La madre pidió que no le tomen más fotos.'

function como(rol: 'COORDINADORA' | 'VOLUNTARIO') {
  const http = crearHttp(tokenDe(rol))
  return {
    tutores: new AutorizacionTutorHttpRepository(http),
    consentimientos: new ConsentimientoHttpRepository(http),
    beneficiarios: new BeneficiarioHttpRepository(http),
  }
}

const coordinadora = () => como('COORDINADORA')
const voluntario = () => como('VOLUNTARIO')

function datosDelTutor(soporte = new File(['firma'], 'firma.jpg', { type: 'image/jpeg' })) {
  return {
    nombre: 'Luz Marina Díaz',
    tipoDocumento: 'CC',
    numeroDocumento: '52123456',
    parentesco: 'MADRE',
    telefono: '3101234567',
    soporte,
  } satisfies NuevaAutorizacionTutor
}

function aprobarTutor(id = ID_CARLOS) {
  return coordinadora().tutores.registrar(id, datosDelTutor())
}

function ficha(id: string, rol: 'COORDINADORA' | 'VOLUNTARIO' = 'COORDINADORA') {
  return como(rol).beneficiarios.consultarPorId(id)
}

describe('mock de la autorización del tutor', () => {
  beforeEach(() => {
    reiniciarBeneficiariosMock()
    servidor.use(...handlers)
  })

  describe('aprobar al tutor', () => {
    it('la Coordinadora la registra y la ficha del menor la muestra activa', async () => {
      const autorizacion = await aprobarTutor()

      expect(autorizacion).toMatchObject({
        estado: 'ACTIVA',
        tutor: { nombre: 'Luz Marina Díaz', numeroDocumento: '52123456', telefono: '3101234567' },
        aprobadaPor: 'Coordinación de Prueba',
      })
      expect((await ficha(ID_CARLOS)).autorizacionTutor).toEqual(autorizacion)
    })

    it('al Voluntario la ficha le llega sin documento ni teléfono del tutor', async () => {
      await aprobarTutor()

      expect((await ficha(ID_CARLOS, 'VOLUNTARIO')).autorizacionTutor?.tutor).toEqual({
        nombre: 'Luz Marina Díaz',
        parentesco: 'MADRE',
        tipoDocumento: null,
        numeroDocumento: null,
        telefono: null,
      })
    })

    it('aprobar al tutor no autoriza todavía las fotos', async () => {
      await aprobarTutor()

      expect((await ficha(ID_CARLOS)).consentimientoImagen).toBeNull()
    })

    it('el Voluntario no puede aprobarla', async () => {
      await expect(
        voluntario().tutores.registrar(ID_CARLOS, datosDelTutor()),
      ).rejects.toMatchObject({ estado: 403 })
    })

    it('rechaza un id que no es UUID y una persona que no existe', async () => {
      await expect(aprobarTutor('123')).rejects.toMatchObject({ estado: 400 })
      await expect(aprobarTutor('00000000-0000-4000-8000-000000000999')).rejects.toMatchObject({
        estado: 404,
      })
    })

    it('al Voluntario le responde 403 antes de revisar el id, como el backend', async () => {
      await expect(voluntario().tutores.registrar('123', datosDelTutor())).rejects.toMatchObject({
        estado: 403,
      })
    })

    it('rechaza a un adulto', async () => {
      await expect(aprobarTutor(ID_MARIA)).rejects.toMatchObject({ estado: 409 })
    })

    it('rechaza una segunda mientras la primera siga activa', async () => {
      await aprobarTutor()

      await expect(aprobarTutor()).rejects.toMatchObject({ estado: 409 })
    })

    it('rechaza un soporte que no es PDF, JPG ni PNG', async () => {
      const soporte = new File(['firma'], 'firma.heic', { type: 'image/heic' })

      await expect(
        coordinadora().tutores.registrar(ID_CARLOS, datosDelTutor(soporte)),
      ).rejects.toMatchObject({ estado: 400 })
    })

    it('rechaza un soporte de más de 5 MB', async () => {
      const soporte = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'firma.pdf', {
        type: 'application/pdf',
      })

      await expect(
        coordinadora().tutores.registrar(ID_CARLOS, datosDelTutor(soporte)),
      ).rejects.toMatchObject({ estado: 413 })
    })

    it('rechaza un campo vacío', async () => {
      await expect(
        coordinadora().tutores.registrar(ID_CARLOS, { ...datosDelTutor(), telefono: '' }),
      ).rejects.toMatchObject({ estado: 400 })
    })
  })

  describe('autorizar las fotos de un menor', () => {
    it('sin tutor activo, no se pueden autorizar', async () => {
      await expect(
        coordinadora().consentimientos.registrar(ID_CARLOS, POLITICA_IMAGEN),
      ).rejects.toMatchObject({ estado: 409 })
    })

    it('con tutor activo, solo la Coordinadora las autoriza', async () => {
      await aprobarTutor()

      await expect(
        voluntario().consentimientos.registrar(ID_CARLOS, POLITICA_IMAGEN),
      ).rejects.toMatchObject({ estado: 403 })
      await coordinadora().consentimientos.registrar(ID_CARLOS, POLITICA_IMAGEN)
      expect((await ficha(ID_CARLOS)).consentimientoImagen).not.toBeNull()
    })

    it('el Voluntario sí puede retirarlas', async () => {
      await aprobarTutor()
      await coordinadora().consentimientos.registrar(ID_CARLOS, POLITICA_IMAGEN)

      await voluntario().consentimientos.revocar(ID_CARLOS, 'USO_IMAGEN')

      expect((await ficha(ID_CARLOS)).consentimientoImagen).toBeNull()
    })
  })

  describe('revocar al tutor', () => {
    it('queda revocada con el motivo, y también se retiran las fotos', async () => {
      await aprobarTutor()
      await coordinadora().consentimientos.registrar(ID_CARLOS, POLITICA_IMAGEN)

      const revocada = await coordinadora().tutores.revocar(ID_CARLOS, MOTIVO)

      expect(revocada).toMatchObject({
        estado: 'REVOCADA',
        revocadaPor: 'Coordinación de Prueba',
        motivoRevocacion: MOTIVO,
      })
      const despues = await ficha(ID_CARLOS)
      expect(despues.autorizacionTutor).toBeNull()
      expect(despues.consentimientoImagen).toBeNull()
      const [retiro] = await coordinadora().consentimientos.consultarHistorial(
        ID_CARLOS,
        'USO_IMAGEN',
      )
      expect(retiro?.revocadoPor).toBe('Coordinación de Prueba')
    })

    it('después se puede aprobar otro tutor', async () => {
      await aprobarTutor()
      await coordinadora().tutores.revocar(ID_CARLOS, MOTIVO)

      await expect(aprobarTutor()).resolves.toMatchObject({ estado: 'ACTIVA' })
    })

    it('el Voluntario no puede revocarla', async () => {
      await aprobarTutor()

      await expect(voluntario().tutores.revocar(ID_CARLOS, MOTIVO)).rejects.toMatchObject({
        estado: 403,
      })
    })

    it('sin motivo no la revoca', async () => {
      await aprobarTutor()

      await expect(coordinadora().tutores.revocar(ID_CARLOS, '')).rejects.toMatchObject({
        estado: 400,
      })
    })

    it('si no hay una activa, responde 404', async () => {
      await expect(coordinadora().tutores.revocar(ID_CARLOS, MOTIVO)).rejects.toMatchObject({
        estado: 404,
      })
    })
  })

  describe('al cumplir 18 años', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    async function menorQueCumple18ElDia25() {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-22T15:00:00.000Z'))
      const { id } = await coordinadora().beneficiarios.registrar({
        nivel: 'BASICO',
        nombres: 'Sara',
        apellidos: 'Prueba',
        fechaNacimiento: '2008-11-25',
        barrio: null,
      })
      await aprobarTutor(id)
      await coordinadora().consentimientos.registrar(id, POLITICA_IMAGEN)
      vi.setSystemTime(new Date('2026-11-25T15:00:00.000Z'))
      return id
    }

    it('su propia autorización crea un registro nuevo y retira la del tutor', async () => {
      const id = await menorQueCumple18ElDia25()

      const propia = await voluntario().consentimientos.registrar(id, POLITICA_IMAGEN)

      expect(propia.registradoEn).toBe('2026-11-25T15:00:00.000Z')
      const historial = await coordinadora().consentimientos.consultarHistorial(id, 'USO_IMAGEN')
      expect(historial.map((registro) => registro.revocadoEn)).toEqual([
        null,
        '2026-11-25T15:00:00.000Z',
      ])
    })

    it('ya no se le puede aprobar un tutor', async () => {
      const id = await menorQueCumple18ElDia25()
      await coordinadora().tutores.revocar(id, MOTIVO)

      await expect(aprobarTutor(id)).rejects.toMatchObject({ estado: 409 })
    })
  })
})
