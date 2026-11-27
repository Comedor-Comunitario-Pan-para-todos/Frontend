import { useEffect, useRef } from 'react'

/** Si al cambiar `estado` el foco se perdió (quedó en la página), lo pone en el elemento devuelto. */
export function useRecuperarFoco<T extends HTMLElement>(estado: string) {
  const elemento = useRef<T>(null)
  const anterior = useRef(estado)

  useEffect(() => {
    if (anterior.current === estado) return
    anterior.current = estado
    if (document.activeElement === document.body) elemento.current?.focus()
  }, [estado])

  return elemento
}
