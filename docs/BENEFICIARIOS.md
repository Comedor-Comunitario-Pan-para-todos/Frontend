# Beneficiarios — SIG-CCPT

Contrato del frontend con el módulo `beneficiarios` del backend. El cliente HTTP
y sus errores están en [HTTP.md](./HTTP.md).

---

## 1. Contrato actual

| Petición | Uso |
| :--- | :--- |
| `POST /beneficiarios` | Registrar (RF-01). |
| `GET /beneficiarios?search=&page=&limit=` | Buscar en el padrón, paginado. |
| `GET /beneficiarios/:id` | Consultar una ficha. |
| `GET /beneficiarios/validar-documento/:numero` | Saber si un documento ya está registrado. |

El backend rechaza cualquier campo que no conozca (`forbidNonWhitelisted`).

---

## 2. Propuesta para RF-02 (pendiente en Backend#30)

El frontend y los mocks (`pnpm dev:mock`) ya usan esta forma. Contra el backend
real, el registro falla con 400 y el `PATCH` todavía no sabe completar el nivel.

### Nivel de captura

Cada registro declara cuántos datos se piden según el propósito de la atención:

| Nivel | Campos |
| :--- | :--- |
| `BASICO` | `nombres`, `apellidos`, `fechaNacimiento`, `barrio` (opcional) |
| `EXTENDIDO` | Los básicos más `tipoDocumento`, `numeroDocumento`, `telefono` y `clasificacion`, todos opcionales |

* La fecha de nacimiento es obligatoria en ambos niveles: se necesita para
  proteger a los menores de edad (RF-21).
* En `BASICO` los campos extendidos se rechazan con 400 (minimización de datos,
  Ley 1581).
* En `EXTENDIDO` el documento sigue siendo opcional: no tener documento no
  impide recibir la ración (RNF-15). Si llega uno de `tipoDocumento` o
  `numeroDocumento`, el otro es obligatorio.

### Formato del número de documento

El número se guarda sin puntos, espacios ni guiones. El frontend revisa su forma
según el tipo; se propone que el backend aplique la misma regla:

| Tipo | Caracteres | Largo | Por qué |
| :--- | :--- | :--- | :--- |
| `CC` | Solo dígitos | 3 a 10 | El NUIP tiene 10 dígitos; las cédulas anteriores conservan su número corto. |
| `TI` | Solo dígitos | 10 a 11 | NUIP de 10; las expedidas antes de 2004 tenían 11. |
| `RC` | Letras y dígitos | 6 a 11 | Los registros anteriores al NUIP pueden traer letras en el serial. |
| `PPT` | Solo dígitos | 4 a 10 | Hoy son de 7 dígitos y Migración Colombia anunció que podrían crecer. |

Los rangos son amplios a propósito: rechazar un documento real deja a la
persona sin registro. Fuentes: Resolución 3571 de 2003 de la Registraduría
(NUIP) y Resolución 572 de 2022 de MinSalud (PPT).

### Clasificación socioeconómica

Desde agosto de 2026 el RUI (Registro Universal de Ingresos) reemplaza
gradualmente al Sisbén IV. Los dos usan la misma escala, así que se guarda el
sistema y el subgrupo:

```json
{ "sistema": "RUI", "grupo": "C12" }
```

* `sistema`: `RUI` o `SISBEN_IV`.
* `grupo`: de `A1` a `D21` (A1–A5, B1–B7, C1–C18, D1–D21).

### `POST /beneficiarios`

```json
{
  "nivel": "EXTENDIDO",
  "nombres": "María Elena",
  "apellidos": "Restrepo",
  "fechaNacimiento": "1958-03-15",
  "barrio": "El Poblado",
  "tipoDocumento": "CC",
  "numeroDocumento": "42185390",
  "telefono": "3151234567",
  "clasificacion": { "sistema": "RUI", "grupo": "B3" }
}
```

### `PATCH /beneficiarios/:id`

Tiene dos usos, según lleve o no `nivel`.

**Completar** (`nivel: "EXTENDIDO"`): pasa a nivel extendido a quien está en
básico (RF-02). Lo usa la pantalla «Completar datos».

```json
{
  "nivel": "EXTENDIDO",
  "tipoDocumento": "TI",
  "numeroDocumento": "1086999888",
  "telefono": "3151234567",
  "clasificacion": { "sistema": "SISBEN_IV", "grupo": "A2" }
}
```

**Actualizar** (sin `nivel`): corrige o pone al día los datos de la persona,
como parte del derecho de rectificación (Ley 1581, RNF-11). Lo usa la pantalla
«Actualizar datos». Siempre envía los básicos; `barrio: null` lo borra.

```json
{
  "nombres": "María Elena",
  "apellidos": "Restrepo",
  "fechaNacimiento": "1958-03-15",
  "barrio": "El Poblado"
}
```

Si quien actualiza es la Coordinadora y la persona ya está en nivel extendido,
se agregan los datos sensibles. Un `null` los borra:

