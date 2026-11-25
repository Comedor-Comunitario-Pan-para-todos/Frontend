import { describe, expect, it } from 'vitest'
import { tienePermiso, type Permiso } from '@/modules/auth/domain/permisos.ts'
import type { Rol, Usuario } from '@/modules/auth/domain/Usuario.ts'

function usuarioConRol(rol: Rol): Usuario {
  return { id: '1', email: 'persona@comedor.test', nombreCompleto: 'Persona de Prueba', rol }
}

describe('tienePermiso', () => {
  it.each<[Rol, Permiso, boolean]>([
    ['COORDINADORA', 'inicio.ver', true],
    ['COORDINADORA', 'turnos.ver', true],
    ['COORDINADORA', 'beneficiarios.ver', true],
    ['COORDINADORA', 'inventario.ver', true],
    ['COORDINADORA', 'aportes.ver', false],
    ['COORDINADORA', 'reportes.ver', true],
    ['PRESIDENTE_JAC', 'inicio.ver', true],
    ['PRESIDENTE_JAC', 'turnos.ver', false],
    ['PRESIDENTE_JAC', 'beneficiarios.ver', false],
    ['PRESIDENTE_JAC', 'inventario.ver', false],
    ['PRESIDENTE_JAC', 'aportes.ver', false],
    ['PRESIDENTE_JAC', 'reportes.ver', true],
    ['VOLUNTARIO', 'inicio.ver', true],
    ['VOLUNTARIO', 'turnos.ver', true],
    ['VOLUNTARIO', 'beneficiarios.ver', true],
    ['VOLUNTARIO', 'inventario.ver', true],
    ['VOLUNTARIO', 'aportes.ver', false],
    ['VOLUNTARIO', 'reportes.ver', false],
    ['DONANTE', 'inicio.ver', true],
    ['DONANTE', 'turnos.ver', false],
    ['DONANTE', 'beneficiarios.ver', false],
    ['DONANTE', 'inventario.ver', false],
    ['DONANTE', 'aportes.ver', true],
    ['DONANTE', 'reportes.ver', true],
  ])('%s con %s: %s', (rol, permiso, esperado) => {
    expect(tienePermiso(usuarioConRol(rol), permiso)).toBe(esperado)
  })

  it.each<[Rol, boolean]>([
    ['COORDINADORA', true],
    ['VOLUNTARIO', true],
    ['PRESIDENTE_JAC', false],
    ['DONANTE', false],
  ])('%s puede leer la guía de inducción: %s', (rol, esperado) => {
    expect(tienePermiso(usuarioConRol(rol), 'induccion.ver')).toBe(esperado)
  })

  it.each<[Rol, Permiso, boolean]>([
    ['COORDINADORA', 'beneficiarios.registrar', true],
    ['COORDINADORA', 'beneficiarios.verDatosSensibles', true],
    ['PRESIDENTE_JAC', 'beneficiarios.registrar', false],
    ['PRESIDENTE_JAC', 'beneficiarios.verDatosSensibles', false],
    ['VOLUNTARIO', 'beneficiarios.registrar', true],
    ['VOLUNTARIO', 'beneficiarios.verDatosSensibles', false],
    ['DONANTE', 'beneficiarios.registrar', false],
    ['DONANTE', 'beneficiarios.verDatosSensibles', false],
    ['COORDINADORA', 'reportes.exportarPadron', false],
    ['PRESIDENTE_JAC', 'reportes.exportarPadron', true],
    ['VOLUNTARIO', 'reportes.exportarPadron', false],
    ['DONANTE', 'reportes.exportarPadron', false],
  ])('%s con %s: %s', (rol, permiso, esperado) => {
    expect(tienePermiso(usuarioConRol(rol), permiso)).toBe(esperado)
  })

  it.each<[Rol, boolean]>([
    ['COORDINADORA', true],
    ['VOLUNTARIO', false],
    ['PRESIDENTE_JAC', false],
    ['DONANTE', false],
  ])('%s puede gestionar al tutor de un menor: %s', (rol, esperado) => {
    expect(tienePermiso(usuarioConRol(rol), 'beneficiarios.gestionarTutor')).toBe(esperado)
  })

  it.each<[Rol, boolean]>([
    ['COORDINADORA', true],
    ['VOLUNTARIO', false],
    ['PRESIDENTE_JAC', false],
    ['DONANTE', false],
  ])('%s puede actualizar los datos sensibles: %s', (rol, esperado) => {
    expect(tienePermiso(usuarioConRol(rol), 'beneficiarios.actualizarDatosSensibles')).toBe(
      esperado,
    )
  })

  it('sin usuario no concede ningún permiso', () => {
    expect(tienePermiso(null, 'inicio.ver')).toBe(false)
  })
})
