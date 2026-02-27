# Plan de Implementación: Sistema Híbrido de Control de Jornadas Laborales

## Resumen

Este plan implementa un sistema completo de fichaje digital para taxistas con las siguientes capacidades:

- Fichaje de inicio/fin de jornadas con gestión de pausas
- Timer en tiempo real con actualización cada segundo
- Vinculación automática de servicios a jornadas activas
- Historial de jornadas con filtros por fecha
- Exportación de jornadas a PDF con detalles completos
- Reportes de productividad con métricas de ingresos por hora
- Supervisión de flota completa para patrones
- Integración con sistema de conciliaciones existente

El sistema se implementará en JavaScript usando Ionic Framework, siguiendo la arquitectura existente de la aplicación con adaptadores, componentes UI y LocalStorage para persistencia.

## Tareas

- [ ] 1. Configurar estructura base y modelos de datos
  - Crear archivo de configuración .kiro
  - Definir modelos de datos (WorkShift, Pause, ShiftFilters, ShiftStats)
  - Configurar constantes y mensajes de error
  - _Requisitos: 13.6, 15.1_


- [ ] 2. Implementar WorkShiftAdapter - Gestión básica de jornadas
  - [ ] 2.1 Crear clase WorkShiftAdapter con constructor y métodos CRUD básicos
    - Implementar constructor que recibe authAdapter
    - Implementar startShift() para crear nueva jornada
    - Implementar endShift() para finalizar jornada
    - Implementar getActiveShift() para obtener jornada activa
    - Implementar getShiftById() para consultar jornada específica
    - _Requisitos: 1.1, 1.3, 1.5_

  - [ ]* 2.2 Escribir test de propiedad para creación de jornadas
    - **Propiedad 1: Shift Creation with Valid State**
    - **Valida: Requisitos 1.1, 1.4, 1.5, 13.1**

  - [ ]* 2.3 Escribir test de propiedad para restricción de jornada única
    - **Propiedad 2: Single Active Shift Constraint**
    - **Valida: Requisitos 1.2, 12.1, 12.2**

  - [ ]* 2.4 Escribir test de propiedad para finalización de jornadas
    - **Propiedad 3: Shift Completion Updates State**
    - **Valida: Requisitos 1.3**

  - [ ]* 2.5 Escribir test de propiedad para IDs únicos
    - **Propiedad 43: Unique Shift IDs**
    - **Valida: Requisitos 1.5**


- [ ] 3. Implementar WorkShiftAdapter - Gestión de pausas
  - [ ] 3.1 Implementar pauseShift() y resumeShift() con validaciones de estado
    - Implementar pauseShift() que cambia estado a "paused" y agrega pausa
    - Implementar resumeShift() que cambia estado a "active" y completa pausa
    - Validar transiciones de estado correctas
    - _Requisitos: 2.2, 2.4, 12.3, 12.4_

  - [ ]* 3.2 Escribir test de propiedad para transición a pausa
    - **Propiedad 4: Pause Transition from Active**
    - **Valida: Requisitos 2.2, 12.3**

  - [ ]* 3.3 Escribir test de propiedad para transición de reanudación
    - **Propiedad 5: Resume Transition from Paused**
    - **Valida: Requisitos 2.4, 12.4**

  - [ ]* 3.4 Escribir test de propiedad para integridad de pausas
    - **Propiedad 6: Pause Structure Integrity**
    - **Valida: Requisitos 2.5**

  - [ ]* 3.5 Escribir test de propiedad para auto-completar pausas
    - **Propiedad 7: Auto-Complete Incomplete Pauses**
    - **Valida: Requisitos 12.5, 12.6**


- [ ] 4. Implementar WorkShiftAdapter - Cálculos y consultas
  - [ ] 4.1 Implementar métodos de cálculo de horas y tiempos
    - Implementar calculateEffectiveHours() para calcular horas efectivas
    - Implementar calculateTotalPauseTime() para sumar duración de pausas
    - Implementar getShiftHistory() con filtros por fecha y usuario
    - _Requisitos: 3.5, 4.1, 4.2, 4.3, 7.1_

  - [ ]* 4.2 Escribir test de propiedad para cálculo de horas efectivas
    - **Propiedad 8: Effective Hours Calculation**
    - **Valida: Requisitos 3.5, 7.1, 9.1**

  - [ ]* 4.3 Escribir test de propiedad para filtrado por usuario
    - **Propiedad 9: Shift History Filtering by User**
    - **Valida: Requisitos 4.1**

  - [ ]* 4.4 Escribir test de propiedad para ordenamiento de historial
    - **Propiedad 10: Shift History Sorting**
    - **Valida: Requisitos 4.2**

  - [ ]* 4.5 Escribir test de propiedad para filtrado por rango de fechas
    - **Propiedad 11: Date Range Filtering**
    - **Valida: Requisitos 4.3, 7.6**


