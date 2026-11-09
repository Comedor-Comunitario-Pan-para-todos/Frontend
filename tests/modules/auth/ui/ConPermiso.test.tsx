import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { Rol } from '@/modules/auth/domain/Usuario.ts'
import { ConPermiso } from '@/modules/auth/ui/ConPermiso.tsx'
import { ContextoAuth, type Auth } from '@/modules/auth/ui/contextoAuth.ts'

function renderizarCon(rol: Rol | null, arbol: ReactNode) {
  const usuario =
    rol === null
      ? null
      : { id: '1', email: 'persona@comedor.test', nombreCompleto: 'Persona de Prueba', rol }
  const auth = { usuario } as Auth

  render(<ContextoAuth.Provider value={auth}>{arbol}</ContextoAuth.Provider>)
}

describe('ConPermiso', () => {
  it('muestra el contenido si el rol tiene el permiso', () => {
    renderizarCon(
      'VOLUNTARIO',
      <ConPermiso permiso="turnos.ver">
        <p>Emitir turno</p>
      </ConPermiso>,
    )

    expect(screen.getByText('Emitir turno')).toBeInTheDocument()
  })

  it('oculta el contenido si el rol no tiene el permiso', () => {
    renderizarCon(
      'DONANTE',
      <ConPermiso permiso="turnos.ver">
        <p>Emitir turno</p>
      </ConPermiso>,
    )

    expect(screen.queryByText('Emitir turno')).not.toBeInTheDocument()
  })

  it('muestra la alternativa si el rol no tiene el permiso', () => {
    renderizarCon(
      'DONANTE',
      <ConPermiso permiso="turnos.ver" alternativa={<p>Sin acceso</p>}>
        <p>Emitir turno</p>
      </ConPermiso>,
    )

    expect(screen.getByText('Sin acceso')).toBeInTheDocument()
    expect(screen.queryByText('Emitir turno')).not.toBeInTheDocument()
  })

  it('sin usuario no muestra el contenido', () => {
    renderizarCon(
      null,
      <ConPermiso permiso="inicio.ver">
        <p>Inicio</p>
      </ConPermiso>,
    )

    expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
  })
})
