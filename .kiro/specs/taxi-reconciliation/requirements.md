# Documento de Requerimientos - Conciliación de Taxista

## Introducción

El módulo de conciliación de taxista permite a los conductores y patrones generar reportes detallados de ingresos, gastos, comisiones y distribuciones para períodos específicos. El sistema debe manejar múltiples formas de pago (efectivo, tarjeta, aplicaciones), calcular comisiones automáticamente y generar conciliaciones completas con totalizaciones y desgloses.

## Glosario

- **Sistema_Conciliacion**: El módulo de conciliación dentro de la PWA de taxi
- **Servicio**: Un viaje realizado por el taxista con su respectivo cobro
- **Conciliacion**: Reporte detallado de ingresos, gastos y distribuciones para un período
- **Patron**: Propietario del vehículo que recibe una parte de los ingresos
- **Taxista**: Conductor que opera el vehículo y recibe una parte de los ingresos
- **Freenow**: Plataforma de aplicación de taxi que cobra comisiones
- **Articulados**: Servicios especiales con tarifas diferenciadas
- **Liquidacion**: Cálculo final de dinero a distribuir entre las partes

## Requerimientos

### Requerimiento 1: Gestión de Servicios para Conciliación

**Historia de Usuario:** Como taxista, quiero registrar todos mis servicios con sus detalles de pago, para que puedan ser incluidos en la conciliación mensual.

#### Criterios de Aceptación

1. CUANDO un taxista registra un servicio, EL Sistema_Conciliacion DEBERÁ almacenar fecha, hora de inicio, total del servicio, tipo de pago y si es articulado
2. CUANDO se registra un pago con tarjeta, EL Sistema_Conciliacion DEBERÁ categorizar el monto como "Pago con tarjeta"
3. CUANDO se registra un pago por aplicación, EL Sistema_Conciliacion DEBERÁ categorizar el monto como "Pago APP"
4. CUANDO se registra un pago en efectivo, EL Sistema_Conciliacion DEBERÁ categorizar el monto como "Pago en efectivo"
5. CUANDO un servicio es marcado como articulado, EL Sistema_Conciliacion DEBERÁ incluirlo en el total de "Articulados"

### Requerimiento 2: Cálculo de Comisiones Freenow

**Historia de Usuario:** Como patrón, quiero que el sistema calcule automáticamente las comisiones de Freenow, para tener un control preciso de los costos de la plataforma.

#### Criterios de Aceptación

1. CUANDO se procesa un servicio de Freenow, EL Sistema_Conciliacion DEBERÁ calcular la comisión según el porcentaje configurado
2. CUANDO se calcula el total Freenow, EL Sistema_Conciliacion DEBERÁ restar la comisión del total del servicio
3. CUANDO hay incentivos de Freenow, EL Sistema_Conciliacion DEBERÁ sumarlos al total neto de Freenow
4. CUANDO hay propinas de Freenow, EL Sistema_Conciliacion DEBERÁ incluirlas en el cálculo de extras

### Requerimiento 3: Distribución de Ingresos

**Historia de Usuario:** Como patrón, quiero que el sistema calcule automáticamente la distribución 60/40 de los ingresos, para facilitar la liquidación con el taxista.

#### Criterios de Aceptación

1. CUANDO se genera una conciliación, EL Sistema_Conciliacion DEBERÁ calcular el 60% de los ingresos netos para el patrón
2. CUANDO se genera una conciliación, EL Sistema_Conciliacion DEBERÁ calcular el 40% de los ingresos netos para el taxista
3. CUANDO hay efectivo neto, EL Sistema_Conciliacion DEBERÁ aplicar la distribución 60/40 al monto
4. CUANDO hay ingresos de Freenow netos, EL Sistema_Conciliacion DEBERÁ aplicar la distribución 60/40 al monto

### Requerimiento 4: Gestión de Gastos

**Historia de Usuario:** Como taxista, quiero registrar todos los gastos del vehículo, para que sean descontados en la conciliación final.

#### Criterios de Aceptación

1. CUANDO un taxista registra un gasto, EL Sistema_Conciliacion DEBERÁ almacenar fecha, concepto y monto
2. CUANDO se genera una conciliación, EL Sistema_Conciliacion DEBERÁ sumar todos los gastos del período
3. CUANDO se calculan los totales netos, EL Sistema_Conciliacion DEBERÁ restar los gastos de los ingresos brutos
4. CUANDO un gasto es eliminado, EL Sistema_Conciliacion DEBERÁ recalcular automáticamente los totales

### Requerimiento 5: Generación de Conciliaciones por Período

**Historia de Usuario:** Como patrón, quiero generar conciliaciones para períodos específicos, para tener reportes organizados por fechas.

#### Criterios de Aceptación

