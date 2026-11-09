import { TiqueteDeAviso } from './TiqueteDeAviso.tsx'

export function PaginaSinAcceso() {
  return (
    <TiqueteDeAviso
      codigo="403"
      titulo="Esta sección no está habilitada para su perfil"
      descripcion="Si necesita entrar, comuníquese con la coordinación."
    />
  )
}
