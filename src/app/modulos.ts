import {
  ChartColumn,
  HandHeart,
  House,
  Package,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Permiso } from '@/modules/auth/domain/permisos.ts'

interface Modulo {
  readonly ruta: string
  readonly nombre: string
  readonly permiso: Permiso
  readonly Icono: LucideIcon
}

export const MODULOS: readonly Modulo[] = [
  { ruta: '/', nombre: 'Inicio', permiso: 'inicio.ver', Icono: House },
  { ruta: '/turnos', nombre: 'Turnos', permiso: 'turnos.ver', Icono: Ticket },
  { ruta: '/beneficiarios', nombre: 'Beneficiarios', permiso: 'beneficiarios.ver', Icono: Users },
  { ruta: '/inventario', nombre: 'Inventario', permiso: 'inventario.ver', Icono: Package },
  { ruta: '/aportes', nombre: 'Aportes', permiso: 'aportes.ver', Icono: HandHeart },
  { ruta: '/reportes', nombre: 'Reportes', permiso: 'reportes.ver', Icono: ChartColumn },
]
