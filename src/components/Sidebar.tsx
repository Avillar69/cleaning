import React from 'react';
import {
  Box,
  VStack,
  Link,
  Text,
  Icon,
  useColorModeValue,
  useBreakpointValue,
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

interface SidebarProps {
  onClose?: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Inicio', icon: FaHome },
  { path: '/services', label: 'Servicios', icon: FaList },
  { path: '/workers', label: 'Personal', icon: FaUsers },
  { path: '/units', label: 'Unidades', icon: FaBuilding },
  { path: '/clients', label: 'Clientes', icon: FaUser },
  { path: '/payments', label: 'Pagos', icon: FaDollarSign },
  { path: '/invoices', label: 'Facturas', icon: FaFileInvoice },
  { path: '/reports', label: 'Reportes', icon: FaChartBar },
  { path: '/service-reports', label: 'Análisis Servicios', icon: FaChartLine },
  { path: '/client-reports', label: 'Cobros', icon: FaUser },
  { path: '/send-schedules', label: 'Enviar Horarios', icon: FaClock },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      position={isMobile ? 'relative' : 'fixed'}
      left={0}
      top={0}
    >
      <VStack spacing={0} align="stretch">
        <Box p={6} borderBottom="1px" borderColor={borderColor}>
          <Text fontSize="xl" fontWeight="bold" color="brand.600">
            KD Cleaning
          </Text>
        </Box>

        <VStack spacing={1} p={4} align="stretch">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                display="flex"
                alignItems="center"
                gap={3}
                p={3}
                borderRadius="md"
                bg={isActive ? 'brand.50' : 'transparent'}
                color={isActive ? 'brand.600' : 'gray.600'}
                fontWeight={isActive ? 'semibold' : 'normal'}
                _hover={{
                  bg: isActive ? 'brand.50' : 'gray.100',
                  color: isActive ? 'brand.600' : 'gray.700',
                }}
                transition="all 0.2s"
              >
                <Icon as={item.icon} boxSize={5} />
                <Text>{item.label}</Text>
              </Link>
            );
          })}
        </VStack>
      </VStack>
    </Box>
  );
};

export default Sidebar;
