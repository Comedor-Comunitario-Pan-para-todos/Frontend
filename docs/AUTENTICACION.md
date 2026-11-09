# Autenticación — SIG-CCPT

Cómo el frontend inicia, conserva y cierra la sesión. El cliente HTTP y sus
errores están en [HTTP.md](./HTTP.md).

---

## 1. Contrato con el backend

| Petición | Cuerpo o encabezado | Respuesta |
| :--- | :--- | :--- |
| `POST /auth/login` | `{ email, password }` | `{ accessToken, usuario: { id, email, nombreCompleto, rol } }` |
| `GET /auth/me` | `Authorization: Bearer <token>` | `{ id, email, nombreCompleto, rol, activo }` |

* **Roles:** `COORDINADORA`, `PRESIDENTE_JAC`, `VOLUNTARIO`, `DONANTE`. Un rol
  que el frontend no conozca se trata como respuesta inválida.
* **El rol no viaja en el token.** Solo se conoce por la respuesta del login o
  de `/auth/me`.
* **El backend no tiene** renovación de token ni endpoint de cierre de sesión.
  Cerrar sesión es borrar el token en el navegador.

---

## 2. Piezas

| Archivo | Papel |
| :--- | :--- |
| `modules/auth/domain/Usuario.ts` | Roles y datos del usuario. |
| `modules/auth/application/iniciarSesion.ts` | Autentica y guarda el token. |
| `modules/auth/application/restaurarSesion.ts` | Decide si hay sesión al abrir la app. |
| `modules/auth/application/cerrarSesion.ts` | Borra el token. |
| `modules/auth/infrastructure/http/AuthHttpRepository.ts` | Llama a la API y valida con Zod. |
| `modules/auth/infrastructure/dispositivo/SesionLocalStorage.ts` | Guarda el token. |
| `app/dependencias.ts` | Conecta los adaptadores con los casos de uso. |

---

## 3. Restaurar la sesión

Al abrir o recargar la app solo sobrevive el token. `restaurarSesion` pregunta
al servidor quién es el usuario:

| Situación | Resultado | La app muestra |
| :--- | :--- | :--- |
| No hay token | `null`, sin llamar al servidor | Login |
| `/auth/me` responde bien | El `Usuario` | La aplicación |
| `/auth/me` responde 401 | Borra el token y devuelve `null` | Login |
| Falla la red o el servidor | Conserva el token y lanza el error | Opción de reintentar |

Un fallo de red no invalida la sesión: nadie dijo que el token sea malo, solo
que no se pudo preguntar. Así un voluntario sin señal no tiene que volver a
escribir su clave.

---

## 4. El token

* **Se guarda en `localStorage`**, solo el token. Una cookie `httpOnly` depende
  de que el backend la emita, y hoy responde el token en el cuerpo. Guardarlo
  solo en memoria obligaría a escribir la clave en cada recarga, en plena fila.
* **Si el navegador bloquea `localStorage`**, el token queda en memoria hasta
  recargar.
* **El frontend no revisa el vencimiento (`exp`).** Compararlo con el reloj del
  teléfono sacaría de la app a quien tenga la fecha adelantada, aunque su token
  siga vigente. El servidor decide y responde 401.
* **Un 401 durante el uso** borra el token y termina la sesión, solo si la
  petición usó el token vigente (ver "Interceptores de sesión" en
  [HTTP.md](./HTTP.md)).

---

## 5. Cerrar sesión

El backend no tiene endpoint de cierre: salir ocurre solo en el navegador.

* Borra el token y deja el usuario en `null`, lo que lleva al login.
* Vacía las consultas y mutaciones en memoria: quien use después ese teléfono
  no ve datos del anterior.
* No recuerda la pantalla en la que estaba: el siguiente ingreso va al inicio.

---

## 6. Cuando la sesión termina sola

| Situación | La app hace |
| :--- | :--- |
| El servidor rechaza el token (401) | Vacía los datos en memoria, lleva al login con el aviso "Su sesión terminó" y, al volver a entrar, regresa a la pantalla donde estaba |
| Se cierra la sesión en otra pestaña | Sale también de esta, sin recordar la pantalla |
| Se inicia sesión en otra pestaña | Vacía los datos y pregunta de nuevo quién es, porque puede ser otra persona |

Lo escrito en un formulario sin enviar se pierde al terminar la sesión.

---

## 7. Permisos por rol

La matriz vive en `modules/auth/domain/permisos.ts` y es lo único que hay que
tocar para cambiar quién ve qué.

| Módulo | Coordinadora | Presidente JAC | Voluntario | Donante |
| :--- | :---: | :---: | :---: | :---: |
| Inicio | Sí | Sí | Sí | Sí |
| Turnos | Sí | No | Sí | No |
| Beneficiarios | Sí | No | Sí | No |
| Inventario | Sí | No | Sí | No |
| Aportes | No | No | No | Sí |
| Reportes | Sí | Sí | No | Sí |

Aportes es la vista del donante. La recepción de donaciones de la Coordinadora
se ubicará cuando se construya ese módulo.

* **`ConPermiso`** muestra su contenido solo si el rol tiene el permiso. Sirve
  para rutas, secciones y botones.
* **El menú** se filtra con la misma matriz: nadie ve un módulo al que no puede
  entrar.
* **Quien fuerza la dirección** ve la página 403 dentro de la app; la URL no
  cambia y el menú sigue disponible.
* **Esto solo ordena la interfaz.** Proteger los datos y registrar el intento en
  la bitácora (HU-02) le corresponde al backend, que debe responder 403.

---

## 8. Probar sin backend

```bash
pnpm dev:mock
```

MSW responde en el navegador con el mismo formato de NestJS. La clave de todos
los usuarios es `Comedor123*`.

| Correo | Resultado |
| :--- | :--- |
| `coordinadora@comedor.test` | Rol `COORDINADORA` |
| `presidente@comedor.test` | Rol `PRESIDENTE_JAC` |
| `voluntario@comedor.test` | Rol `VOLUNTARIO` |
| `donante@comedor.test` | Rol `DONANTE` |
| `inactivo@comedor.test` | 401: usuario inactivo |
| `caida@comedor.test` | 500: servidor caído |

Los handlers están en `src/mocks/handlers.ts`. Ni ellos ni
`mockServiceWorker.js` llegan al build de producción.
