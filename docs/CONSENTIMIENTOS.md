# Consentimientos — SIG-CCPT

Contrato del frontend para guardar el consentimiento informado (RF-19) y la
autorización de uso de imagen (RF-20) del beneficiario. Es una propuesta pendiente
en Backend#64 y Backend#66: el frontend y los mocks (`pnpm dev:mock`) ya la usan,
pero el backend real todavía no tiene estas rutas.

---

## 1. Qué se guarda

La persona acepta de forma verbal una política (Ley 1581; el Decreto 1377 de 2013
admite la autorización oral). La prueba es el registro: qué versión de la política
aceptó, para qué finalidad, cuándo y quién la tomó.

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
  demás roles reciben 403.

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
* 409 si la finalidad es `USO_IMAGEN` y la persona es menor de 18 años: hace falta
  la autorización de su tutor (RF-21). Mientras no exista RF-21, se rechaza
  siempre a los menores.

---

## 3. Retirar: `POST /beneficiarios/:id/consentimiento/revocacion`

```json
{ "finalidad": "USO_IMAGEN" }
```

* Marca la autorización vigente de esa finalidad como retirada y responde 200 con
  el registro, ya con `revocadoEn` y `revocadoPor`.
* Solo toca la finalidad pedida: retirar la de imagen no cambia la de datos.
* Después de retirarla se puede volver a autorizar; queda como un registro nuevo.
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

Un valor que no se puede leer cuenta como `null`, sin rechazar la ficha.

---

## 6. Lo que hace la ficha

**Autorización de datos.** Quien se registró antes de RF-19 llega con
`consentimiento: null`: la ficha muestra «Autorización pendiente» y deja
registrarla.

**Uso de imagen.** Sin autorización vigente no hay fotos (opt-in, RNF-11). La
sección muestra uno de tres estados, siempre con color, ícono y texto:

| Estado | Cuándo | Qué se puede hacer |
| :--- | :--- | :--- |
| Foto autorizada | Hay `consentimientoImagen` | Retirar la autorización, después de confirmarlo |
| Rostro no fotografiable | Adulto sin autorización | Explicar la política de imagen y registrar la autorización |
| Requiere autorización del tutor | Menor de 18 años sin autorización | Nada todavía: el botón está deshabilitado hasta RF-21 |

* La edad se calcula con la fecha de hoy en Colombia (`shared/domain/fechaDeHoy.ts`).
* Al autorizar o retirar, la ficha toma la respuesta del servidor sin volver a
  cargarse, y el historial se actualiza.
* «Ver historial» muestra cada autorización y cada retiro como un movimiento, con
  la fecha y quién lo anotó. Solo se pide al servidor cuando alguien lo abre.
