// Script para agregar servicios de ejemplo con diferentes plataformas
// Ejecutar en la consola del navegador después de iniciar sesión como taxista

function addSampleServices() {
    const currentUser = JSON.parse(localStorage.getItem('taxi_auth_current_user') || '{}');
    const existingServices = JSON.parse(localStorage.getItem('taxi_services') || '[]');
    
    const now = new Date();
    const sampleServices = [
        // Servicios de Uber
        {
            id: Date.now() + 1,
            datetime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 horas atrás
            origin: 'Aeropuerto',
            destination: 'Centro Comercial',
            serviceSource: 'uber',
            amount: 28.50,
            commission: 5.70, // 20% comisión
            tip: 2.00,
            netAmount: 24.80,
            clientName: 'Ana Martínez',
            clientPhone: '+34 666 111 222',
            paymentMethod: 'app',
            notes: 'Servicio de Uber',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        {
            id: Date.now() + 2,
            datetime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // 4 horas atrás
            origin: 'Hotel Marriott',
            destination: 'Estación Central',
            serviceSource: 'uber',
            amount: 22.75,
            commission: 4.55, // 20% comisión
            tip: 0,
            netAmount: 18.20,
            clientName: 'Roberto Silva',
            clientPhone: '+34 677 333 444',
            paymentMethod: 'app',
            notes: 'Sin propina',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        
        // Servicios de FreeNow
        {
            id: Date.now() + 3,
            datetime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hora atrás
            origin: 'Universidad',
            destination: 'Residencia Estudiantes',
            serviceSource: 'freenow',
            amount: 12.50,
            commission: 1.88, // 15% comisión
            tip: 1.50,
            netAmount: 12.12,
            clientName: 'Laura González',
            clientPhone: '+34 688 555 666',
            paymentMethod: 'app',
            notes: 'Estudiante',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        {
            id: Date.now() + 4,
            datetime: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 16), // 6 horas atrás
            origin: 'Centro Médico',
            destination: 'Farmacia Central',
            serviceSource: 'freenow',
            amount: 8.25,
            commission: 1.24, // 15% comisión
            tip: 0.75,
            netAmount: 7.76,
            clientName: 'Carmen Ruiz',
            clientPhone: '+34 699 777 888',
            paymentMethod: 'app',
            notes: 'Servicio médico',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        
        // Servicios de Emisora
        {
            id: Date.now() + 5,
            datetime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 16), // 3 horas atrás
            origin: 'Calle Mayor 45',
            destination: 'Aeropuerto Terminal 2',
            serviceSource: 'emisora',
            amount: 35.00,
            commission: 0, // Sin comisión
            tip: 5.00,
            netAmount: 40.00,
            clientName: 'Miguel Torres',
            clientPhone: '+34 611 222 333',
            paymentMethod: 'efectivo',
            notes: 'Cliente frecuente, buena propina',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        {
            id: Date.now() + 6,
            datetime: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 16), // 5 horas atrás
            origin: 'Hospital General',
            destination: 'Residencia Geriátrica',
            serviceSource: 'emisora',
            amount: 18.50,
            commission: 0, // Sin comisión
            tip: 2.00,
            netAmount: 20.50,
            clientName: 'Dolores Vega',
            clientPhone: '+34 622 444 555',
            paymentMethod: 'efectivo',
            notes: 'Persona mayor, ayuda con equipaje',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        
        // Servicios de Calle
        {
            id: Date.now() + 7,
            datetime: new Date(now.getTime() - 30 * 60 * 1000).toISOString().slice(0, 16), // 30 minutos atrás
            origin: 'Plaza del Sol',
            destination: 'Calle Serrano 123',
            serviceSource: 'calle',
            amount: 14.75,
            commission: 0, // Sin comisión
            tip: 1.25,
            netAmount: 16.00,
            clientName: 'Turista Extranjero',
            clientPhone: '',
            paymentMethod: 'efectivo',
            notes: 'Turista, pagó en efectivo',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        },
        
        // Servicios de Otro
        {
            id: Date.now() + 8,
            datetime: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 horas atrás
            origin: 'Empresa Logística',
            destination: 'Puerto Comercial',
            serviceSource: 'otro',
            amount: 42.00,
            commission: 0, // Sin comisión
            tip: 3.00,
            netAmount: 45.00,
            clientName: 'Empresa TransLog',
            clientPhone: '+34 900 123 456',
            paymentMethod: 'transferencia',
            notes: 'Servicio corporativo mensual',
            taxistaId: currentUser.id || 1,
            status: 'completado'
        }
    ];
    
    const allServices = [...existingServices, ...sampleServices];
    localStorage.setItem('taxi_services', JSON.stringify(allServices));
    
    console.log(`✅ Se agregaron ${sampleServices.length} servicios de ejemplo`);
    console.log('📊 Distribución por plataforma:');
    console.log('- Uber: 2 servicios');
    console.log('- FreeNow: 2 servicios');
    console.log('- Emisora: 2 servicios');
    console.log('- Calle: 1 servicio');
    console.log('- Otro: 1 servicio');
    console.log('');
    console.log('🔄 Recarga la página para ver los nuevos servicios');
}

// Ejecutar automáticamente si se incluye en una página
if (typeof window !== 'undefined') {
    console.log('📝 Script de servicios de ejemplo cargado');
    console.log('💡 Ejecuta addSampleServices() para agregar servicios de prueba');
}