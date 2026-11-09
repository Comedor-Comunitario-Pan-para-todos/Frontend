# Comunicación con la API — SIG-CCPT

Cómo se configura el frontend para hablar con el backend: variables de
entorno, proxy de desarrollo y modos de ejecución.

---

## 1. Variables de entorno

Se definen en archivos `.env.*` de la raíz. Las que llevan el prefijo `VITE_`
llegan al código del navegador; las demás solo las lee `vite.config.ts` y
**nunca entran al bundle**.

| Variable | Valor por defecto | Para qué sirve |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | Base de todas las peticiones a la API. Ruta relativa (recomendado) o URL completa. |
| `VITE_USAR_MOCKS` | `false` | `true` para que las peticiones las responda MSW en el navegador, sin backend. |
| `API_PROXY_TARGET` | — | Backend al que el proxy de desarrollo reenvía las peticiones. |
| `API_PROXY_QUITAR_PREFIJO` | `true` | Quita `/api` antes de reenviar, mientras el backend no tenga ese prefijo global. |

`.env.example` documenta todas las variables.

### Validación al arrancar

`src/app/entorno.ts` valida las variables `VITE_` con Zod antes de montar la
aplicación. Si algo está mal, la app no arranca y el error dice qué corregir:

```
Configuración de entorno inválida:
  - VITE_USAR_MOCKS: debe ser "true" o "false"
```

Reglas:

* `VITE_API_BASE_URL` debe empezar por `/` o ser una URL completa. Se le quita la barra final.
* `VITE_USAR_MOCKS` solo acepta `"true"` o `"false"`.
* Un build de producción con `VITE_USAR_MOCKS=true` no arranca: nunca se despliega con datos falsos.

Solo `src/app/` lee el entorno. El resto del código recibe los valores por
parámetro (por ejemplo, el cliente HTTP recibe su URL base al crearse).

---

## 2. Proxy de desarrollo

En `pnpm dev`, el navegador llama siempre a la misma dirección de la app
(`/api/...`) y Vite reenvía la petición al backend:

```
navegador ──► localhost:5173/api/auth/me ──► proxy de Vite ──► localhost:3000/auth/me
```

* El navegador ve un solo origen, así que **no hace falta CORS** en desarrollo.
* Con `API_PROXY_QUITAR_PREFIJO=true` el proxy quita `/api` antes de reenviar.
  Cuando el backend tenga el prefijo global `/api`, se cambia a `false`.
* Si `VITE_API_BASE_URL` es una URL completa, no hay proxy: el navegador llama
  directo a esa URL (y el backend debe permitir CORS para ese origen).
* Si `API_PROXY_TARGET` no es una URL válida, el servidor de desarrollo no arranca.

### Apuntar a otro backend

Sin tocar archivos versionados, crea `.env.development.local` (está en
`.gitignore`) con tu destino:

```
API_PROXY_TARGET=https://staging.comedor.org
```

---

## 3. Modos de ejecución

| Comando | Archivos que carga | Comportamiento |
| :--- | :--- | :--- |
| `pnpm dev` | `.env`, `.env.development`, `.env.development.local` | Proxy hacia `API_PROXY_TARGET` (por defecto el backend local en el puerto 3000). |
| `pnpm build` | `.env`, `.env.production`, `.env.production.local` | Sin proxy ni mocks: el proxy de Vite solo existe en desarrollo. En producción, o el servidor web reenvía `/api` al backend (mismo dominio), o se construye con `VITE_API_BASE_URL` apuntando a la URL del backend (dominios distintos, con CORS en el backend). |

Los archivos `*.local` tienen prioridad y no se versionan.

---

## 4. Registro en consola

`console` está prohibido en el código (`no-console` en `.oxlintrc.json`):
`pnpm lint` falla si queda alguno. Se puede usar mientras se depura, pero se
borra antes del commit, para no exponer tokens ni datos personales (RNF-09).
Si un caso lo necesita de verdad:

```ts
// oxlint-disable-next-line no-console -- motivo
```

---

## 5. Cliente HTTP

Vive en `src/shared/infrastructure/http/`:

| Archivo | Responsabilidad |
| :--- | :--- |
| `HttpClient.ts` | Contrato que usan los adaptadores: `get`, `post`, `patch` y `delete`. |
| `AxiosHttpClient.ts` | Implementación con Axios: URL base, tiempo límite (15 s), envío y validación. |
| `interceptoresSesion.ts` | Agrega el token y decide si un 401 cierra la sesión. |
| `normalizarError.ts` | Convierte cualquier falla en un `ErrorApi`. |

