import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Card,
  CardBody,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Checkbox,
  Badge,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import type { Payment, Service, Worker, Unit, PaymentService } from '../types';

// Función helper para formatear fechas en formato DD/MM/YYYY
const formatDateDDMMYYYY = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Función helper para obtener la fecha efectiva de un servicio
const getServiceEffectiveDate = (service: Service) => {
  return service.execution_date || service.start_date;
};

// Función para obtener el rango del mes actual
const getCurrentMonthRange = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(startOfMonth),
    endDate: formatDate(endOfMonth)
  };
};

// Función para obtener el rango de la semana actual (lunes a domingo)
const getCurrentWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  const monday = new Date(now);
  let daysToSubtract;
  if (dayOfWeek === 0) {
    daysToSubtract = 6;
  } else {
    daysToSubtract = dayOfWeek - 1;
  }
  
  monday.setDate(now.getDate() - daysToSubtract);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday)
  };
};

// Función para calcular el pago de un trabajador por un servicio
// Usa cross_rates si está disponible, sino usa unit_rates como fallback
const calculateWorkerPayment = (service: Service, workerId: string, workers: Worker[], units: Unit[]): number => {
  const worker = workers.find(w => w.id === workerId);
  const unit = units.find(u => u.id === service.unit_id);
  
  if (!worker || !unit) return 0;
  
  // Para servicios Touch Up, Landscaping y Terceros, solo se paga por extras (no por la unidad)
  if (service.service_type === 'Touch Up' || service.service_type === 'Landscaping' || service.service_type === 'Terceros') {
    const extrasPayment = (service.extras || []).reduce((total, extra) => total + (extra.worker_pay || 0), 0);
    return extrasPayment;
  }
  
  let basePayment = 0;
  
  if (service.pay_by_hour) {
    // Calcular horas trabajadas
    const startTime = new Date(`2000-01-01T${service.start_time}`);
    const endTime = new Date(`2000-01-01T${service.end_time}`);
    const hoursWorked = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    basePayment = worker.hourly_rate * hoursWorked;
  } else {
    // Pago por unidad - usar cross_rates si está disponible, sino unit_rates
    if (service.service_type && worker.cross_rates && worker.cross_rates[service.unit_id]) {
      // Usar tarifa cruzada específica para unidad × tipo de servicio
      const crossRate = worker.cross_rates[service.unit_id][service.service_type];
      if (crossRate !== undefined && crossRate > 0) {
        basePayment = crossRate;
      } else {
        // Si no hay tarifa cruzada para este tipo de servicio, usar unit_rates
        basePayment = worker.unit_rates[service.unit_id] || 0;
      }
    } else {
      // Fallback a unit_rates (tarifa general por unidad)
      basePayment = worker.unit_rates[service.unit_id] || 0;
    }
  }
  
  // Agregar pagos por extras
  const extrasPayment = (service.extras || []).reduce((total, extra) => total + (extra.worker_pay || 0), 0);
  
  return basePayment + extrasPayment;
};

