# Consentimientos — SIG-CCPT

Contrato del frontend para guardar el consentimiento informado (RF-19), la
autorización de uso de imagen (RF-20) y la autorización del tutor de un menor de
edad (RF-21). Es una propuesta pendiente en Backend#64, Backend#66 y Backend#68:
el frontend y los mocks (`pnpm dev:mock`) ya la usan, pero el backend real todavía
no tiene estas rutas.

---

## 1. Qué se guarda

La persona acepta de forma verbal una política (Ley 1581; el Decreto 1377 de 2013
admite la autorización oral). La prueba es el registro: qué versión de la política
aceptó, para qué finalidad, cuándo y quién la tomó. Por un menor de edad autoriza
el adulto que lo acompaña.

| Finalidad | Requisito | Política en el código |
| :--- | :--- | :--- |
| `ATENCION_ALIMENTARIA` | RF-19: tratamiento de datos | `domain/politicaVigente.ts` |
| `USO_IMAGEN` | RF-20: fotos en las que se reconozca a la persona | `domain/politicaImagen.ts` |

* **Versión de la política:** un número entero que solo sube cuando cambia el
  texto. Quien aceptó una versión anterior la conserva.
* **Quién lo tomó o lo retiró:** lo pone el servidor a partir de la sesión; el
  frontend no lo envía, para que no se pueda falsear.
* **Retirar no borra:** marca cuándo y quién la retiró, y el registro queda en el
  historial.
* **Una sola vigente:** cada beneficiario tiene a lo sumo una autorización vigente
  por finalidad.
* **Quién puede:** Voluntario y Coordinadora, igual que el registro (RNF-07). Los
  demás roles reciben 403. La excepción es registrar `USO_IMAGEN` de un menor:
  solo la Coordinadora (sección 2).

---

## 2. Autorizar: `POST /beneficiarios/:id/consentimiento`

```json
{ "versionPolitica": 1, "finalidad": "USO_IMAGEN" }
```

Respuesta (201 si es nuevo; 200 si ya había uno vigente de esa finalidad y versión):

```json
{
  "id": "c0a8…",
  "versionPolitica": 1,
  "finalidad": "USO_IMAGEN",
  "registradoPor": { "id": "…", "nombreCompleto": "Voluntario de Prueba" },
  "createdAt": "2026-11-19T15:00:00.000Z",
  "revocadoEn": null,
  "revocadoPor": null
}
```

* Repetir la petición con la misma versión no crea otro registro: si la respuesta
  se perdió por la red, reintentar es seguro.
* 400 si falta la versión o la finalidad, la finalidad no es una de las dos, o
  llega un campo que no conoce.
* 404 si el beneficiario no existe.

**`USO_IMAGEN` de un menor de 18 años (RF-21):**

* Es el segundo paso, explícito: aprobar al tutor (sección 6) no crea la
  autorización de imagen.
* 403 si quien la registra no es la Coordinadora.
* 409 si el menor no tiene una autorización del tutor `ACTIVA`.

**Mayoría de edad.** Una `USO_IMAGEN` registrada cuando el beneficiario era menor
deja de valer el día que cumple 18 años (en hora de Colombia): desde entonces la
debe dar la persona. Al registrarla, el servidor crea un registro nuevo y retira
el anterior, en lugar de devolver el que dio el tutor.

---

## 3. Retirar: `POST /beneficiarios/:id/consentimiento/revocacion`

```json
{ "finalidad": "USO_IMAGEN" }
```

* Marca la autorización vigente de esa finalidad como retirada y responde 200 con
  el registro, ya con `revocadoEn` y `revocadoPor`.
* Solo toca la finalidad pedida: retirar la de imagen no cambia la de datos.
* Después de retirarla se puede volver a autorizar; queda como un registro nuevo.
* Retirar la de imagen de un menor lo pueden hacer el Voluntario y la
  Coordinadora: retirar siempre protege.
