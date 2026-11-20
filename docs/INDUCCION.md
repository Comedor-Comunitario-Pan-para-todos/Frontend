# Inducción de voluntarios — SIG-CCPT

Contrato del frontend para la guía de inducción de voluntarios nuevos (RF-15). Es
una propuesta para Backend#56, que solo nombra las rutas: el frontend y los mocks
(`pnpm dev:mock`) ya la usan, pero el backend real todavía no las tiene.

---

## 1. Qué es

Una guía corta con 4 temas (higiene, trato digno, manejo de alimentos y
emergencias) que el voluntario lee en el celular antes de su primer turno. Cada
tema termina en la casilla «Ya leí este tema», y el avance se guarda para que pueda
seguir otro día.

* **Los temas** los define el comedor y son los mismos para todos.
* **El avance** es de cada persona: el servidor lo toma de la sesión, así que el
  frontend no envía quién es el voluntario.
* Lo pueden usar Voluntario y Coordinadora (permiso `induccion.ver`). Presidente
  JAC y Donante reciben 403.

---

## 2. `GET /induccion`

Devuelve los temas y el avance de quien tiene la sesión abierta.

```json
{
  "modulos": [
    {
      "id": "higiene",
      "orden": 1,
      "titulo": "Higiene antes de servir",
      "minutosLectura": 2,
      "puntos": [
        "Lávese las manos con agua y jabón por 40 segundos al llegar…",
        "Póngase gorro y delantal, y venga con zapatos cerrados."
      ]
    }
  ],
  "progreso": { "modulosLeidos": ["higiene"] }
}
```

| Campo | Regla |
| :--- | :--- |
| `id` | Texto estable que no cambia aunque se edite el título: el avance se guarda con él. |
| `orden` | Entero. El frontend muestra los temas ordenados por este número. |
| `minutosLectura` | Entero ≥ 0. Con la suma se arma «unos 9 minutos». |
| `puntos` | Lista de frases cortas, en lenguaje cotidiano y en trato de usted, como el resto de la app. |
| `modulosLeidos` | `id` de los temas que la persona marcó. Lista vacía si no ha leído ninguno. |

* Si la guía no tiene temas, `modulos` llega vacío y la pantalla muestra
  «Todavía no hay temas».
* Un `id` en `modulosLeidos` que ya no está en la guía no cuenta para el avance.
* Los campos de más (fechas de creación, por ejemplo) se ignoran.

---

## 3. `PATCH /induccion/progreso`

Marca o desmarca un tema como leído.

```json
{ "moduloId": "trato-digno", "leido": true }
```

Respuesta 200 con el avance tal como quedó guardado:

```json
{ "modulosLeidos": ["higiene", "trato-digno"] }
```

* Marcar dos veces el mismo tema no lo repite: si la respuesta se perdió por la
  red, reintentar es seguro.
* `"leido": false` lo desmarca.
* 400 si falta `moduloId`, si `leido` no es verdadero o falso, o si llega un campo
  que no conoce.
* 404 si el tema no existe.

---

## 4. Cómo lo usa el frontend

| Pieza | Dónde |
| :--- | :--- |
| Pantalla de la guía, en `/induccion` (no está en el menú) | `src/modules/induccion/ui/guia/` |
| Tarjeta de acceso en el Inicio mientras falte algún tema | `src/modules/induccion/ui/acceso/` |
| Cálculo del avance y del tema que toca leer | `src/modules/induccion/domain/avanceInduccion.ts` |

* Al entrar se abre el primer tema, en orden, que falta por leer.
* La casilla se marca en pantalla apenas se toca y luego se guarda. Si el guardado
  falla, vuelve a como estaba, el tema sigue abierto y aparece la Constancia de fallo
  con «Reintentar» (`DESIGN.md`, 6.1): nunca se ve como guardado algo que no lo está.
* Cuando se guarda un tema, se abre solo el siguiente que falta.
* Los temas `higiene`, `trato-digno`, `alimentos` y `emergencias` tienen ícono
  propio. Un tema nuevo con otro `id` se muestra con un libro abierto.
* La tarjeta del Inicio desaparece cuando la persona leyó todos los temas. Si la
  guía no carga, la tarjeta no aparece y el resto del Inicio sigue funcionando.

---

## 5. Mocks

`src/mocks/induccion.ts` tiene el texto de los 4 temas y guarda el avance en
memoria por usuario (al recargar vuelve al inicio).

* El voluntario de prueba empieza con «Higiene antes de servir» ya leído.
* La primera vez que se marca «Manejo seguro de los alimentos» el guardado falla
  con 500, para probar «Reintentar». El segundo intento funciona.
