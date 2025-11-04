import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaList,
  FaUsers,
  FaBuilding,
  FaUser,
  FaDollarSign,
  FaFileInvoice,
  FaChartBar,
  FaChartLine,
  FaClock,
} from 'react-icons/fa';

const navItems = [
  { path: '/dashboard', label: 'Inicio', icon: FaHome },
  { path: '/services', label: 'Servicios', icon: FaList },
  { path: '/workers', label: 'Personal', icon: FaUsers },
  { path: '/units', label: 'Unidades', icon: FaBuilding },
  { path: '/clients', label: 'Clientes', icon: FaUser },
  { path: '/payments', label: 'Pagos', icon: FaDollarSign },
  { path: '/invoices', label: 'Facturas', icon: FaFileInvoice },
  { path: '/reports', label: 'Reportes', icon: FaChartBar },
  { path: '/service-reports', label: 'Análisis', icon: FaChartLine },
  { path: '/client-reports', label: 'Cobros', icon: FaUser },
  { path: '/send-schedules', label: 'Horarios', icon: FaClock },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTop="1px"
      borderColor={borderColor}
      display={{ base: 'block', md: 'none' }}
      zIndex={10}
    >
      <Flex justify="space-around" py={2}>
        {navItems.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <IconButton
              key={item.path}
              aria-label={item.label}
              icon={<item.icon />}
              variant="ghost"
              size="sm"
              color={isActive ? 'brand.600' : 'gray.500'}
              onClick={() => navigate(item.path)}
              _hover={{
                color: isActive ? 'brand.600' : 'brand.500',
              }}
            />
          );
        })}
      </Flex>
    </Box>
  );
};

export default BottomNav;
