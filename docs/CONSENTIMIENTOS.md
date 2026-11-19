# Consentimientos — SIG-CCPT

Contrato del frontend para guardar el consentimiento informado del beneficiario
(RF-19). Es una propuesta pendiente en Backend#64: el frontend y los mocks
(`pnpm dev:mock`) ya la usan, pero el backend real todavía no tiene esta ruta.

---

## 1. Qué se guarda

La persona acepta de forma verbal la política de tratamiento de datos (Ley 1581;
el Decreto 1377 de 2013 admite la autorización oral). La prueba es el registro:
qué versión de la política aceptó, para qué finalidad, cuándo y quién la tomó.

* **Versión de la política:** un número entero. Vive en
  `src/modules/beneficiarios/domain/politicaVigente.ts` y solo sube cuando cambia
  el texto de la política. Quien aceptó una versión anterior la conserva.
* **Quién lo tomó:** lo pone el servidor a partir de la sesión; el frontend no lo
  envía, para que no se pueda falsear.

---

## 2. `POST /beneficiarios/:id/consentimiento`

```json
{ "versionPolitica": 1, "finalidad": "ATENCION_ALIMENTARIA" }
```

Respuesta (201 si es nuevo; 200 si la persona ya había aceptado esa versión):

```json
{
  "id": "c0a8…",
  "beneficiarioId": "0000…0001",
  "versionPolitica": 1,
  "finalidad": "ATENCION_ALIMENTARIA",
  "registradoPor": { "id": "…", "nombreCompleto": "Voluntario de Prueba" },
  "createdAt": "2026-11-19T15:00:00.000Z"
}
```

* Repetir la petición con la misma versión no crea otro registro: si la respuesta
  se perdió por la red, reintentar es seguro.
* 400 si falta la versión o la finalidad, o llega un campo que no conoce.
* 404 si el beneficiario no existe.
* Lo pueden usar Voluntario y Coordinadora, igual que el registro (RNF-07).

---

## 3. El consentimiento en la ficha

Todas las respuestas que devuelven una ficha (`GET /beneficiarios/:id`, el padrón,
el registro…) incluyen `consentimiento`: el mismo objeto de arriba, o `null` si la
persona todavía no ha aceptado.

* Quien se registró antes de RF-19 llega con `null`: la ficha muestra
  «Autorización pendiente» y deja registrarla con el mismo `POST`.
* Un `consentimiento` que no se puede leer cuenta como pendiente, sin rechazar la
  ficha.
