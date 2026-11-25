# Turnos de la fila — SIG-CCPT

Contrato del frontend para entregar el número de turno en la reja (RF-03, HU-26 y
HU-27). Es una propuesta para Backend#32, que solo nombra las rutas: el frontend y
los mocks (`pnpm dev:mock`) ya la usan, pero el backend real todavía no las tiene.

---

## 1. Qué es

El voluntario de la puerta busca a la persona en el padrón y le entrega un número
consecutivo del día. La persona espera hasta que la llamen por ese número.

* **El número lo pone el servidor.** Empieza en 1 cada día y sube de uno en uno.
  Como varios voluntarios pueden atender la reja a la vez, solo el servidor puede
  asegurar que no se repita.
* **Un turno por persona al día** (HU-27). Si ya recibió uno, no se le da otro: se
  le muestra el que tenía, por si lo perdió.
* Todo turno nace «En espera» (HU-26). Cambiarlo cuando la persona recibe su ración
  no es parte de RF-03.
* Lo pueden usar Voluntario y Coordinadora (permiso `turnos.ver`). Presidente JAC y
  Donante reciben 403.

---

## 2. `GET /turnos?fecha=AAAA-MM-DD`

Devuelve los turnos entregados ese día. El frontend siempre pide el día de hoy en
la hora de Colombia (`America/Bogota`), no en UTC: a las 7 p. m. en Pereira ya es
el día siguiente en UTC.

```json
[
  {
    "id": "6f1c2a7e-0d4b-4a59-9b4e-2f7d1c3a8b90",
    "numero": 42,
    "beneficiario": {
      "id": "0b7d5c1e-3f2a-4c8d-9e6f-1a2b3c4d5e6f",
      "nombreCompleto": "Jorge Iván Cardona"
    },
    "entregadoEn": "2026-11-24T16:58:00.000Z",
    "estado": "EN_ESPERA"
  }
]
```

| Campo | Regla |
| :--- | :--- |
| `numero` | Entero ≥ 1, consecutivo del día. El frontend lo muestra con tres cifras: `#042`. |
| `beneficiario` | Solo el `id` y el nombre que se muestra en la fila. Nada de documento ni datos sensibles (RNF-07). |
| `entregadoEn` | Fecha y hora ISO 8601 con zona (`Z` u `-05:00`). |
| `estado` | Por ahora siempre `EN_ESPERA`. |

* Lista vacía si todavía no se ha entregado ningún turno.
* El orden no importa: el frontend pone primero el número más alto.
* 400 si falta `fecha` o no tiene la forma `AAAA-MM-DD`.

---

## 3. `POST /turnos`

Entrega el siguiente turno del día a una persona del padrón.

```json
{ "beneficiarioId": "0b7d5c1e-3f2a-4c8d-9e6f-1a2b3c4d5e6f" }
```

Respuesta **201** con el turno nuevo, con la misma forma de cada elemento de la
lista.

| Estado | Cuándo | Qué hace el frontend |
| :--- | :--- | :--- |
| **409** | La persona ya recibió turno hoy. | Vuelve a pedir la lista de hoy, busca el turno de la persona y se lo muestra con el aviso «ya tiene turno hoy». No hace falta que el 409 traiga el turno. |
| **422** | La jornada de hoy no está abierta o ya se entregaron todas las raciones (`JornadaAtencion`). | Muestra «No se pueden entregar turnos ahora. Avísele a la coordinadora.» y quita el botón. No ofrece reintentar. |
| 400 | Falta `beneficiarioId`, no es un UUID o llega un campo que no conoce. | Error general. |
| 404 | La persona no está en el padrón. | Error general. |
| 5xx o sin conexión | — | Constancia de fallo con «Reintentar» (`DESIGN.md`, 6.1). |

El 409 y el 422 se distinguen **solo por el código de estado**, así que no deben
usarse para otros casos en esta ruta.

---

## 4. Cómo lo usa el frontend

| Pieza | Dónde |
| :--- | :--- |
| Pantalla, en `/turnos` (menú «Turnos») | `src/modules/turnos/ui/fila/` |
| Número con tres cifras, orden de la lista y turno de una persona | `src/modules/turnos/domain/turnosDelDia.ts` |
| Traducción del 409 y el 422 a errores del negocio | `src/modules/turnos/infrastructure/http/TurnosHttpRepository.ts` |

* La búsqueda es la misma del padrón (`usePadron` y `BuscadorBeneficiarios`, que
  exporta `src/modules/beneficiarios/index.ts`). El documento se ve oculto para el
  voluntario, como en el resto de la app.
* En los resultados, quien ya tiene turno hoy aparece marcado con su número antes
  de elegirlo.
* Al entregar el turno se ve el tiquete con el número en grande y la Constancia
  verde. La lista se actualiza de una vez y luego se vuelve a pedir, para ver
  también los turnos que entregaron otros voluntarios.
* «Buscar a otra persona» limpia la búsqueda y deja el cursor en el buscador.
* El turno repetido se muestra en rojo (`danger`), como pide `DESIGN.md`.

---

## 5. Mocks

`src/mocks/turnos.ts` guarda los turnos en memoria (al recargar vuelven al inicio)
y usa las personas de `src/mocks/beneficiarios.ts`.

* Rosa Martínez de Osorio, José Aníbal Ospina Giraldo y Luz Dary Cardona Marín ya
  tienen los turnos #001, #002 y #003 de hoy.
* Entregarle turno a Pedro Pablo Zapata responde 422, para probar la jornada no
  disponible.
* La primera vez que se le entrega turno a Gloria Inés Henao Ríos falla con 500,
  para probar «Reintentar». El segundo intento funciona.
