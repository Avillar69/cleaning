import React from 'react';
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  FaList,
  FaUsers,
  FaBuilding,
  FaUser,
  FaDollarSign,
  FaFileInvoice,
} from 'react-icons/fa';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    clients, 
    units, 
    workers, 
    services, 
    payments, 
    invoices, 
    loading 
  } = useData();

  const cardBg = useColorModeValue('white', 'gray.800');

  const menuItems = [
    {
      path: '/services',
      label: 'Servicios',
      icon: FaList,
      count: services.length,
      color: 'blue',
    },
    {
      path: '/workers',
      label: 'Personal',
      icon: FaUsers,
      count: workers.length,
      color: 'green',
    },
    {
      path: '/units',
      label: 'Unidades',
      icon: FaBuilding,
      count: units.length,
      color: 'purple',
    },
    {
      path: '/clients',
      label: 'Clientes',
      icon: FaUser,
      count: clients.length,
      color: 'orange',
    },
    {
      path: '/payments',
      label: 'Pagos',
      icon: FaDollarSign,
      count: payments.length,
      color: 'teal',
    },
    {
      path: '/invoices',
      label: 'Facturas',
      icon: FaFileInvoice,
      count: invoices.length,
      color: 'pink',
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        Cargando datos...
      </Box>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>
          Bienvenido, {user?.email}!
        </Heading>
        <Text color="gray.600">
          Tu panel de control para la gestión de limpieza.
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
        {menuItems.map((item) => (
          <GridItem key={item.path}>
            <Card bg={cardBg} shadow="md" _hover={{ shadow: 'lg' }} transition="all 0.2s">
              <CardBody>
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <Text fontSize="lg" fontWeight="semibold">
                      {item.label}
                    </Text>
                    <Stat>
                      <StatNumber fontSize="2xl" color={`${item.color}.500`}>
                        {item.count}
                      </StatNumber>
                      <StatHelpText>
                        <StatArrow type="increase" />
                        Total registros
                      </StatHelpText>
                    </Stat>
                  </VStack>
                  <Icon as={item.icon} boxSize={8} color={`${item.color}.500`} />
                </HStack>
              </CardBody>
            </Card>
          </GridItem>
        ))}
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Resumen de Servicios</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>Servicios este mes</StatLabel>
                <StatNumber>
                  {services.filter(s => {
                    const serviceDate = new Date(s.start_date);
                    const now = new Date();
                    return serviceDate.getMonth() === now.getMonth() && 
                           serviceDate.getFullYear() === now.getFullYear();
                  }).length}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total de trabajadores</StatLabel>
                <StatNumber>{workers.length}</StatNumber>
              </Stat>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Resumen Financiero</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Stat>
                <StatLabel>Pagos este mes</StatLabel>
                <StatNumber>
                  {payments.filter(p => {
                    const paymentDate = new Date(p.payment_date);
                    const now = new Date();
                    return paymentDate.getMonth() === now.getMonth() && 
                           paymentDate.getFullYear() === now.getFullYear();
                  }).length}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Facturas pendientes</StatLabel>
                <StatNumber>
                  {invoices.filter(i => i.status !== 'paid').length}
                </StatNumber>
              </Stat>
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </VStack>
  );
};

export default Dashboard;
