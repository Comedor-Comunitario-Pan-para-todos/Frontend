import { BookOpen, Droplets, HeartHandshake, TriangleAlert, Utensils } from 'lucide-react'

interface IconoTemaProps {
  readonly idModulo: string
  readonly className: string
}

/** Si la coordinadora agrega un tema nuevo, se muestra con un libro abierto. */
export function IconoTema({ idModulo, className }: IconoTemaProps) {
  switch (idModulo) {
    case 'higiene':
      return <Droplets aria-hidden="true" className={className} />
    case 'trato-digno':
      return <HeartHandshake aria-hidden="true" className={className} />
    case 'alimentos':
      return <Utensils aria-hidden="true" className={className} />
    case 'emergencias':
      return <TriangleAlert aria-hidden="true" className={className} />
    default:
      return <BookOpen aria-hidden="true" className={className} />
  }
}
