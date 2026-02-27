# Documento de Diseño: Sistema Híbrido de Control de Jornadas Laborales

## Overview

Este documento define el diseño técnico para implementar un Sistema Híbrido de Control de Jornadas Laborales en la aplicación PWA de gestión de flotas de taxi. El sistema permitirá a los taxistas registrar sus jornadas mediante fichaje digital, gestionar pausas, visualizar historial y generar reportes de productividad. Los patrones podrán supervisar las jornadas de toda su flota.

### Objetivos del Sistema

- Proporcionar fichaje digital simple y confiable para inicio/fin de jornadas
- Gestionar pausas durante jornadas activas con cálculo automático de horas efectivas
- Mostrar estado de jornada en tiempo real con timer actualizado cada segundo
- Vincular servicios automáticamente a jornadas activas
- Generar reportes de productividad con métricas de ingresos por hora
- Permitir supervisión de flota completa para patrones
- Exportar detalles de jornadas a PDF
- Integrar con sistema de conciliaciones existente

### Alcance

El sistema se implementará como una extensión del sistema existente de gestión de flotas, reutilizando componentes y patrones establecidos (DashboardView, FABButton, ReportsView, adapters). Utilizará LocalStorage para persistencia de datos en formato JSON, manteniendo consistencia con la arquitectura actual.

## Architecture

### High-Level Architecture

El sistema sigue la arquitectura existente de la aplicación con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DashboardView│  │ FABButton    │  │ ReportsView  │      │
│  │ (Extended)   │  │ (Extended)   │  │ (Extended)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │WorkShiftMgr  │  │ShiftHistory  │  │ShiftDetail   │      │
│  │              │  │View          │  │Modal         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           WorkShiftAdapter                           │   │
│  │  - Gestión de jornadas (CRUD)                        │   │
│  │  - Cálculo de horas efectivas                        │   │
│  │  - Vinculación de servicios                          │   │
│  │  - Filtrado por rol (TAXISTA/PATRON)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LocalStorage (JSON)                        │   │
│  │  - taxi_work_shifts: Array<WorkShift>               │   │
│  │  - taxi_services: Array<Service> (existing)         │   │
│  │  - taxi_users: Array<User> (existing)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```


### Component Interaction Flow

```
Usuario presiona "Iniciar Jornada"
    │
    ▼
FABButton / WorkShiftManager
    │
    ▼
WorkShiftAdapter.startShift()
    │
    ├─► Validar: no existe jornada activa
    ├─► Crear registro con timestamp
    ├─► Guardar en LocalStorage
    └─► Actualizar UI
    │
    ▼
DashboardView muestra jornada activa
    │
    ├─► Timer en tiempo real (actualización cada 1s)
    ├─► Botones: Pausa / Finalizar
    └─► Lista de pausas
```

### Technology Stack

- **Frontend Framework**: Ionic Framework (Web Components)
- **UI Components**: Ionic Components (ion-card, ion-button, ion-modal, etc.)
- **Data Persistence**: LocalStorage (JSON serialization)
- **Real-time Updates**: setInterval para timer (1000ms)
- **PDF Generation**: jsPDF library (ya disponible en el proyecto)
- **Charts**: Chart.js (ya disponible para reportes)
- **Date/Time**: JavaScript Date API con zona horaria local

### Integration Points

1. **AuthAdapter**: Obtener usuario actual y rol para filtrado
2. **ReconcileAdapter**: Vincular servicios a jornadas activas
3. **DashboardView**: Mostrar tarjeta de jornada activa
4. **FABButton**: Agregar opciones de fichaje rápido
5. **ReportsView**: Incluir métricas de horas trabajadas
6. **ReconciliationView**: Mostrar horas efectivas en conciliaciones

## Components and Interfaces

### WorkShiftAdapter

Adaptador principal para gestión de jornadas laborales. Sigue el patrón establecido por ReconcileAdapter.

**Responsabilidades**:
- CRUD de jornadas (crear, leer, actualizar, eliminar)
- Validación de integridad de jornadas
- Cálculo de horas efectivas
- Filtrado por rol (TAXISTA/PATRON)
- Vinculación de servicios a jornadas activas

**Métodos Públicos**:

```javascript
class WorkShiftAdapter {
  constructor(authAdapter)
  
  // Gestión de jornadas
  async startShift(): Promise<WorkShift>
  async endShift(shiftId: string): Promise<WorkShift>
  async pauseShift(shiftId: string): Promise<WorkShift>
  async resumeShift(shiftId: string): Promise<WorkShift>
  
  // Consultas
  async getActiveShift(): Promise<WorkShift | null>
  async getShiftHistory(filters?: ShiftFilters): Promise<WorkShift[]>
  async getShiftById(shiftId: string): Promise<WorkShift | null>
  
  // Cálculos
  calculateEffectiveHours(shift: WorkShift): number
  calculateTotalPauseTime(shift: WorkShift): number
  
  // Vinculación de servicios
  async linkServiceToActiveShift(serviceId: string): Promise<void>
  async getShiftServices(shiftId: string): Promise<Service[]>
  
  // Validaciones
  validateShiftIntegrity(shift: WorkShift): ValidationResult
}
```


### WorkShiftManager Component

Componente UI para gestión de fichaje en el dashboard. Muestra el estado actual de la jornada y proporciona controles de fichaje.

**Responsabilidades**:
- Renderizar tarjeta de jornada activa en dashboard
- Mostrar timer en tiempo real
- Proporcionar botones de control (Iniciar, Pausar, Reanudar, Finalizar)
- Actualizar UI cada segundo mientras hay jornada activa
- Mostrar lista de pausas con duraciones

**Métodos Públicos**:

```javascript
class WorkShiftManager {
  constructor(authAdapter, workShiftAdapter)
  
  // Renderizado
  async render(containerId: string): Promise<void>
  renderActiveShift(shift: WorkShift): string
  renderShiftControls(shift: WorkShift): string
  
  // Acciones de fichaje
  async handleStartShift(): Promise<void>
  async handleEndShift(): Promise<void>
  async handlePauseShift(): Promise<void>
  async handleResumeShift(): Promise<void>
  
  // Timer en tiempo real
  startTimer(): void
  stopTimer(): void
  updateTimerDisplay(): void
  
