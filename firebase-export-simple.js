// Script simple para exportar datos desde Firebase
// Ejecuta este código paso a paso en la consola del navegador

console.log('🚀 Script de exportación simple cargado');

// Paso 1: Buscar datos en localStorage
window.searchLocalStorage = function() {
  console.log('🔍 Buscando en localStorage...');
  
  const keys = Object.keys(localStorage);
  console.log('🔑 Claves encontradas:', keys);
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      const parsed = JSON.parse(value);
      console.log(`📦 ${key}:`, parsed);
      
      // Verificar si contiene datos de la aplicación
      if (parsed && typeof parsed === 'object') {
        if (parsed.unitTypes || parsed.clients || parsed.workers || parsed.units) {
          console.log(`✅ ¡Datos encontrados en ${key}!`);
          return parsed;
        }
      }
    } catch (e) {
      console.log(`📦 ${key} (no JSON):`, value);
    }
  });
  
  return null;
};

// Paso 2: Buscar datos en sessionStorage
window.searchSessionStorage = function() {
  console.log('🔍 Buscando en sessionStorage...');
  
  const keys = Object.keys(sessionStorage);
  console.log('🔑 Claves encontradas:', keys);
  
  keys.forEach(key => {
    try {
      const value = sessionStorage.getItem(key);
      const parsed = JSON.parse(value);
      console.log(`📦 ${key}:`, parsed);
      
      if (parsed && typeof parsed === 'object') {
        if (parsed.unitTypes || parsed.clients || parsed.workers || parsed.units) {
          console.log(`✅ ¡Datos encontrados en ${key}!`);
          return parsed;
        }
      }
    } catch (e) {
      console.log(`📦 ${key} (no JSON):`, value);
    }
  });
  
  return null;
};

// Paso 3: Buscar en window
window.searchWindow = function() {
  console.log('🔍 Buscando en window...');
  
  const windowKeys = Object.keys(window);
  const relevantKeys = windowKeys.filter(key => 
    key.includes('data') || 
    key.includes('context') || 
    key.includes('app') ||
    key.includes('user')
  );
  
  console.log('🔑 Claves relevantes:', relevantKeys);
  
  relevantKeys.forEach(key => {
    const value = window[key];
    console.log(`📦 ${key}:`, value);
    
    if (value && typeof value === 'object') {
      if (value.unitTypes || value.clients || value.workers || value.units) {
        console.log(`✅ ¡Datos encontrados en window.${key}!`);
        return value;
      }
    }
  });
  
  return null;
};

// Paso 4: Función principal de búsqueda
window.findData = function() {
  console.log('🔍 Buscando datos en todas las ubicaciones...');
  
  // Buscar en localStorage
  const localData = window.searchLocalStorage();
  if (localData) return localData;
  
  // Buscar en sessionStorage
  const sessionData = window.searchSessionStorage();
  if (sessionData) return sessionData;
  
  // Buscar en window
  const windowData = window.searchWindow();
  if (windowData) return windowData;
  
  console.log('❌ No se encontraron datos automáticamente');
  return null;
};

// Paso 5: Función de exportación
window.exportData = function() {
  console.log('📦 Iniciando exportación...');
  
  const data = window.findData();
  
  if (!data) {
    console.log('❌ No se encontraron datos');
    console.log('💡 Instrucciones:');
    console.log('1. Asegúrate de estar en la aplicación Firebase');
    console.log('2. Ve a la página de Dashboard');
    console.log('3. Espera a que se carguen los datos');
    console.log('4. Ejecuta window.exportData() nuevamente');
    return null;
  }
  
  console.log('✅ Datos encontrados:', data);
  
  // Formatear para migración
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
  
  console.log('✅ Datos formateados para migración:');
  console.log(JSON.stringify(exportData, null, 2));
  
  // Copiar al portapapeles
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
      console.log('📋 Datos copiados al portapapeles');
      alert('✅ Datos exportados y copiados al portapapeles.\\n\\nAhora puedes pegarlos en la nueva aplicación de Supabase.');
    });
  } else {
    console.log('📋 Copia manualmente los datos JSON de arriba');
  }
  
  return exportData;
};

console.log('🎉 Script simple cargado exitosamente');
console.log('📝 Comandos disponibles:');
console.log('  - window.searchLocalStorage() - Buscar en localStorage');
console.log('  - window.searchSessionStorage() - Buscar en sessionStorage');
console.log('  - window.searchWindow() - Buscar en window');
console.log('  - window.findData() - Buscar en todas las ubicaciones');
console.log('  - window.exportData() - Exportar datos');
console.log('');
console.log('🚀 Ejecuta window.exportData() para comenzar');
