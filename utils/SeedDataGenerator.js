/**
 * SeedDataGenerator
 * Genera datos de prueba realistas:
 *  - 7 jornadas (una por día, los últimos 7 días)
 *  - Día actual: 10 servicios  |  Días anteriores: 5 servicios cada uno
 *  - 1-2 gastos por jornada
 *  - Cada servicio vinculado a su jornada (shiftId)
 *  - Jornadas marcadas como 'completed' (no interfieren con la jornada activa real)
 */

const SeedDataGenerator = (() => {

  // ── Helpers ──────────────────────────────────────────────────────────────

  const rand    = (min, max) => Math.random() * (max - min) + min;
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick    = arr => arr[randInt(0, arr.length - 1)];
  const round2  = n => Math.round(n * 100) / 100;

  /** Devuelve un Date aleatorio dentro del rango [startMs, endMs] */
  function randDateBetween(startMs, endMs) {
    return new Date(startMs + Math.random() * (endMs - startMs));
  }

  function isoDate(d) { return d.toISOString().split('T')[0]; }
  function isoTime(d) { return d.toTimeString().slice(0, 5); }

  // ── Catálogos ─────────────────────────────────────────────────────────────

  const SOURCES         = ['emisora', 'calle', 'uber', 'freenow', 'otro'];
  const SOURCE_WEIGHTS  = [0.30, 0.25, 0.20, 0.15, 0.10];
  const PAYMENT_METHODS = ['efectivo', 'tarjeta', 'app', 'transferencia'];
  const PAYMENT_WEIGHTS = [0.50, 0.30, 0.15, 0.05];

  const ORIGINS = [
    'Aeropuerto T4', 'Estación Atocha', 'Puerta del Sol', 'Gran Vía',
    'Barrio de Salamanca', 'Chamberí', 'Retiro', 'Lavapiés',
    'Malasaña', 'Chueca', 'Moncloa', 'Vallecas',
    'Hospital La Paz', 'IFEMA', 'Estadio Bernabéu', 'Palacio Real'
  ];

  const DESTINATIONS = [
    'Aeropuerto T1', 'Aeropuerto T4', 'Estación Chamartín', 'Estación Atocha',
    'Puerta del Sol', 'Gran Vía', 'Callao', 'Ópera',
    'Nuevos Ministerios', 'Cuatro Torres', 'La Castellana', 'Paseo del Prado',
    'Hospital Gregorio Marañón', 'Hospital Ramón y Cajal', 'IFEMA', 'Barajas'
  ];

  const EXPENSE_CATEGORIES = ['Gasolina', 'Comida', 'Lavado', 'Mantenimiento', 'Peajes', 'Seguro', 'Otro'];

  const EXPENSE_NOTES = {
    'Gasolina':      ['Repostaje completo', 'Repostaje parcial', 'Gasolinera Repsol', 'Gasolinera BP'],
    'Comida':        ['Almuerzo', 'Cena', 'Bocadillo', 'Menú del día'],
    'Lavado':        ['Lavado exterior', 'Lavado completo', 'Aspirado interior'],
    'Mantenimiento': ['Cambio de aceite', 'Revisión ITV', 'Cambio de ruedas', 'Frenos'],
    'Peajes':        ['Autopista A-6', 'Autopista M-30', 'Túnel M-30'],
    'Seguro':        ['Cuota mensual seguro', 'Seguro a todo riesgo'],
    'Otro':          ['Varios', 'Material de limpieza', 'Aparcamiento']
  };

  const EXPENSE_RANGES = {
    'Gasolina':      [40, 90],
    'Comida':        [5, 20],
    'Lavado':        [8, 25],
    'Mantenimiento': [30, 200],
    'Peajes':        [2, 12],
    'Seguro':        [60, 120],
    'Otro':          [5, 40]
  };

  // ── Selección ponderada ───────────────────────────────────────────────────

  function weightedPick(items, weights) {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      acc += weights[i];
      if (r <= acc) return items[i];
    }
    return items[items.length - 1];
  }

  function commissionForSource(source, amount) {
    const rates = { uber: 0.25, freenow: 0.20, emisora: 0.05, calle: 0, otro: 0 };
    return round2(amount * (rates[source] ?? 0));
  }

  // ── Generadores unitarios ─────────────────────────────────────────────────

  function buildService(userId, shiftId, dateMs, index) {
    const d          = new Date(dateMs);
    const source     = weightedPick(SOURCES, SOURCE_WEIGHTS);
    const payment    = weightedPick(PAYMENT_METHODS, PAYMENT_WEIGHTS);
    const amount     = round2(rand(4, 45));
    const commission = commissionForSource(source, amount);
    const tip        = Math.random() < 0.25 ? round2(rand(0.5, 5)) : 0;
    const netAmount  = round2(amount + tip - commission);

    return {
      id:            `service-seed-${d.getTime()}-${index}`,
      userId,
      shiftId,
      date:          isoDate(d),
      time:          isoTime(d),
      datetime:      d.toISOString(),
      origin:        pick(ORIGINS),
      destination:   pick(DESTINATIONS),
      serviceSource: source,
      paymentMethod: payment,
      amount,
      commission,
      tip,
      totalAmount:   round2(amount + tip),
      netAmount,
      notes:         '',
      createdAt:     d.toISOString(),
      updatedAt:     d.toISOString()
    };
  }

  function buildExpense(userId, shiftId, dateMs, index) {
    const d        = new Date(dateMs);
    const category = pick(EXPENSE_CATEGORIES);
    const [mn, mx] = EXPENSE_RANGES[category] || [5, 50];
    const amount   = round2(rand(mn, mx));

    return {
      id:        `expense-seed-${d.getTime()}-${index}`,
      userId,
      shiftId,
      category,
      amount,
      notes:     pick(EXPENSE_NOTES[category] || ['Varios']),
      paidBy:    Math.random() < 0.7 ? 'taxista' : 'patron',
      date:      isoDate(d),
      createdAt: d.toISOString(),
      updatedAt: d.toISOString()
    };
  }

  // ── Generador de jornada diaria ───────────────────────────────────────────

  /**
   * Crea una jornada completada para un día concreto.
   * La jornada empieza entre las 07:00 y las 09:00 y dura entre 8 y 10 horas.
   * Incluye 1 pausa de 20-40 min a mitad de jornada.
   *
   * @param {string} userId
   * @param {Date}   dayDate  - cualquier momento del día objetivo
   * @param {number} dayIndex - para hacer el id único
   * @returns {{ shift, serviceTimestamps, expenseTimestamps }}
   */
  function buildDayShift(userId, dayDate, numServices, dayIndex) {
    // Inicio: entre 07:00 y 09:00 del día
    const startH  = randInt(7, 9);
    const startM  = randInt(0, 59);
    const start   = new Date(dayDate);
    start.setHours(startH, startM, 0, 0);

    // Duración total: 8-10 horas
    const durationMs = rand(8, 10) * 3600000;
    const end         = new Date(start.getTime() + durationMs);

    // Pausa: empieza entre el 40% y 60% de la jornada, dura 20-40 min
    const pauseStart = new Date(start.getTime() + durationMs * rand(0.4, 0.6));
    const pauseEnd   = new Date(pauseStart.getTime() + rand(20, 40) * 60000);

    const shiftId = `shift-seed-${start.getTime()}-${dayIndex}`;

    const shift = {
      id:        shiftId,
      userId,
      startTime: start.toISOString(),
      endTime:   end.toISOString(),
      status:    'completed',
      pauses:    [{ startTime: pauseStart.toISOString(), endTime: pauseEnd.toISOString() }],
      createdAt: start.toISOString(),
      updatedAt: end.toISOString()
    };

    // Distribuir los servicios uniformemente dentro de la jornada (evitando la pausa)
    // Dividimos la jornada en dos bloques: antes y después de la pausa
    const block1 = { from: start.getTime(),       to: pauseStart.getTime() };
    const block2 = { from: pauseEnd.getTime(),     to: end.getTime() };
    const totalBlock = (block1.to - block1.from) + (block2.to - block2.from);

    const serviceTimestamps = Array.from({ length: numServices }, (_, i) => {
      // Distribuir proporcionalmente entre los dos bloques
      const ratio = (i + 0.5) / numServices;
      const pos   = ratio * totalBlock;
      const b1len = block1.to - block1.from;
      if (pos < b1len) {
        return block1.from + pos;
      } else {
        return block2.from + (pos - b1len);
      }
    });

    // 1-2 gastos por jornada, al inicio o al final
    const numExpenses = randInt(1, 2);
    const expenseTimestamps = Array.from({ length: numExpenses }, () =>
      Math.random() < 0.5
        ? start.getTime() + rand(0, 1800000)       // primeros 30 min
        : end.getTime()   - rand(0, 1800000)        // últimos 30 min
    );

    return { shift, shiftId, serviceTimestamps, expenseTimestamps };
  }

  // ── API pública ───────────────────────────────────────────────────────────

  /**
   * Genera y guarda datos de prueba en localStorage.
   *
   * Estructura:
   *  - Hoy:              1 jornada con 10 servicios
   *  - Últimos 6 días:   1 jornada con  5 servicios cada uno
   *  - Cada jornada:     1-2 gastos
   *
   * @param {string} userId
   * @returns {{ shifts, services, expenses }}
   */
  function generate(userId) {
    const now     = new Date();
    const newShifts   = [];
    const newServices = [];
    const newExpenses = [];

    // Días: 0 = hoy, 1..6 = días anteriores
    for (let daysAgo = 0; daysAgo <= 6; daysAgo++) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - daysAgo);

      const numServices = daysAgo === 0 ? 10 : 5;
      const { shift, shiftId, serviceTimestamps, expenseTimestamps } =
        buildDayShift(userId, dayDate, numServices, daysAgo);

      newShifts.push(shift);

      serviceTimestamps.forEach((ts, i) => {
        newServices.push(buildService(userId, shiftId, ts, `${daysAgo}-${i}`));
      });

      expenseTimestamps.forEach((ts, i) => {
        newExpenses.push(buildExpense(userId, shiftId, ts, `${daysAgo}-${i}`));
      });
    }

    // Persistir — añadir a los datos existentes
    const existingShifts   = JSON.parse(localStorage.getItem('taxi_work_shifts')  || '[]');
    const existingServices = JSON.parse(localStorage.getItem('taxi_services')      || '[]');
    const existingExpenses = JSON.parse(localStorage.getItem('taxi_expenses')      || '[]');

    localStorage.setItem('taxi_work_shifts', JSON.stringify([...existingShifts,   ...newShifts]));
    localStorage.setItem('taxi_services',    JSON.stringify([...existingServices, ...newServices]));
    localStorage.setItem('taxi_expenses',    JSON.stringify([...existingExpenses, ...newExpenses]));

    console.log(`[SeedDataGenerator] Generados ${newShifts.length} jornadas, ${newServices.length} servicios y ${newExpenses.length} gastos para userId=${userId}`);
    return { shifts: newShifts.length, services: newServices.length, expenses: newExpenses.length };
  }

  /**
   * Elimina únicamente los datos generados por el seed (ids con prefijo "seed").
   * @param {string} userId
   */
  function clear(userId) {
    const isSeed = id => typeof id === 'string' && id.includes('-seed-');

    const shifts   = JSON.parse(localStorage.getItem('taxi_work_shifts')  || '[]');
    const services = JSON.parse(localStorage.getItem('taxi_services')      || '[]');
    const expenses = JSON.parse(localStorage.getItem('taxi_expenses')      || '[]');

    const fShifts   = shifts.filter(s   => !(s.userId   === userId && isSeed(s.id)));
    const fServices = services.filter(s => !(s.userId   === userId && isSeed(s.id)));
    const fExpenses = expenses.filter(e => !(e.userId   === userId && isSeed(e.id)));

    localStorage.setItem('taxi_work_shifts', JSON.stringify(fShifts));
    localStorage.setItem('taxi_services',    JSON.stringify(fServices));
    localStorage.setItem('taxi_expenses',    JSON.stringify(fExpenses));

    const rS = shifts.length   - fShifts.length;
    const rSv = services.length - fServices.length;
    const rE = expenses.length - fExpenses.length;
    console.log(`[SeedDataGenerator] Eliminados ${rS} jornadas, ${rSv} servicios y ${rE} gastos de prueba`);
    return { shifts: rS, services: rSv, expenses: rE };
  }

  return { generate, clear };
})();

if (typeof window !== 'undefined') {
  window.SeedDataGenerator = SeedDataGenerator;
}