* 400 si falta la finalidad o llega un campo que no conoce.
* 404 si el beneficiario no existe o no tiene una autorización vigente de esa
  finalidad.

---

## 4. Historial: `GET /beneficiarios/:id/consentimientos?finalidad=USO_IMAGEN`

Lista de registros como el de la sección 2, del más reciente al más antiguo. Uno
retirado trae `revocadoEn` y `revocadoPor`; uno vigente los trae en `null`.

* `finalidad` es opcional; sin ella llegan todas.
* 400 si llega un parámetro que no conoce o una finalidad que no existe.
* 404 si el beneficiario no existe.

---

## 5. Los consentimientos en la ficha

Todas las respuestas que devuelven una ficha (`GET /beneficiarios/:id`, el padrón,
el registro…) incluyen el registro vigente de cada finalidad, o `null`:

* `consentimiento`: el de `ATENCION_ALIMENTARIA`.
* `consentimientoImagen`: el de `USO_IMAGEN`.
* `autorizacionTutor`: la autorización del tutor `ACTIVA` (sección 6).

Un valor que no se puede leer cuenta como `null`, sin rechazar la ficha.

---

## 6. Autorización del tutor (RF-21)

La firma el padre, la madre, el acudiente o el tutor legal de un menor de edad
para el uso de su imagen, y la aprueba la Coordinadora (entidad
`AutorizacionTutor` del MER). No es requisito para recibir la ración.

* **Solo la Coordinadora** la registra o la revoca. Los demás roles reciben 403.
* **Solo para menores:** 409 si el beneficiario ya cumplió 18 años.
* **Una sola activa** por beneficiario: 409 si ya tiene una. Para cambiar de
  tutor, se revoca y se registra otra.
* **No se edita ni se borra:** revocar marca la fecha, el motivo y quién lo hizo.
* **Los datos del tutor son la constancia de lo firmado:** se guardan tal como
  estaban al firmar, aunque el tutor también esté en el padrón.
* **El Voluntario no recibe** el documento ni el teléfono del tutor: llegan en
  `null`. Ve el nombre, el parentesco y quién la aprobó.

### 6.1 Registrar: `POST /beneficiarios/:id/autorizacion-tutor`

`multipart/form-data`:

| Campo | Reglas |
| :--- | :--- |
| `nombre` | Obligatorio, hasta 150 caracteres. |
| `tipoDocumento` | `CC`, `CE`, `PPT` o `PASAPORTE`. |
| `numeroDocumento` | Obligatorio, hasta 30 caracteres. |
| `parentesco` | `MADRE`, `PADRE`, `ACUDIENTE` o `TUTOR_LEGAL`. |
| `telefono` | Obligatorio, hasta 20 caracteres. |
| `soporte` | El papel firmado: PDF, JPG o PNG, hasta 5 MB. |

Respuesta 201:

```json
{
  "id": "a1b2…",
  "estado": "ACTIVA",
  "tutor": {
    "nombre": "María Pérez Gómez",
    "tipoDocumento": "CC",
    "numeroDocumento": "1020304050",
    "parentesco": "MADRE",
    "telefono": "3001234567"
  },
  "aprobadaPor": { "id": "…", "nombreCompleto": "Coordinación de Prueba" },
  "fechaAprobacion": "2026-11-22T15:00:00.000Z",
  "revocadaEn": null,
  "revocadaPor": null,
  "motivoRevocacion": null
}
```

* 400 si falta un campo, no cumple sus reglas o el soporte no es PDF, JPG o PNG.
* 413 si el soporte pesa más de 5 MB.
* 404 si el beneficiario no existe.

### 6.2 Revocar: `POST /beneficiarios/:id/autorizacion-tutor/revocacion`

```json
{ "motivo": "La madre pidió que no le tomen más fotos." }
```

* Pasa la autorización activa a `REVOCADA` y responde 200 con el registro, ya con
  `revocadaEn`, `revocadaPor` y `motivoRevocacion`.
* **En cascada:** retira también la `USO_IMAGEN` vigente del menor, que aparece
  en su historial como un retiro anotado por la misma Coordinadora.
