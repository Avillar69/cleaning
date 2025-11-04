-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE service_type AS ENUM ('Departure Clean', 'Prearrival Service', 'Touch Up', 'Landscaping', 'Terceros');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue');

-- Create unit_types table
CREATE TABLE unit_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create units table
CREATE TABLE units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_type_id UUID REFERENCES unit_types(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code_name VARCHAR(100) NOT NULL,
  address TEXT,
  price DECIMAL(10,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workers table
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dni VARCHAR(20) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_rates JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create extras table
CREATE TABLE extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  worker_pay DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(5,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  worker_ids UUID[] NOT NULL,
  start_date DATE NOT NULL,
  execution_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  pay_by_hour BOOLEAN NOT NULL DEFAULT true,
  extras JSONB DEFAULT '[]',
  total_cost DECIMAL(10,2) NOT NULL,
  historical_unit_price DECIMAL(10,2),
  work_order VARCHAR(100),
  service_type service_type,
  has_pets BOOLEAN DEFAULT false,
  work_order_pet VARCHAR(100),
  deep_cleaning BOOLEAN DEFAULT false,
  payments JSONB DEFAULT '[]',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  service_ids UUID[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  operation_number VARCHAR(100),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  services UUID[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_config table
CREATE TABLE user_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  last_touch_up_number INTEGER NOT NULL DEFAULT 0,
  last_landscaping_number INTEGER NOT NULL DEFAULT 0,
  last_terceros_number INTEGER NOT NULL DEFAULT 0,
  last_invoice_number INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_unit_types_user_id ON unit_types(user_id);
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_units_user_id ON units(user_id);
CREATE INDEX idx_units_client_id ON units(client_id);
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_extras_user_id ON extras(user_id);
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_unit_id ON services(unit_id);
CREATE INDEX idx_services_start_date ON services(start_date);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_worker_id ON payments(worker_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_user_config_user_id ON user_config(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own unit_types" ON unit_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unit_types" ON unit_types
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unit_types" ON unit_types
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unit_types" ON unit_types
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own units" ON units
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own units" ON units
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own units" ON units
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own units" ON units
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workers" ON workers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workers" ON workers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workers" ON workers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workers" ON workers
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own extras" ON extras
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extras" ON extras
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extras" ON extras
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extras" ON extras
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own services" ON services
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services" ON services
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own services" ON services
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments" ON payments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own user_config" ON user_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user_config" ON user_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_config" ON user_config
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_unit_types_updated_at BEFORE UPDATE ON unit_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extras_updated_at BEFORE UPDATE ON extras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_config_updated_at BEFORE UPDATE ON user_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
