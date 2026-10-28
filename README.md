# SIG-CCPT — Cliente Móvil / Web (Frontend)

> **Sistema de Información y Gestión para el Comedor Comunitario Pan para Todos**  

---

## 1. Descripción del Proyecto

El cliente de **SIG-CCPT** es una aplicación web responsiva (*Mobile-First*) y progresiva (*Offline-First*) desarrollada con **React**, **TypeScript**, **Vite** y estilarizada con **Tailwind CSS**. Está diseñada para operar fluidamente desde los navegadores y accesos directos de teléfonos inteligentes personales (**BYOD**) de los voluntarios y la coordinación en el comedor comunitario del barrio El Jardín (Pereira).

El proyecto implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** en el Frontend, desacoplando la lógica de negocio y los casos de uso operativos (emisión de turnos, registro de insumos, actas de merma, control de Habeas Data) de los componentes visuales de React y de los mecanismos de almacenamiento. Esto permite que el sistema opere sin conexión a internet mediante adaptadores de persistencia local en el cliente (IndexedDB / Web Storage) y se sincronice de manera transparente vía API REST con el servidor central respaldado por **TypeORM y MySQL**.

---

## 2. Stack Tecnológico y Arquitectura

### 2.1 Tecnologías Principales del Frontend
* **Core:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (tipado estricto sin `any` para máxima robustez).
* **Herramienta de Construcción:** [Vite](https://vitejs.dev/) (empaquetado ultrarrápido, bajo consumo de recursos en desarrollo y producción).
* **Estilos y Diseño:** [Tailwind CSS](https://tailwindcss.com/) (diseño utilitario optimizado, sin sobrecarga de estilos para dispositivos de gama baja).
* **Patrón de Diseño:** **Arquitectura Hexagonal en Frontend**:
  * **Dominio (`domain`):** Entidades del comedor (Beneficiario, Turno, Donación, Merma, Insumo) y reglas de negocio puras.
  * **Aplicación (`application`):** Casos de uso e interacción del usuario (gestión de turnos, validación de caducidad FEFO, cola de sincronización).
  * **Infraestructura y Adaptadores (`infrastructure`):** 
    * *Adaptador HTTP:* Cliente de comunicación con la API del Backend (TypeORM / MySQL).
    * *Adaptador de Persistencia Local:* Caché y cola de transacciones offline (IndexedDB / LocalStorage).
    * *Adaptadores de Dispositivo:* Compresión de imágenes y cámara web/móvil.
  * **Presentación / UI (`ui` / `components`):** Vistas, páginas y componentes React maquetados con Tailwind CSS.

### 2.2 Integración con Backend y Persistencia
* **Backend Target:** API REST conectada a base de datos relacional **MySQL** a través del ORM **TypeORM**.
* **Persistencia Cliente (Offline):** Almacenamiento local seguro en el navegador para mantener el caché diario de beneficiarios y encolar registros de donaciones/turnos sin acceso a red.

---

## 3. Propósito del Software (Frontend)

El propósito del cliente frontend es proveer una interfaz accesible, ligera y altamente usable que resuelva la problemática operativa y documental del comedor:

* **Eliminación de la Doble Captura:** Unificar el registro diario en un único flujo digital en el acceso comunal ("la reja"), suprimiendo el cuaderno manual y las discrepancias con la cocina.
* **Agilidad en la Atención:** Ofrecer interfaces simplificadas que permitan a voluntarios rotativos sin experiencia completar tareas críticas en $\le 4$ pantallas y $\le 90$ segundos, con una efectividad $\ge 90\%$ al primer intento.
* **Control y Trazabilidad de Insumos (FEFO):** Registro de ofertas y donaciones con soporte para pesaje medido o estimado, y formalización de actas de merma con captura y compresión de evidencia fotográfica in situ para auditoría fiscal de supermercados aliados.
* **Protección de Datos y Habeas Data (Ley 1581 / Dec. 1377):** Cumplimiento normativo riguroso desde la interfaz (consentimiento *opt-in*, bloqueo de captura de fotografías a menores de edad sin consentimiento formal del tutor legal y exportaciones anonimizadas).
* **Resiliencia Operativa Offline-First:** Continuidad absoluta de la jornada de alimentación aunque falle el fluido eléctrico o la red móvil, sincronizando los datos en diferido cuando se restablezca la conexión.

---

## 4. Alcance del Cliente Frontend

### 4.1 Capacidades en Alcance

* **Control de Acceso Basado en Roles (RBAC):**
  * Vistas y permisos adaptados por perfil: Coordinadora Operativa, Presidente JAC, Voluntario Operativo y Donante Corporativo.
  * Panel exclusivo para la Coordinadora: alta, modificación e inactivación lógica (*soft delete*) de colaboradores.
* **Gestión de Beneficiarios y Fila de Atención:**
  * Búsqueda y validación de personas contra el caché local precargado al inicio de la jornada para mitigar duplicados sin conexión.
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
* **Cola de Sincronización Fuera de Línea:**
  * Indicador visual dinámico en la barra superior con el número de transacciones locales pendientes de envío.
  * Disparo automático de la sincronización al recuperar conectividad (`navigator.onLine`).
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

* **Dispositivos Objetivo:** Navegadores móviles modernos en Android 8.0+ (Chrome móvil / WebView), con 1 GB de RAM disponible.
* **Rendimiento:** Tiempos de carga de vista $\le 2\text{ s}$ y peso total del bundle cliente optimizado con Vite para garantizar bajo consumo de memoria ($\le 150\text{ MB}$).
* **Tratamiento Multimedia:** Compresión client-side de imágenes JPG/PNG antes de almacenarlas en la cola offline para evitar colapsar la cuota de almacenamiento local.
* **Costo de Licenciamiento:** **\$0** (Uso exclusivo de herramientas Open Source y librerías gratuitas).

---

## 6. Equipo de Desarrollo (Frontend)

Módulo Frontend, arquitectura y experiencia de usuario a cargo de:

* **Daniel Alejandro Macias Perez** — *Desarrollador Frontend*
* **Neider Duvan Guindigua Machoa** — *Desarrollador Frontend*
