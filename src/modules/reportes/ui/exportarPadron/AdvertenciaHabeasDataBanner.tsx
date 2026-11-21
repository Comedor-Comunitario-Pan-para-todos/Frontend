import { Alerta } from '@/shared/ui/Alerta.tsx'

/** Aviso permanente de Habeas Data sobre el archivo (RNF-08, RNF-11, Ley 1581 de 2012). */
export function AdvertenciaHabeasDataBanner() {
  return (
    <Alerta tipo="privacidad" titulo="Datos personales confidenciales">
      El archivo solo incluye a quienes autorizaron compartir sus datos con la Alcaldía (Ley 1581 de
      2012). Cada descarga queda registrada con su nombre, la fecha y la hora.
    </Alerta>
  )
}
