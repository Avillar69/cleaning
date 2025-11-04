// Script para exportar datos desde la aplicación Firebase original
// Copia y pega este código en la consola del navegador de la aplicación Firebase

// Función para exportar todos los datos
window.exportData = async function() {
  console.log('🚀 Iniciando exportación de datos...');
  
  try {
    // Obtener datos del contexto de datos
    const dataContext = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.get(1)?.currentDispatcherRef?.current?.memoizedState;
    
    // Alternativa: si tienes acceso directo al contexto
    if (window.dataContext) {
      const data = window.dataContext;
      console.log('📦 Datos encontrados:', data);
      
      // Formatear datos para migración
      const exportData = {
        unitTypes: data.unitTypes || [],
        clients: data.clients || [],
        workers: data.workers || [],
        units: data.units || [],
        services: data.services || [],
        payments: data.payments || [],
        invoices: data.invoices || [],
        lastTouchUpNumber: data.lastTouchUpNumber || 0,
        lastLandscapingNumber: data.lastLandscapingNumber || 0,
        lastTercerosNumber: data.lastTercerosNumber || 0,
        lastInvoiceNumber: data.lastInvoiceNumber || 0,
      };
      
      console.log('✅ Datos exportados exitosamente:');
      console.log(JSON.stringify(exportData, null, 2));
      
      // Copiar al portapapeles
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
        console.log('📋 Datos copiados al portapapeles');
        alert('Datos exportados y copiados al portapapeles. Ahora puedes pegarlos en la nueva aplicación.');
      });
      
      return exportData;
    } else {
      console.log('❌ No se encontraron datos. Asegúrate de estar en la aplicación Firebase.');
      console.log('💡 Alternativa: Ve a la página de Dashboard y ejecuta este script nuevamente.');
      return null;
    }
  } catch (error) {
    console.error('❌ Error exportando datos:', error);
    return null;
  }
};

// Función alternativa para exportar desde localStorage
window.exportDataFromStorage = function() {
  console.log('🔍 Buscando datos en localStorage...');
  
  const keys = Object.keys(localStorage);
  const firebaseKeys = keys.filter(key => key.includes('firebase') || key.includes('user'));
  
  console.log('🔑 Claves encontradas:', firebaseKeys);
  
  firebaseKeys.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`📦 Datos de ${key}:`, data);
    } catch (e) {
      console.log(`📦 Datos de ${key} (no JSON):`, localStorage.getItem(key));
    }
  });
};

// Función para exportar datos específicos
window.exportSpecificData = function(dataType) {
  const validTypes = ['units', 'clients', 'workers', 'services', 'payments', 'invoices'];
  
  if (!validTypes.includes(dataType)) {
    console.log('❌ Tipo de datos inválido. Tipos válidos:', validTypes);
    return;
  }
  
  console.log(`📦 Exportando ${dataType}...`);
  
  // Aquí necesitarías implementar la lógica específica para cada tipo
  console.log('💡 Implementa la lógica específica para exportar', dataType);
};

console.log('🎉 Script de exportación cargado exitosamente');
console.log('📝 Comandos disponibles:');
console.log('  - window.exportData() - Exportar todos los datos');
console.log('  - window.exportDataFromStorage() - Buscar datos en localStorage');
console.log('  - window.exportSpecificData("units") - Exportar datos específicos');
console.log('');
console.log('🚀 Ejecuta window.exportData() para comenzar la exportación');
