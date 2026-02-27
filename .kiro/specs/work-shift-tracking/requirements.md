# Documento de Requisitos: Sistema Híbrido de Control de Jornadas Laborales

## Introducción

Este documento define los requisitos para implementar un Sistema Híbrido de Control de Jornadas Laborales en una aplicación PWA de gestión de flotas de taxi. El sistema permitirá a los taxistas registrar sus jornadas de trabajo mediante fichaje digital, gestionar pausas, visualizar historial y generar reportes de productividad. Los patrones podrán supervisar las jornadas de toda su flota.

## Glosario

- **Sistema_Fichaje**: Módulo responsable de registrar inicio, fin y pausas de jornadas laborales
- **Jornada**: Período de trabajo continuo desde el inicio hasta el fin del turno, incluyendo pausas
- **Pausa**: Período de descanso dentro de una jornada activa
- **Horas_Efectivas**: Tiempo total de jornada menos el tiempo total de pausas
- **Dashboard_Jornada**: Vista en tiempo real del estado actual de la jornada activa
- **Historial_Jornadas**: Registro histórico de todas las jornadas completadas
- **TAXISTA**: Usuario conductor que registra sus propias jornadas
- **PATRON**: Usuario dueño de flota que supervisa jornadas de sus taxistas asociados
- **LocalStorage**: Sistema de almacenamiento local del navegador para persistencia de datos
- **Timer_Tiempo_Real**: Componente que actualiza la duración de jornada cada segundo
- **Exportador_PDF**: Módulo que genera documentos PDF de jornadas individuales
- **Vinculador_Servicios**: Componente que asocia servicios realizados con jornadas activas

## Requisitos

### Requisito 1: Gestión de Fichaje de Jornadas

**User Story:** Como TAXISTA, quiero poder iniciar y finalizar mi jornada laboral mediante botones de fichaje, para que el sistema registre automáticamente mis horas de trabajo.

#### Acceptance Criteria

1. WHEN el TAXISTA presiona el botón "Iniciar Jornada", THE Sistema_Fichaje SHALL crear un nuevo registro de jornada con timestamp de inicio y estado "active"
2. IF existe una jornada con estado "active" para el TAXISTA, THEN THE Sistema_Fichaje SHALL deshabilitar el botón "Iniciar Jornada"
3. WHEN el TAXISTA presiona el botón "Finalizar Jornada", THE Sistema_Fichaje SHALL actualizar el registro con timestamp de fin y cambiar estado a "completed"
4. THE Sistema_Fichaje SHALL almacenar cada registro de jornada en LocalStorage bajo la clave "taxi_work_shifts"
5. WHEN se crea o actualiza una jornada, THE Sistema_Fichaje SHALL generar un identificador único para el registro

### Requisito 2: Control de Pausas Durante la Jornada

**User Story:** Como TAXISTA, quiero poder registrar pausas durante mi jornada laboral, para que el sistema calcule correctamente mis horas efectivas de trabajo.

#### Acceptance Criteria

1. WHILE existe una jornada con estado "active", THE Sistema_Fichaje SHALL habilitar el botón "Pausa"
2. WHEN el TAXISTA presiona el botón "Pausa", THE Sistema_Fichaje SHALL cambiar el estado de la jornada a "paused" y registrar timestamp de inicio de pausa
3. WHILE la jornada tiene estado "paused", THE Sistema_Fichaje SHALL deshabilitar el botón "Pausa" y habilitar el botón "Reanudar"
4. WHEN el TAXISTA presiona el botón "Reanudar", THE Sistema_Fichaje SHALL cambiar el estado a "active" y registrar timestamp de fin de pausa en el array de pausas
5. THE Sistema_Fichaje SHALL almacenar cada pausa como objeto con propiedades startTime y endTime dentro del array "pauses" de la jornada
6. IF no existe jornada activa, THEN THE Sistema_Fichaje SHALL deshabilitar los botones "Pausa" y "Reanudar"

### Requisito 3: Visualización de Jornada Activa en Dashboard