- [ ] 5. Implementar WorkShiftAdapter - Vinculación de servicios
  - [ ] 5.1 Implementar vinculación automática de servicios a jornadas activas
    - Implementar linkServiceToActiveShift() para vincular servicio
    - Implementar getShiftServices() para obtener servicios de una jornada
    - Extender ReconcileAdapter.createService() para vincular automáticamente
    - _Requisitos: 5.1, 5.2, 5.3_

  - [ ]* 5.2 Escribir test de propiedad para vinculación de servicios
    - **Propiedad 12: Service Linking to Active Shift**
    - **Valida: Requisitos 5.1, 5.2**

  - [ ]* 5.3 Escribir test de propiedad para cálculo de ingresos
    - **Propiedad 13: Shift Income Calculation**
    - **Valida: Requisitos 5.3, 5.4, 5.5**

  - [ ]* 5.4 Escribir test de propiedad para lista de servicios
    - **Propiedad 45: Shift Services List Accuracy**
    - **Valida: Requisitos 5.3**


- [ ] 6. Implementar WorkShiftAdapter - Persistencia y validación
  - [ ] 6.1 Implementar persistencia en LocalStorage con validaciones
    - Implementar saveShift() para guardar en LocalStorage
    - Implementar loadShifts() para cargar desde LocalStorage
    - Implementar validateShiftIntegrity() para validar estructura
    - Manejar errores de LocalStorage (cuota excedida, corrupción)
    - _Requisitos: 1.4, 13.1, 13.2, 13.5_

  - [ ]* 6.2 Escribir test de propiedad para persistencia round-trip
    - **Propiedad 25: LocalStorage Persistence Round-Trip**
    - **Valida: Requisitos 13.2, 13.3, 13.4, 13.5**

  - [ ]* 6.3 Escribir test de propiedad para estructura de datos
    - **Propiedad 26: Shift Data Structure Completeness**
    - **Valida: Requisitos 13.6**

  - [ ]* 6.4 Escribir test de propiedad para actualización inmediata
    - **Propiedad 44: Immediate LocalStorage Update**
    - **Valida: Requisitos 13.5**


- [ ] 7. Checkpoint - Verificar adaptador completo
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 8. Implementar WorkShiftManager - Componente de dashboard
  - [ ] 8.1 Crear componente WorkShiftManager con renderizado de jornada activa
    - Crear clase WorkShiftManager con constructor
    - Implementar render() para mostrar tarjeta de jornada activa
    - Implementar renderActiveShift() para HTML de jornada
    - Implementar renderShiftControls() para botones de control
    - Mostrar información: hora inicio, tiempo transcurrido, pausas, horas efectivas
    - _Requisitos: 3.1, 3.2, 3.4, 3.5, 3.7, 14.1_

  - [ ]* 8.2 Escribir test de propiedad para visibilidad de jornada activa
    - **Propiedad 31: Dashboard Active Shift Visibility**
    - **Valida: Requisitos 3.1, 3.7**

  - [ ]* 8.3 Escribir test de propiedad para indicador visual de estado
    - **Propiedad 32: Shift Status Visual Indicator**
    - **Valida: Requisitos 3.6**

  - [ ]* 8.4 Escribir test de propiedad para lista de pausas
    - **Propiedad 33: Pause List Display Completeness**
    - **Valida: Requisitos 3.4**

  - [ ]* 8.5 Escribir test de propiedad para formato de hora de inicio
    - **Propiedad 38: Start Time Display Format**
    - **Valida: Requisitos 3.2**


- [ ] 9. Implementar WorkShiftManager - Timer en tiempo real
  - [ ] 9.1 Implementar timer con actualización cada segundo
    - Crear ShiftTimerController para gestionar ciclo de vida del timer
    - Implementar start(), stop(), tick() con setInterval de 1000ms
    - Crear ShiftTimerDisplay para actualizar UI sin parpadeos
    - Implementar formatDuration() para formato HH:MM:SS
    - Emitir evento 'shift-timer-update' cada segundo
    - Optimizar con requestAnimationFrame y Page Visibility API
    - _Requisitos: 3.3, 15.4, 15.5_

  - [ ]* 9.2 Escribir test de propiedad para frecuencia de actualización
    - **Propiedad 30: Timer Update Frequency**
    - **Valida: Requisitos 3.3**

  - [ ]* 9.3 Escribir test de propiedad para formato de duración
    - **Propiedad 29: Duration Display Format**
    - **Valida: Requisitos 15.4**


