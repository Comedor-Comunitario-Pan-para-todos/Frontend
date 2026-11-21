import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDependencias } from '@/app/contextoDependencias.ts'
import type { GuiaInduccion } from '@/modules/induccion/domain/GuiaInduccion.ts'
import { conLectura } from '@/modules/induccion/domain/avanceInduccion.ts'
import { CLAVE_GUIA } from '@/modules/induccion/ui/avance/useGuiaInduccion.ts'

export interface Lectura {
  readonly idModulo: string
  readonly leido: boolean
}

/**
 * Marca un tema en pantalla al instante y lo guarda. Si el guardado falla, la casilla vuelve a
 * como estaba: nunca se muestra como guardado algo que no lo está.
 */
export function useMarcarLectura() {
  const { registrarLecturaModulo } = useDependencias()
  const consultas = useQueryClient()

  return useMutation({
    mutationFn: ({ idModulo, leido }: Lectura) => registrarLecturaModulo(idModulo, leido),
    onMutate: async ({ idModulo, leido }) => {
      await consultas.cancelQueries({ queryKey: CLAVE_GUIA })
      const anterior = consultas.getQueryData<GuiaInduccion>(CLAVE_GUIA)
      if (anterior) {
        consultas.setQueryData<GuiaInduccion>(CLAVE_GUIA, {
          ...anterior,
          progreso: conLectura(anterior.progreso, idModulo, leido),
        })
      }
      return { anterior }
    },
    onError: (_error, _lectura, contexto) => {
      if (contexto?.anterior) consultas.setQueryData(CLAVE_GUIA, contexto.anterior)
    },
    onSuccess: (progreso) => {
      consultas.setQueryData<GuiaInduccion>(CLAVE_GUIA, (guia) => guia && { ...guia, progreso })
    },
  })
}