1. CUANDO un usuario selecciona un rango de fechas, EL Sistema_Conciliacion DEBERÁ mostrar todos los servicios del período
2. CUANDO se genera una conciliación, EL Sistema_Conciliacion DEBERÁ agrupar los servicios por día
3. CUANDO se muestra una conciliación, EL Sistema_Conciliacion DEBERÁ calcular totales diarios y totales generales
4. CUANDO no hay servicios en el período, EL Sistema_Conciliacion DEBERÁ mostrar una conciliación vacía con totales en cero
5. CUANDO se actualiza un servicio del período, EL Sistema_Conciliacion DEBERÁ recalcular automáticamente la conciliación

### Requerimiento 6: Cálculo de Efectivo y Billetes

**Historia de Usuario:** Como taxista, quiero registrar el desglose de billetes del efectivo recaudado, para facilitar el conteo y la liquidación.

#### Criterios de Aceptación

1. CUANDO un taxista ingresa cantidades de billetes, EL Sistema_Conciliacion DEBERÁ calcular automáticamente el total
2. CUANDO se modifica la cantidad de un tipo de billete, EL Sistema_Conciliacion DEBERÁ recalcular el total inmediatamente
3. CUANDO el total de billetes no coincide con el efectivo neto, EL Sistema_Conciliacion DEBERÁ mostrar la diferencia
4. CUANDO se guarda el desglose de billetes, EL Sistema_Conciliacion DEBERÁ almacenarlo junto con la conciliación

### Requerimiento 7: Liquidación Final

**Historia de Usuario:** Como patrón, quiero ver el cálculo final de liquidación para cada parte, para realizar los pagos correspondientes.

#### Criterios de Aceptación

1. CUANDO se completa una conciliación, EL Sistema_Conciliacion DEBERÁ mostrar el monto a liquidar para el taxista
2. CUANDO se completa una conciliación, EL Sistema_Conciliacion DEBERÁ mostrar el monto a liquidar para el patrón
3. CUANDO hay saldo para el exterior, EL Sistema_Conciliacion DEBERÁ calcularlo y mostrarlo por separado
4. CUANDO hay diferencias en los cálculos, EL Sistema_Conciliacion DEBERÁ mostrarlas claramente con explicación

### Requerimiento 8: Exportación y Persistencia

**Historia de Usuario:** Como usuario, quiero exportar las conciliaciones en diferentes formatos, para compartirlas y archivarlas.

#### Criterios de Aceptación

1. CUANDO un usuario solicita exportar una conciliación, EL Sistema_Conciliacion DEBERÁ generar un archivo PDF
2. CUANDO se exporta a PDF, EL Sistema_Conciliacion DEBERÁ incluir todos los detalles, totales y desgloses
3. CUANDO se guarda una conciliación, EL Sistema_Conciliacion DEBERÁ almacenarla en localStorage
4. CUANDO se carga la aplicación, EL Sistema_Conciliacion DEBERÁ recuperar todas las conciliaciones guardadas
5. CUANDO se elimina una conciliación, EL Sistema_Conciliacion DEBERÁ solicitar confirmación del usuario

### Requerimiento 9: Validación y Control de Errores

**Historia de Usuario:** Como usuario, quiero que el sistema valide todos los datos ingresados, para evitar errores en los cálculos.

#### Criterios de Aceptación

1. CUANDO se ingresa un monto negativo, EL Sistema_Conciliacion DEBERÁ rechazar el valor y mostrar un mensaje de error
2. CUANDO se ingresa una fecha inválida, EL Sistema_Conciliacion DEBERÁ rechazar el valor y mostrar un mensaje de error
3. CUANDO faltan datos obligatorios, EL Sistema_Conciliacion DEBERÁ impedir guardar y mostrar los campos requeridos
4. CUANDO hay inconsistencias en los cálculos, EL Sistema_Conciliacion DEBERÁ mostrar advertencias al usuario

### Requerimiento 10: Interfaz de Usuario Responsiva

**Historia de Usuario:** Como usuario, quiero usar la funcionalidad de conciliación en diferentes dispositivos, para acceder desde móvil, tablet o escritorio.

#### Criterios de Aceptación

1. CUANDO se accede desde un dispositivo móvil, EL Sistema_Conciliacion DEBERÁ mostrar una interfaz optimizada para pantallas pequeñas
2. CUANDO se accede desde tablet, EL Sistema_Conciliacion DEBERÁ aprovechar el espacio adicional para mostrar más información
3. CUANDO se accede desde escritorio, EL Sistema_Conciliacion DEBERÁ mostrar la interfaz completa con todas las columnas visibles
4. CUANDO se rota el dispositivo, EL Sistema_Conciliacion DEBERÁ adaptar la interfaz automáticamente
5. CUANDO se usan gestos táctiles, EL Sistema_Conciliacion DEBERÁ responder apropiadamente para navegación y edición