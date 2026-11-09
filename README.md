# SIG-CCPT — Cliente Móvil / Web (Frontend)

> **Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos**  

---

## 1. Descripción del Proyecto

El cliente de **SIG-CCPT** es una aplicación web responsiva (*Mobile-First*) que opera **100% en línea** (RNF-01), desarrollada con **React**, **TypeScript**, **Vite** y estilizada con **Tailwind CSS**. Está diseñada para operar fluidamente desde los navegadores y accesos directos de teléfonos inteligentes personales (**BYOD**) de los voluntarios, y se adapta a tablets y portátiles para la coordinación, la JAC y los donantes del comedor comunitario del barrio El Jardín (Pereira).

El proyecto implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** en el Frontend, desacoplando la lógica de negocio y los casos de uso operativos (emisión de turnos, registro de insumos, actas de merma, control de Habeas Data) de los componentes visuales de React y de los mecanismos de comunicación. Toda transacción se valida y persiste de inmediato en el servidor central vía API REST, respaldado por **TypeORM y MySQL**, que actúa como única fuente de verdad (RNF-16).

---

## 2. Stack Tecnológico y Arquitectura

### 2.1 Tecnologías Principales del Frontend
* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (tipado estricto sin `any` para máxima robustez).
* **Herramienta de Construcción:** [Vite](https://vitejs.dev/) (empaquetado ultrarrápido, bajo consumo de recursos en desarrollo y producción).
* **Estilos y Diseño:** [Tailwind CSS](https://tailwindcss.com/) (diseño utilitario optimizado, sin sobrecarga de estilos para dispositivos de gama baja).
* **Pruebas:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) (`pnpm test`).
* **Patrón de Diseño:** **Arquitectura Hexagonal (Puertos y Adaptadores) organizada por módulo**. Cada área de negocio (`beneficiarios`, `turnos`, `inventario`…) vive en `src/modules/<modulo>/` con sus propias capas:
  * **Dominio (`domain`):** Entidades del comedor y reglas de negocio puras, sin React ni API.
  * **Aplicación (`application`):** Casos de uso y puertos (interfaces) hacia el exterior.
  * **Infraestructura (`infrastructure`):** Adaptadores que implementan los puertos: HTTP hacia la API del Backend, dispositivo (cámara, compresión de imágenes).
  * **Interfaz (`ui`):** Componentes, hooks y páginas React maquetados con Tailwind CSS.
  * Lo común a varios módulos va en `src/shared/` y la composición de la aplicación en `src/app/`.
  * Estructura completa y reglas entre capas: [`docs/ARQUITECTURA.md`](./docs/ARQUITECTURA.md).

### 2.2 Integración con Backend y Persistencia
* **Backend Target:** API REST conectada a base de datos relacional **MySQL** a través del ORM **TypeORM**.
* **Persistencia:** 100% en el servidor. El cliente no guarda copias locales de beneficiarios ni encola transacciones; en el navegador solo se conservan la sesión y preferencias de interfaz.

### 2.3 Sistema de Diseño
* Tokens centralizados en `src/index.css` (Tailwind CSS v4, bloque `@theme`): colores, tipografías, escala de texto, breakpoints, medidas táctiles, radios y sombras.

### 2.4 Desarrollo

| Comando | Uso |
| :--- | :--- |
| `pnpm dev` | Servidor de desarrollo contra la API real (proxy hacia el backend). |
| `pnpm dev:mock` | Servidor de desarrollo sin backend, con respuestas simuladas. |
| `pnpm test` | Pruebas. |
| `pnpm build` | Build de producción. |

Más detalle en [`docs/HTTP.md`](./docs/HTTP.md) (entorno, cliente HTTP, errores) y [`docs/AUTENTICACION.md`](./docs/AUTENTICACION.md) (sesión, usuarios de prueba).

---

## 3. Propósito del Software (Frontend)

El propósito del cliente frontend es proveer una interfaz accesible, ligera y altamente usable que resuelva la problemática operativa y documental del comedor:

* **Eliminación de la Doble Captura:** Unificar el registro diario en un único flujo digital en el acceso comunal ("la reja"), suprimiendo el cuaderno manual y las discrepancias con la cocina.
* **Agilidad en la Atención:** Ofrecer interfaces simplificadas que permitan a voluntarios rotativos sin experiencia completar tareas críticas en $\le 4$ pantallas y $\le 90$ segundos, con una efectividad $\ge 90\%$ al primer intento.
* **Control y Trazabilidad de Insumos (FEFO):** Registro de ofertas y donaciones con soporte para pesaje medido o estimado, y formalización de actas de merma con captura y compresión de evidencia fotográfica in situ para auditoría fiscal de supermercados aliados.
* **Protección de Datos y Habeas Data (Ley 1581 / Dec. 1377):** Cumplimiento normativo riguroso desde la interfaz (consentimiento *opt-in*, bloqueo de captura de fotografías a menores de edad sin consentimiento formal del tutor legal y exportaciones anonimizadas).
* **Operación en Línea Confiable:** Validación y registro inmediato en el servidor central, con indicación clara del estado de conexión y mensajes comprensibles cuando una operación no se pueda completar, para que el voluntario sepa siempre si el registro quedó guardado.
* **Diseño Multidispositivo:** Interfaz *Mobile-First* que se adapta a teléfonos, tablets y portátiles sin perder legibilidad ni áreas táctiles.

---

## 4. Alcance del Cliente Frontend

### 4.1 Capacidades en Alcance

* **Control de Acceso Basado en Roles (RBAC):**
  * Vistas y permisos adaptados por perfil: Coordinadora Operativa, Presidente JAC, Voluntario Operativo y Donante Corporativo.
  * Panel exclusivo para la Coordinadora: alta, modificación e inactivación lógica (*soft delete*) de colaboradores.
* **Gestión de Beneficiarios y Fila de Atención:**
  * Búsqueda y validación de personas en tiempo real contra el servidor central para evitar duplicados.
  * Formularios por nivel de sensibilidad: **Básico** (nombre/barrio opcional no excluyente) y **Extendido** (cédula, teléfono, Sisbén).
  * Emisión de turnos o tiquetes secuenciales diarios con bloqueo de raciones duplicadas.
* **Gestión de Insumos, Mermas y Cadena de Frío:**
  * Registro de recepción de donaciones bajo principio FEFO (*First Expired, First Out*).
  * Módulo de registro de incidentes en equipos de refrigeración (cadena de frío) con catálogo dinámico y acción correctiva.
  * Generación de actas de descarte con campo obligatorio "Autorizado por" y compresión de fotos de evidencia para donantes corporativos.
* **Voluntariado e Inducción:**
  * Consulta de convocatorias y confirmación de turnos operativos.
  * Visualización de tareas asignadas (puerta, servido, lavado).
  * *Checklist* interactivo de guía de inducción básica para voluntarios novatos.
* **Estado de Conexión y Retroalimentación:**
  * Indicador visual en la barra superior cuando no hay conexión con el servidor.
  * Bloqueo de envío de formularios sin conexión, conservando lo digitado en pantalla para reintentar sin volver a capturar.
  * Confirmación explícita de cada registro guardado y mensajes de error accionables.
* **Seguridad, Transparencia y Reportes:**
  * Bloqueo incondicional de fotos a menores sin acreditación de tutor.
  * Visualización de reportes agregados para la JAC y certificados de donación descargables para empresas aportantes.

---

### 4.2 Exclusiones del Frontend (Fuera de Alcance)

* **Servidor y Base de Datos Central:** La configuración directa de MySQL, migraciones de TypeORM, autenticación en backend y lógica relacional central pertenecen al repositorio de Backend.
* **Generación Pesada de Archivos OOXML (.xlsx):** La exportación formal para la Alcaldía de Pereira es procesada por el backend para no sobrecargar el hilo de JavaScript en teléfonos de gama baja; el front solo solicita y descarga el archivo resultante.
* **Módulos de Cobro o Venta de Raciones:** El comedor es de carácter 100% solidario y comunitario; no se contemplan módulos de recaudo, POS ni facturación.
* **Filtros Excluyentes por Procedencia:** La interfaz no impone restricciones de servicio basadas en el barrio de origen del beneficiario.
* **Integración Directa con ERPs Privados:** No se crean conexiones directas cliente-servidor hacia software corporativo de donantes (SAP, Éxito, etc.).

---

## 5. Restricciones Técnicas y de Rendimiento

* **Dispositivos Objetivo:** Navegadores móviles modernos en Android 8.0+ (Chrome móvil / WebView), con 1 GB de RAM disponible. Base de diseño en 360px de ancho; también tablets y portátiles.
* **Conectividad:** Requiere conexión a internet / red local durante toda la operación (RNF-01).
* **Rendimiento:** Tiempos de carga de vista $\le 2\text{ s}$ y peso total del bundle cliente optimizado con Vite para garantizar bajo consumo de memoria ($\le 150\text{ MB}$).
* **Tratamiento Multimedia:** Compresión client-side de imágenes JPG/PNG antes de enviarlas al servidor, para reducir el consumo de datos móviles y el tiempo de carga.
* **Costo de Licenciamiento:** **\$0** (Uso exclusivo de herramientas Open Source y librerías gratuitas).

---

## 6. Equipo de Desarrollo (Frontend)

Módulo Frontend, arquitectura y experiencia de usuario a cargo de:

* **Daniel Alejandro Macias Perez** — *Desarrollador Frontend*
* **Neider Duvan Guindigua Machoa** — *Desarrollador Frontend*
