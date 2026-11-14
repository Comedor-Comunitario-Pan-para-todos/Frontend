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
real, el registro falla con 400 hasta que se implemente.

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

### Respuesta (todas las rutas que devuelven una ficha)

Los mismos campos de hoy, más `nivel` y `clasificacion` (`null` si no hay).

* Un registro anterior a RF-02 puede llegar sin `nivel`: el frontend lo deduce
  (extendido si tiene documento o teléfono).
* Una `clasificacion` con un sistema o un grupo desconocido se ignora, sin
  rechazar la ficha.

### Datos sensibles por rol (RNF-07)

Voluntario y Coordinadora pueden capturar el nivel extendido. Solo la
Coordinadora ve completos el documento, el teléfono y la clasificación. El
frontend los oculta en pantalla, pero lo correcto es que el backend no los
envíe a los roles que no deben verlos.
