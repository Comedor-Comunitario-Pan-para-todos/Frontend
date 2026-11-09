import { Eye, EyeOff } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { CampoTexto } from './CampoTexto.tsx'

type CampoContrasenaProps = Omit<ComponentProps<typeof CampoTexto>, 'type' | 'accion'>

export function CampoContrasena(props: CampoContrasenaProps) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <CampoTexto
      {...props}
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      accion={
        <button
          type="button"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible((actual) => !actual)}
          className="absolute inset-y-0 right-0 flex w-touch items-center justify-center rounded-md text-ink-secondary transition duration-150 ease-press hover:text-ink"
        >
          <Icono aria-hidden="true" className="size-5" />
        </button>
      }
    />
  )
}