  // Utilidades
  formatDuration(milliseconds: number): string
  formatTime(isoString: string): string
}
```

**UI Structure**:

```html
<ion-card id="active-shift-card">
  <ion-card-header>
    <ion-card-title>
      <ion-icon name="time"></ion-icon>
      Jornada Activa
    </ion-card-title>
    <ion-badge color="success">Trabajando</ion-badge>
  </ion-card-header>
  
  <ion-card-content>
    <!-- Timer en tiempo real -->
    <div class="shift-timer">
      <div class="timer-display">08:45:32</div>
      <div class="timer-label">Tiempo transcurrido</div>
    </div>
    
    <!-- Información de jornada -->
    <ion-list>
      <ion-item>
        <ion-label>Inicio</ion-label>
        <ion-note slot="end">09:00</ion-note>
      </ion-item>
      <ion-item>
        <ion-label>Horas efectivas</ion-label>
        <ion-note slot="end" color="success">08:15:32</ion-note>
      </ion-item>
    </ion-list>
    
    <!-- Lista de pausas -->
    <div class="pause-list">
      <h4>Pausas (2)</h4>
      <ion-chip>10:30 - 10:45 (15 min)</ion-chip>
      <ion-chip>13:00 - 13:15 (15 min)</ion-chip>
    </div>
    
    <!-- Botones de control -->
    <ion-button expand="block" color="warning">
      <ion-icon slot="start" name="pause"></ion-icon>
      Pausar
    </ion-button>
    <ion-button expand="block" color="danger">
      <ion-icon slot="start" name="stop"></ion-icon>
      Finalizar Jornada
    </ion-button>
  </ion-card-content>
</ion-card>
```


### ShiftHistoryView Component

Componente modal para visualizar historial de jornadas completadas con filtros por fecha.

**Responsabilidades**:
- Mostrar lista de jornadas completadas
- Filtrar por rango de fechas
- Ordenar por fecha descendente
- Mostrar resumen de cada jornada
- Permitir ver detalle de jornada individual
- Exportar jornada a PDF

**Métodos Públicos**:

```javascript
class ShiftHistoryView {
  constructor(authAdapter, workShiftAdapter, reconcileAdapter)
  
  // Modal
  async show(): Promise<void>
  async createModal(): Promise<HTMLIonModalElement>
  
  // Carga de datos
  async loadShiftHistory(filters?: ShiftFilters): Promise<void>
  
  // Renderizado
  renderShiftList(shifts: WorkShift[]): string
  renderShiftCard(shift: WorkShift): string
  renderFilters(): string
  
  // Acciones
  async handleFilterChange(): Promise<void>
  async handleShiftClick(shiftId: string): Promise<void>
  async handleExportPDF(shiftId: string): Promise<void>
  
  // Utilidades
  calculateShiftStats(shift: WorkShift): ShiftStats
}
```

**UI Structure**:

```html
<ion-modal>
  <ion-header>
    <ion-toolbar color="primary">
      <ion-title>Historial de Jornadas</ion-title>
      <ion-buttons slot="end">
        <ion-button onclick="this.closest('ion-modal').dismiss()">
          <ion-icon name="close"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
    
    <!-- Filtros de fecha -->
    <ion-toolbar>
      <ion-grid>
        <ion-row>
          <ion-col size="5">
            <ion-item>
              <ion-label position="stacked">Desde</ion-label>
              <ion-input type="datetime-local" id="filter-start"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="5">
            <ion-item>
              <ion-label position="stacked">Hasta</ion-label>
              <ion-input type="datetime-local" id="filter-end"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="2">
            <ion-button expand="block" id="filter-btn">
              <ion-icon name="funnel"></ion-icon>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-toolbar>
  </ion-header>
  
  <ion-content class="ion-padding">
    <!-- Lista de jornadas -->
    <div id="shift-list">
      <!-- Tarjeta de jornada -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Lunes, 15 Enero 2024</ion-card-title>
          <ion-card-subtitle>09:00 - 17:30</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-grid>
            <ion-row>
              <ion-col size="6">
                <div class="stat-label">Duración Total</div>
                <div class="stat-value">8h 30m</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Horas Efectivas</div>
                <div class="stat-value">8h 00m</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Pausas</div>
                <div class="stat-value">2 (30m)</div>
              </ion-col>
              <ion-col size="6">
                <div class="stat-label">Servicios</div>
                <div class="stat-value">12</div>
              </ion-col>
              <ion-col size="12">
                <div class="stat-label">Ingresos</div>
                <div class="stat-value">€245.50</div>
              </ion-col>
            </ion-row>
          </ion-grid>
          
          <ion-button expand="block" size="small">
            Ver Detalle
          </ion-button>
          <ion-button expand="block" size="small" color="secondary">
            <ion-icon slot="start" name="download"></ion-icon>
            Exportar PDF
          </ion-button>
        </ion-card-content>
      </ion-card>
    </div>
  </ion-content>
</ion-modal>
```


### ShiftDetailModal Component

Modal para mostrar detalle completo de una jornada individual.

**Responsabilidades**:
- Mostrar información completa de jornada
- Listar todas las pausas con timestamps
- Mostrar servicios realizados durante la jornada
- Calcular y mostrar métricas de productividad
- Permitir exportar a PDF

**Métodos Públicos**:

```javascript
class ShiftDetailModal {
  constructor(workShiftAdapter, reconcileAdapter)
  
  // Modal
  async show(shiftId: string): Promise<void>
  async createModal(shift: WorkShift): Promise<HTMLIonModalElement>
  
  // Renderizado
  renderShiftInfo(shift: WorkShift): string
  renderPauseList(pauses: Pause[]): string
  renderServiceList(services: Service[]): string
  renderMetrics(shift: WorkShift, services: Service[]): string
  
