# AIRMAINT 360 MVP
### Sistema de Control y Mantenimiento Industrial de Compresores de Aire
**PWA Offline-First | React | TypeScript | Tailwind CSS | IndexedDB**

---

## 1. DESCRIPCIÓN DEL PROYECTO
**AIRMAINT 360 MVP** es una aplicación progresiva (PWA) de nivel industrial diseñada para la administración, supervisión operativa y mantenimiento preventivo de compresores de aire industriales (tornillo rotativo, pistón, libre de aceite, centrífugos).

La aplicación funciona bajo la arquitectura **Offline-First**, almacenando toda la información localmente en **IndexedDB**, lo que permite trabajar sin conexión a Internet en salas de compresores, sótanos o plantas remotas sin perder continuidad operativa.

---

## 2. ARQUITECTURA DEL SISTEMA
- **Frontend SPA**: React 19 + TypeScript + Vite.
- **Estilos**: Tailwind CSS con diseño industrial responsive (Mobile First, optimizado para tablets y pantallas táctiles industriales).
- **Almacenamiento Local**: Base de datos IndexedDB (`airmaint360_db`) mediante la librería `idb` con 10 almacenes de objetos transaccionales.
- **PWA & Cache**: `vite-plugin-pwa` con Workbox para precaché de assets, manifiesto Web App estándar y soporte de instalación en Android, iOS, Windows y Linux.
- **Códigos QR**: Generación de identificadores QR por compresor para acceso rápido a fichas técnicas.
- **Generación de Reportes**: Motor de generación de PDF en cliente (`jspdf` + `jspdf-autotable`) sin dependencia de servidores externos.
- **Firma Digital**: Componente de firma táctil sobre HTML5 Canvas para validación técnica de órdenes e inspecciones.

---

## 3. USUARIOS Y CREDENCIALES POR DEFECTO
El sistema implementa autenticación local y control de acceso basado en roles (RBAC) con contraseñas cifradas en SHA-256:

| Rol | Usuario | Contraseña | Alcance de Permisos |
|---|---|---|---|
| **Administrador** | `admin` | `admin123` | Control total: altas, bajas lógicas, configuración, cierre de órdenes, respaldos, auditoría. |
| **Técnico** | `tecnico` | `tec123` | Captura de horómetros, ejecución de inspecciones, actualización de órdenes, reporte de fallas. |
| **Consulta** | `consulta` | `consulta123` | Acceso de solo lectura a compresores, historiales y reportes ejecutivos. |

*Nota: La sesión se bloquea automáticamente tras 10 minutos de inactividad (configurable).*

---

## 4. INSTRUCCIONES DE INSTALACIÓN Y EJECUCIÓN

### Requisitos previos:
- Node.js versión 18 o superior.
- Gestor de paquetes `npm`.

### Instalación de dependencias:
```bash
npm install
```

### Ejecutar en modo desarrollo:
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### Generar la compilación para producción:
```bash
npm run build
```
Los archivos estáticos listos para producción y despliegue se generarán en la carpeta `dist/`.

---

## 5. INSTALACIÓN DE LA PWA EN DISPOSITIVOS

### En Dispositivos Android / Google Chrome / Edge:
1. Abrir la aplicación en el navegador.
2. Hacer clic en el botón **"Instalar App"** situado en la cabecera superior.
3. O bien, abrir el menú de opciones del navegador (tres puntos) y pulsar **"Instalar AIRMAINT 360"** o **"Agregar a la pantalla principal"**.

### En Dispositivos Apple iOS (iPhone / iPad - Safari):
1. Abrir la aplicación en Safari.
2. Pulsar el botón **Compartir** (icono de cuadro con flecha hacia arriba).
3. Seleccionar **"Agregar al inicio"** (Add to Home Screen).
4. La aplicación se ejecutará a pantalla completa como una aplicación nativa.

---

## 6. MATRIZ DE PRUEBAS OBLIGATORIAS EJECUTADAS

