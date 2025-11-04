// Función para exportar datos desde la aplicación Firebase original
// Esta función debe ejecutarse en la consola del navegador de la aplicación Firebase

export const createFirebaseExportScript = () => {
  return `
// Script para exportar datos desde la aplicación Firebase original
// Ejecuta este código en la consola del navegador (F12) de la aplicación Firebase

(function() {
  console.log('🚀 Iniciando exportación de datos desde Firebase...');
  
  // Función para obtener datos del contexto de React
  function getDataFromContext() {
    try {
      // Buscar el contexto de datos en el DOM
      const reactRoot = document.querySelector('#root');
      if (!reactRoot) {
        // Buscar el contexto de datos en el árbol de React
        const fiber = reactRoot._reactInternalFiber || reactRoot._reactInternalInstance;
        if (fiber) {
          console.log('🔍 Buscando contexto de datos...');
          return findDataContext(fiber);
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo datos del contexto:', error);
      return null;
    }
  }
  
  // Función recursiva para buscar el contexto de datos
  function findDataContext(fiber) {
    if (!fiber) return null;
    
    // Buscar en el estado actual
    if (fiber.memoizedState) {
      const state = fiber.memoizedState;
      if (state && typeof state === 'object') {
        // Buscar datos en el estado
        if (state.unitTypes || state.clients || state.workers) {
          console.log('✅ Datos encontrados en el estado');
          return state;
        }
      }
    }
    
    // Buscar en props
    if (fiber.memoizedProps && fiber.memoizedProps.data) {
      console.log('✅ Datos encontrados en props');
      return fiber.memoizedProps.data;
    }
    
    // Buscar en children
    if (fiber.child) {
      const childData = findDataContext(fiber.child);
      if (childData) return childData;
    }
    
    // Buscar en sibling
    if (fiber.sibling) {
      const siblingData = findDataContext(fiber.sibling);
      if (siblingData) return siblingData;
    }
    
    return null;
  }
  
  // Función principal de exportación
  window.exportFirebaseData = function() {
    console.log('📦 Iniciando exportación...');
    
    // Intentar obtener datos del contexto
    let data = getDataFromContext();
    
    if (!data) {
      console.log('⚠️ No se encontraron datos en el contexto. Intentando métodos alternativos...');
      
      // Método alternativo: buscar en window
      if (window.dataContext) {
        data = window.dataContext;
        console.log('✅ Datos encontrados en window.dataContext');
      } else if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // Usar React DevTools
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        const renderers = hook.renderers;
        if (renderers && renderers.size > 0) {
          const renderer = renderers.get(1);
          if (renderer) {
            console.log('🔍 Buscando en React DevTools...');
            // Implementar búsqueda en React DevTools
          }
        }
      }
    }
    
    if (!data) {
      console.log('❌ No se pudieron obtener los datos automáticamente.');
      console.log('💡 Instrucciones manuales:');
      console.log('1. Ve a la página de Dashboard');
      console.log('2. Abre las herramientas de desarrollador (F12)');
      console.log('3. Ve a la pestaña "Application" o "Aplicación"');
      console.log('4. Busca en "Local Storage" o "Session Storage"');
      console.log('5. Busca claves que contengan "data", "user", o "firebase"');
      console.log('6. Copia los datos JSON encontrados');
      return null;
    }
    
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
        console.log('📋 Copia manualmente los datos de arriba');
      });
    } else {
      console.log('📋 Copia manualmente los datos JSON de arriba');
    }
    
    return exportData;
  };
  
  // Función para buscar datos en localStorage
  window.searchLocalStorage = function() {
    console.log('🔍 Buscando datos en localStorage...');
    
    const keys = Object.keys(localStorage);
    console.log('🔑 Todas las claves:', keys);
    
    const relevantKeys = keys.filter(key => 
      key.includes('data') || 
      key.includes('user') || 
      key.includes('firebase') ||
      key.includes('context')
    );
    
    console.log('🎯 Claves relevantes:', relevantKeys);
    
    relevantKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);
        console.log(\`📦 \${key}:\`, parsed);
      } catch (e) {
        console.log(\`📦 \${key} (no JSON):\`, value);
      }
    });
  };
  
  console.log('🎉 Script de exportación cargado exitosamente');
  console.log('📝 Comandos disponibles:');
  console.log('  - window.exportFirebaseData() - Exportar todos los datos');
  console.log('  - window.searchLocalStorage() - Buscar en localStorage');
  console.log('');
  console.log('🚀 Ejecuta window.exportFirebaseData() para comenzar');
  
})();
`;
};

// Función para crear un script de exportación manual
export const createManualExportInstructions = () => {
  return `
# Instrucciones para Exportar Datos desde Firebase

## Método 1: Exportación Automática

1. **Ve a la aplicación Firebase original**
2. **Abre la consola del navegador** (F12)
3. **Pega y ejecuta este código:**

\`\`\`javascript
// Script de exportación automática
window.exportFirebaseData = function() {
  // Buscar datos en el contexto de React
  const reactRoot = document.querySelector('#root');
  let data = null;
  
  // Intentar obtener datos del contexto
  if (window.dataContext) {
    data = window.dataContext;
  } else {
    // Buscar en localStorage
    const keys = Object.keys(localStorage);
    const dataKey = keys.find(key => key.includes('data') || key.includes('user'));
    if (dataKey) {
      data = JSON.parse(localStorage.getItem(dataKey));
    }
  }
  
  if (data) {
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
    
    console.log('Datos exportados:', exportData);
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Datos copiados al portapapeles');
    return exportData;
  } else {
    console.log('No se encontraron datos');
    return null;
  }
};

window.exportFirebaseData();
\`\`\`

## Método 2: Exportación Manual

1. **Ve a la aplicación Firebase original**
2. **Abre las herramientas de desarrollador** (F12)
3. **Ve a la pestaña "Application" o "Aplicación"**
4. **Busca en "Local Storage" o "Session Storage"**
5. **Busca claves que contengan datos de la aplicación**
6. **Copia los datos JSON encontrados**

## Método 3: Desde el Código

Si tienes acceso al código de la aplicación Firebase:

1. **Agrega esta función al DataContext:**
\`\`\`javascript
export const exportAllData = () => {
  return {
    unitTypes,
    clients,
    workers,
    units,
    services,
    payments,
    invoices,
    lastTouchUpNumber,
    lastLandscapingNumber,
    lastTercerosNumber,
    lastInvoiceNumber,
  };
};
\`\`\`

2. **Ejecuta en la consola:**
\`\`\`javascript
// Si tienes acceso al contexto
const data = window.dataContext.exportAllData();
console.log(JSON.stringify(data, null, 2));
\`\`\`
`;
};