  // Exportación
  async exportToPDF(shift: WorkShift): Promise<void>
}
```

### FABButton Extension

Extensión del componente FABButton existente para incluir opciones de fichaje.

**Nuevas Opciones**:
- "Iniciar Jornada" (cuando no hay jornada activa)
- "Pausar Jornada" (cuando hay jornada activa)
- "Reanudar Jornada" (cuando jornada está pausada)
- "Finalizar Jornada" (cuando hay jornada activa)

**Implementación**:

```javascript
// En FABButton.showActionSheet()
async showActionSheet() {
  const buttons = [];
  
  // Obtener estado de jornada activa
  const activeShift = await workShiftAdapter.getActiveShift();
  
  if (!activeShift) {
    buttons.push({
      text: 'Iniciar Jornada',
      icon: 'play',
      handler: () => this.handleStartShift()
    });
  } else if (activeShift.status === 'active') {
    buttons.push({
      text: 'Pausar Jornada',
      icon: 'pause',
      handler: () => this.handlePauseShift()
    });
    buttons.push({
      text: 'Finalizar Jornada',
      icon: 'stop',
      handler: () => this.handleEndShift()
    });
  } else if (activeShift.status === 'paused') {
    buttons.push({
      text: 'Reanudar Jornada',
      icon: 'play',
      handler: () => this.handleResumeShift()
    });
    buttons.push({
      text: 'Finalizar Jornada',
      icon: 'stop',
      handler: () => this.handleEndShift()
    });
  }
  
  // Agregar opciones existentes (Nuevo Servicio, Nuevo Gasto, etc.)
  buttons.push(...this.getDefaultButtons());
  
  await ActionSheetManager.show('Acciones Rápidas', buttons);
}
```

### DashboardView Extension

Extensión del componente DashboardView existente para mostrar jornada activa.

**Modificaciones**:
- Agregar sección para WorkShiftManager en el dashboard
- Actualizar renderDashboard() para incluir jornada activa
- Agregar listener para eventos de jornada

**Implementación**:

```javascript
// En DashboardView.renderDashboard()
async renderDashboard(user) {
  // ... código existente ...
  
  // Renderizar jornada activa
  if (window.WorkShiftManager) {
    const shiftManager = new WorkShiftManager(this.authAdapter, window.workShiftAdapter);
    await shiftManager.render('shift-manager-container');
  }
  
  // ... resto del código ...
}
```


### ReportsView Extension

Extensión del componente ReportsView existente para incluir métricas de horas trabajadas.

**Nuevas Métricas**:
- Total de horas efectivas trabajadas
- Promedio de ingresos por hora efectiva
- Distribución de jornadas por turno (mañana/tarde/noche)
- Comparativa de productividad entre turnos

**Implementación**:

```javascript
// En ReportsView.calculateAdvancedStats()
calculateAdvancedStats(services, taxistas, allUsers) {
  // ... código existente ...
  
  // Obtener jornadas del período
  const shifts = await workShiftAdapter.getShiftHistory({
    startDate: this.startDate,
    endDate: this.endDate,
    userIds: taxistas.map(t => t.id)
  });
  
  // Calcular horas efectivas totales
  const totalEffectiveHours = shifts.reduce((sum, shift) => {
    return sum + workShiftAdapter.calculateEffectiveHours(shift);
  }, 0);
  
  // Calcular ingreso por hora efectiva
  const incomePerHour = totalEffectiveHours > 0 
    ? totalEarnings / totalEffectiveHours 
    : 0;
  
  // Clasificar jornadas por turno
  const shiftsByTurn = this.classifyShiftsByTurn(shifts);
  
  return {
    ...existingStats,
    totalEffectiveHours,
    incomePerHour,
    shiftsByTurn
  };
}

classifyShiftsByTurn(shifts) {
  return {
    morning: shifts.filter(s => this.getShiftTurn(s) === 'morning'),
    afternoon: shifts.filter(s => this.getShiftTurn(s) === 'afternoon'),
    night: shifts.filter(s => this.getShiftTurn(s) === 'night')
  };
}

getShiftTurn(shift) {
  const startHour = new Date(shift.startTime).getHours();
  if (startHour >= 6 && startHour < 14) return 'morning';
  if (startHour >= 14 && startHour < 22) return 'afternoon';
  return 'night';
}
```

## Data Models

### WorkShift Model

Modelo principal para representar una jornada laboral.

```typescript
interface WorkShift {
  // Identificación
  id: string;                    // Formato: "shift-{timestamp}"
  userId: string;                // ID del taxista
  
  // Timestamps
  startTime: string;             // ISO 8601 con zona horaria
  endTime: string | null;        // ISO 8601 con zona horaria, null si activa
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  
  // Estado
  status: 'active' | 'paused' | 'completed';
  
  // Pausas
  pauses: Pause[];               // Array de pausas
  
  // Metadata
  notes?: string;                // Notas opcionales
}
```

### Pause Model

Modelo para representar una pausa durante la jornada.

```typescript
interface Pause {
  startTime: string;             // ISO 8601 con zona horaria
  endTime: string | null;        // ISO 8601, null si pausa activa
}
```

### ShiftFilters Model

Modelo para filtros de consulta de jornadas.

```typescript
interface ShiftFilters {
  startDate?: string;            // ISO 8601 date
  endDate?: string;              // ISO 8601 date
  userIds?: string[];            // Array de IDs de usuarios
  status?: 'active' | 'paused' | 'completed';
}
```

### ShiftStats Model

Modelo para estadísticas calculadas de una jornada.

```typescript
interface ShiftStats {
  // Tiempos
  totalDuration: number;         // Milisegundos
  totalPauseTime: number;        // Milisegundos
  effectiveHours: number;        // Milisegundos
  
  // Servicios
  serviceCount: number;
  totalIncome: number;           // Euros
  
  // Productividad
  incomePerHour: number;         // Euros por hora efectiva
  servicesPerHour: number;       // Servicios por hora efectiva
}
```


### LocalStorage Schema

El sistema utilizará LocalStorage para persistencia de datos, siguiendo el patrón establecido en la aplicación.

**Clave**: `taxi_work_shifts`

**Estructura**:

```json
[
  {
    "id": "shift-1705320000000",
    "userId": "user-123",
    "startTime": "2024-01-15T09:00:00+01:00",
    "endTime": "2024-01-15T17:30:00+01:00",
    "status": "completed",
    "pauses": [
      {
        "startTime": "2024-01-15T11:00:00+01:00",
        "endTime": "2024-01-15T11:15:00+01:00"
      },
      {
        "startTime": "2024-01-15T14:00:00+01:00",
        "endTime": "2024-01-15T14:30:00+01:00"
      }
    ],
    "notes": "Turno de mañana",
    "createdAt": "2024-01-15T09:00:00+01:00",
    "updatedAt": "2024-01-15T17:30:00+01:00"
  }
]
```

### Service Model Extension

Extensión del modelo Service existente para vincular servicios a jornadas.

**Nuevo Campo**:

```typescript
interface Service {
  // ... campos existentes ...
  shiftId?: string;              // ID de jornada asociada (opcional)
}
```

**Implementación**:

Cuando se crea un servicio, el sistema verificará si existe una jornada activa y agregará el campo `shiftId` automáticamente.

```javascript
// En ReconcileAdapter.createService()
async createService(serviceData) {
  // ... código existente ...
  
  // Vincular a jornada activa si existe
  const activeShift = await workShiftAdapter.getActiveShift();
  if (activeShift) {
    service.shiftId = activeShift.id;
  }
  
  // ... resto del código ...
}
```

## State Management

### Application State

El estado de jornadas se gestiona a través de LocalStorage con sincronización en tiempo real mediante eventos personalizados.

**Estados Posibles**:
- **No Shift**: No hay jornada activa
- **Active Shift**: Jornada en curso, timer corriendo
- **Paused Shift**: Jornada pausada, timer detenido
- **Completed Shift**: Jornada finalizada

**Transiciones de Estado**:

```
No Shift ──[Iniciar Jornada]──> Active Shift
                                      │
                                      ├──[Pausar]──> Paused Shift
                                      │                   │
                                      │              [Reanudar]
                                      │                   │
                                      │<──────────────────┘
                                      │
                                      └──[Finalizar]──> Completed Shift