- [ ] 10. Implementar WorkShiftManager - Acciones de fichaje
  - [ ] 10.1 Implementar handlers para acciones de fichaje
    - Implementar handleStartShift() con validación y feedback
    - Implementar handleEndShift() con confirmación
    - Implementar handlePauseShift() con actualización de UI
    - Implementar handleResumeShift() con actualización de UI
    - Manejar errores con ToastManager y AlertController
    - Emitir eventos personalizados (shift-started, shift-ended, etc.)
    - _Requisitos: 1.1, 1.3, 2.2, 2.4_

  - [ ]* 10.2 Escribir tests unitarios para handlers de fichaje
    - Test para inicio de jornada exitoso
    - Test para rechazo de inicio con jornada activa
    - Test para pausa y reanudación
    - Test para finalización de jornada


- [ ] 11. Implementar ShiftHistoryView - Modal de historial
  - [ ] 11.1 Crear componente ShiftHistoryView con modal y filtros
    - Crear clase ShiftHistoryView con constructor
    - Implementar show() para mostrar modal
    - Implementar createModal() con estructura HTML completa
    - Implementar renderFilters() con inputs datetime-local
    - Implementar renderShiftList() para lista de jornadas
    - Implementar renderShiftCard() para tarjeta individual
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 14.2_

  - [ ]* 11.2 Escribir test de propiedad para completitud de display
    - **Propiedad 34: Shift History Display Completeness**
    - **Valida: Requisitos 4.5**


- [ ] 12. Implementar ShiftHistoryView - Carga y filtrado de datos
  - [ ] 12.1 Implementar carga de datos y aplicación de filtros
    - Implementar loadShiftHistory() con filtros opcionales
    - Implementar handleFilterChange() para aplicar filtros de fecha
    - Implementar calculateShiftStats() para calcular estadísticas
    - Ordenar jornadas por fecha descendente
    - Mostrar servicios e ingresos por jornada
    - _Requisitos: 4.1, 4.2, 4.3, 5.3, 5.4_

  - [ ]* 12.2 Escribir tests unitarios para filtrado
    - Test para filtrado por rango de fechas
    - Test para ordenamiento descendente
    - Test para cálculo de estadísticas


- [ ] 13. Implementar ShiftDetailModal - Vista de detalle
  - [ ] 13.1 Crear componente ShiftDetailModal con información completa
    - Crear clase ShiftDetailModal con constructor
    - Implementar show() para mostrar modal con shiftId
    - Implementar createModal() con estructura HTML
    - Implementar renderShiftInfo() para información básica
    - Implementar renderPauseList() para lista detallada de pausas
    - Implementar renderServiceList() para servicios realizados
    - Implementar renderMetrics() para métricas de productividad
    - _Requisitos: 4.6, 5.3, 10.1, 10.2, 14.3_

  - [ ]* 13.2 Escribir tests unitarios para renderizado de detalle
    - Test para renderizado de información completa
    - Test para cálculo de métricas
    - Test para lista de servicios


- [ ] 14. Checkpoint - Verificar componentes UI
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 15. Implementar ShiftPDFExporter - Exportación a PDF
  - [ ] 15.1 Crear clase ShiftPDFExporter con generación de PDF
    - Crear clase ShiftPDFExporter usando jsPDF
    - Implementar exportShift() para generar PDF completo
    - Incluir: fecha, horas, duración, pausas, servicios, ingresos
    - Implementar métodos auxiliares de formato (formatDate, formatTime, formatDuration)
    - Generar nombre de archivo con formato "jornada_YYYY-MM-DD_HH-MM.pdf"
    - Manejar paginación para listas largas de servicios
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 15.2 Escribir test de propiedad para completitud de PDF
    - **Propiedad 14: PDF Export Completeness**
    - **Valida: Requisitos 6.2**

  - [ ]* 15.3 Escribir test de propiedad para formato de nombre de archivo
    - **Propiedad 15: PDF Filename Format**
    - **Valida: Requisitos 6.5**

  - [ ]* 15.4 Escribir tests unitarios para exportación
    - Test para generación de PDF sin errores
    - Test para formato de contenido
    - Test para nombre de archivo