**User Story:** Como TAXISTA, quiero ver en tiempo real el estado de mi jornada actual en el dashboard, para monitorear mi tiempo de trabajo y pausas.

#### Acceptance Criteria

1. WHILE existe una jornada con estado "active" o "paused", THE Dashboard_Jornada SHALL mostrar una tarjeta con información de la jornada activa
2. THE Dashboard_Jornada SHALL mostrar la hora de inicio de la jornada en formato legible
3. THE Timer_Tiempo_Real SHALL actualizar el tiempo transcurrido cada segundo mientras la jornada está activa
4. THE Dashboard_Jornada SHALL mostrar una lista de todas las pausas registradas con sus duraciones
5. THE Dashboard_Jornada SHALL calcular y mostrar las horas efectivas restando el tiempo total de pausas del tiempo transcurrido
6. THE Dashboard_Jornada SHALL mostrar el estado actual con indicador visual: "Trabajando" en color verde o "En pausa" en color naranja
7. WHEN no existe jornada activa, THE Dashboard_Jornada SHALL ocultar la tarjeta de jornada activa

### Requisito 4: Historial de Jornadas Completadas

**User Story:** Como TAXISTA, quiero acceder a un historial de todas mis jornadas pasadas con filtros por fecha, para revisar mi actividad laboral histórica.

#### Acceptance Criteria

1. THE Historial_Jornadas SHALL mostrar una lista de todas las jornadas con estado "completed" del TAXISTA
2. THE Historial_Jornadas SHALL ordenar las jornadas por fecha de inicio en orden descendente
3. WHERE el usuario aplica filtro de fecha, THE Historial_Jornadas SHALL mostrar solo jornadas dentro del rango especificado
4. THE Historial_Jornadas SHALL utilizar inputs de tipo "datetime-local" para los filtros de fecha
5. FOR ALL jornadas en la lista, THE Historial_Jornadas SHALL mostrar fecha, hora inicio, hora fin, duración total, cantidad de pausas y horas efectivas
6. WHEN el TAXISTA selecciona una jornada del historial, THE Historial_Jornadas SHALL mostrar vista detallada con información completa

### Requisito 5: Vinculación de Servicios con Jornadas

**User Story:** Como TAXISTA, quiero que los servicios que registro se vinculen automáticamente a mi jornada activa, para poder ver qué servicios realicé en cada turno.

#### Acceptance Criteria

1. WHEN se crea un nuevo servicio, THE Vinculador_Servicios SHALL verificar si existe una jornada activa para el TAXISTA
2. IF existe jornada activa, THEN THE Vinculador_Servicios SHALL agregar el identificador de la jornada al registro del servicio
3. THE Historial_Jornadas SHALL mostrar la lista de servicios realizados durante cada jornada
4. THE Historial_Jornadas SHALL calcular y mostrar los ingresos totales generados durante cada jornada
5. THE Historial_Jornadas SHALL sumar los importes de todos los servicios vinculados a una jornada para calcular ingresos

### Requisito 6: Exportación de Jornadas a PDF

**User Story:** Como TAXISTA, quiero exportar el detalle de una jornada específica a formato PDF, para tener un registro imprimible de mi actividad laboral.

#### Acceptance Criteria

1. WHEN el TAXISTA selecciona la opción "Exportar a PDF" en una jornada, THE Exportador_PDF SHALL generar un documento PDF con los datos de la jornada
2. THE Exportador_PDF SHALL incluir en el PDF: fecha, hora inicio, hora fin, duración total, lista de pausas, horas efectivas, servicios realizados e ingresos
3. THE Exportador_PDF SHALL formatear el PDF con diseño legible y estructura organizada
4. WHEN se completa la generación, THE Exportador_PDF SHALL iniciar la descarga del archivo PDF
5. THE Exportador_PDF SHALL nombrar el archivo con formato "jornada_YYYY-MM-DD_HH-MM.pdf"

### Requisito 7: Reportes de Productividad por Período

