# Plan de Implementación: Conciliación de Taxista

## Visión General

Implementación del módulo de conciliación de taxista como extensión de la PWA existente. El desarrollo seguirá un enfoque incremental, construyendo desde los modelos de datos básicos hasta la interfaz completa, con validación continua a través de pruebas.

## Tareas

- [x] 1. Configurar estructura base y tipos de datos
  - Crear directorio del módulo de conciliación
  - Definir interfaces TypeScript para Service, Expense, ReconciliationData
  - Configurar tipos para cálculos y validaciones
  - Integrar con la estructura existente de la PWA
  - _Requerimientos: 1.1, 4.1, 8.3_

- [ ] 2. Implementar motor de cálculos (CalculationEngine)
  - [x] 2.1 Crear CalculationEngine con métodos básicos
    - Implementar calculateCommission para diferentes plataformas
    - Implementar calculateDistribution para reparto 60/40
    - Implementar calculateDailyTotals para totales por día
    - _Requerimientos: 2.1, 2.2, 3.1, 3.2_

  - [ ]* 2.2 Escribir prueba de propiedad para cálculo de comisiones
    - **Propiedad 4: Cálculo correcto de comisiones Freenow**
    - **Valida: Requerimientos 2.1, 2.2**

  - [ ]* 2.3 Escribir prueba de propiedad para distribución 60/40
    - **Propiedad 6: Distribución correcta 60/40**
    - **Valida: Requerimientos 3.1, 3.2, 3.3, 3.4**

  - [x] 2.4 Implementar cálculos de extras y totales finales
    - Implementar calculateFinalSettlement
    - Implementar cálculo de incentivos y propinas Freenow
    - Implementar cálculo de saldo externo
    - _Requerimientos: 2.3, 2.4, 7.1, 7.2, 7.3_

  - [ ]* 2.5 Escribir prueba de propiedad para extras Freenow
    - **Propiedad 5: Suma correcta de extras Freenow**
    - **Valida: Requerimientos 2.3, 2.4**

- [ ] 3. Implementar gestión de servicios (ServiceManager)
  - [x] 3.1 Crear componente ServiceManager con CRUD básico
    - Implementar formulario de registro de servicios
    - Implementar lista de servicios con edición y eliminación
    - Integrar validaciones de entrada
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 3.2 Escribir prueba de propiedad para almacenamiento de servicios
    - **Propiedad 1: Almacenamiento completo de servicios**
    - **Valida: Requerimientos 1.1**

  - [ ]* 3.3 Escribir prueba de propiedad para categorización de pagos
    - **Propiedad 2: Categorización correcta de pagos**
    - **Valida: Requerimientos 1.2, 1.3, 1.4**

  - [x] 3.4 Implementar filtrado y búsqueda de servicios
    - Implementar filtro por rango de fechas
    - Implementar filtro por tipo de pago
    - Implementar búsqueda por monto o plataforma
    - _Requerimientos: 5.1_

  - [ ]* 3.5 Escribir prueba de propiedad para filtrado por fechas
    - **Propiedad 11: Filtrado correcto por fechas**
    - **Valida: Requerimientos 5.1**

- [ ] 4. Implementar gestión de gastos (ExpenseManager)
  - [x] 4.1 Crear componente ExpenseManager con CRUD básico
    - Implementar formulario de registro de gastos
    - Implementar lista de gastos con edición y eliminación
    - Integrar validaciones de entrada
    - _Requerimientos: 4.1, 4.2_

  - [ ]* 4.2 Escribir prueba de propiedad para almacenamiento de gastos
    - **Propiedad 7: Almacenamiento completo de gastos**
    - **Valida: Requerimientos 4.1**

  - [ ]* 4.3 Escribir prueba de propiedad para suma de gastos
    - **Propiedad 8: Suma correcta de gastos por período**
    - **Valida: Requerimientos 4.2**

- [x] 5. Checkpoint - Validar funcionalidad básica
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.

- [ ] 6. Implementar generador de conciliaciones (ReconciliationGenerator)
  - [x] 6.1 Crear ReconciliationGenerator con lógica principal
    - Implementar generación de conciliación por período
    - Implementar agrupación de servicios por día
    - Implementar cálculo de totales diarios y generales
    - _Requerimientos: 5.2, 5.3, 5.5_

  - [ ]* 6.2 Escribir prueba de propiedad para agrupación por día
    - **Propiedad 12: Agrupación correcta por día**
    - **Valida: Requerimientos 5.2**

  - [ ]* 6.3 Escribir prueba de propiedad para consistencia de totales
    - **Propiedad 13: Consistencia de totales diarios y generales**
    - **Valida: Requerimientos 5.3**

  - [x] 6.4 Implementar cálculo de totales netos y recálculo automático
    - Implementar resta de gastos de ingresos brutos
    - Implementar recálculo automático tras cambios
    - Manejar casos de conciliación vacía
    - _Requerimientos: 4.3, 4.4, 5.4, 5.5_

  - [ ]* 6.5 Escribir prueba de propiedad para cálculo de totales netos
    - **Propiedad 9: Cálculo correcto de totales netos**
    - **Valida: Requerimientos 4.3**

  - [ ]* 6.6 Escribir prueba de propiedad para recálculo automático
    - **Propiedad 10: Recálculo automático tras eliminación**
    - **Valida: Requerimientos 4.4, 5.5**

