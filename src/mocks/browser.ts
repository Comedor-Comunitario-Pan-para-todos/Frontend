import { http, passthrough } from 'msw'
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers.ts'

/**
 * Dice si la petición va a la API. En el navegador MSW ve todo lo que pide la página, también
 * los módulos que sirve Vite: sin este filtro, `/src/modules/beneficiarios/index.ts` coincide
 * con `*\/beneficiarios/:id` y el mock responde 401 en vez del archivo.
 */
export function esPeticionDeLaApi(url: string, apiBaseUrl: string, origen: string): boolean {
  const base = new URL(apiBaseUrl, origen).href.replace(/\/+$/, '')
  return url === base || url.startsWith(`${base}/`) || url.startsWith(`${base}?`)
}

export async function iniciarMocks(apiBaseUrl: string): Promise<void> {
  // Va primero: lo que no es de la API sigue de largo sin pasar por los demás handlers.
  const soloLaApi = http.all('*', ({ request }) =>
    esPeticionDeLaApi(request.url, apiBaseUrl, location.origin) ? undefined : passthrough(),
  )

  await setupWorker(soloLaApi, ...handlers).start({ onUnhandledFrame: 'bypass' })
}