```

### Event System

El sistema utilizará eventos personalizados para comunicación entre componentes.

**Eventos**:

```javascript
// Jornada iniciada
window.dispatchEvent(new CustomEvent('shift-started', {
  detail: { shift: workShift }
}));

// Jornada pausada
window.dispatchEvent(new CustomEvent('shift-paused', {
  detail: { shift: workShift }
}));

// Jornada reanudada
window.dispatchEvent(new CustomEvent('shift-resumed', {
  detail: { shift: workShift }
}));

// Jornada finalizada
window.dispatchEvent(new CustomEvent('shift-ended', {
  detail: { shift: workShift }
}));

// Timer actualizado (cada segundo)
window.dispatchEvent(new CustomEvent('shift-timer-update', {
  detail: { 
    shiftId: workShift.id,
    elapsed: elapsedMilliseconds,
    effective: effectiveMilliseconds
  }
}));
```

**Listeners**:

```javascript
// En DashboardView
window.addEventListener('shift-started', () => {
  this.refresh();
});

// En FABButton
window.addEventListener('shift-ended', () => {
  this.updateActionSheet();
});

// En WorkShiftManager
window.addEventListener('shift-timer-update', (event) => {
  this.updateTimerDisplay(event.detail);
});
```


## Real-Time Timer Implementation

### Timer Architecture

El timer en tiempo real se implementará usando `setInterval` con actualización cada segundo. El diseño garantiza precisión y eficiencia.

**Componentes del Timer**:

1. **Timer Controller**: Gestiona el ciclo de vida del timer
2. **Time Calculator**: Calcula tiempo transcurrido y efectivo
3. **Display Updater**: Actualiza la UI sin causar parpadeos

### Timer Controller

```javascript
class ShiftTimerController {
  constructor(workShiftAdapter) {
    this.workShiftAdapter = workShiftAdapter;
    this.intervalId = null;
    this.isRunning = false;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000); // Actualizar cada segundo
    
    // Primera actualización inmediata
    this.tick();
  }
  
  stop() {
    if (!this.isRunning) return;
    
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
  }
  
  async tick() {
    const activeShift = await this.workShiftAdapter.getActiveShift();
    
    if (!activeShift) {
      this.stop();
      return;
    }
    
    // Solo actualizar si la jornada está activa (no pausada)
    if (activeShift.status !== 'active') {
      return;
    }
    
    const elapsed = this.calculateElapsed(activeShift);
    const effective = this.calculateEffective(activeShift);
    
    // Emitir evento para actualizar UI
    window.dispatchEvent(new CustomEvent('shift-timer-update', {
      detail: {
        shiftId: activeShift.id,
        elapsed: elapsed,
        effective: effective
      }
    }));
  }
  
  calculateElapsed(shift) {
    const start = new Date(shift.startTime);
    const now = new Date();
    return now - start;
  }
  
  calculateEffective(shift) {
    const elapsed = this.calculateElapsed(shift);
    const pauseTime = this.workShiftAdapter.calculateTotalPauseTime(shift);
    return elapsed - pauseTime;
  }
}
```

### Display Updater

```javascript
class ShiftTimerDisplay {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.lastUpdate = null;
  }
  
  update(elapsed, effective) {
    // Evitar actualizaciones innecesarias
    const newValue = this.formatDuration(effective);
    if (newValue === this.lastUpdate) return;
    
    this.lastUpdate = newValue;
    
    // Actualizar sin causar reflow
    requestAnimationFrame(() => {
      if (this.element) {
        this.element.textContent = newValue;
      }
    });
  }
  
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
```

### Timer Lifecycle

```javascript
// Iniciar timer cuando se carga el dashboard
window.addEventListener('DOMContentLoaded', () => {
  const timerController = new ShiftTimerController(workShiftAdapter);
  
  // Verificar si hay jornada activa
  workShiftAdapter.getActiveShift().then(shift => {
    if (shift && shift.status === 'active') {
      timerController.start();
    }
  });
  
  // Iniciar timer cuando se inicia jornada
  window.addEventListener('shift-started', () => {
    timerController.start();
  });
  
  // Detener timer cuando se finaliza jornada
  window.addEventListener('shift-ended', () => {
    timerController.stop();
  });
  
  // Pausar/reanudar timer
  window.addEventListener('shift-paused', () => {
    // El timer sigue corriendo pero no actualiza (status !== 'active')
  });
  
  window.addEventListener('shift-resumed', () => {
    // El timer vuelve a actualizar
  });
});
```

### Performance Considerations

1. **Throttling**: El timer solo actualiza cuando hay cambios significativos
2. **RequestAnimationFrame**: Usa RAF para actualizaciones de UI suaves
3. **Conditional Updates**: Solo actualiza si el estado es 'active'
4. **Memory Management**: Limpia intervalos cuando no se necesitan
5. **Battery Optimization**: Detiene timer cuando la app está en background (usando Page Visibility API)

```javascript
// Optimización de batería
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    timerController.stop();
  } else {
    // Verificar si hay jornada activa al volver
    workShiftAdapter.getActiveShift().then(shift => {
      if (shift && shift.status === 'active') {
        timerController.start();
      }
    });
  }
});
```


## PDF Export Implementation

### PDF Generation Approach

El sistema utilizará la librería jsPDF (ya disponible en el proyecto) para generar documentos PDF de jornadas individuales.

### PDF Generator Class

```javascript
class ShiftPDFExporter {
  constructor() {
    // jsPDF ya está disponible globalmente
    this.jsPDF = window.jspdf.jsPDF;
  }
  
