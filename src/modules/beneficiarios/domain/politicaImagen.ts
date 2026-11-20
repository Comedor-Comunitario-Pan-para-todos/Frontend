import type { PoliticaVigente } from './politicaVigente.ts'

export const FINALIDAD_USO_IMAGEN = 'USO_IMAGEN'

export const POLITICA_IMAGEN: PoliticaVigente = {
  nombre: 'Política de uso de imagen',
  version: 1,
  finalidad: FINALIDAD_USO_IMAGEN,
  resumen:
    'Las fotos en las que se le reconozca solo se toman si usted lo autoriza. Sin su autorización, no hay fotos.',
  puntos: [
    {
      titulo: 'Para qué',
      texto: 'Para mostrar a la Junta de Acción Comunal y a los donantes cómo funciona el comedor.',
    },
    {
      titulo: 'Es voluntario',
      texto: 'Decir que no, no le quita la ración ni cambia la forma en que lo atendemos.',
    },
    {
      titulo: 'Puede retirarla',
      texto:
        'Puede retirar esta autorización cuando quiera, hablando con la coordinación del comedor.',
    },
    {
      titulo: 'Niños, niñas y adolescentes',
      texto: 'Para una persona menor de edad se necesita además la autorización de su tutor.',
    },
  ],
}
