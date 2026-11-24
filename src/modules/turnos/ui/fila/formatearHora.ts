/** La hora de entrega como se dice en la reja: «12:04 p. m.», en la hora de Colombia. */
export function formatearHora(momento: string): string {
  return new Date(momento).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
  })
}