  async exportShift(shift, services = []) {
    const doc = new this.jsPDF();
    
    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 20;
    
    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Detalle de Jornada Laboral', margin, yPosition);
    yPosition += 15;
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    // Información básica
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    
    const startDate = new Date(shift.startTime);
    const endDate = shift.endTime ? new Date(shift.endTime) : null;
    
    doc.text(`Fecha: ${this.formatDate(startDate)}`, margin, yPosition);
    yPosition += 8;
    
    doc.text(`Hora Inicio: ${this.formatTime(startDate)}`, margin, yPosition);
    yPosition += 8;
    
    if (endDate) {
      doc.text(`Hora Fin: ${this.formatTime(endDate)}`, margin, yPosition);
      yPosition += 8;
    }
    
    // Duración
    const duration = this.calculateDuration(shift);
    doc.text(`Duración Total: ${this.formatDuration(duration)}`, margin, yPosition);
    yPosition += 8;
    
    const effectiveHours = this.calculateEffectiveHours(shift);
    doc.setFont(undefined, 'bold');
    doc.text(`Horas Efectivas: ${this.formatDuration(effectiveHours)}`, margin, yPosition);
    doc.setFont(undefined, 'normal');
    yPosition += 15;
    
    // Pausas
    if (shift.pauses && shift.pauses.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Pausas', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      shift.pauses.forEach((pause, index) => {
        const pauseStart = new Date(pause.startTime);
        const pauseEnd = pause.endTime ? new Date(pause.endTime) : null;
        const pauseDuration = pauseEnd ? pauseEnd - pauseStart : 0;
        
        doc.text(
          `${index + 1}. ${this.formatTime(pauseStart)} - ${pauseEnd ? this.formatTime(pauseEnd) : 'En curso'} (${this.formatDuration(pauseDuration)})`,
          margin + 5,
          yPosition
        );
        yPosition += 7;
      });
      
      yPosition += 10;
    }
    
    // Servicios realizados
    if (services.length > 0) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Servicios Realizados', margin, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      
      let totalIncome = 0;
      
      services.forEach((service, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const serviceTime = new Date(service.datetime || service.date);
        const amount = parseFloat(service.amount || 0);
        totalIncome += amount;
        
        doc.text(
          `${index + 1}. ${this.formatTime(serviceTime)} - €${amount.toFixed(2)}`,
          margin + 5,
          yPosition
        );
        yPosition += 7;
      });
      
      yPosition += 5;
      doc.setFont(undefined, 'bold');
      doc.text(`Total Servicios: ${services.length}`, margin, yPosition);
      yPosition += 7;
      doc.text(`Ingresos Totales: €${totalIncome.toFixed(2)}`, margin, yPosition);
      yPosition += 10;
      
      // Calcular ingreso por hora efectiva
      const hoursEffective = effectiveHours / (1000 * 60 * 60);
      const incomePerHour = hoursEffective > 0 ? totalIncome / hoursEffective : 0;
      doc.text(`Ingreso por Hora Efectiva: €${incomePerHour.toFixed(2)}/h`, margin, yPosition);
    }
    
    // Footer
    yPosition = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generado el ${this.formatDate(new Date())} a las ${this.formatTime(new Date())}`,
      margin,
      yPosition
    );
    
    // Guardar PDF
    const fileName = `jornada_${this.formatDateForFilename(startDate)}.pdf`;
    doc.save(fileName);
  }
  
  // Métodos auxiliares
  formatDate(date) {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  formatTime(date) {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
  
  formatDateForFilename(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  }
  
  calculateDuration(shift) {
    const start = new Date(shift.startTime);
    const end = shift.endTime ? new Date(shift.endTime) : new Date();
    return end - start;
  }
  
  calculateEffectiveHours(shift) {
    const duration = this.calculateDuration(shift);
    const pauseTime = shift.pauses.reduce((total, pause) => {
      if (pause.endTime) {
        const pauseStart = new Date(pause.startTime);
        const pauseEnd = new Date(pause.endTime);
        return total + (pauseEnd - pauseStart);
      }
      return total;
    }, 0);
    return duration - pauseTime;
  }
}
```

### PDF Export Usage

```javascript
// En ShiftDetailModal o ShiftHistoryView
async handleExportPDF(shiftId) {
  try {
    LoadingManager.show('Generando PDF...');
    
    // Obtener jornada
    const shift = await workShiftAdapter.getShiftById(shiftId);
    if (!shift) {
      throw new Error('Jornada no encontrada');
    }
    
    // Obtener servicios de la jornada
    const services = await workShiftAdapter.getShiftServices(shiftId);
    
    // Generar PDF
    const exporter = new ShiftPDFExporter();
    await exporter.exportShift(shift, services);
    
    LoadingManager.hide();
    ToastManager.showSuccess('PDF generado correctamente');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    LoadingManager.hide();
    ToastManager.showError('Error al generar PDF: ' + error.message);
  }
}
```


## Error Handling

### Validation Errors

El sistema implementará validación exhaustiva para prevenir estados inconsistentes:

**Validaciones de Jornada**:
- No permitir iniciar jornada si ya existe una activa o pausada
- No permitir pausar jornada si no está en estado "active"
- No permitir reanudar jornada si no está en estado "paused"
- No permitir finalizar jornada con pausas incompletas (auto-completar)
- Validar que timestamps sean válidos y en orden cronológico

**Mensajes de Error**:

```javascript
const ERROR_MESSAGES = {
  SHIFT_ALREADY_ACTIVE: 'Ya tienes una jornada activa. Finalízala antes de iniciar una nueva.',
  SHIFT_NOT_ACTIVE: 'No hay jornada activa para pausar.',
  SHIFT_NOT_PAUSED: 'La jornada no está pausada.',
  INVALID_TIMESTAMP: 'Timestamp inválido.',
  STORAGE_ERROR: 'Error al guardar en LocalStorage. Verifica el espacio disponible.',
  LOAD_ERROR: 'Error al cargar jornadas. Intenta recargar la aplicación.',
  EXPORT_ERROR: 'Error al exportar PDF. Intenta nuevamente.'
};
```

### Error Recovery

**LocalStorage Errors**:
- Detectar cuota excedida y notificar al usuario
- Implementar limpieza de datos antiguos si es necesario
- Proporcionar opción de exportar datos antes de limpiar

**Network Errors** (futuro):
- Mantener cola de operaciones pendientes
- Reintentar automáticamente cuando se recupere conexión
- Notificar al usuario sobre operaciones pendientes

**Data Corruption**:
- Validar estructura de datos al cargar desde LocalStorage
- Intentar recuperar datos parciales si es posible
- Proporcionar opción de resetear datos si la corrupción es severa

### User Feedback

Todos los errores se mostrarán al usuario mediante:
- **ToastManager**: Para errores no críticos y confirmaciones
- **AlertController**: Para errores críticos que requieren acción del usuario
- **LoadingManager**: Para operaciones largas con indicador de progreso

