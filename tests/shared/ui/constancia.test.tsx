import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConstanciaProvider } from '@/shared/ui/constancia/ConstanciaProvider.tsx'
import {
  useConstancia,
  type AccionesConstancia,
} from '@/shared/ui/constancia/contextoConstancia.ts'

const vibrate = vi.fn()
let acciones: AccionesConstancia

function Capturar() {
  const valor = useConstancia()
  useEffect(() => {
    acciones = valor
  }, [valor])
  return null
}

function arbol(pantalla: string) {
  return (
    <ConstanciaProvider pantalla={pantalla}>
      <Capturar />
    </ConstanciaProvider>
  )
}

function confirmarTurno() {
  act(() => {
    acciones.confirmar({ titulo: 'Turno registrado', resumen: 'Turno 45' })
  })
}

function esperar(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('Constancia', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vibrate.mockClear()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(navigator, 'vibrate')
  })

  it('al guardar muestra la tarjeta, vibra una vez y luego se reduce a una tira', () => {
    render(arbol('/turnos'))

    confirmarTurno()
    expect(screen.getByText('Turno registrado')).toBeInTheDocument()
    expect(vibrate).toHaveBeenCalledWith(40)

    esperar(2600)
    expect(screen.queryByText('Turno registrado')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Turno 45')
  })

  it('la tira permanece hasta que se cambia de pantalla', () => {
    const { rerender } = render(arbol('/turnos'))
    confirmarTurno()
    esperar(60_000)
    expect(screen.getByRole('status')).toHaveTextContent('Turno 45')

    rerender(arbol('/reportes'))

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('una tarjeta recién mostrada sobrevive al cambio de pantalla', () => {
    const { rerender } = render(arbol('/turnos'))
    confirmarTurno()

    rerender(arbol('/reportes'))

    expect(screen.getByText('Turno registrado')).toBeInTheDocument()
  })

  it('un fallo no se va solo, vibra dos veces y permite reintentar', () => {
    const reintentar = vi.fn()
    render(arbol('/turnos'))

    act(() => {
      acciones.avisarFallo({ titulo: 'No se guardó el turno', reintentar })
    })
    esperar(60_000)
    expect(vibrate).toHaveBeenCalledWith([40, 60, 40])

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(reintentar).toHaveBeenCalledOnce()
    expect(screen.queryByText('No se guardó el turno')).not.toBeInTheDocument()
  })

  it('una decisión ejecuta su acción y también se puede cerrar', () => {
    const alPresionar = vi.fn()
    render(arbol('/turnos'))

    act(() => {
      acciones.pedirDecision({
        titulo: 'Ya recibió ración hoy',
        accion: { etiqueta: 'Ver registro', alPresionar },
      })
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(alPresionar).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('la nueva reemplaza a la anterior', () => {
    render(arbol('/turnos'))
    act(() => {
      acciones.avisarFallo({ titulo: 'No se guardó el turno', reintentar: vi.fn() })
    })

    confirmarTurno()

    expect(screen.queryByText('No se guardó el turno')).not.toBeInTheDocument()
    expect(screen.getByText('Turno registrado')).toBeInTheDocument()
  })

  it('funciona en teléfonos sin vibración', () => {
    Reflect.deleteProperty(navigator, 'vibrate')
    render(arbol('/turnos'))

    confirmarTurno()

    expect(screen.getByText('Turno registrado')).toBeInTheDocument()
  })

  it('useConstancia falla fuera del proveedor', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useConstancia())).toThrow('ConstanciaProvider')

    vi.restoreAllMocks()
  })
})
