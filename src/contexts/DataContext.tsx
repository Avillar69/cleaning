import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { 
  UnitType, 
  Client, 
  Unit, 
  Worker, 
  Extra, 
  Payment, 
  Service, 
  Invoice, 
  UserConfig 
} from '../types';

interface DataContextType {
  // Data
  unitTypes: UnitType[];
  clients: Client[];
  units: Unit[];
  workers: Worker[];
  services: Service[];
  extras: Extra[];
  payments: Payment[];
  invoices: Invoice[];
  config: UserConfig | null;
  
  // Loading states
  loading: boolean;
  
  // CRUD operations for UnitTypes
  createUnitType: (unitType: Omit<UnitType, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUnitType: (id: string, unitType: Partial<Omit<UnitType, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteUnitType: (id: string) => Promise<void>;
  
  // CRUD operations for Clients
  createClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // CRUD operations for Units
  createUnit: (unit: Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateUnit: (id: string, unit: Partial<Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  
  // CRUD operations for Workers
  createWorker: (worker: Omit<Worker, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWorker: (id: string, worker: Partial<Omit<Worker, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  
  // CRUD operations for Services
  createService: (service: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateService: (id: string, service: Partial<Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  
  // CRUD operations for Payments
  createPayment: (payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePayment: (id: string, payment: Partial<Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  
  // CRUD operations for Invoices
  createInvoice: (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Config operations
  updateConfig: (config: Partial<Omit<UserConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // State
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load all data when user changes
  useEffect(() => {
    if (!user) {
      setUnitTypes([]);
      setClients([]);
      setUnits([]);
      setWorkers([]);
      setServices([]);
      setExtras([]);
      setPayments([]);
      setInvoices([]);
      setConfig(null);
      setLoading(false);
      return;
    }

    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUnitTypes(),
        loadClients(),
        loadUnits(), // Ahora carga sin depender del usuario
        loadWorkers(),
        loadServices(),
        loadExtras(),
        loadPayments(),
        loadInvoices(),
        loadConfig(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load functions
  const loadUnitTypes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('unit_types')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    setUnitTypes(data || []);
  };

  const loadClients = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    setClients(data || []);
  };

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');
    
    if (error) throw error;
    setUnits(data || []);
  };

  const loadWorkers = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    setWorkers(data || []);
  };

  const loadServices = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    setServices(data || []);
  };

  const loadExtras = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('extras')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) throw error;
    setExtras(data || []);
  };

  const loadPayments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_date', { ascending: false });
    
    if (error) throw error;
    setPayments(data || []);
  };

  const loadInvoices = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setInvoices(data || []);
  };

  const loadConfig = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_config')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      // Create default config
      const defaultConfig = {
        user_id: user.id,
        last_touch_up_number: 0,
        last_landscaping_number: 0,
        last_terceros_number: 0,
        last_invoice_number: 0,
        currency: 'USD'
      };
      
      const { data: newConfig, error: createError } = await supabase
        .from('user_config')
        .insert(defaultConfig)
        .select()
        .single();
      
      if (createError) throw createError;
      setConfig(newConfig);
    } else {
      setConfig(data);
    }
  };

  // CRUD operations
  const createUnitType = useCallback(async (unitType: Omit<UnitType, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('unit_types')
      .insert({ ...unitType, user_id: user.id });
    
    if (error) throw error;
    await loadUnitTypes();
  }, [user]);

  const updateUnitType = useCallback(async (id: string, unitType: Partial<Omit<UnitType, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('unit_types')
      .update(unitType)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadUnitTypes();
  }, [user]);

  const deleteUnitType = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('unit_types')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadUnitTypes();
  }, [user]);

  const createClient = useCallback(async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    return supabase
      .from('clients')
      .insert({ ...client, user_id: user.id })
      .then(async ({ error }) => {
        if (error) throw error;
        await loadClients();
      });
  }, [user]);

  const updateClient = useCallback(async (id: string, client: Partial<Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadClients();
  }, [user]);

  const deleteClient = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadClients();
  }, [user]);

  const createUnit = useCallback(async (unit: Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('units')
      .insert(unit);
    
    if (error) throw error;
    await loadUnits();
  }, []);

  const updateUnit = useCallback(async (id: string, unit: Partial<Omit<Unit, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const { error } = await supabase
      .from('units')
      .update(unit)
      .eq('id', id);
    
    if (error) throw error;
    await loadUnits();
  }, []);

  const deleteUnit = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await loadUnits();
  }, []);

  const createWorker = useCallback(async (worker: Omit<Worker, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('workers')
      .insert({ ...worker, user_id: user.id });
    
    if (error) throw error;
    await loadWorkers();
  }, [user]);

  const updateWorker = useCallback(async (id: string, worker: Partial<Omit<Worker, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('workers')
      .update(worker)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadWorkers();
  }, [user]);

  const deleteWorker = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('workers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadWorkers();
  }, [user]);

  const createService = useCallback(async (service: Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('services')
      .insert({ ...service, user_id: user.id });
    
    if (error) throw error;
    await loadServices();
  }, [user]);

  const updateService = useCallback(async (id: string, service: Partial<Omit<Service, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadServices();
  }, [user]);

  const deleteService = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadServices();
  }, [user]);

  const createPayment = useCallback(async (payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('payments')
      .insert({ ...payment, user_id: user.id });
    
    if (error) throw error;
    await loadPayments();
  }, [user]);

  const updatePayment = useCallback(async (id: string, payment: Partial<Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('payments')
      .update(payment)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadPayments();
  }, [user]);

  const deletePayment = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadPayments();
  }, [user]);

  const createInvoice = useCallback(async (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('invoices')
      .insert({ ...invoice, user_id: user.id });
    
    if (error) throw error;
    await loadInvoices();
  }, [user]);

  const updateInvoice = useCallback(async (id: string, invoice: Partial<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadInvoices();
  }, [user]);

  const deleteInvoice = useCallback(async (id: string) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadInvoices();
  }, [user]);

  const updateConfig = useCallback(async (configUpdate: Partial<Omit<UserConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('No user');
    
    const { error } = await supabase
      .from('user_config')
      .update(configUpdate)
      .eq('user_id', user.id);
    
    if (error) throw error;
    await loadConfig();
  }, [user]);

  const value: DataContextType = {
    // Data
    unitTypes,
    clients,
    units,
    workers,
    services,
    extras,
    payments,
    invoices,
    config,
    loading,
    
    // CRUD operations
    createUnitType,
    updateUnitType,
    deleteUnitType,
    createClient,
    updateClient,
    deleteClient,
    createUnit,
    updateUnit,
    deleteUnit,
    createWorker,
    updateWorker,
    deleteWorker,
    createService,
    updateService,
    deleteService,
    createPayment,
    updatePayment,
    deletePayment,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateConfig,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
