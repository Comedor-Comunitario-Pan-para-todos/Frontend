import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { entorno } from '@/app/entorno.ts'
import './index.css'
import { App } from '@/app/App.tsx'

// La condición DEV deja los mocks por fuera del build de producción.
async function prepararMocks(): Promise<void> {
  if (import.meta.env.DEV && entorno.usarMocks) {
    const { iniciarMocks } = await import('@/mocks/browser.ts')
    await iniciarMocks()
  }
}

void prepararMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
