import { Boton } from '@/shared/ui/Boton.tsx'

function App() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-content flex-col justify-center gap-6 px-gutter py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-pill bg-primary-soft px-3 py-1 font-mono text-label font-semibold text-primary">
          SIG-CCPT
        </span>
        <h1 className="text-heading font-semibold text-ink">Comedor Comunitario Pan para Todos</h1>
        <p className="text-body text-ink-secondary">
          Base del sistema de diseño: colores, tipografía, tamaños y breakpoints centralizados en{' '}
          <code className="font-mono text-label">src/index.css</code>.
        </p>
      </header>

      <section className="flex flex-col items-center gap-1 rounded-lg border border-hairline bg-surface p-6 shadow-ticket">
        <span className="text-label font-medium text-ink-muted">Turno</span>
        <span className="font-mono text-ticket font-bold text-ink">#042</span>
        <span className="mt-2 rounded-pill bg-success-soft px-3 py-1 text-label font-medium text-success">
          Comensal habilitado
        </span>
      </section>

      <Boton>Confirmar y emitir turno</Boton>
      <Boton variante="secundario">Cancelar</Boton>
      <Boton cargando>Guardando</Boton>
      <Boton disabled>No disponible</Boton>
    </main>
  )
}

export default App