- [ ] 16. Extender FABButton con opciones de fichaje
  - [ ] 16.1 Agregar opciones de fichaje al menú de acciones rápidas
    - Modificar FABButton.showActionSheet() para incluir opciones de jornada
    - Mostrar "Iniciar Jornada" cuando no hay jornada activa
    - Mostrar "Pausar" y "Finalizar" cuando hay jornada activa
    - Mostrar "Reanudar" y "Finalizar" cuando jornada está pausada
    - Implementar handlers para cada acción
    - Actualizar dinámicamente opciones según estado
    - _Requisitos: 11.1, 11.2, 11.3, 11.4, 11.5, 14.6_

  - [ ]* 16.2 Escribir test de propiedad para opciones según estado
    - **Propiedad 36: FAB Options Based on Shift State**
    - **Valida: Requisitos 11.2, 11.3, 11.5**

  - [ ]* 16.3 Escribir test de propiedad para ejecución de acciones
    - **Propiedad 37: FAB Action Execution**
    - **Valida: Requisitos 11.4**


- [ ] 17. Extender DashboardView con jornada activa
  - [ ] 17.1 Integrar WorkShiftManager en el dashboard
    - Modificar DashboardView.renderDashboard() para incluir sección de jornada
    - Agregar contenedor para WorkShiftManager
    - Instanciar y renderizar WorkShiftManager
    - Agregar listeners para eventos de jornada (shift-started, shift-ended)
    - Actualizar dashboard cuando cambia estado de jornada
    - _Requisitos: 3.1, 3.7, 14.4_

  - [ ]* 17.2 Escribir tests de integración para dashboard
    - Test para renderizado de jornada activa en dashboard
    - Test para actualización al cambiar estado
    - Test para ocultamiento cuando no hay jornada


- [ ] 18. Extender ReportsView con métricas de jornadas
  - [ ] 18.1 Agregar métricas de horas trabajadas a reportes
    - Modificar ReportsView.calculateAdvancedStats() para incluir jornadas
    - Calcular total de horas efectivas del período
    - Calcular ingreso por hora efectiva
    - Implementar classifyShiftsByTurn() para clasificar por turno
    - Implementar getShiftTurn() para determinar turno de jornada
    - Agregar gráficas de horas trabajadas por día
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.5_

  - [ ]* 18.2 Escribir test de propiedad para ingreso por hora
    - **Propiedad 16: Income Per Hour Calculation**
    - **Valida: Requisitos 7.2, 9.3, 10.1, 10.5**

  - [ ]* 18.3 Escribir test de propiedad para servicios por hora
    - **Propiedad 17: Services Per Hour Calculation**
    - **Valida: Requisitos 10.3**

  - [ ]* 18.4 Escribir test de propiedad para clasificación de turnos
    - **Propiedad 18: Shift Turn Classification**
    - **Valida: Requisitos 7.4**

  - [ ]* 18.5 Escribir test de propiedad para precisión decimal
    - **Propiedad 24: Decimal Precision for Income Per Hour**
    - **Valida: Requisitos 10.2**

  - [ ]* 18.6 Escribir test de propiedad para datos de gráficas
    - **Propiedad 39: Chart Data Accuracy for Reports**
    - **Valida: Requisitos 7.3**

  - [ ]* 18.7 Escribir test de propiedad para comparación de turnos
    - **Propiedad 40: Turn Productivity Comparison**
    - **Valida: Requisitos 7.5**


- [ ] 19. Implementar funcionalidad de supervisión para PATRON
  - [ ] 19.1 Agregar filtrado por rol y taxista en WorkShiftAdapter
    - Modificar getShiftHistory() para soportar filtrado por rol
    - Para PATRON: incluir jornadas de taxistas asociados
    - Implementar filtro por taxista específico
    - Agregar información de taxista en renderizado de jornadas
    - _Requisitos: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 19.2 Escribir test de propiedad para visibilidad de flota
    - **Propiedad 19: Patron Fleet Visibility**
    - **Valida: Requisitos 8.1**

  - [ ]* 19.3 Escribir test de propiedad para filtrado por taxista
    - **Propiedad 20: Patron Taxista Filtering**
    - **Valida: Requisitos 8.3**

  - [ ]* 19.4 Escribir test de propiedad para información de taxista
    - **Propiedad 35: Taxista Information in Patron View**
    - **Valida: Requisitos 8.4**


