import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Worker, ServiceType } from '../types';

// Tipo para tarifas cruzadas: unidad × tipo de servicio
type CrossRates = Record<string, Record<ServiceType, number>>;

interface TariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  onSave: (rates: CrossRates) => void;
}

// Componente de input optimizado con estado local y debouncing para evitar re-renders
const RateInputCell = React.memo(({ 
  unitId, 
  serviceType, 
  initialValue, 
  onValueChange 
}: { 
  unitId: string; 
  serviceType: ServiceType; 
  initialValue: number; 
  onValueChange: (unitId: string, serviceType: ServiceType, value: number) => void;
}) => {
  const [localValue, setLocalValue] = useState<string>(initialValue > 0 ? initialValue.toFixed(2) : '');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Sincronizar el valor inicial solo cuando cambia significativamente (no en cada render)
  React.useEffect(() => {
    const newValue = initialValue > 0 ? initialValue.toFixed(2) : '';
    // Solo actualizar si el valor realmente cambió (no solo por re-render)
    if (document.activeElement !== inputRef.current) {
      setLocalValue(newValue);
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce: actualizar el estado padre después de 300ms de inactividad
    timeoutRef.current = setTimeout(() => {
      const numValue = parseFloat(val) || 0;
      onValueChange(unitId, serviceType, numValue);
    }, 300);
  };

  const handleBlur = () => {
    // Limpiar timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Asegurar que el valor esté sincronizado al perder el foco
    const numValue = parseFloat(localValue) || 0;
    const formattedValue = numValue > 0 ? numValue.toFixed(2) : '';
    setLocalValue(formattedValue);
    onValueChange(unitId, serviceType, numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir Enter para guardar inmediatamente
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Td textAlign="center">
      <HStack spacing={1} justify="center">
        <Input
          ref={inputRef}
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          textAlign="center"
          w="100px"
          size="sm"
          autoComplete="off"
          step="0.01"
          min="0"
        />
        <VStack spacing={0} h="32px">
          <IconButton
            aria-label="Incrementar"
            icon={<Box>+</Box>}
            size="xs"
            h="16px"
            onClick={() => {
              const current = parseFloat(localValue) || 0;
              const newVal = (current + 0.01).toFixed(2);
              setLocalValue(newVal);
              onValueChange(unitId, serviceType, parseFloat(newVal));
            }}
          />
          <IconButton
            aria-label="Decrementar"
            icon={<Box>-</Box>}
            size="xs"
            h="16px"
            onClick={() => {
              const current = parseFloat(localValue) || 0;
              const newVal = Math.max(0, current - 0.01).toFixed(2);
              setLocalValue(newVal);
              onValueChange(unitId, serviceType, parseFloat(newVal));
            }}
          />
        </VStack>
      </HStack>
    </Td>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si el valor inicial cambió significativamente
  return Math.abs(prevProps.initialValue - nextProps.initialValue) < 0.01;
});

RateInputCell.displayName = 'RateInputCell';

const TariffModal: React.FC<TariffModalProps> = ({ isOpen, onClose, worker, onSave }) => {
  const { units } = useData();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const serviceTypes: ServiceType[] = [
    'Departure Clean',
    'Prearrival Service',
    'Touch Up',
    'Landscaping',
    'Terceros'
  ];

  // Inicializar tarifas cruzadas desde cross_rates existentes o desde unit_rates como fallback
  const [crossRates, setCrossRates] = useState<CrossRates>({});

  // Efecto para inicializar las tarifas cuando se abre el modal o cambian las unidades
  React.useEffect(() => {
    if (isOpen && units.length > 0) {
      const rates: CrossRates = {};
      units.forEach(unit => {
        // Si existe cross_rates guardado, usarlo; sino usar unit_rates como valor por defecto
        if (worker.cross_rates && worker.cross_rates[unit.id]) {
          rates[unit.id] = { ...worker.cross_rates[unit.id] };
        } else {
          // Inicializar todos los tipos de servicio con la tarifa de unit_rates
          const defaultRate = worker.unit_rates[unit.id] || 0;
          rates[unit.id] = {
            'Departure Clean': defaultRate,
            'Prearrival Service': defaultRate,
            'Touch Up': defaultRate,
            'Landscaping': defaultRate,
            'Terceros': defaultRate,
          };
        }
      });
      setCrossRates(rates);
    }
  }, [isOpen, units, worker]);

  // Función optimizada para actualizar valores sin causar re-renders masivos
  const handleRateChange = React.useCallback((unitId: string, serviceType: ServiceType, value: number) => {
    setCrossRates(prev => {
      const currentValue = prev[unitId]?.[serviceType] ?? 0;
      // Solo actualizar si hay un cambio real
      if (Math.abs(currentValue - value) < 0.01) {
        return prev;
      }
      
      // Crear una copia shallow del estado anterior
      const newRates = { ...prev };
      if (!newRates[unitId]) {
        newRates[unitId] = {
          'Departure Clean': 0,
          'Prearrival Service': 0,
          'Touch Up': 0,
          'Landscaping': 0,
          'Terceros': 0,
        };
      } else {
        newRates[unitId] = { ...newRates[unitId] };
      }
      newRates[unitId][serviceType] = value;
      
      return newRates;
    });
  }, []);

  const handleSave = () => {
    onSave(crossRates);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Tarifario - ${worker.name}`}
      size="6xl"
    >
      <VStack spacing={4} align="stretch">
        <Text fontSize="sm" color="gray.600">
          Configure las tarifas para cada combinación de Unidad y Tipo de Servicio
        </Text>

        {/* Botones de acción en la parte superior */}
        <HStack justify="flex-end" spacing={3} pb={2} borderBottomWidth={1} borderColor={borderColor}>
          <Button onClick={onClose} variant="outline" size="md">
            Cancelar
          </Button>
          <Button onClick={handleSave} colorScheme="blue" size="md">
            Guardar Tarifario
          </Button>
        </HStack>

        <Box
          overflowX="auto"
          overflowY="auto"
          maxH="70vh"
          borderWidth={1}
          borderColor={borderColor}
          borderRadius="md"
          bg={cardBg}
        >
          <Table variant="simple" size="sm">
            <Thead position="sticky" top={0} bg={cardBg} zIndex={2}>
              <Tr>
                <Th position="sticky" left={0} bg={cardBg} zIndex={3} borderRightWidth={1} borderColor={borderColor}>
                  Unidad
                </Th>
                {serviceTypes.map(serviceType => (
                  <Th key={serviceType} textAlign="center" minW="150px">
                    {serviceType}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {units.map(unit => (
                <Tr key={unit.id}>
                  <Td
                    position="sticky"
                    left={0}
                    bg={cardBg}
                    zIndex={1}
                    borderRightWidth={1}
                    borderColor={borderColor}
                    fontWeight="medium"
                  >
                    {unit.name}
                  </Td>
                  {serviceTypes.map(serviceType => (
                    <RateInputCell
                      key={`${unit.id}-${serviceType}`}
                      unitId={unit.id}
                      serviceType={serviceType}
                      initialValue={crossRates[unit.id]?.[serviceType] || 0}
                      onValueChange={handleRateChange}
                    />
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Modal>
  );
};

const Workers: React.FC = () => {
  const { workers, createWorker, updateWorker, deleteWorker, loading } = useData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTariffOpen, onOpen: onTariffOpen, onClose: onTariffClose } = useDisclosure();
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [tariffWorker, setTariffWorker] = useState<Worker | null>(null);
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    dni: '',
    phone: '',
    email: '',
    hourly_rate: 0,
    unit_rates: {} as Record<string, number>,
  });
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleOpenModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name,
        dni: worker.dni,
        phone: worker.phone,
        email: worker.email,
        hourly_rate: worker.hourly_rate,
        unit_rates: worker.unit_rates,
      });
    } else {
      setEditingWorker(null);
      setFormData({
        name: '',
        dni: '',
        phone: '',
        email: '',
        hourly_rate: 0,
        unit_rates: {},
      });
    }
    setError('');
    onOpen();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingWorker) {
        await updateWorker(editingWorker.id, formData);
      } else {
        await createWorker(formData);
      }
      onClose();
    } catch (err) {
      setError('Error al guardar el trabajador');
    }
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este trabajador?')) {
      try {
        await deleteWorker(workerId);
      } catch (err) {
        setError('Error al eliminar el trabajador');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        Cargando trabajadores...
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Personal</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="brand"
          onClick={() => handleOpenModal()}
        >
          Nuevo Trabajador
        </Button>
      </HStack>

      <Card bg={cardBg}>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>DNI</Th>
                <Th>Teléfono</Th>
                <Th>Email</Th>
                <Th>Tarifa por Hora</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {workers.map((worker) => (
                <Tr key={worker.id}>
                  <Td fontWeight="medium">{worker.name}</Td>
                  <Td>{worker.dni}</Td>
                  <Td>{worker.phone}</Td>
                  <Td>{worker.email}</Td>
                  <Td>
                    <Badge colorScheme="green" variant="subtle">
                      $ {worker.hourly_rate}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(worker)}
                      />
                      <IconButton
                        aria-label="Editar Tarifario"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => {
                          setTariffWorker(worker);
                          onTariffOpen();
                        }}
                        title="Editar Tarifario"
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(worker.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Nombre</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del trabajador"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>DNI</FormLabel>
              <Input
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="DNI del trabajador"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Teléfono</FormLabel>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Teléfono del trabajador"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Email</FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email del trabajador"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Tarifa por Hora</FormLabel>
              <NumberInput
                value={formData.hourly_rate}
                onChange={(_, value) => setFormData({ ...formData, hourly_rate: value || 0 })}
                min={0}
                precision={2}
                size="lg"
              >
                <NumberInputField borderRadius="md" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <HStack spacing={4} w="full" pt={4}>
              <Button 
                type="submit" 
                colorScheme="brand" 
                flex={1}
                size="lg"
                fontWeight="medium"
              >
                {editingWorker ? 'Actualizar' : 'Crear'}
              </Button>
              <Button 
                onClick={onClose} 
                variant="outline" 
                flex={1}
                size="lg"
                fontWeight="medium"
              >
                Cancelar
              </Button>
            </HStack>
          </VStack>
        </form>
      </Modal>

      {tariffWorker && (
        <TariffModal
          isOpen={isTariffOpen}
          onClose={() => {
            onTariffClose();
            setTariffWorker(null);
          }}
          worker={tariffWorker}
          onSave={async (rates: CrossRates) => {
            try {
              // Calcular promedio de tarifas para unit_rates (compatibilidad con código existente)
              const unitRates: Record<string, number> = {};
              Object.keys(rates).forEach(unitId => {
                const serviceRates = rates[unitId];
                const values = Object.values(serviceRates).filter(v => v > 0);
                unitRates[unitId] = values.length > 0 
                  ? values.reduce((a, b) => a + b, 0) / values.length 
                  : 0;
              });

              // Guardar tanto unit_rates (para compatibilidad) como cross_rates (tarifas cruzadas completas)
              await updateWorker(tariffWorker.id, {
                unit_rates: unitRates,
                cross_rates: rates,
              });

              toast({
                title: 'Tarifario guardado',
                description: 'Las tarifas se han guardado correctamente.',
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } catch (error) {
              console.error('Error al guardar tarifario:', error);
              toast({
                title: 'Error',
                description: 'Error al guardar el tarifario. Por favor, intente nuevamente.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            }
          }}
        />
      )}
    </Box>
  );
};

export default Workers;
