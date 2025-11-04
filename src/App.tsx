import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Workers from './pages/Workers';
import Units from './pages/Units';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Migration from './pages/Migration';
import Layout from './components/Layout';

// Extend the theme to customize Chakra UI
const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
      },
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="services" element={<Services />} />
                <Route path="workers" element={<Workers />} />
                <Route path="units" element={<Units />} />
                <Route path="clients" element={<Clients />} />
                <Route path="payments" element={<Payments />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="reports" element={<Reports />} />
                <Route path="service-reports" element={<Reports />} />
                <Route path="client-reports" element={<Reports />} />
                <Route path="send-schedules" element={<Reports />} />
                <Route path="migration" element={<Migration />} />
              </Route>
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