- [ ] 20. Implementar estadísticas agregadas para PATRON
  - [ ] 20.1 Agregar cálculos de estadísticas de flota
    - Implementar agregación de métricas de toda la flota
    - Calcular totales de servicios, ingresos y horas efectivas
    - Implementar comparación de productividad entre taxistas
    - Agregar visualización de estadísticas en ReportsView
    - _Requisitos: 8.5, 8.6_

  - [ ]* 20.2 Escribir test de propiedad para agregación de flota
    - **Propiedad 21: Fleet Statistics Aggregation**
    - **Valida: Requisitos 8.5**

  - [ ]* 20.3 Escribir test de propiedad para comparación de taxistas
    - **Propiedad 41: Taxista Productivity Comparison**
    - **Valida: Requisitos 8.6**


- [ ] 21. Checkpoint - Verificar funcionalidad de supervisión
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 22. Integrar con sistema de conciliaciones
  - [ ] 22.1 Extender ReconciliationView con horas trabajadas
    - Modificar ReconciliationView para mostrar horas efectivas del período
    - Calcular total de horas efectivas en conciliación
    - Calcular ratio de ingresos por hora efectiva
    - Incluir horas trabajadas en reportes exportados
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 22.2 Escribir test de propiedad para integración de horas
    - **Propiedad 22: Reconciliation Hours Integration**
    - **Valida: Requisitos 9.1, 9.2**

  - [ ]* 22.3 Escribir test de propiedad para ratio de ingresos
    - **Propiedad 42: Reconciliation Income Per Hour Ratio**
    - **Valida: Requisitos 9.4**


- [ ] 23. Implementar ranking de productividad
  - [ ] 23.1 Agregar identificación de jornadas más/menos productivas
    - Implementar cálculo de productividad por jornada
    - Identificar jornada con mayor ingreso por hora
    - Identificar jornada con menor ingreso por hora
    - Agregar visualización destacada en reportes
    - _Requisitos: 10.4_

  - [ ]* 23.2 Escribir test de propiedad para ranking
    - **Propiedad 23: Productivity Ranking**
    - **Valida: Requisitos 10.4**


- [ ] 24. Implementar manejo de zona horaria y formatos
  - [ ] 24.1 Implementar funciones de formato de fecha y hora
    - Crear utilidades para formato de timestamps en zona horaria local
    - Implementar formateo de fechas en formato DD/MM/YYYY HH:MM
    - Implementar formateo de duraciones en HH:MM:SS
    - Asegurar que todos los timestamps usen ISO 8601 con zona horaria
    - Implementar conversión de zona horaria del navegador
    - _Requisitos: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 24.2 Escribir test de propiedad para formato ISO 8601
    - **Propiedad 27: Timestamp ISO 8601 Format**
    - **Valida: Requisitos 15.1, 15.2**

  - [ ]* 24.3 Escribir test de propiedad para formato de fecha en UI
    - **Propiedad 28: Date Display Format**
    - **Valida: Requisitos 15.3**

  - [ ]* 24.4 Escribir tests unitarios para formatos
    - Test para conversión a ISO 8601
    - Test para formato de visualización
    - Test para formato de duración


- [ ] 25. Implementar sistema de eventos personalizados
  - [ ] 25.1 Crear sistema de eventos para comunicación entre componentes
    - Implementar emisión de eventos: shift-started, shift-ended, shift-paused, shift-resumed
    - Implementar evento shift-timer-update para actualización de timer
    - Agregar listeners en componentes relevantes (Dashboard, FAB, WorkShiftManager)
    - Asegurar propagación correcta de eventos
    - _Requisitos: 3.3, 11.5_

  - [ ]* 25.2 Escribir tests de integración para eventos
    - Test para emisión de eventos en operaciones
    - Test para recepción de eventos en componentes
    - Test para actualización de UI en respuesta a eventos


- [ ] 26. Implementar manejo de errores y validaciones
  - [ ] 26.1 Agregar validaciones exhaustivas y manejo de errores
    - Implementar validación de timestamps cronológicos
    - Implementar manejo de errores de LocalStorage (cuota excedida)
    - Implementar validación de integridad de datos al cargar
    - Agregar mensajes de error descriptivos
    - Implementar recuperación de errores cuando sea posible
    - Usar ToastManager y AlertController para feedback al usuario
    - _Requisitos: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [ ]* 26.2 Escribir tests unitarios para manejo de errores
    - Test para validación de jornada activa existente
    - Test para validación de estados de pausa/reanudación
    - Test para auto-completar pausas incompletas
    - Test para manejo de errores de LocalStorage
    - Test para validación de timestamps