* 400 si falta el motivo o pasa de 255 caracteres.
* 404 si el beneficiario no existe o no tiene una autorización activa.

### 6.3 Historial: `GET /beneficiarios/:id/autorizaciones-tutor`

Lista de registros como el de 6.1, del más reciente al más antiguo, con las
revocadas. Las mismas reglas de quién ve el documento y el teléfono.

### 6.4 Soporte: `GET /beneficiarios/:id/autorizaciones-tutor/:idAutorizacion/soporte`

Devuelve el archivo firmado. Solo la Coordinadora; los demás roles reciben 403.

### 6.5 Extensión prevista

`tutor.beneficiarioId` (opcional) para vincular al tutor con una persona del
padrón y llenar sus datos desde la ficha. Antes hay que acordar con el equipo que
el padrón guarde quién es tutor de quién (Ley 1581, minimización).

---

## 7. Lo que hace la ficha

**Autorización de datos.** Quien se registró antes de RF-19 llega con
`consentimiento: null`: la ficha muestra «Autorización pendiente» y deja
registrarla. Si es menor, el texto pide explicarle la política al adulto que lo
acompaña.

La ficha no muestra el texto de las políticas. Al pedir una autorización se abre
una hoja con la explicación, la política y el botón para registrarla; al
registrarla, la hoja se cierra y la Constancia confirma si quedó guardada.

**Uso de imagen.** Sin autorización vigente no hay fotos (opt-in, RNF-11). Las
fotos solo sirven para que la Junta muestre en el barrio la actividad del
comedor; nunca se entregan a donantes ni a empresas, ni se usan para publicidad.
Un menor de edad que no tiene autorización, o que no está en el padrón, no se
fotografía. La sección muestra uno de tres estados, siempre con color, ícono y
texto:

| Estado | Cuándo | Qué se puede hacer |
| :--- | :--- | :--- |
| Foto autorizada | Adulto con una autorización que dio siendo mayor de edad, o menor con tutor aprobado y autorización | Retirar la autorización, después de confirmarlo (cualquier rol) |
| Rostro no fotografiable | Adulto sin autorización, o menor con tutor aprobado y sin autorización | Explicar la política y registrar la autorización. Para un menor, se le explica al tutor y solo la registra la Coordinadora |
| Requiere autorización del tutor | Menor de 18 años sin tutor aprobado | Nada todavía: primero se aprueba al tutor |

* **Al cumplir 18**, la autorización que dio su tutor deja de valer: la ficha lo
  muestra como «Rostro no fotografiable», avisa que ahora autoriza la persona y
  deja registrar la suya. El servidor hace lo mismo al recibirla (sección 2).

* La edad se calcula con la fecha de hoy en Colombia (`shared/domain/fechaDeHoy.ts`).
* Al autorizar o retirar, la ficha toma la respuesta del servidor sin volver a
  cargarse, y el historial se actualiza.
* «Ver historial» muestra cada autorización y cada retiro como un movimiento, con
  la fecha y quién lo anotó. Solo se pide al servidor cuando alguien lo abre.

**Tutor del menor (RF-21).** Solo aparece en la ficha de un menor de edad.

* Sin tutor aprobado, explica quién firma. La Coordinadora ve «Aprobar al tutor»,
  que abre `/beneficiarios/:id/tutor`; los demás roles leen que lo aprueba la
  coordinación. Esa pantalla pide los datos del tutor, el papel firmado y que la
  Coordinadora marque que lo revisó.
* Con tutor aprobado, muestra su nombre, qué es del menor, el teléfono, el
  documento, cuándo y quién lo aprobó. Al Voluntario el documento y el teléfono
  le salen como «Solo lo ve la coordinación».
* La Coordinadora puede revocarlo: escribe el motivo (hasta 255 caracteres) y
  confirma. La confirmación avisa si con eso se retira también la autorización
  de fotos. Si falla, lo escrito se conserva y se puede reintentar.