**User Story:** Como TAXISTA, quiero ver estadísticas de mis horas trabajadas por día, semana y mes, para analizar mi productividad laboral.

#### Acceptance Criteria

1. THE Sistema_Reportes SHALL calcular el total de horas efectivas trabajadas para períodos diario, semanal y mensual
2. THE Sistema_Reportes SHALL calcular el promedio de ingresos por hora efectiva para cada período
3. THE Sistema_Reportes SHALL mostrar gráficas visuales de horas trabajadas por día en el período seleccionado
4. THE Sistema_Reportes SHALL clasificar jornadas por turno (mañana: 06:00-14:00, tarde: 14:00-22:00, noche: 22:00-06:00)
5. THE Sistema_Reportes SHALL mostrar comparativas de productividad entre diferentes turnos
6. WHERE el usuario selecciona un período personalizado, THE Sistema_Reportes SHALL calcular estadísticas para ese rango de fechas

### Requisito 8: Supervisión de Jornadas por PATRON

**User Story:** Como PATRON, quiero ver las jornadas de todos mis taxistas asociados con filtros por taxista y fecha, para supervisar la actividad de mi flota.

#### Acceptance Criteria

1. WHEN un PATRON accede al Historial_Jornadas, THE Sistema_Fichaje SHALL mostrar jornadas de todos los taxistas asociados al PATRON
2. THE Historial_Jornadas SHALL incluir filtro por taxista que muestre lista de taxistas asociados
3. WHERE el PATRON selecciona un taxista específico, THE Historial_Jornadas SHALL mostrar solo jornadas de ese taxista
4. THE Historial_Jornadas SHALL mostrar el nombre y número de taxista en cada registro de jornada
5. THE Sistema_Reportes SHALL calcular estadísticas agregadas de toda la flota para el PATRON
6. THE Sistema_Reportes SHALL permitir al PATRON comparar productividad entre diferentes taxistas

### Requisito 9: Integración con Sistema de Conciliaciones

**User Story:** Como TAXISTA, quiero que mis conciliaciones muestren las horas trabajadas del período, para tener una visión completa de mi actividad y compensación.

#### Acceptance Criteria

1. WHEN se genera una conciliación, THE Sistema_Conciliacion SHALL calcular el total de horas efectivas del período
2. THE Sistema_Conciliacion SHALL mostrar las horas efectivas trabajadas en la vista de conciliación
3. THE Sistema_Conciliacion SHALL calcular el ratio de ingresos por hora efectiva
4. THE Sistema_Conciliacion SHALL incluir las horas trabajadas en los reportes exportados de conciliación

### Requisito 10: Cálculo de Métricas de Productividad

**User Story:** Como TAXISTA, quiero ver mi ingreso promedio por hora efectiva en los reportes, para evaluar la rentabilidad de mis jornadas.

#### Acceptance Criteria

1. THE Sistema_Reportes SHALL calcular ingresos por hora efectiva dividiendo ingresos totales entre horas efectivas
2. THE Sistema_Reportes SHALL mostrar el ingreso por hora efectiva con precisión de dos decimales
3. THE Sistema_Reportes SHALL calcular el promedio de servicios por hora efectiva
4. THE Sistema_Reportes SHALL identificar y resaltar las jornadas con mayor y menor productividad
5. WHERE no existen horas efectivas, THEN THE Sistema_Reportes SHALL mostrar "N/A" en lugar de división por cero

### Requisito 11: Actualización de FABButton con Opciones de Fichaje

**User Story:** Como TAXISTA, quiero acceder rápidamente a las opciones de fichaje desde el botón flotante, para iniciar o finalizar mi jornada sin navegar por menús.

#### Acceptance Criteria

1. WHEN el TAXISTA presiona el FABButton, THE Sistema_Fichaje SHALL incluir opciones de fichaje en el menú de acciones rápidas
2. WHERE no existe jornada activa, THE FABButton SHALL mostrar opción "Iniciar Jornada"
3. WHERE existe jornada activa, THE FABButton SHALL mostrar opciones "Finalizar Jornada" y "Pausa/Reanudar" según el estado
4. WHEN el TAXISTA selecciona una opción de fichaje desde el FABButton, THE Sistema_Fichaje SHALL ejecutar la acción correspondiente
5. THE FABButton SHALL actualizar dinámicamente las opciones disponibles según el estado de la jornada

