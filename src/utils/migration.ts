import { supabase } from '../lib/supabase';

// Función para migrar datos desde Firebase a Supabase
export const migrateDataFromFirebase = async (firebaseData: any, userId: string) => {
  console.log('🚀 Iniciando migración de datos...');
  
  try {
    // 1. Migrar tipos de unidades
    if (firebaseData.unitTypes && firebaseData.unitTypes.length > 0) {
      console.log('📦 Migrando tipos de unidades...');
      const unitTypesToInsert = firebaseData.unitTypes.map((unitType: any) => ({
        name: unitType.name,
        user_id: userId,
      }));
      
      const { error: unitTypesError } = await supabase
        .from('unit_types')
        .insert(unitTypesToInsert);
      
      if (unitTypesError) {
        console.error('Error migrando tipos de unidades:', unitTypesError);
      } else {
        console.log('✅ Tipos de unidades migrados exitosamente');
      }
    }

    // 2. Migrar clientes
    if (firebaseData.clients && firebaseData.clients.length > 0) {
      console.log('👥 Migrando clientes...');
      const clientsToInsert = firebaseData.clients.map((client: any) => ({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
        user_id: userId,
      }));
      
      const { error: clientsError } = await supabase
        .from('clients')
        .insert(clientsToInsert);
      
      if (clientsError) {
        console.error('Error migrando clientes:', clientsError);
      } else {
        console.log('✅ Clientes migrados exitosamente');
      }
    }

    // 3. Migrar trabajadores
    if (firebaseData.workers && firebaseData.workers.length > 0) {
      console.log('👷 Migrando trabajadores...');
      const workersToInsert = firebaseData.workers.map((worker: any) => ({
        name: worker.name,
        dni: worker.dni || '',
        phone: worker.phone || '',
        email: worker.email || '',
        hourly_rate: worker.hourlyRate || 0,
        unit_rates: worker.unitRates || {},
        user_id: userId,
      }));
      
      const { error: workersError } = await supabase
        .from('workers')
        .insert(workersToInsert);
      
      if (workersError) {
        console.error('Error migrando trabajadores:', workersError);
      } else {
        console.log('✅ Trabajadores migrados exitosamente');
      }
    }

    // 4. Migrar unidades (necesitamos mapear IDs)
    if (firebaseData.units && firebaseData.units.length > 0) {
      console.log('🏠 Migrando unidades...');
      
      // Primero obtenemos los tipos de unidades y clientes para mapear IDs
      const { data: unitTypes } = await supabase
        .from('unit_types')
        .select('id, name')
        .eq('user_id', userId);
      
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', userId);
      
      const unitsToInsert = firebaseData.units.map((unit: any) => {
        // Mapear tipo de unidad
        const unitType = unitTypes?.find(ut => ut.name === unit.unitTypeId);
        // Mapear cliente
        const client = clients?.find(c => c.name === unit.clientId);
        
        return {
          unit_type_id: unitType?.id || '',
          client_id: client?.id || '',
          name: unit.name,
          code_name: unit.codeName || unit.name,
          address: unit.address || '',
          price: unit.price || 0,
          user_id: userId,
        };
      });
      
      const { error: unitsError } = await supabase
        .from('units')
        .insert(unitsToInsert);
      
      if (unitsError) {
        console.error('Error migrando unidades:', unitsError);
      } else {
        console.log('✅ Unidades migradas exitosamente');
      }
    }

    // 5. Migrar servicios
    if (firebaseData.services && firebaseData.services.length > 0) {
      console.log('🔧 Migrando servicios...');
      
      // Obtener IDs mapeados
      const { data: units } = await supabase
        .from('units')
        .select('id, name')
        .eq('user_id', userId);
      
      const { data: workers } = await supabase
        .from('workers')
        .select('id, name')
        .eq('user_id', userId);
      
      const servicesToInsert = firebaseData.services.map((service: any) => {
        // Mapear unidad
        const unit = units?.find(u => u.name === service.unitId);
        // Mapear trabajadores
        const workerIds = service.workerIds?.map((workerId: string) => {
          const worker = workers?.find(w => w.name === workerId);
          return worker?.id;
        }).filter(Boolean) || [];
        
        return {
          unit_id: unit?.id || '',
          worker_ids: workerIds,
          start_date: service.startDate || service.start_date,
          execution_date: service.executionDate || service.execution_date,
          start_time: service.startTime || service.start_time,
          end_time: service.endTime || service.end_time,
          pay_by_hour: service.payByHour !== false,
          extras: service.extras || [],
          total_cost: service.totalCost || service.total_cost || 0,
          historical_unit_price: service.historicalUnitPrice || service.historical_unit_price,
          work_order: service.workOrder || service.work_order,
          service_type: service.serviceType || service.service_type,
          has_pets: service.hasPets || service.has_pets || false,
          work_order_pet: service.workOrderPet || service.work_order_pet,
          deep_cleaning: service.deepCleaning || service.deep_cleaning || false,
          payments: service.payments || [],
          user_id: userId,
        };
      });
      
      const { error: servicesError } = await supabase
        .from('services')
        .insert(servicesToInsert);
      
      if (servicesError) {
        console.error('Error migrando servicios:', servicesError);
      } else {
        console.log('✅ Servicios migrados exitosamente');
      }
    }

    // 6. Migrar pagos
    if (firebaseData.payments && firebaseData.payments.length > 0) {
      console.log('💰 Migrando pagos...');
      
      const { data: workers } = await supabase
        .from('workers')
        .select('id, name')
        .eq('user_id', userId);
      
      const paymentsToInsert = firebaseData.payments.map((payment: any) => {
        // Mapear trabajador
        const worker = workers?.find(w => w.name === payment.workerId);
        
        return {
          worker_id: worker?.id || '',
          service_ids: payment.serviceIds || payment.service_ids || [],
          total_amount: payment.totalAmount || payment.total_amount || 0,
          payment_date: payment.paymentDate || payment.payment_date,
          operation_number: payment.operationNumber || payment.operation_number || '',
          notes: payment.notes || '',
          user_id: userId,
        };
      });
      
      const { error: paymentsError } = await supabase
        .from('payments')
        .insert(paymentsToInsert);
      
      if (paymentsError) {
        console.error('Error migrando pagos:', paymentsError);
      } else {
        console.log('✅ Pagos migrados exitosamente');
      }
    }

    // 7. Migrar facturas
    if (firebaseData.invoices && firebaseData.invoices.length > 0) {
      console.log('📄 Migrando facturas...');
      
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', userId);
      
      const invoicesToInsert = firebaseData.invoices.map((invoice: any) => {
        // Mapear cliente
        const client = clients?.find(c => c.name === invoice.clientId);
        
        return {
          invoice_number: invoice.invoiceNumber || invoice.invoice_number,
          client_id: client?.id || '',
          services: invoice.services || [],
          total_amount: invoice.totalAmount || invoice.total_amount || 0,
          issue_date: invoice.issueDate || invoice.issue_date,
          due_date: invoice.dueDate || invoice.due_date,
          status: invoice.status || 'draft',
          notes: invoice.notes || '',
          user_id: userId,
        };
      });
      
      const { error: invoicesError } = await supabase
        .from('invoices')
        .insert(invoicesToInsert);
      
      if (invoicesError) {
        console.error('Error migrando facturas:', invoicesError);
      } else {
        console.log('✅ Facturas migradas exitosamente');
      }
    }

    // 8. Migrar configuración
    if (firebaseData.lastTouchUpNumber || firebaseData.lastLandscapingNumber || firebaseData.lastTercerosNumber || firebaseData.lastInvoiceNumber) {
      console.log('⚙️ Migrando configuración...');
      
      const configData = {
        user_id: userId,
        last_touch_up_number: firebaseData.lastTouchUpNumber || 0,
        last_landscaping_number: firebaseData.lastLandscapingNumber || 0,
        last_terceros_number: firebaseData.lastTercerosNumber || 0,
        last_invoice_number: firebaseData.lastInvoiceNumber || 0,
        currency: 'USD',
      };
      
      const { error: configError } = await supabase
        .from('user_config')
        .upsert(configData);
      
      if (configError) {
        console.error('Error migrando configuración:', configError);
      } else {
        console.log('✅ Configuración migrada exitosamente');
      }
    }

    console.log('🎉 ¡Migración completada exitosamente!');
    return { success: true, message: 'Migración completada exitosamente' };

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return { success: false, error: error };
  }
};

// Función para exportar datos desde la aplicación original
export const exportFirebaseData = () => {
  console.log('📤 Función para exportar datos desde Firebase');
  console.log('Para usar esta función:');
  console.log('1. Ve a la aplicación original (Firebase)');
  console.log('2. Abre la consola del navegador (F12)');
  console.log('3. Ejecuta: window.exportData()');
  console.log('4. Copia los datos exportados');
  console.log('5. Úsalos en la función de migración');
};

// Función helper para formatear datos de Firebase
export const formatFirebaseData = (firebaseData: any) => {
  return {
    unitTypes: firebaseData.unitTypes || [],
    clients: firebaseData.clients || [],
    workers: firebaseData.workers || [],
    units: firebaseData.units || [],
    services: firebaseData.services || [],
    payments: firebaseData.payments || [],
    invoices: firebaseData.invoices || [],
    lastTouchUpNumber: firebaseData.lastTouchUpNumber || 0,
    lastLandscapingNumber: firebaseData.lastLandscapingNumber || 0,
    lastTercerosNumber: firebaseData.lastTercerosNumber || 0,
    lastInvoiceNumber: firebaseData.lastInvoiceNumber || 0,
  };
};
