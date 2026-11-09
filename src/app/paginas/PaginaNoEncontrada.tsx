import { TiqueteDeAviso } from './TiqueteDeAviso.tsx'

export function PaginaNoEncontrada() {
  return (
    <TiqueteDeAviso
      codigo="404"
      titulo="No encontramos esta página"
      descripcion="Puede que la dirección esté mal escrita o que la página ya no exista."
    />
  )
}