```javascript
// Ejemplo de manejo de errores
async startShift() {
  try {
    LoadingManager.show('Iniciando jornada...');
    
    // Validar que no exista jornada activa
    const activeShift = await this.getActiveShift();
    if (activeShift) {
      throw new Error(ERROR_MESSAGES.SHIFT_ALREADY_ACTIVE);
    }
    
    // Crear jornada
    const shift = await this.createShift();
    
    LoadingManager.hide();
    ToastManager.showSuccess('Jornada iniciada correctamente');
    
    return shift;
  } catch (error) {
    console.error('Error starting shift:', error);
    LoadingManager.hide();
    ToastManager.showError(error.message);
    throw error;
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several redundancies that can be consolidated:

**Redundancies Identified**:
1. Properties 5.4 and 5.5 both test income calculation - can be combined into one property
2. Properties 13.3 and 13.4 both test JSON serialization round-trip - can be combined
3. Properties 1.4 and 13.1 both test LocalStorage persistence - can be combined
4. Properties 3.5, 7.1, 9.1 all test effective hours calculation - can be combined into one comprehensive property
5. Properties 7.2, 9.3, 10.1 all test income per hour calculation - can be combined
6. Properties 2.1, 2.3, 2.6, 3.1, 3.7 all test UI state based on shift status - can be combined into comprehensive UI state properties
7. Properties 12.3 and 12.4 test state validation for pause/resume - can be combined into one state transition property

**Consolidated Properties**:
After consolidation, we have 45 unique testable properties covering all functional requirements.

### Property 1: Shift Creation with Valid State

*For any* taxista, when they start a new shift, the system should create a shift record with a unique ID, the current timestamp as startTime, status set to "active", an empty pauses array, and the shift should be immediately persisted to LocalStorage under the key "taxi_work_shifts".

**Validates: Requirements 1.1, 1.4, 1.5, 13.1**

### Property 2: Single Active Shift Constraint

*For any* taxista, at any given time, there should be at most one shift with status "active" or "paused" - attempting to start a new shift when one already exists should be rejected with an error.

**Validates: Requirements 1.2, 12.1, 12.2**

### Property 3: Shift Completion Updates State

*For any* active or paused shift, when it is ended, the system should set the endTime to the current timestamp, change the status to "completed", and persist the updated shift to LocalStorage.

**Validates: Requirements 1.3**

### Property 4: Pause Transition from Active

*For any* shift with status "active", when paused, the system should change the status to "paused" and add a new pause object to the pauses array with startTime set to the current timestamp and endTime set to null.

**Validates: Requirements 2.2, 12.3**

### Property 5: Resume Transition from Paused

*For any* shift with status "paused", when resumed, the system should change the status back to "active" and set the endTime of the most recent pause to the current timestamp.

**Validates: Requirements 2.4, 12.4**

### Property 6: Pause Structure Integrity

*For any* completed pause in a shift's pauses array, the pause object should have both startTime and endTime properties, and endTime should be chronologically after startTime.

**Validates: Requirements 2.5**

### Property 7: Auto-Complete Incomplete Pauses

*For any* shift being ended that has a pause with null endTime, the system should automatically set that pause's endTime to the current timestamp before completing the shift.

**Validates: Requirements 12.5, 12.6**

### Property 8: Effective Hours Calculation

*For any* shift, the effective hours should equal the total duration (endTime - startTime) minus the sum of all pause durations, where each pause duration is (pause.endTime - pause.startTime).

**Validates: Requirements 3.5, 7.1, 9.1**

### Property 9: Shift History Filtering by User

*For any* taxista, when they request their shift history, the system should return only shifts where userId matches their ID and status is "completed".

**Validates: Requirements 4.1**

### Property 10: Shift History Sorting

*For any* list of shifts returned by the history view, the shifts should be sorted by startTime in descending order (most recent first).

**Validates: Requirements 4.2**

### Property 11: Date Range Filtering

*For any* date range filter applied to shift history, only shifts where startTime falls within the specified range (inclusive) should be returned.

**Validates: Requirements 4.3, 7.6**

### Property 12: Service Linking to Active Shift

*For any* service created while a shift with status "active" exists for the same user, the service should have its shiftId field set to the ID of that active shift.

**Validates: Requirements 5.1, 5.2**

### Property 13: Shift Income Calculation

*For any* shift, the total income should equal the sum of the amount field of all services where shiftId matches the shift's ID.

**Validates: Requirements 5.3, 5.4, 5.5**

### Property 14: PDF Export Completeness

*For any* shift exported to PDF, the generated PDF content should include the shift's date, start time, end time, total duration, list of all pauses, effective hours, list of all linked services, and total income.

**Validates: Requirements 6.2**

### Property 15: PDF Filename Format

*For any* shift exported to PDF, the filename should match the pattern "jornada_YYYY-MM-DD_HH-MM.pdf" where the date and time correspond to the shift's startTime.

**Validates: Requirements 6.5**

### Property 16: Income Per Hour Calculation

*For any* report or reconciliation period, the income per hour should equal the total income divided by the total effective hours (in hours), or display "N/A" if total effective hours is zero.

**Validates: Requirements 7.2, 9.3, 10.1, 10.5**

### Property 17: Services Per Hour Calculation

*For any* report period, the services per hour should equal the total number of services divided by the total effective hours (in hours).

**Validates: Requirements 10.3**

### Property 18: Shift Turn Classification

*For any* shift, it should be classified into exactly one turn category based on the hour of startTime: "morning" if hour is 6-13, "afternoon" if hour is 14-21, or "night" if hour is 22-5.

**Validates: Requirements 7.4**

### Property 19: Patron Fleet Visibility

*For any* patron user, when they access shift history, the system should return shifts from all taxistas where the taxista's patronId matches the patron's ID, plus the patron's own shifts.

**Validates: Requirements 8.1**

### Property 20: Patron Taxista Filtering

*For any* patron applying a taxista filter, only shifts where userId matches the selected taxista's ID should be displayed.

**Validates: Requirements 8.3**

### Property 21: Fleet Statistics Aggregation

*For any* patron viewing fleet statistics, the aggregated totals (services, income, effective hours) should equal the sum of the corresponding values from all associated taxistas' shifts.

**Validates: Requirements 8.5**

### Property 22: Reconciliation Hours Integration

*For any* reconciliation generated for a period, the total effective hours should equal the sum of effective hours from all shifts within that period for the user.

**Validates: Requirements 9.1, 9.2**

### Property 23: Productivity Ranking

*For any* set of shifts in a report, the shift with the highest income per effective hour should be identified as the most productive, and the one with the lowest should be identified as the least productive.

**Validates: Requirements 10.4**

### Property 24: Decimal Precision for Income Per Hour

*For any* displayed income per hour value, it should be formatted with exactly 2 decimal places.

**Validates: Requirements 10.2**

### Property 25: LocalStorage Persistence Round-Trip

*For any* shift created or modified, serializing it to JSON, storing it in LocalStorage, then loading and deserializing it should produce an equivalent shift object with all fields preserved.

**Validates: Requirements 13.2, 13.3, 13.4, 13.5**

### Property 26: Shift Data Structure Completeness

*For any* shift stored in LocalStorage, it should have all required fields: id, userId, startTime, status, pauses (array), createdAt, and updatedAt.

**Validates: Requirements 13.6**

### Property 27: Timestamp ISO 8601 Format

*For any* timestamp stored in a shift (startTime, endTime, pause times), it should be in ISO 8601 format with timezone information.

**Validates: Requirements 15.1, 15.2**

### Property 28: Date Display Format

*For any* date displayed in the UI, it should match the format "DD/MM/YYYY HH:MM" for the user's local timezone.

**Validates: Requirements 15.3**

### Property 29: Duration Display Format

*For any* duration displayed in the UI, it should match either "HH:MM:SS" format or "X horas Y minutos" format.

**Validates: Requirements 15.4**

### Property 30: Timer Update Frequency

*For any* active shift, the timer display should update at least once per second while the shift status is "active".

**Validates: Requirements 3.3**

### Property 31: Dashboard Active Shift Visibility

*For any* user with a shift in status "active" or "paused", the dashboard should display the active shift card; when no such shift exists, the card should not be displayed.

**Validates: Requirements 3.1, 3.7**

### Property 32: Shift Status Visual Indicator

*For any* active shift displayed, the status indicator should show "Trabajando" with green color when status is "active", and "En pausa" with orange color when status is "paused".

**Validates: Requirements 3.6**

### Property 33: Pause List Display Completeness

*For any* shift displayed with pauses, all pauses in the pauses array should be shown in the UI with their calculated durations.

**Validates: Requirements 3.4**

### Property 34: Shift History Display Completeness

*For any* shift in the history list, the display should include date, start time, end time, total duration, pause count, and effective hours.

**Validates: Requirements 4.5**

### Property 35: Taxista Information in Patron View

*For any* shift displayed in patron's history view, the display should include the taxista's name and numero de taxista.

**Validates: Requirements 8.4**

### Property 36: FAB Options Based on Shift State

*For any* user, when no active shift exists, the FAB should show "Iniciar Jornada" option; when an active shift exists with status "active", it should show "Pausar" and "Finalizar" options; when status is "paused", it should show "Reanudar" and "Finalizar" options.

**Validates: Requirements 11.2, 11.3, 11.5**

### Property 37: FAB Action Execution

*For any* shift action selected from the FAB menu, the corresponding shift operation (start, pause, resume, or end) should be executed and the shift state should be updated accordingly.

**Validates: Requirements 11.4**

### Property 38: Start Time Display Format

*For any* shift displayed in the dashboard, the start time should be shown in a human-readable format in the user's local timezone.

**Validates: Requirements 3.2**

### Property 39: Chart Data Accuracy for Reports

*For any* report period, the data points in the hours worked chart should match the calculated effective hours for each day in the period.

**Validates: Requirements 7.3**

### Property 40: Turn Productivity Comparison

*For any* report showing turn comparisons, the productivity metrics (income per hour, services per hour) should be calculated separately for each turn category and displayed for comparison.

**Validates: Requirements 7.5**

### Property 41: Taxista Productivity Comparison

*For any* patron viewing taxista comparisons, the productivity metrics should be calculated separately for each taxista and allow comparison between them.

**Validates: Requirements 8.6**

### Property 42: Reconciliation Income Per Hour Ratio

*For any* reconciliation, the income per hour ratio should be calculated as total income divided by total effective hours from shifts in the reconciliation period.

**Validates: Requirements 9.4**

### Property 43: Unique Shift IDs

*For any* set of shifts in the system, all shift IDs should be unique - no two shifts should have the same ID.

**Validates: Requirements 1.5**

### Property 44: Immediate LocalStorage Update

*For any* shift modification (start, pause, resume, end), the updated shift should be written to LocalStorage immediately before the operation returns.

**Validates: Requirements 13.5**

### Property 45: Shift Services List Accuracy

*For any* shift detail view, the list of services displayed should include all and only services where the shiftId field matches the shift's ID.

**Validates: Requirements 5.3**


## Testing Strategy

### Dual Testing Approach

El sistema utilizará una estrategia de testing dual que combina unit tests y property-based tests para garantizar cobertura completa:

**Unit Tests**:
- Verificar ejemplos específicos y casos edge
- Probar integración entre componentes
- Validar manejo de errores
- Verificar comportamiento de UI

**Property-Based Tests**:
- Verificar propiedades universales con inputs aleatorios
- Ejecutar mínimo 100 iteraciones por propiedad
- Generar datos de prueba variados (shifts, pausas, servicios)
- Validar invariantes del sistema

### Property-Based Testing Configuration

**Librería**: fast-check (ya disponible en el proyecto)

**Configuración Estándar**:

```javascript
import fc from 'fast-check';