- [ ] 27. Checkpoint - Verificar sistema completo
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 28. Configurar suite de tests con fast-check
  - [ ] 28.1 Configurar property-based testing con fast-check
    - Crear archivo de configuración de tests (PBT_CONFIG)
    - Implementar generadores de datos (taxistaArb, shiftArb, pauseArb, serviceArb)
    - Configurar ejecución de tests con mínimo 100 iteraciones
    - Agregar scripts de test en package.json
    - Configurar cobertura de código con objetivo de 80%
    - _Requisitos: Testing Strategy_

  - [ ]* 28.2 Escribir tests unitarios para generadores
    - Test para validez de datos generados
    - Test para restricciones de generadores


- [ ] 29. Agregar estilos CSS para componentes de jornadas
  - [ ] 29.1 Crear estilos para componentes de jornadas
    - Crear estilos para tarjeta de jornada activa en dashboard
    - Crear estilos para timer con display grande y legible
    - Crear estilos para indicadores de estado (verde/naranja)
    - Crear estilos para lista de pausas con chips
    - Crear estilos para modal de historial con filtros
    - Crear estilos para tarjetas de jornadas en historial
    - Asegurar diseño responsive para móviles
    - _Requisitos: 3.6, UI Design_

  - [ ]* 29.2 Verificar diseño responsive
    - Test visual en diferentes tamaños de pantalla
    - Test de accesibilidad de colores y contraste


- [ ] 30. Optimizar rendimiento del timer y eventos
  - [ ] 30.1 Implementar optimizaciones de rendimiento
    - Implementar throttling para actualizaciones de UI
    - Usar requestAnimationFrame para actualizaciones suaves
    - Implementar Page Visibility API para pausar timer en background
    - Optimizar listeners de eventos para evitar memory leaks
    - Implementar cleanup de intervalos al desmontar componentes
    - _Requisitos: 3.3, Performance_

  - [ ]* 30.2 Escribir tests de rendimiento
    - Test para verificar frecuencia de actualización
    - Test para verificar cleanup de recursos
    - Test para verificar pausa en background


- [ ] 31. Implementar acceso desde menú principal
  - [ ] 31.1 Agregar opción de historial de jornadas al menú
    - Agregar botón "Historial de Jornadas" en menú principal o dashboard
    - Implementar navegación a ShiftHistoryView
    - Agregar icono apropiado (time-outline o calendar)
    - _Requisitos: 4.1, Navigation_

  - [ ]* 31.2 Escribir tests de navegación
    - Test para apertura de historial desde menú
    - Test para navegación entre vistas


- [ ] 32. Implementar inicialización del sistema
  - [ ] 32.1 Crear inicialización global del sistema de jornadas
    - Crear instancia global de WorkShiftAdapter
    - Inicializar timer al cargar aplicación si hay jornada activa
    - Registrar listeners globales de eventos
    - Cargar datos desde LocalStorage al inicio
    - _Requisitos: 13.2, Initialization_

  - [ ]* 32.2 Escribir tests de inicialización
    - Test para carga de datos al inicio
    - Test para inicialización de timer con jornada activa
    - Test para registro de listeners


- [ ] 33. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.

- [ ] 34. Pruebas de integración end-to-end
  - [ ]* 34.1 Escribir tests de integración para flujos completos
    - Test para flujo completo: iniciar → pausar → reanudar → finalizar jornada
    - Test para vinculación automática de servicios a jornada activa
    - Test para visualización en dashboard durante jornada
    - Test para generación de historial y exportación a PDF
    - Test para cálculo de métricas en reportes
    - Test para supervisión de flota por PATRON
    - Test para integración con conciliaciones


- [ ] 35. Documentación y limpieza final
  - [ ] 35.1 Agregar documentación y comentarios al código
    - Agregar JSDoc a todos los métodos públicos
    - Documentar estructura de datos en LocalStorage
    - Agregar comentarios explicativos en lógica compleja
    - Documentar eventos personalizados y su uso
    - Crear README con instrucciones de uso del sistema
    - _Requisitos: Documentation_

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de corrección
- Los tests unitarios validan ejemplos específicos y casos edge
- La meta de cobertura de código es 80%
- Se utilizará fast-check con mínimo 100 iteraciones por propiedad
- El sistema sigue la arquitectura existente de la aplicación
- Todos los componentes usan Ionic Framework para consistencia de UI