### Requisito 12: Validación de Integridad de Jornadas

**User Story:** Como TAXISTA, quiero que el sistema valide la integridad de mis registros de jornada, para evitar inconsistencias en mis datos laborales.

#### Acceptance Criteria

1. WHEN se intenta iniciar una jornada, THE Sistema_Fichaje SHALL verificar que no exista otra jornada activa o pausada
2. IF existe jornada activa o pausada, THEN THE Sistema_Fichaje SHALL mostrar mensaje de error y prevenir la creación
3. WHEN se intenta pausar una jornada, THE Sistema_Fichaje SHALL verificar que el estado sea "active"
4. WHEN se intenta reanudar una jornada, THE Sistema_Fichaje SHALL verificar que el estado sea "paused"
5. WHEN se intenta finalizar una jornada, THE Sistema_Fichaje SHALL verificar que no exista pausa sin timestamp de fin
6. IF existe pausa incompleta, THEN THE Sistema_Fichaje SHALL completar automáticamente la pausa antes de finalizar la jornada

### Requisito 13: Persistencia y Sincronización de Datos

**User Story:** Como TAXISTA, quiero que mis registros de jornada se almacenen localmente y persistan entre sesiones, para no perder información si cierro la aplicación.

#### Acceptance Criteria

1. THE Sistema_Fichaje SHALL almacenar todos los registros de jornada en LocalStorage bajo la clave "taxi_work_shifts"
2. WHEN la aplicación se inicia, THE Sistema_Fichaje SHALL cargar los registros existentes desde LocalStorage
3. THE Sistema_Fichaje SHALL serializar los registros a formato JSON antes de almacenarlos
4. THE Sistema_Fichaje SHALL deserializar los registros desde JSON al cargarlos
5. WHEN se modifica un registro de jornada, THE Sistema_Fichaje SHALL actualizar inmediatamente el LocalStorage
6. THE Sistema_Fichaje SHALL mantener un array de objetos con estructura: {id, userId, startTime, endTime, pauses, status}

### Requisito 14: Componentes de Interfaz de Usuario

**User Story:** Como desarrollador, quiero implementar componentes reutilizables para la gestión de jornadas, para mantener consistencia en la interfaz y facilitar el mantenimiento.

#### Acceptance Criteria

1. THE Sistema_Fichaje SHALL implementar componente WorkShiftManager para gestionar operaciones de fichaje
2. THE Sistema_Fichaje SHALL implementar componente ShiftHistoryView para mostrar historial de jornadas
3. THE Sistema_Fichaje SHALL implementar componente ShiftDetailModal para mostrar detalles de jornada individual
4. THE DashboardView SHALL integrar visualización de jornada activa en su renderizado
5. THE ReportsView SHALL integrar métricas de horas trabajadas en sus reportes
6. THE FABButton SHALL integrar opciones de fichaje en su menú de acciones

### Requisito 15: Manejo de Zona Horaria y Formato de Tiempo

**User Story:** Como TAXISTA, quiero que el sistema registre correctamente las fechas y horas en mi zona horaria local, para que los registros reflejen mi horario real de trabajo.

#### Acceptance Criteria

1. THE Sistema_Fichaje SHALL utilizar la zona horaria local del navegador para todos los timestamps
2. THE Sistema_Fichaje SHALL almacenar timestamps en formato ISO 8601 con información de zona horaria
3. THE Dashboard_Jornada SHALL mostrar fechas y horas en formato legible para el usuario (DD/MM/YYYY HH:MM)
4. THE Historial_Jornadas SHALL mostrar duraciones en formato "HH:MM:SS" o "X horas Y minutos"
5. THE Timer_Tiempo_Real SHALL actualizar la visualización cada segundo sin causar parpadeos visuales