```json
{
  "nombres": "María Elena",
  "apellidos": "Restrepo",
  "fechaNacimiento": "1958-03-15",
  "barrio": "El Poblado",
  "tipoDocumento": null,
  "numeroDocumento": null,
  "telefono": "3151234567",
  "clasificacion": { "sistema": "RUI", "grupo": "B3" }
}
```

* Responde la ficha actualizada (200), con las mismas reglas de documento y
  clasificación del registro.
* 409 si el documento ya es de otra persona; 404 si el id no existe.
* Completar y actualizar los básicos: Voluntario y Coordinadora.
* Actualizar los datos sensibles: solo la Coordinadora (403 para otro rol),
  porque el voluntario no ve el teléfono ni la clasificación (RNF-07).
* En una ficha básica, actualizar con campos extendidos responde 400: para eso
  está completar.

### Respuesta (todas las rutas que devuelven una ficha)

Los mismos campos de hoy, más `nivel` y `clasificacion` (`null` si no hay), y
`consentimiento` (RF-19, ver [CONSENTIMIENTOS.md](./CONSENTIMIENTOS.md)).

* Un registro anterior a RF-02 puede llegar sin `nivel`: el frontend lo deduce
  (extendido si tiene documento o teléfono).
* Una `clasificacion` con un sistema o un grupo desconocido se ignora, sin
  rechazar la ficha.

### Datos sensibles por rol (RNF-07)

Voluntario y Coordinadora pueden capturar el nivel extendido. Solo la
Coordinadora ve completos el documento, el teléfono y la clasificación. El
frontend los oculta en pantalla, pero lo correcto es que el backend no los
envíe a los roles que no deben verlos.

---

## 3. Propuesta para RF-24: barrios (por proponer en Backend#74)

El barrio es opcional y no condiciona la entrega de la ración. Así lo dice la
ayuda del campo, que cumple el criterio de puertas abiertas de RF-24.

### `GET /beneficiarios/barrios`

```json
["Cuba", "El Jardín", "El Poblado", "Otún", "Villasantana"]
```

* Los barrios que ya tiene el padrón, sin repetir (sin distinguir mayúsculas
  ni tildes) y en orden alfabético.
* Lo pueden usar Voluntario y Coordinadora.
* En Nest debe declararse antes de `GET /beneficiarios/:id`, o `barrios` se
  tomaría como un id.
* Si falla, el campo sigue sirviendo, solo que sin sugerencias.

Se propone además que el backend, al guardar, deje el barrio con la forma ya
registrada cuando coincida sin importar mayúsculas, tildes, signos ni espacios
repetidos. El frontend lo hace al salir del campo, pero no cubre todos los
casos (ver «Barrio» en la sección 4).

---

## 4. Flujo de captura en la interfaz

1. **Registro** (`/beneficiarios/nuevo`): empieza en nivel básico, que basta
   para recibir la ración. El selector «Nivel de registro» muestra los campos
   extendidos solo si se elige «Extendido».
2. **Ficha** (`/beneficiarios/:id`): una insignia indica el nivel. En nivel
   básico no se muestran campos sensibles vacíos. En extendido, quien no tiene
   el permiso `beneficiarios.verDatosSensibles` ve el documento enmascarado y
   «Solo lo ve la coordinación» en teléfono y clasificación.
3. **Completar** (`/beneficiarios/:id/completar`): desde la ficha básica, el
   botón «Completar datos extendidos» pide los mismos campos del registro
   extendido y la autorización de la Ley 1581, y envía el `PATCH`. Si el
   documento que se escribe ya es de otra persona, lo avisa antes de guardar,
   debajo del número.
4. **Actualizar** (`/beneficiarios/:id/actualizar`): desde cualquier ficha, el
   botón «Actualizar datos» permite cambiar los básicos. Con el permiso
   `beneficiarios.actualizarDatosSensibles` (Coordinadora) y una ficha en nivel
   extendido, también muestra la sección «Datos sensibles», con el mismo aviso
   de documento repetido.

Los formularios validan cada campo al salir de él y, desde ahí, mientras se
escribe.

### Barrio

Para que un mismo barrio no quede escrito de varias formas, sin cerrar la lista:

* **Sugerencias:** mientras se escribe, aparecen hasta 3 barrios ya registrados
  parecidos, como botones bajo el campo. Cuenta como parecido el que empieza
  por lo escrito, el que lo contiene o está contenido en él (desde 3 letras) y
  el que difiere por un error de tecleo (1 letra desde 4 letras, 2 desde 8). Se
  comparan sin mayúsculas, tildes, signos ni espacios, y sin prefijos como
  «Barrio», «B/», «Bº», «Br.», «Sector» o «Urb.».
* **Unificación:** al salir del campo, si lo escrito es el mismo barrio que uno
  registrado y solo cambian mayúsculas, tildes, signos o espacios repetidos, se
  reemplaza por la forma registrada. Lo que solo se parece, como «B/ El
  Jardín», un error de tecleo o «eljardin» sin espacio, no se cambia: queda
  como sugerencia y la persona decide.
* **Barrio nuevo:** si no se parece a ninguno, se guarda tal cual y desde ese
  momento aparece como sugerencia.

La lógica está en `domain/barrio.ts`.