interface PaymentFormProps {
  onSave: (payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  editingPayment?: Payment;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSave, onClose, editingPayment }) => {
  const { services = [], workers = [], units = [], payments = [] } = useData();
  const toast = useToast();

  const getAllRange = () => ({ startDate: '2020-01-01', endDate: '2030-12-31' });

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [dateRange, setDateRange] = useState(editingPayment ? getAllRange() : getCurrentMonthRange());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentData, setPaymentData] = useState({
    payment_date: getTodayString(),
    operation_number: '',
    notes: '',
  });

  // Inicializar formulario si se está editando
  useEffect(() => {
    if (editingPayment) {
      setSelectedWorkerId(editingPayment.worker_id);
      setSelectedServices(editingPayment.service_ids);
      setPaymentData({
        payment_date: editingPayment.payment_date,
        operation_number: editingPayment.operation_number,
        notes: editingPayment.notes || '',
      });
      setDateRange(getAllRange());
    } else {
      setDateRange(getCurrentMonthRange());
      setSelectedWorkerId('');
      setSelectedServices([]);
      setPaymentData({
        payment_date: getTodayString(),
        operation_number: '',
        notes: '',
      });
    }
  }, [editingPayment]);

  // Filtrar servicios pendientes del trabajador seleccionado
  const pendingServices = useMemo(() => {
    if (!selectedWorkerId) return [];

    const candidateServices = services.filter(service => {
      const effectiveDate = getServiceEffectiveDate(service);
      const startDate = new Date(dateRange.startDate + 'T00:00:00');
      const endDate = new Date(dateRange.endDate + 'T23:59:59');
      const serviceDate = new Date(effectiveDate + 'T12:00:00');
      
      const isInRange = serviceDate >= startDate && serviceDate <= endDate;
      const hasWorker = service.worker_ids.includes(selectedWorkerId);
      
      return isInRange && hasWorker;
    });

    if (editingPayment) {
      return candidateServices;
    } else {
      return candidateServices.filter(service => {
        const isAlreadyPaid = payments.some(p => 
          p.worker_id === selectedWorkerId && p.service_ids.includes(service.id)
        );
        return !isAlreadyPaid;
      });
    }
  }, [selectedWorkerId, dateRange, services, payments, editingPayment]);

  // Calcular total a pagar por servicios seleccionados
  const totalToPay = useMemo(() => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (!service) return total;
      return total + calculateWorkerPayment(service, selectedWorkerId, workers, units);
    }, 0);
  }, [selectedServices, selectedWorkerId, services, workers, units]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServices.length === pendingServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(pendingServices.map(s => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId) {
      toast({
        title: 'Trabajador requerido',
        description: 'Por favor, seleccione un trabajador.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (selectedServices.length === 0) {
      toast({
        title: 'Servicios requeridos',
        description: 'Por favor, seleccione al menos un servicio.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      toast({
        title: 'Rango de fechas inválido',
        description: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validar que ningún servicio seleccionado tenga pago de $0
    const servicesWithZeroPayment = selectedServices.filter(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (!service) return false;
      return calculateWorkerPayment(service, selectedWorkerId, workers, units) === 0;
    });
    
    if (servicesWithZeroPayment.length > 0) {
      const serviceNames = servicesWithZeroPayment.map(serviceId => {
        const service = services.find(s => s.id === serviceId);
        const unit = units.find(u => u.id === service?.unit_id);
        return unit?.name || 'Unidad eliminada';
      }).join(', ');
      
      toast({
        title: 'Servicios con tarifa $0',
        description: `Los siguientes servicios tienen un pago de $0: ${serviceNames}. Verifique la configuración de tarifas del trabajador.`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!paymentData.operation_number.trim()) {
      toast({
        title: 'Número de operación requerido',
        description: 'Por favor, ingrese el número de operación o cheque.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const payment: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      worker_id: selectedWorkerId,
      service_ids: selectedServices,
      total_amount: totalToPay,
      payment_date: paymentData.payment_date,
      operation_number: paymentData.operation_number.trim(),
      notes: paymentData.notes.trim(),
    };

    onSave(payment);
  };

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        {/* Selección de trabajador */}
        <FormControl isRequired>
          <FormLabel>Seleccionar Trabajador</FormLabel>
          <Select 
            value={selectedWorkerId} 
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            placeholder="Seleccione un trabajador..."
          >
            {workers.map(worker => (
              <option key={worker.id} value={worker.id}>
                {worker.name} - ${worker.hourly_rate}/hora
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Rango de fechas */}
        {selectedWorkerId && (
          <VStack spacing={3} align="stretch">
            <HStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Desde</FormLabel>
                <DatePicker
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Hasta</FormLabel>
                <DatePicker
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                />
              </FormControl>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <Button
                size="sm"
                onClick={() => {
                  const today = getTodayString();
                  setDateRange({ startDate: today, endDate: today });
                }}
                colorScheme="green"
                variant="outline"
              >
                Solo hoy
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const today = getTodayString();
                  setDateRange(prev => ({ ...prev, endDate: today }));
                }}
                colorScheme="blue"
                variant="outline"
              >
                Fecha fin: Hoy
              </Button>
              <Button
                size="sm"
                onClick={() => setDateRange(getCurrentMonthRange())}
                variant="outline"
              >
                Este mes
              </Button>
              <Button
                size="sm"
                onClick={() => setDateRange(getCurrentWeekRange())}
                variant="outline"
              >
                Esta semana
              </Button>
              <Button
                size="sm"
                onClick={() => setDateRange(getAllRange())}
                colorScheme="blue"
                variant="outline"
              >
                Todos
              </Button>
            </HStack>
          </VStack>
        )}

        {/* Lista de servicios pendientes */}
        {selectedWorkerId && pendingServices.length > 0 && (
          <FormControl>
            <HStack justify="space-between" mb={2}>
              <Box>
                <FormLabel mb={0}>
                  {editingPayment ? 'Servicios Disponibles' : 'Servicios Pendientes de Pago'}
                </FormLabel>
                <Text fontSize="sm" color="gray.600">
                  {formatDateDDMMYYYY(dateRange.startDate)} al {formatDateDDMMYYYY(dateRange.endDate)}
                </Text>
              </Box>
              <Button
                size="sm"
                variant="link"
                onClick={handleSelectAll}
              >
                {selectedServices.length === pendingServices.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </Button>
            </HStack>
            
            <Box
              maxH="400px"
              overflowY="auto"
              borderWidth={1}
              borderRadius="md"
              p={2}
              bg={cardBg}
            >
              <VStack spacing={2} align="stretch">
                {pendingServices.map(service => {
                  const unit = units.find(u => u.id === service.unit_id);
                  const pendingAmount = calculateWorkerPayment(service, selectedWorkerId, workers, units);
                  const isAlreadyPaid = !editingPayment && payments.some(p => 
                    p.worker_id === selectedWorkerId && p.service_ids.includes(service.id)
                  );
                  
                  return (
                    <Card key={service.id} size="sm" variant="outline" bg={isAlreadyPaid ? 'gray.50' : 'white'}>
                      <CardBody p={3}>
                        <HStack align="start">
                          <Checkbox
                            isChecked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            isDisabled={isAlreadyPaid}
                            mt={1}
                          />
                          <Box flex={1}>
                            <HStack justify="space-between" mb={1}>
                              <Box>
                                <Text fontWeight="bold">
                                  {unit?.name || 'Unidad eliminada'}
                                  {unit?.address && (
                                    <Text as="span" fontSize="sm" color="gray.600" fontWeight="normal" ml={1}>
                                      ({unit.address})
                                    </Text>
                                  )}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {formatDateDDMMYYYY(getServiceEffectiveDate(service))} - {service.start_time} a {service.end_time}
                                </Text>
                                {service.work_order && (
                                  <Text fontSize="sm" color="blue.600" fontWeight="medium">
                                    Work Order: {service.work_order}
                                  </Text>
                                )}
                                {service.work_order_pet && (
                                  <Text fontSize="sm" color="green.600" fontWeight="medium">
                                    Work Order Mascotas: {service.work_order_pet}
                                  </Text>
                                )}
                              </Box>
                              <VStack align="end" spacing={0}>
                                <Text 
                                  fontWeight="bold" 
                                  color={pendingAmount === 0 ? 'red.600' : 'green.600'}
                                >
                                  ${pendingAmount.toFixed(2)}
                                </Text>
                                {pendingAmount === 0 && (
                                  <Text fontSize="xs" color="red.500" fontWeight="medium">
                                    Sin tarifa
                                  </Text>
                                )}
                                {isAlreadyPaid && (
                                  <Text fontSize="xs" color="gray.500">
                                    Ya pagado
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </VStack>
            </Box>
          </FormControl>
        )}

        {/* Información del pago */}
        {selectedServices.length > 0 && (
          <VStack spacing={4} align="stretch">
            <HStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Fecha de Pago</FormLabel>
                <DatePicker
                  value={paymentData.payment_date}
                  onChange={(date) => setPaymentData(prev => ({ ...prev, payment_date: date }))}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Número de Operación/Cheque</FormLabel>
                <Input
                  value={paymentData.operation_number}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, operation_number: e.target.value }))}
                  placeholder="Ingrese el número de operación o cheque"
                  autoComplete="off"
                />
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel>Notas (opcional)</FormLabel>
              <Textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionales sobre el pago"
                rows={3}
                autoComplete="off"
              />
            </FormControl>

            <Card bg={totalToPay === 0 ? 'red.50' : 'green.50'} borderColor={totalToPay === 0 ? 'red.200' : 'green.200'}>
              <CardBody>
                <HStack justify="space-between">
                  <Text fontWeight="bold" color={totalToPay === 0 ? 'red.800' : 'green.800'}>
                    {totalToPay === 0 ? 'Total a Pagar (ERROR):' : 'Total a Pagar:'}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={totalToPay === 0 ? 'red.600' : 'green.600'}>
                    ${totalToPay.toFixed(2)}
                  </Text>
                </HStack>
                {totalToPay === 0 && (
                  <Alert status="error" mt={2} size="sm">
                    <AlertIcon />
                    <Text fontSize="sm">
                      No se puede procesar el pago. Verifique que las tarifas del trabajador estén configuradas correctamente.
                    </Text>
                  </Alert>
                )}
              </CardBody>
            </Card>
          </VStack>
        )}

        {/* Botones */}
        <HStack justify="flex-end" spacing={3} pt={4}>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            colorScheme="blue"
            isDisabled={selectedServices.length === 0 || totalToPay === 0}
          >
            {editingPayment ? 'Actualizar Pago' : 'Realizar Pago'}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

const Payments: React.FC = () => {
  const { 
    payments, 
    services, 
    workers, 
    units, 
    createPayment, 
    updatePayment, 
    updateService,
    deletePayment,
    loading 
  } = useData();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [dateFilter, setDateFilter] = useState(getCurrentMonthRange());
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  // Filtrar pagos por fecha
  const filteredPayments = useMemo(() => {
    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.payment_date);
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);
        
        return paymentDate >= startDate && paymentDate <= endDate;
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [payments, dateFilter]);

  const handleOpenModal = (payment?: Payment) => {
    setEditingPayment(payment || null);
    onOpen();
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPayment) {
        // Actualizar pago existente
        await updatePayment(editingPayment.id, paymentData);
        
        // Actualizar los servicios con la información de pago
        for (const serviceId of paymentData.service_ids) {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const existingPayments = (service.payments || []).filter(p => p.worker_id !== paymentData.worker_id);
            const workerPayment: PaymentService = {
              service_id: service.id,
              worker_id: paymentData.worker_id,
              amount: calculateWorkerPayment(service, paymentData.worker_id, workers, units),
              is_paid: true,
            };
            
            const updatedService = {
              ...service,
              payments: [...existingPayments, workerPayment],
            };
            
            await updateService(service.id, { payments: updatedService.payments });
          }
        }
        
        toast({
          title: 'Pago actualizado',
          description: 'El pago se ha actualizado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Crear nuevo pago
        await createPayment(paymentData);
        
        // Actualizar los servicios con la información de pago
        for (const serviceId of paymentData.service_ids) {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const existingPayments = (service.payments || []).filter(p => p.worker_id !== paymentData.worker_id);
            const workerPayment: PaymentService = {
              service_id: service.id,
              worker_id: paymentData.worker_id,
              amount: calculateWorkerPayment(service, paymentData.worker_id, workers, units),
              is_paid: true,
            };
            
            const updatedService = {
              ...service,
              payments: [...existingPayments, workerPayment],
            };
            
            await updateService(service.id, { payments: updatedService.payments });
          }
        }
        
        toast({
          title: 'Pago creado',
          description: 'El pago se ha registrado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
      setEditingPayment(null);
    } catch (error) {
      console.error('Error al guardar pago:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el pago. Por favor, intente nuevamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este pago?')) {
      try {
        await deletePayment(paymentId);
        toast({
          title: 'Pago eliminado',
          description: 'El pago se ha eliminado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error al eliminar pago:', error);
        toast({
          title: 'Error',
          description: 'Error al eliminar el pago. Por favor, intente nuevamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Pagos</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleOpenModal()}
        >
          Nuevo Pago
        </Button>
      </HStack>

      {/* Filtros de fecha */}
      <Card bg={cardBg} mb={6}>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Text fontWeight="medium">Filtrar por fecha de pago:</Text>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm">Desde</FormLabel>
                <DatePicker
                  value={dateFilter.startDate}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, startDate: date }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Hasta</FormLabel>
                <DatePicker
                  value={dateFilter.endDate}
                  onChange={(date) => setDateFilter(prev => ({ ...prev, endDate: date }))}
                />
              </FormControl>
            </HStack>
            <Button
              size="sm"
              onClick={() => setDateFilter(getCurrentMonthRange())}
              colorScheme="green"
              variant="outline"
            >
              Este mes
            </Button>
            <Button
              size="sm"
              onClick={() => setDateFilter(getCurrentWeekRange())}
              variant="outline"
            >
              Esta semana
            </Button>
            <Button
              size="sm"
              onClick={() => setDateFilter({ startDate: '2020-01-01', endDate: '2030-12-31' })}
              colorScheme="blue"
              variant="outline"
            >
              Todos
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {filteredPayments.length > 0 ? (
        <VStack spacing={4} align="stretch">
          {filteredPayments.map(payment => {
            const worker = workers.find(w => w.id === payment.worker_id);
            const paymentServices = services.filter(s => payment.service_ids.includes(s.id));
            
            return (
              <Card key={payment.id} bg={cardBg}>
                <CardBody>
                  <HStack justify="space-between" align="start" flexWrap="wrap">
                    <Box flex={1} minW="300px">
                      <HStack spacing={4} mb={2} flexWrap="wrap">
                        <Heading size="md" color="blue.600">
                          {worker?.name || 'Trabajador eliminado'}
                        </Heading>
                        <Text fontSize="sm" color="gray.600">
                          {formatDateDDMMYYYY(payment.payment_date)}
                        </Text>
                        <Heading size="md" color="green.600">
                          ${payment.total_amount.toFixed(2)}
                        </Heading>
                        <Text fontSize="sm" color="gray.500">
                          Op: {payment.operation_number}
                        </Text>
                      </HStack>
                      
                      <HStack spacing={4} mb={2} fontSize="sm">
                        <Box>
                          <Text fontWeight="medium" color="gray.700">Servicios pagados:</Text>
                          <Text>{paymentServices.length} servicios</Text>
                        </Box>
                      </HStack>
                      
                      {payment.notes && (
                        <Box mb={2}>
                          <Text fontWeight="medium" color="gray.700" fontSize="sm">Notas:</Text>
                          <Text fontSize="sm">{payment.notes}</Text>
                        </Box>
                      )}
                      
                      {/* Servicios incluidos */}
                      {paymentServices.length > 0 && (
                        <HStack spacing={2} flexWrap="wrap" mt={2}>
                          {paymentServices.map(service => {
                            const unit = units.find(u => u.id === service.unit_id);
                            const workerCost = calculateWorkerPayment(service, payment.worker_id, workers, units);
                            return (
                              <Badge key={service.id} colorScheme="blue" p={1}>
                                {unit?.name || 'Unidad eliminada'} - {formatDateDDMMYYYY(getServiceEffectiveDate(service))}
                                {service.work_order && (
                                  <Text as="span" ml={1} fontWeight="medium">
                                    (WO: {service.work_order})
                                  </Text>
                                )}
                                {service.work_order_pet && (
                                  <Text as="span" ml={1} fontWeight="medium" color="green.600">
                                    (Mascotas: {service.work_order_pet})
                                  </Text>
                                )}
                                <Text as="span" ml={1} color="green.600" fontWeight="medium">
                                  (${workerCost.toFixed(2)})
                                </Text>
                              </Badge>
                            );
                          })}
                        </HStack>
                      )}
                    </Box>
                    
                    {/* Botones de acción */}
                    <HStack spacing={1} flexShrink={0}>
                      <IconButton
                        aria-label="Editar Pago"
                        icon={<EditIcon />}
                        colorScheme="yellow"
                        size="sm"
                        onClick={() => handleOpenModal(payment)}
                      />
                      <IconButton
                        aria-label="Eliminar Pago"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                      />
                    </HStack>
                  </HStack>
                </CardBody>
              </Card>
            );
          })}
        </VStack>
      ) : (
        <Card bg={cardBg}>
          <CardBody textAlign="center" py={8}>
            <Text color="gray.500" fontSize="lg">
              No hay pagos registrados en el período seleccionado.
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              {payments.length > 0 
                ? 'Intenta cambiar el filtro de fechas para ver más pagos.'
                : 'Comienza registrando tu primer pago.'
              }
            </Text>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingPayment(null);
        }}
        title={editingPayment ? "Editar Pago" : "Nuevo Pago"}
        size="xl"
      >
        <PaymentForm 
          onSave={handleSavePayment} 
          onClose={() => {
            onClose();
            setEditingPayment(null);
          }} 
          editingPayment={editingPayment || undefined}
        />
      </Modal>
    </Box>
  );
};

export default Payments;
