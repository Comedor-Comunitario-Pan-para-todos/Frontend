import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { rutas } from './rutas.tsx'

const enrutador = createBrowserRouter(rutas)

export function App() {
  return <RouterProvider router={enrutador} />
}
