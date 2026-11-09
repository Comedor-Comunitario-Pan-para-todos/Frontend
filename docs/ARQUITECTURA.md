# Arquitectura del Frontend — SIG-CCPT

Guía de la estructura de la aplicación: cómo se organiza el código y qué va en
cada carpeta.

---

## 1. Enfoque

El frontend sigue una **arquitectura hexagonal (puertos y adaptadores)
organizada por módulo**:

* **Hexagonal:** la lógica de negocio está separada de React, del navegador y de
  la API. Las piezas externas se conectan por **puertos** (interfaces) y
  **adaptadores** (implementaciones de esas interfaces).
* **Por módulo:** cada área de negocio (`beneficiarios`, `turnos`,
  `inventario`…) es un módulo con sus propias capas.

---

## 2. Estructura de carpetas

```
src/
├── app/                          Arranque y composición de la aplicación
│   ├── layout/
│   ├── paginas/
│   ├── entorno.ts
│   ├── modulos.ts
│   ├── rutas.tsx
│   ├── queryClient.ts
│   ├── dependencias.ts
│   ├── contextoDependencias.ts
│   ├── DependenciasProvider.tsx
│   └── App.tsx
│
├── modules/                      Un módulo por área de negocio
│   └── <modulo>/
│       ├── domain/
│       ├── application/
│       │   └── ports/
│       ├── infrastructure/
│       │   ├── http/
│       │   └── dispositivo/
│       ├── ui/
│       └── index.ts              Solo si otro módulo lo necesita
│
├── shared/                       Piezas comunes a varios módulos
│   ├── domain/
│   ├── application/ports/
│   ├── infrastructure/
│   └── ui/
│
├── mocks/                        Respuestas simuladas con MSW (`pnpm dev:mock`)
├── index.css                     Tokens del sistema de diseño
└── main.tsx                      Punto de entrada

tests/                            Pruebas, con la misma estructura que src/
├── modules/<modulo>/...
├── shared/...
└── setup.ts                      Configuración global de pruebas
```

---

## 3. Qué contiene cada parte

### `app/` — Composición

Es el único lugar que conoce las implementaciones concretas y las conecta entre sí.

| Archivo | Contenido |
| :--- | :--- |
| `dependencias.ts` | Crea los adaptadores y, con ellos, los casos de uso de cada módulo. |
| `contextoDependencias.ts` | Context de React y hook `useDependencias`, con el que la interfaz recibe los casos de uso. |
| `DependenciasProvider.tsx` | Proveedor de ese context. |
| `rutas.tsx`, `modulos.ts` | Rutas de la aplicación y lista de módulos del menú. |
| `layout/`, `paginas/` | Layout con navegación y páginas generales (error, no encontrada, sin acceso). |
| `entorno.ts` | Lee y valida las variables de entorno. |
| `queryClient.ts` | Configuración de TanStack Query. |
| `App.tsx` | Reúne los proveedores y el enrutador. |

### `modules/<modulo>/` — Módulos de negocio

Cada módulo tiene las mismas capas:

#### `domain/` — Dominio

El núcleo del negocio. Código puro de TypeScript, sin React, sin llamadas a la
API y sin acceso al navegador.

* **Entidades:** los objetos del negocio y sus datos (`Beneficiario.ts`).
* **Objetos de valor:** datos pequeños con reglas propias (fechas, documentos).
* **Reglas de negocio:** funciones que deciden o calculan algo a partir de datos.
* **Errores de dominio:** clases de error con significado de negocio.

#### `application/` — Aplicación

Los casos de uso: lo que la persona usuaria puede hacer en el sistema.

* **Casos de uso:** un archivo por acción (`registrarX.ts`, `consultarX.ts`).
  Coordinan las reglas del dominio y hablan con el exterior solo a través de
  puertos.
* **`ports/`:** interfaces que describen lo que el caso de uso necesita del
  exterior (obtener datos, guardar, usar la cámara), sin decir cómo se hace.

#### `infrastructure/` — Infraestructura

Los adaptadores: implementaciones concretas de los puertos.