- [ ] 7. Implementar calculadora de efectivo (CashCalculator)
  - [x] 7.1 Crear CashCalculator con desglose de billetes
    - Implementar formulario de entrada de billetes
    - Implementar cálculo automático de totales
    - Implementar cálculo de diferencias con efectivo neto
    - _Requerimientos: 6.1, 6.2, 6.3_

  - [ ]* 7.2 Escribir prueba de propiedad para cálculo de billetes
    - **Propiedad 14: Cálculo correcto de billetes**
    - **Valida: Requerimientos 6.1**

  - [ ]* 7.3 Escribir prueba de propiedad para recálculo de billetes
    - **Propiedad 15: Recálculo inmediato de billetes**
    - **Valida: Requerimientos 6.2**

  - [ ]* 7.4 Escribir prueba de propiedad para diferencias de efectivo
    - **Propiedad 16: Cálculo correcto de diferencias de efectivo**
    - **Valida: Requerimientos 6.3**

- [ ] 8. Implementar persistencia y almacenamiento
  - [x] 8.1 Crear sistema de persistencia en localStorage
    - Implementar guardado de servicios, gastos y conciliaciones
    - Implementar carga de datos al iniciar la aplicación
    - Implementar eliminación con confirmación
    - _Requerimientos: 8.3, 8.4, 8.5_

  - [ ]* 8.2 Escribir prueba de propiedad para persistencia round-trip
    - **Propiedad 21: Persistencia round-trip en localStorage**
    - **Valida: Requerimientos 8.3, 8.4**

  - [ ]* 8.3 Escribir prueba de propiedad para persistencia de billetes
    - **Propiedad 17: Persistencia de desglose de billetes**
    - **Valida: Requerimientos 6.4**

- [ ] 9. Implementar validaciones y manejo de errores
  - [x] 9.1 Crear sistema de validaciones
    - Implementar validación de montos negativos
    - Implementar validación de fechas inválidas
    - Implementar validación de campos obligatorios
    - Implementar detección de inconsistencias
    - _Requerimientos: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 9.2 Escribir prueba de propiedad para validación de entrada
    - **Propiedad 22: Validación de entrada**
    - **Valida: Requerimientos 9.1, 9.2, 9.3**

  - [ ]* 9.3 Escribir prueba de propiedad para detección de inconsistencias
    - **Propiedad 23: Detección de inconsistencias**
    - **Valida: Requerimientos 9.4**

- [x] 10. Checkpoint - Validar lógica de negocio completa
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.

- [ ] 11. Implementar interfaz de usuario principal
  - [x] 11.1 Crear componente principal ReconciliationModule
    - Implementar navegación entre pestañas (servicios, gastos, conciliación)
    - Implementar selector de período de fechas
    - Integrar todos los componentes desarrollados
    - _Requerimientos: 5.1, 10.1, 10.2, 10.3_

  - [x] 11.2 Crear tabla de conciliación (ReconciliationTable)
    - Implementar tabla responsiva con todas las columnas
    - Implementar totales diarios y generales
    - Implementar visualización de liquidación final
    - _Requerimientos: 7.1, 7.2, 7.3_

  - [ ]* 11.3 Escribir prueba de propiedad para liquidación final
    - **Propiedad 18: Cálculo correcto de liquidación final**
    - **Valida: Requerimientos 7.1, 7.2**

  - [ ]* 11.4 Escribir prueba de propiedad para saldo externo
    - **Propiedad 19: Cálculo correcto de saldo externo**
    - **Valida: Requerimientos 7.3**

- [ ] 12. Implementar exportación de reportes
  - [x] 12.1 Crear ReportExporter con generación de PDF
    - Implementar generación de PDF con todos los detalles
    - Implementar exportación de datos en formato JSON
    - Integrar con el sistema de descarga del navegador
    - _Requerimientos: 8.1, 8.2_

  - [ ]* 12.2 Escribir prueba unitaria para generación de PDF
    - Verificar que se genere un PDF válido
    - _Requerimientos: 8.1_

  - [ ]* 12.3 Escribir prueba de propiedad para completitud de PDF
    - **Propiedad 20: Completitud de datos en PDF**
    - **Valida: Requerimientos 8.2**

- [ ] 13. Implementar diseño responsivo y optimizaciones
  - [x] 13.1 Optimizar interfaz para dispositivos móviles
    - Implementar diseño adaptativo para pantallas pequeñas
    - Optimizar tablas para scroll horizontal en móvil
    - Implementar gestos táctiles para navegación
    - _Requerimientos: 10.1, 10.4, 10.5_

  - [x] 13.2 Optimizar interfaz para tablet y escritorio
    - Aprovechar espacio adicional en tablets
    - Mostrar interfaz completa en escritorio
    - Implementar atajos de teclado
    - _Requerimientos: 10.2, 10.3_

- [ ] 14. Integración final y pruebas de sistema
  - [x] 14.1 Integrar módulo con PWA existente
    - Integrar con el sistema de navegación existente
    - Integrar con el sistema de autenticación si existe
    - Asegurar consistencia de estilos con Tailwind CSS
    - Verificar funcionamiento offline de la PWA

  - [ ]* 14.2 Escribir pruebas de integración
    - Probar flujo completo de registro a conciliación
    - Probar persistencia entre sesiones
    - Probar manejo de errores de red

- [x] 15. Checkpoint final - Validación completa del sistema
  - Asegurar que todas las pruebas pasen, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Las pruebas de propiedades validan propiedades universales de corrección
- Las pruebas unitarias validan ejemplos específicos y casos borde
- La implementación sigue un enfoque incremental construyendo desde la base hacia la interfaz