import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampoSoporte } from '@/modules/beneficiarios/ui/tutor/CampoSoporte.tsx'

const FOTO = new File([new Uint8Array(350 * 1024)], 'papel.jpg', { type: 'image/jpeg' })
const PDF = new File([new Uint8Array(1.25 * 1024 * 1024)], 'papel.pdf', {
  type: 'application/pdf',
})

function campo(props: Partial<Parameters<typeof CampoSoporte>[0]> = {}) {
  const alElegir = vi.fn()
  const alQuitar = vi.fn()
  render(<CampoSoporte archivo={null} alElegir={alElegir} alQuitar={alQuitar} {...props} />)
  return { alElegir, alQuitar }
}

describe('CampoSoporte', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:vista-previa'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('deja tomar una foto con la cámara de atrás del teléfono', async () => {
    const { alElegir } = campo()
    const camara = screen.getByLabelText('Tomar foto')

    expect(camara).toHaveAttribute('capture', 'environment')
    expect(camara).toHaveAttribute('accept', 'image/*')
    await userEvent.upload(camara, FOTO)

    expect(alElegir).toHaveBeenCalledWith(FOTO)
  })

  it('deja elegir un PDF, JPG o PNG ya guardado', async () => {
    const { alElegir } = campo()
    const archivo = screen.getByLabelText('Elegir archivo')

    expect(archivo).not.toHaveAttribute('capture')
    expect(archivo).toHaveAttribute('accept', 'application/pdf,image/jpeg,image/png')
    await userEvent.upload(archivo, PDF)

    expect(alElegir).toHaveBeenCalledWith(PDF)
  })

  it('avisa de nuevo si se elige otra vez el mismo archivo', async () => {
    const { alElegir } = campo()

    await userEvent.upload(screen.getByLabelText('Elegir archivo'), PDF)
    await userEvent.upload(screen.getByLabelText('Elegir archivo'), PDF)

    expect(alElegir).toHaveBeenCalledTimes(2)
  })

  it('explica qué se puede adjuntar', () => {
    campo()

    expect(
      screen.getByRole('group', { name: 'Papel firmado por el tutor' }),
    ).toHaveAccessibleDescription('Tómele una foto al papel o elija un PDF. Hasta 5 MB.')
  })

  it('mientras prepara la foto, lo dice y no deja elegir otra', () => {
    campo({ preparando: true })

    expect(screen.getByRole('status')).toHaveTextContent('Preparando la foto…')
    expect(screen.queryByLabelText('Tomar foto')).not.toBeInTheDocument()
  })

  it('muestra la foto elegida con su nombre y lo que pesa', () => {
    campo({ archivo: FOTO })

    expect(screen.getByRole('img', { name: 'Vista previa del papel firmado' })).toHaveAttribute(
      'src',
      'blob:vista-previa',
    )
    expect(screen.getByText('papel.jpg')).toBeInTheDocument()
    expect(screen.getByText('350 KB')).toBeInTheDocument()
  })

  it('un PDF se muestra con su nombre, sin vista previa', () => {
    campo({ archivo: PDF })

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('papel.pdf')).toBeInTheDocument()
    expect(screen.getByText('1,3 MB')).toBeInTheDocument()
  })

  it('libera la URL temporal de la foto al cambiarla', () => {
    const { unmount } = render(
      <CampoSoporte archivo={FOTO} alElegir={vi.fn()} alQuitar={vi.fn()} />,
    )

    unmount()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:vista-previa')
  })

  it('deja cambiar el soporte elegido', async () => {
    const { alQuitar } = campo({ archivo: FOTO })

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar el soporte' }))

    expect(alQuitar).toHaveBeenCalled()
  })

  it('muestra el error en lugar de la ayuda y marca el grupo como inválido', () => {
    campo({ error: 'El soporte no puede pesar más de 5 MB.' })
    const grupo = screen.getByRole('group', { name: 'Papel firmado por el tutor' })

    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('El soporte no puede pesar más de 5 MB.')
  })
})
