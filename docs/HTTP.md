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
