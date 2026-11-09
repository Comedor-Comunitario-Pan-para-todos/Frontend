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

  it('sin usuario no concede ningún permiso', () => {
    expect(tienePermiso(null, 'inicio.ver')).toBe(false)
  })
})
