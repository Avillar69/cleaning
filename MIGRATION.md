# 🔄 Guía de Migración de Datos

Esta guía te ayudará a migrar todos los datos desde la aplicación Firebase original a la nueva aplicación con Supabase.

## 📋 Datos que se Migran

- ✅ **Tipos de Unidades** (Departamento, Casa, etc.)
- ✅ **Clientes** (Información completa)
- ✅ **Trabajadores** (Con tarifas y datos)
- ✅ **Unidades** (Con precios y asignaciones)
- ✅ **Servicios** (Programación completa)
- ✅ **Pagos** (Historial de pagos)
- ✅ **Facturas** (Con numeración correlativa)
- ✅ **Configuración** (Números correlativos)

## 🚀 Proceso de Migración

### Paso 1: Exportar Datos desde Firebase

#### Opción A: Script Automático (Recomendado)

1. **Ve a la aplicación Firebase original**
2. **Abre la consola del navegador** (F12)
3. **Pega y ejecuta este código:**

```javascript
// Script de exportación automática
window.exportFirebaseData = function() {
  console.log('🚀 Iniciando exportación de datos...');
  
  // Buscar datos en el contexto de React
  let data = null;
  
  // Intentar obtener datos del contexto
  if (window.dataContext) {
    data = window.dataContext;
  } else {
    // Buscar en localStorage
    const keys = Object.keys(localStorage);
    const dataKey = keys.find(key => 
      key.includes('data') || 
      key.includes('user') || 
      key.includes('firebase') ||
      key.includes('context')
    );
    if (dataKey) {
      try {
        data = JSON.parse(localStorage.getItem(dataKey));
      } catch (e) {
        console.log('Error parseando datos:', e);
      }
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
    
    console.log('✅ Datos exportados exitosamente:');
    console.log(JSON.stringify(exportData, null, 2));
    
    // Copiar al portapapeles
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(exportData, null, 2)).then(() => {
        console.log('📋 Datos copiados al portapapeles');
        alert('✅ Datos exportados y copiados al portapapeles.\\n\\nAhora puedes pegarlos en la nueva aplicación de Supabase.');
      });
    }
    
    return exportData;
  } else {
    console.log('❌ No se encontraron datos. Asegúrate de estar en la aplicación Firebase.');
    return null;
  }
};

// Ejecutar exportación
window.exportFirebaseData();
```

#### Opción B: Exportación Manual

1. **Ve a la aplicación Firebase original**
2. **Abre las herramientas de desarrollador** (F12)
3. **Ve a la pestaña "Application" o "Aplicación"**
4. **Busca en "Local Storage" o "Session Storage"**
5. **Busca claves que contengan datos de la aplicación**
6. **Copia los datos JSON encontrados**

### Paso 2: Importar Datos en Supabase

1. **Ve a la nueva aplicación Supabase** (`http://localhost:5178/`)
2. **Inicia sesión** con tu cuenta
3. **Ve a la página de Migración** (`/migration`)
4. **Pega los datos exportados** en el campo de texto
5. **Haz clic en "Migrar Datos"**
6. **Espera a que se complete la migración**

## 🔧 Configuración de Supabase

Antes de migrar, asegúrate de que:

1. **Tienes un proyecto de Supabase creado**
2. **Has ejecutado el script de base de datos** (`supabase-schema.sql`)
3. **Has configurado las variables de entorno** (`.env`)

### Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_aqui
```

## 📊 Verificación de Migración

Después de la migración, verifica que:

- ✅ **Tipos de unidades** aparecen en la página de Unidades
- ✅ **Clientes** aparecen en la página de Clientes  
- ✅ **Trabajadores** aparecen en la página de Personal
- ✅ **Unidades** aparecen en la página de Unidades
- ✅ **Servicios** aparecen en la página de Servicios
- ✅ **Pagos** aparecen en la página de Pagos
- ✅ **Facturas** aparecen en la página de Facturas

## 🚨 Solución de Problemas

### Error: "No se encontraron datos"

**Solución:**
1. Asegúrate de estar en la aplicación Firebase original
2. Ve a la página de Dashboard
3. Ejecuta el script de exportación nuevamente

### Error: "Variables de entorno no configuradas"

**Solución:**
1. Crea el archivo `.env` con las credenciales de Supabase
2. Reinicia el servidor de desarrollo

### Error: "Error durante la migración"

**Solución:**
1. Verifica que el esquema de base de datos esté creado
2. Revisa la consola para más detalles del error
3. Intenta migrar los datos por partes

## 📞 Soporte

Si tienes problemas con la migración:

1. **Revisa la consola del navegador** para errores
2. **Verifica que todos los datos estén exportados correctamente**
3. **Asegúrate de que Supabase esté configurado correctamente**

## 🎉 ¡Migración Completada!

Una vez que la migración esté completa, tendrás:

- ✅ **Todos tus datos** en la nueva aplicación
- ✅ **Mejor rendimiento** con Supabase
- ✅ **Diseño moderno** con Chakra UI
- ✅ **Funcionalidades mejoradas** con flatpickr
- ✅ **Escalabilidad** para el futuro

¡Disfruta de tu nueva aplicación de gestión de limpieza! 🧹✨