// Configuración base para todos los tests de propiedades
const PBT_CONFIG = {
  numRuns: 100,  // Mínimo 100 iteraciones
  verbose: true,
  seed: Date.now()
};

// Ejemplo de test de propiedad
describe('Work Shift Tracking - Property Tests', () => {
  it('Property 1: Shift Creation with Valid State', () => {
    fc.assert(
      fc.property(
        fc.record({
          userId: fc.uuid(),
          nombre: fc.string({ minLength: 1, maxLength: 50 })
        }),
        (taxista) => {
          // Feature: work-shift-tracking, Property 1: Shift creation with valid state
          const adapter = new WorkShiftAdapter(authAdapter);
          const shift = adapter.startShift(taxista.userId);
          
          // Verificar estructura
          expect(shift).toHaveProperty('id');
          expect(shift).toHaveProperty('userId', taxista.userId);
          expect(shift).toHaveProperty('startTime');
          expect(shift).toHaveProperty('status', 'active');
          expect(shift).toHaveProperty('pauses');
          expect(Array.isArray(shift.pauses)).toBe(true);
          expect(shift.pauses.length).toBe(0);
          
          // Verificar persistencia
          const stored = JSON.parse(localStorage.getItem('taxi_work_shifts'));
          expect(stored).toContainEqual(shift);
        }
      ),
      PBT_CONFIG
    );
  });
});
```

### Test Generators

**Generadores de Datos**:

```javascript
// Generador de taxistas
const taxistaArb = fc.record({
  id: fc.uuid(),
  nombre: fc.string({ minLength: 1, maxLength: 50 }),
  numeroTaxista: fc.integer({ min: 1, max: 9999 }).map(n => n.toString().padStart(4, '0')),
  rol: fc.constant('TAXISTA')
});