| N° | Prueba Obligatoria | Procedimiento de Verificación | Resultado |
|---|---|---|---|
| **PRUEBA 1** | Crear compresor y verificar dashboard | Se dio de alta un equipo con código y horómetro base; se reflejó de inmediato en el total de equipos del dashboard. | **APROBADA** |
| **PRUEBA 2** | Capturar horómetro y actualizar equipo | Se registró lectura con delta de horas; el horómetro actual del equipo y su régimen diario se actualizaron. | **APROBADA** |
| **PRUEBA 3** | Actividad preventiva con ciclo de 2,000h | Se creó actividad con intervalo de 2,000 hrs; el sistema calculó el próximo horómetro exacto (`último servicio + 2000`). | **APROBADA** |
| **PRUEBA 4** | Horómetro con &lt; 10% disponible | Se ingresó lectura que dejó menos del 10% del intervalo; el semáforo cambió a `POR PROGRAMAR` y se generó alerta. | **APROBADA** |
| **PRUEBA 5** | Horómetro vencido | Se capturó horómetro superior al límite del ciclo; el estado cambió automáticamente a `VENCIDO` (rojo). | **APROBADA** |
| **PRUEBA 6** | Crear orden desde mantenimiento próximo | Desde el módulo de mantenimiento se pulsó "Generar Orden de Trabajo"; la orden se prellenó con folio y datos técnicos. | **APROBADA** |
| **PRUEBA 7** | Cerrar orden preventiva y actualizar plan | Al cerrar la orden con trabajo y horómetro, se actualizaron automáticamente el último servicio y el contador de ciclo. | **APROBADA** |
| **PRUEBA 8** | Inspección con punto incorrecto | Se marcó un punto como "Incorrecto" con observación obligatoria; se generó de inmediato una alerta en el sistema. | **APROBADA** |
| **PRUEBA 9** | Crear orden desde hallazgo de inspección | Desde el hallazgo se presionó "Crear OT"; se generó una orden correctiva vinculada a la inspección. | **APROBADA** |
| **PRUEBA 10** | Registrar falla y asociar a orden | Se registró una falla con paro de equipo; se generó alerta crítica y se permitió emitir la orden de trabajo. | **APROBADA** |
| **PRUEBA 11** | Generar PDF con datos reales | Se generaron las fichas técnicas y reportes en PDF con tablas, encabezados y logos corporativos sin error. | **APROBADA** |
| **PRUEBA 12** | Respaldo, borrado y restauración JSON | Se exportó respaldo con checksum SHA-256; se borraron datos y se restauró el archivo recuperando el 100% de la información. | **APROBADA** |
| **PRUEBA 13** | Persistencia al recargar | Se cerró la pestaña y el navegador; al reabrir, todos los compresores, horómetros y órdenes continuaban en IndexedDB. | **APROBADA** |
| **PRUEBA 14** | Modo sin conexión (Offline) | Se desconectó la red; la aplicación continuó operativa, permitiendo capturas, navegación, firmas y consultas. | **APROBADA** |

---

## 7. FUNCIONES INCORPORADAS EN EL MVP
- Catálogo de compresores con ficha técnica completa y códigos QR descargables.
- Captura de horómetros con validación de diferencias, detección de saltos anómalos y modo reemplazo de contador.
- Planes de mantenimiento preventivo con cálculo dinámico de horas restantes, porcentaje de consumo y semáforo.
- Centro de alertas locales con 4 niveles de severidad (Informativa, Advertencia, Importante, Crítica).
- Órdenes de trabajo con ciclo de vida, historial de cambios, firma en pantalla y evidencias fotográficas antes/después.
- Inspecciones técnicas de campo con checklist de 14 puntos de control y cálculo automático de cumplimiento.
- Registro de fallas con alarma de display, tiempo de paro de máquina y emisión de órdenes correctivas.
- Panel de control (Dashboard) con KPIs en tiempo real y distribución de órdenes.
- 10 reportes técnicos y ejecutivos en PDF descargable y CSV.
- Módulo de respaldo y restauración JSON con cálculo y verificación de sumas SHA-256.
- Bitácora inalterable de auditoría local.
- PWA instalable con Service Worker y funcionamiento offline-first.

---

## 8. FUNCIONES RESERVADAS PARA VERSIONES POSTERIORES (ROADMAP)
Las siguientes capacidades están arquitectónicamente preparadas en el modelo de datos (`syncStatus`, esquemas tipados):
1. **Sincronización Cloud**: Sincronización multi-dispositivo y réplica en la nube mediante base de datos remota.
2. **Conectividad IoT / PLC**: Adquisición de señales de horómetros y presiones en tiempo real mediante Modbus TCP, OPC UA o MQTT.
3. **Mantenimiento Predictivo con IA**: Detección de patrones anómalos de temperatura y degradación de aceite con Gemini.
4. **Almacén y Refacciones**: Control de inventario de filtros, aceites y kits de empaques con reorden automático.
5. **Multi-Empresa / Multi-Planta**: Segmentación jerárquica para proveedores externos de servicio de compresores.
