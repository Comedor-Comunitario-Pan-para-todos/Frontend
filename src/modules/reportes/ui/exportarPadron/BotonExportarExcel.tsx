import { Download } from 'lucide-react'
import { Boton } from '@/shared/ui/Boton.tsx'

interface BotonExportarExcelProps {
  readonly generando: boolean
  readonly deshabilitado: boolean
  alPresionar(): void
}

export function BotonExportarExcel({
  generando,
  deshabilitado,
  alPresionar,
}: BotonExportarExcelProps) {
  return (
    <Boton cargando={generando} disabled={deshabilitado} onClick={alPresionar} className="w-full">
      {!generando && <Download aria-hidden="true" className="size-5 shrink-0" />}
      {generando ? 'Generando archivo…' : 'Descargar Excel (.xlsx)'}
    </Boton>
  )
}
