// Script mejorado para exportar datos desde la aplicación Firebase original
// Ejecuta este código en la consola del navegador (F12) de la aplicación Firebase

(function() {
  console.log('🚀 Iniciando exportación mejorada de datos...');
  
  // Función para buscar datos en diferentes ubicaciones
  function searchForData() {
    console.log('🔍 Buscando datos en diferentes ubicaciones...');
    
    // 1. Buscar en window.dataContext
    if (window.dataContext) {
      console.log('✅ Datos encontrados en window.dataContext');
      return window.dataContext;
    }
    
    // 2. Buscar en localStorage
    console.log('🔍 Buscando en localStorage...');
    const localStorageKeys = Object.keys(localStorage);
    console.log('🔑 Claves en localStorage:', localStorageKeys);
    
    for (const key of localStorageKeys) {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);
        
        // Buscar objetos que contengan datos de la aplicación
        if (parsed && typeof parsed === 'object') {
          if (parsed.unitTypes || parsed.clients || parsed.workers || parsed.units) {
            console.log(`✅ Datos encontrados en localStorage.${key}`);
            return parsed;
          }
        }
      } catch (e) {
        // No es JSON, continuar
      }
    }
    
    // 3. Buscar en sessionStorage
    console.log('🔍 Buscando en sessionStorage...');
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log('🔑 Claves en sessionStorage:', sessionStorageKeys);
    
    for (const key of sessionStorageKeys) {
      try {
        const value = sessionStorage.getItem(key);
        const parsed = JSON.parse(value);
        
        if (parsed && typeof parsed === 'object') {
          if (parsed.unitTypes || parsed.clients || parsed.workers || parsed.units) {
            console.log(`✅ Datos encontrados en sessionStorage.${key}`);
            return parsed;
          }
        }
      } catch (e) {
        // No es JSON, continuar
      }
    }
    
    // 4. Buscar en el DOM (React DevTools)
    console.log('🔍 Buscando en React DevTools...');
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const renderers = hook.renderers;
      
      if (renderers && renderers.size > 0) {
        for (const [id, renderer] of renderers) {
          console.log(`🔍 Revisando renderer ${id}...`);
          try {
            const fiber = renderer.findFiberByHostInstance(document.querySelector('#root'));
            if (fiber) {
              const data = searchFiberForData(fiber);
              if (data) {
                console.log('✅ Datos encontrados en React Fiber');
                return data;
              }
            }
          } catch (e) {
            console.log('⚠️ Error buscando en React Fiber:', e);
          }
        }
      }
    }
    
    return null;
  }
  
  // Función recursiva para buscar datos en React Fiber
  function searchFiberForData(fiber, depth = 0) {
    if (!fiber || depth > 10) return null;
    
    // Buscar en memoizedState
    if (fiber.memoizedState) {
      const state = fiber.memoizedState;
      if (state && typeof state === 'object') {
        if (state.unitTypes || state.clients || state.workers) {
          return state;
        }
      }
    }
    
    // Buscar en memoizedProps
    if (fiber.memoizedProps && fiber.memoizedProps.data) {
      return fiber.memoizedProps.data;
    }
    
    // Buscar en child
    if (fiber.child) {
      const childData = searchFiberForData(fiber.child, depth + 1);
      if (childData) return childData;
    }
    
    // Buscar en sibling
    if (fiber.sibling) {
      const siblingData = searchFiberForData(fiber.sibling, depth + 1);
      if (siblingData) return siblingData;
    }
    
    return null;
  }
  
  // Función principal de exportación
  window.exportFirebaseDataEnhanced = function() {
    console.log('📦 Iniciando exportación mejorada...');
    
    const data = searchForData();
    
    if (!data) {
      console.log('❌ No se encontraron datos automáticamente.');
      console.log('💡 Instrucciones manuales:');
      console.log('1. Ve a la página de Dashboard de la aplicación Firebase');
      console.log('2. Asegúrate de que los datos estén cargados');
      console.log('3. Ejecuta este script nuevamente');
      console.log('');
      console.log('🔍 O busca manualmente en:');
      console.log('- localStorage (F12 > Application > Local Storage)');
      console.log('- sessionStorage (F12 > Application > Session Storage)');
      console.log('- window.dataContext (si existe)');
      return null;
    }
    
    console.log('✅ Datos encontrados:', data);
    
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
        console.log('📋 Datos copiados al portapapeles');
        alert('✅ Datos exportados y copiados al portapapeles.\\n\\nAhora puedes pegarlos en la nueva aplicación de Supabase.');
      }).catch(err => {
        console.error('❌ Error copiando al portapapeles:', err);
        console.log('📋 Copia manualmente los datos JSON de arriba');
      });
    } else {
      console.log('📋 Copia manualmente los datos JSON de arriba');
    }
    
    return exportData;
  };
  
  // Función para buscar datos manualmente
  window.searchAllStorage = function() {
    console.log('🔍 Buscando en todos los almacenamientos...');
    
    console.log('📦 localStorage:');
    Object.keys(localStorage).forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);
        console.log(`  ${key}:`, parsed);
      } catch (e) {
        console.log(`  ${key}:`, value);
      }
    });
    
    console.log('📦 sessionStorage:');
    Object.keys(sessionStorage).forEach(key => {
      try {
        const value = sessionStorage.getItem(key);
        const parsed = JSON.parse(value);
        console.log(`  ${key}:`, parsed);
      } catch (e) {
        console.log(`  ${key}:`, value);
      }
    });
    
    console.log('📦 window properties:');
    Object.keys(window).forEach(key => {
      if (key.includes('data') || key.includes('context') || key.includes('app')) {
        console.log(`  ${key}:`, window[key]);
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
    
    const data = searchForData();
    if (data && data[dataType]) {
      const exportData = { [dataType]: data[dataType] };
      console.log(`✅ ${dataType} exportados:`, exportData);
      
      if (navigator.clipboard) {
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
        console.log('📋 Datos copiados al portapapeles');
      }
      
      return exportData;
    } else {
      console.log(`❌ No se encontraron datos de ${dataType}`);
      return null;
    }
  };
  
  console.log('🎉 Script de exportación mejorado cargado exitosamente');
  console.log('📝 Comandos disponibles:');
  console.log('  - window.exportFirebaseDataEnhanced() - Exportar todos los datos');
  console.log('  - window.searchAllStorage() - Buscar en todos los almacenamientos');
  console.log('  - window.exportSpecificData("units") - Exportar datos específicos');
  console.log('');
  console.log('🚀 Ejecuta window.exportFirebaseDataEnhanced() para comenzar');
  
})();