// Generador de patrones
const patronArb = fc.record({
  id: fc.uuid(),
  nombre: fc.string({ minLength: 1, maxLength: 50 }),
  rol: fc.constant('PATRON')
});

// Generador de timestamps válidos
const timestampArb = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2024-12-31')
}).map(d => d.toISOString());

// Generador de pausas completas
const pauseArb = fc.record({
  startTime: timestampArb,
  endTime: timestampArb
}).filter(p => new Date(p.endTime) > new Date(p.startTime));

// Generador de shifts completos
const completedShiftArb = fc.record({
  id: fc.uuid().map(id => `shift-${id}`),
  userId: fc.uuid(),
  startTime: timestampArb,
  endTime: timestampArb,
  status: fc.constant('completed'),
  pauses: fc.array(pauseArb, { maxLength: 5 }),
  createdAt: timestampArb,
  updatedAt: timestampArb
}).filter(s => new Date(s.endTime) > new Date(s.startTime));

// Generador de servicios
const serviceArb = fc.record({
  id: fc.uuid().map(id => `service-${id}`),
  userId: fc.uuid(),
  amount: fc.float({ min: 5, max: 100, noNaN: true }).map(n => parseFloat(n.toFixed(2))),
  datetime: timestampArb,
  shiftId: fc.option(fc.uuid().map(id => `shift-${id}`), { nil: null })
});
```

### Unit Test Coverage

**Componentes a Testear**:

1. **WorkShiftAdapter**:
   - CRUD operations
   - State transitions
   - Validation logic
   - Error handling
   - Role-based filtering

2. **WorkShiftManager**:
   - UI rendering
   - Timer functionality
   - Event handling
   - User interactions

3. **ShiftHistoryView**:
   - Data loading
   - Filtering
   - Sorting
   - Modal interactions

4. **ShiftDetailModal**:
   - Detail rendering
   - Service listing
   - Metrics calculation

5. **ShiftPDFExporter**:
   - PDF generation
   - Content formatting
   - Filename generation

6. **Integration Tests**:
   - Service linking to shifts
   - Dashboard integration
   - FAB button integration
   - Reports integration
   - Reconciliation integration

### Example Unit Tests

```javascript
describe('WorkShiftAdapter', () => {
  let adapter;
  let authAdapter;
  
  beforeEach(() => {
    localStorage.clear();
    authAdapter = new AuthAdapter();
    adapter = new WorkShiftAdapter(authAdapter);
  });
  
  describe('startShift', () => {
    it('should create a new shift with correct initial state', async () => {
      const shift = await adapter.startShift();
      
      expect(shift.id).toBeDefined();
      expect(shift.status).toBe('active');
      expect(shift.startTime).toBeDefined();
      expect(shift.endTime).toBeNull();
      expect(shift.pauses).toEqual([]);
    });
    
    it('should reject if active shift already exists', async () => {
      await adapter.startShift();
      
      await expect(adapter.startShift()).rejects.toThrow(
        'Ya tienes una jornada activa'
      );
    });
  });
  
  describe('pauseShift', () => {
    it('should add pause to active shift', async () => {
      const shift = await adapter.startShift();
      const paused = await adapter.pauseShift(shift.id);
      
      expect(paused.status).toBe('paused');
      expect(paused.pauses.length).toBe(1);
      expect(paused.pauses[0].startTime).toBeDefined();
      expect(paused.pauses[0].endTime).toBeNull();
    });
    
    it('should reject if shift is not active', async () => {
      const shift = await adapter.startShift();
      await adapter.pauseShift(shift.id);
      
      await expect(adapter.pauseShift(shift.id)).rejects.toThrow();
    });
  });
  
  describe('calculateEffectiveHours', () => {
    it('should calculate effective hours correctly', () => {
      const shift = {
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T17:00:00Z',
        pauses: [
          {
            startTime: '2024-01-15T11:00:00Z',
            endTime: '2024-01-15T11:30:00Z'
          },
          {
            startTime: '2024-01-15T14:00:00Z',
            endTime: '2024-01-15T14:30:00Z'
          }
        ]
      };
      
      const effective = adapter.calculateEffectiveHours(shift);
      
      // 8 hours total - 1 hour pauses = 7 hours
      expect(effective).toBe(7 * 60 * 60 * 1000);
    });
    
    it('should handle shifts with no pauses', () => {
      const shift = {
        startTime: '2024-01-15T09:00:00Z',
        endTime: '2024-01-15T17:00:00Z',
        pauses: []
      };
      
      const effective = adapter.calculateEffectiveHours(shift);
      
      expect(effective).toBe(8 * 60 * 60 * 1000);
    });
  });
});
```

### Test Tagging Convention

Todos los property-based tests deben incluir un comentario con el formato:

```javascript
// Feature: work-shift-tracking, Property {number}: {property description}
```

Ejemplo:

```javascript
it('Property 8: Effective Hours Calculation', () => {
  fc.assert(
    fc.property(completedShiftArb, (shift) => {
      // Feature: work-shift-tracking, Property 8: Effective hours calculation
      const adapter = new WorkShiftAdapter(authAdapter);
      const effective = adapter.calculateEffectiveHours(shift);
      
      const totalDuration = new Date(shift.endTime) - new Date(shift.startTime);
      const pauseTime = shift.pauses.reduce((sum, pause) => {
        return sum + (new Date(pause.endTime) - new Date(pause.startTime));
      }, 0);
      
      expect(effective).toBe(totalDuration - pauseTime);
    }),
    PBT_CONFIG
  );
});
```

### Continuous Integration

Los tests se ejecutarán automáticamente en CI/CD:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:pbt": "jest --testNamePattern='Property'",
    "test:unit": "jest --testNamePattern='should'"
  }
}
```

### Coverage Goals

- **Unit Test Coverage**: Mínimo 80% de cobertura de código
- **Property Test Coverage**: Todas las propiedades del diseño deben tener un test
- **Integration Test Coverage**: Todos los puntos de integración deben estar cubiertos
- **Edge Case Coverage**: Todos los casos edge identificados deben tener tests específicos

