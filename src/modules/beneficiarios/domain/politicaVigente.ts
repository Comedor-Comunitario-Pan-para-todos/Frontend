export interface PoliticaDeDatos {
  readonly version: number
  readonly finalidad: string
}

export interface PuntoDePolitica {
  readonly titulo: string
  readonly texto: string
}
export interface PoliticaVigente extends PoliticaDeDatos {
  readonly nombre: string
  readonly resumen: string
  readonly puntos: readonly PuntoDePolitica[]
}

export const POLITICA_VIGENTE: PoliticaVigente = {
  nombre: 'Política de datos',
  version: 1,
  finalidad: 'ATENCION_ALIMENTARIA',
  resumen:
    'Sus datos se usan solo para darle la ración y organizar la atención del comedor. No se usan para nada más.',
  puntos: [
    {
      titulo: 'Para qué',
      texto:
        'Para saber quién recibe la ración, organizar los turnos y rendir cuentas de la entrega de alimentos.',
    },
    {
      titulo: 'Qué datos',
      texto:
        'Su nombre, fecha de nacimiento y barrio. El documento, el teléfono y la clasificación del RUI o el Sisbén solo se piden si un trámite los necesita.',
    },
    {
      titulo: 'Es voluntario',
      texto:
        'Puede no dar los datos que no quiera dar, en especial los sensibles y los de niños, niñas y adolescentes. Eso no le quita la ración.',
    },
    {
      titulo: 'Sus derechos',
      texto:
        'Puede conocer, corregir o pedir que se borren sus datos, y retirar esta autorización cuando quiera, hablando con la coordinación del comedor.',
    },
    {
      titulo: 'Quién responde',
      texto: 'El Comedor Comunitario Pan para Todos, que guarda sus datos de forma segura.',
    },
  ],
}