`HttpClient` es un contrato interno de infraestructura. Los casos de uso no lo
conocen: ellos hablan con los puertos de su módulo (`AuthRepository`,
`BeneficiarioRepository`), y son los adaptadores de esos puertos los que usan
`HttpClient`.

### Uso desde un adaptador

```ts
const esquemaUsuario = z.object({ id: z.string(), email: z.string() })

class UsuarioHttpRepository implements UsuarioRepository {
  readonly #http: HttpClient

  constructor(http: HttpClient) {
    this.#http = http
  }

  buscar(texto: string, signal?: AbortSignal) {
    return this.#http.get('/usuarios', {
      esquema: z.array(esquemaUsuario),
      params: { busqueda: texto },
      signal,
    })
  }
}
```

| Opción | Para qué |
| :--- | :--- |
| `esquema` | Valida la respuesta y define su tipo. Sin esquema, la respuesta llega como `unknown`. Si no cumple, se lanza `respuesta-invalida`. |
| `params` | Arma la query string. Los valores `undefined` se descartan. |
| `signal` | Cancela la petición. TanStack Query entrega el suyo. |
| `omitirSesion` | La petición no pertenece a la sesión: no envía el token y su 401 no cierra la sesión. La usa el login. |

Las escrituras no se reintentan automáticamente: reenviar un `POST /turnos`
podría emitir dos turnos. La interfaz ofrece un botón para reintentar.

### Interceptores de sesión

* **Petición:** agrega `Authorization: Bearer <token>` si hay token.
* **Respuesta:** convierte el error en `ErrorApi` y, si es un 401 de la sesión
  actual, llama a `alExpirarSesion`.

Un 401 solo cierra la sesión si la petición salió con el **token vigente**.
Como `alExpirarSesion` debe borrar el token, cuando llegan varios 401 a la vez
solo el primero avisa.

---

## 6. Errores

Toda falla del cliente llega como un `ErrorApi`
(`src/shared/application/errores/ErrorApi.ts`). El resto de la aplicación
pregunta por `error.tipo`, no por códigos HTTP: `estado` se conserva solo como
información.

| Tipo | Cuándo ocurre |
| :--- | :--- |
| `red` | No hubo respuesta del servidor. |
| `tiempo-agotado` | Pasó el tiempo límite. |
| `cancelada` | Se canceló la petición. |
| `validacion` | 400 o 422. |
| `no-autenticado` | 401. |
| `sin-permiso` | 403. No cierra la sesión. |
| `no-encontrado` | 404. |
| `conflicto` | 409. |
| `servidor` | 5xx. |
| `respuesta-invalida` | La respuesta no cumple el esquema. |
| `desconocido` | Cualquier otro caso. |

### Mensajes para la persona usuaria

`mensajeDeError(error)` (`src/shared/ui/mensajeDeError.ts`) devuelve el texto en
español de cualquier error capturado. El texto del servidor solo se muestra en
`no-autenticado`, `conflicto` y `validacion`; en los demás tipos, nunca.

### Errores de negocio

Si un error tiene significado propio para un módulo, su adaptador lo traduce a
un error de dominio. Por ejemplo, un `conflicto` al registrar se convierte en
`BeneficiarioDuplicado`.

---

## 7. Consultas con TanStack Query

El cliente se configura en `src/app/queryClient.ts`. La caché vive solo en
memoria: al recargar la página los datos se piden de nuevo (RNF-01).

| Ajuste | Valor | Motivo |
| :--- | :--- | :--- |
| Reintentos de lecturas | 2, solo `red` y `servidor` | Son fallos pasajeros. Un 403 o un 404 no cambia al repetirlo, y un `tiempo-agotado` ya esperó 15 s. |
| Reintentos de escrituras | Ninguno | Repetir un guardado podría duplicar el registro. La persona decide con "Reintentar". |
| Vigencia de los datos | 30 s | Evita repetir la misma petición al cambiar de pantalla en teléfonos de gama baja. |
| `networkMode` | `always` | Sin conexión la petición falla de inmediato. El modo por defecto la deja en pausa y enviaría el guardado al volver la red, y la app no tiene colas de sincronización. |

---

## 8. Pruebas

Las pruebas interceptan la red con MSW (`tests/mocks/servidor.ts`), así que
ejercitan Axios, los interceptores y la validación reales. Cada prueba define
sus respuestas con `servidor.use(...)`. Una petición sin respuesta definida
hace saltar un error de MSW.
