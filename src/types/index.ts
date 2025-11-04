export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UnitType {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  unit_type_id: string;
  client_id: string;
  name: string;
  code_name: string;
  address: string;
  price: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  hourly_rate: number;
  unit_rates: Record<string, number>;
  cross_rates?: Record<string, Record<ServiceType, number>>; // Tarifas cruzadas: unidad × tipo de servicio
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  worker_pay: number;
  duration_hours: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentService {
  service_id: string;
  worker_id: string;
  amount: number;
  is_paid: boolean;
}

export interface Payment {
  id: string;
  worker_id: string;
  service_ids: string[];
  total_amount: number;
  payment_date: string;
  operation_number: string;
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type ServiceType = 'Departure Clean' | 'Prearrival Service' | 'Touch Up' | 'Landscaping' | 'Terceros';

export interface Service {
  id: string;
  unit_id: string;
  worker_ids: string[];
  start_date: string;
  execution_date?: string;
  start_time: string;
  end_time: string;
  pay_by_hour: boolean;
  extras: Extra[];
  total_cost: number;
  historical_unit_price?: number;
  work_order?: string;
  service_type?: ServiceType;
  has_pets?: boolean;
  work_order_pet?: string;
  deep_cleaning?: boolean;
  payments?: PaymentService[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  services: string[];
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserConfig {
  id: string;
  user_id: string;
  last_touch_up_number: number;
  last_landscaping_number: number;
  last_terceros_number: number;
  last_invoice_number: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export type NavigationPage = 
  | 'dashboard' 
  | 'services' 
  | 'workers' 
  | 'units' 
  | 'clients' 
  | 'reports' 
  | 'client-reports' 
  | 'payments' 
  | 'send-schedules' 
  | 'invoices' 
  | 'service-reports';

export interface ReportData {
  [workerName: string]: {
    totalHours: number;
    totalPay: number;
    servicesCount: number;
  };
}
