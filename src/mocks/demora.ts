import { delay } from 'msw'

/** Espera realista en el modo mock; ninguna en las pruebas, para no dejar respuestas pendientes. */
export function demora(): Promise<void> {
  return import.meta.env.MODE === 'test' ? Promise.resolve() : delay()
}