| Carpeta | Contenido |
| :--- | :--- |
| `http/` | Adaptadores que llaman a la API REST del backend y traducen sus respuestas (DTO) a tipos del dominio. |
| `dispositivo/` | Adaptadores de capacidades del navegador o del teléfono (cámara, archivos, compresión de imágenes). |

#### `ui/` — Interfaz

Todo lo que es React.

* **Componentes:** piezas visuales del módulo (`NombreComponente.tsx`).
* **Hooks:** conectan los componentes con los casos de uso (`useX.ts`).
* **Páginas:** pantallas completas que arma el módulo.

#### `index.ts` — API pública del módulo

Exporta lo que otros módulos pueden usar. Lo que no se exporta aquí es interno
del módulo. Se crea cuando otro módulo necesita algo de este, y expone solo eso.
`app/` no lo requiere: es el único lugar que importa adaptadores directamente.

### `shared/` — Compartido

Misma organización por capas que un módulo, pero con piezas que usan **dos o
más módulos**.

| Carpeta | Contenido |
| :--- | :--- |
| `domain/` | Tipos y objetos de valor comunes y errores base. |
| `application/ports/` | Puertos comunes (reloj, sesión). |
| `infrastructure/` | Adaptadores comunes (cliente HTTP, reloj del sistema). |
| `ui/` | Componentes base del sistema de diseño (botón, badge, modal, campo de formulario). |

### Archivos y carpetas de la raíz de `src/`

| Elemento | Contenido |
| :--- | :--- |
| `index.css` | Tokens del sistema de diseño (`@theme` de Tailwind CSS). |
| `main.tsx` | Monta la aplicación en el navegador. |

### `tests/` — Pruebas

Fuera de `src/`, con la misma estructura de carpetas: la prueba de
`src/modules/beneficiarios/domain/edad.ts` está en
`tests/modules/beneficiarios/domain/edad.test.ts`. `setup.ts` contiene la
configuración global de Vitest y Testing Library.

---

## 4. Relación entre capas

```
ui ──────────► application ──────────► domain
                    ▲
infrastructure ─────┘  (implementa los puertos)

app/ conecta infrastructure con application y lo entrega a ui
```

| Capa | Puede usar | No puede usar |
| :--- | :--- | :--- |
| `domain` | `shared/domain` | Ninguna otra capa, React, API, navegador |
| `application` | `domain`, `shared/domain`, `shared/application` | React, `infrastructure`, `ui` |
| `infrastructure` | `application/ports`, `domain`, `shared` (excepto `shared/ui`) | `ui` |
| `ui` | `application`, `domain`, `shared/ui`, `app/contextoDependencias.ts` | `infrastructure`, el resto de `app/` |
| `app` | Todo | — |

Entre módulos, solo se importa a través del `index.ts` de cada uno.

`contextoDependencias.ts` es la única parte de `app/` que puede importar la
interfaz. Solo conoce el tipo de los casos de uso, así que `ui` sigue sin
depender de Axios ni de ningún otro adaptador.

### Imports

* Dentro de la misma carpeta: ruta relativa (`./edad.ts`).
* Hacia cualquier otra carpeta de `src/`: alias `@/`
  (`@/shared/domain/FechaCalendario.ts`).

---

## 5. Nombres de archivos

| Tipo | Formato | Ejemplo |
| :--- | :--- | :--- |
| Componentes y clases | `PascalCase.tsx` / `PascalCase.ts` | `BeneficiarioCard.tsx`, `BeneficiarioHttpRepository.ts` |
| Funciones, tipos y casos de uso | `camelCase.ts` | `registrarBeneficiario.ts` |
| Puertos | `NombrePort.ts` / `NombreRepository.ts` | `CamaraPort.ts`, `BeneficiarioRepository.ts` |
| Hooks | `useNombre.ts` | `useBeneficiario.ts` |
| Pruebas | `nombre.test.ts(x)` en la ruta espejo dentro de `tests/` | `tests/modules/beneficiarios/application/registrarBeneficiario.test.ts` |

Los nombres del negocio van en español; los términos del patrón (`Repository`,
`Port`, `Adapter`, `Provider`) se dejan en inglés.
