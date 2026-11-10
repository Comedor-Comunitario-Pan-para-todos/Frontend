import { useEffect, useState } from 'react'

/**
 * Devuelve `valor` solo cuando lleva `retrasoMs` sin cambiar. Sirve para no consultar al servidor
 * con cada tecla mientras la persona sigue escribiendo.
 */
export function useValorRetrasado<T>(valor: T, retrasoMs: number): T {
  const [retrasado, setRetrasado] = useState(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), retrasoMs)
    return () => clearTimeout(temporizador)
  }, [valor, retrasoMs])

  return retrasado
}
