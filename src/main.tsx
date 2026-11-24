import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { entorno } from '@/app/entorno.ts'
import './index.css'
import { App } from '@/app/App.tsx'

async function prepararMocks(): Promise<void> {
  const permiteMocks = import.meta.env.DEV || import.meta.env.MODE === 'demo'
  if (permiteMocks && entorno.usarMocks) {
    const { iniciarMocks } = await import('@/mocks/browser.ts')
    await iniciarMocks(entorno.apiBaseUrl)
  }
}

void prepararMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
