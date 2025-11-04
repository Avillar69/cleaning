import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaFilePdf } from 'react-icons/fa';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import PDFBulkImporter from '../components/PDFBulkImporter';
import Select2 from '../components/Select2';
import MultiSelect from '../components/MultiSelect';
import { Service, ServiceType } from '../types';
import { ExtractedServiceData } from '../services/pdfExtractionService';

const Services: React.FC = () => {
  const { 
    services, 
    units, 
    workers, 
    config,
    createService, 
    updateService, 
    deleteService, 
    updateConfig,
    loading 
  } = useData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPDFOpen, onOpen: onPDFOpen, onClose: onPDFClose } = useDisclosure();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const toast = useToast();
  const [formData, setFormData] = useState({
    unit_id: '',
    worker_ids: [] as string[],
    start_date: '',
    execution_date: '',
    start_time: '',
    end_time: '',
    pay_by_hour: true,
    total_cost: 0,
    work_order: '',
    service_type: 'Departure Clean' as ServiceType,
    has_pets: false,
    work_order_pet: '',
    deep_cleaning: false,
    extras: [] as any[],
  });
  const [error, setError] = useState('');
  const [workOrderError, setWorkOrderError] = useState<string | null>(null);
  const [workOrderPetError, setWorkOrderPetError] = useState<string | null>(null);

  const cardBg = useColorModeValue('white', 'gray.800');

  const serviceTypes: ServiceType[] = [
    'Departure Clean',
    'Prearrival Service', 
    'Touch Up',
    'Landscaping',
    'Terceros'
  ];

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        unit_id: service.unit_id,
        worker_ids: service.worker_ids,
        start_date: service.start_date,
        execution_date: service.execution_date || '',
        start_time: service.start_time,
        end_time: service.end_time,
        pay_by_hour: service.pay_by_hour,
        total_cost: service.total_cost,
        work_order: service.work_order || '',
        service_type: service.service_type || 'Departure Clean',
        has_pets: service.has_pets || false,
        work_order_pet: service.work_order_pet || '',
        deep_cleaning: service.deep_cleaning || false,
        extras: service.extras || [],
      });
    } else {
      setEditingService(null);
      setFormData({
        unit_id: '',
        worker_ids: [],
        start_date: '',
        execution_date: '',
        start_time: '',
        end_time: '',
        pay_by_hour: true,
        total_cost: 0,
        work_order: '',
        service_type: 'Departure Clean',
        has_pets: false,
        work_order_pet: '',
        deep_cleaning: false,
        extras: [],
      });
    }
    setError('');
    setWorkOrderError(null);
    setWorkOrderPetError(null);
    onOpen();
  };

  // Generar workOrder automático para servicios Touch Up, Landscaping y Terceros
  // Limpiar workOrder para servicios Prearrival Service y Departure Clean
  useEffect(() => {
    if (!editingService) { // Solo para servicios nuevos (no editando)
      let prefix = '';
      
      if (formData.service_type === 'Touch Up') {
        prefix = 'T';
      } else if (formData.service_type === 'Landscaping') {
        prefix = 'L';
      } else if (formData.service_type === 'Terceros') {
        prefix = 'C';
      }
      
      if (prefix) {
        // Encontrar el próximo número disponible basándose en los servicios existentes
        const existingNumbers = services
          .filter(s => s.work_order && s.work_order.startsWith(prefix))
          .map(s => {
            const numberStr = s.work_order!.substring(1); // Remover el prefijo
            return parseInt(numberStr, 10);
          })
          .filter(num => !isNaN(num))
          .sort((a, b) => b - a); // Ordenar de mayor a menor

        const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
        const generatedWorkOrder = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        
        // Para servicios nuevos, no validar duplicados ya que el número se genera automáticamente
        // basándose en los servicios existentes
        setWorkOrderError(null);
        setFormData(prev => ({
          ...prev,
          work_order: generatedWorkOrder
        }));
      } else if (formData.service_type === 'Prearrival Service' || formData.service_type === 'Departure Clean') {
        // Limpiar workOrder para servicios Prearrival y Departure Clean
        setFormData(prev => ({
          ...prev,
          work_order: ''
        }));
        setWorkOrderError(null);
      }
    }
  }, [formData.service_type, editingService, services]);

  // Función para validar unicidad del WorkOrder
  const validateWorkOrderUniqueness = (workOrder: string) => {
    if (!workOrder.trim()) {
      return null; // No hay error si está vacío
    }
    
    const existingService = services.find(s => 
      s.work_order && 
      s.work_order.toLowerCase() === workOrder.toLowerCase() &&
      s.id !== editingService?.id
    );
    
    if (existingService) {
      return `El WorkOrder # "${workOrder}" ya existe en otro servicio.`;
    }
    
    return null;
  };

  // Obtener el precio histórico de la unidad
  const historicalUnitPrice = useMemo(() => {
    // Si estamos editando un servicio, usar el precio histórico guardado
    if (editingService?.historical_unit_price) {
      return editingService.historical_unit_price;
    }
    // Si es un servicio nuevo, usar el precio actual de la unidad
    const unit = units.find(u => u.id === formData.unit_id);
    return unit ? unit.price : 0;
  }, [formData.unit_id, units, editingService?.historical_unit_price]);

  // Calcular el costo total
  const totalCost = useMemo(() => {
    // Usar el precio histórico si estamos editando un servicio, sino usar el precio actual
    const unitPrice = historicalUnitPrice;
    const petsFee = formData.has_pets ? 50 : 0; // Cargo adicional por mascotas
    const deepCleaningMultiplier = formData.deep_cleaning ? 2 : 1; // Duplica el costo si es Deep Cleaning
    
    // Para servicios Touch Up, Landscaping y Terceros, solo se cobran los extras (no el precio de la unidad)
    if (formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros') {
      return (petsFee) * deepCleaningMultiplier;
    }
    
    return (unitPrice + petsFee) * deepCleaningMultiplier;
  }, [historicalUnitPrice, formData.has_pets, formData.service_type, formData.deep_cleaning, formData.unit_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.unit_id) {
      setError('Por favor, seleccione una unidad.');
      return;
    }
    if (formData.worker_ids.length === 0) {
      setError('Por favor, seleccione al menos un trabajador.');
      return;
    }
    
    // Validar que el workorder no esté duplicado
    if (workOrderError) {
      setError('Por favor, corrija el error del WorkOrder # antes de guardar.');
      return;
    }
    
    // Validar que el workorder de mascotas no esté duplicado
    if (workOrderPetError) {
      setError('Por favor, corrija el error del WorkOrder de mascotas antes de guardar.');
      return;
    }
    
    if (formData.work_order.trim()) {
      const existingService = services.find(s => 
        s.work_order && 
        s.work_order.toLowerCase() === formData.work_order.toLowerCase() &&
        s.id !== editingService?.id // Excluir el servicio actual si estamos editando
      );
      
      if (existingService) {
        setError(`El WorkOrder # "${formData.work_order}" ya existe en otro servicio. Por favor, use un código diferente.`);
        return;
      }
    }
    
    // Validar workorder de mascotas contra todos los workorders existentes
    if (formData.work_order_pet.trim()) {
      const existingService = services.find(s => 
        (s.work_order && s.work_order.toLowerCase() === formData.work_order_pet.toLowerCase()) ||
        (s.work_order_pet && s.work_order_pet.toLowerCase() === formData.work_order_pet.toLowerCase())
      );
      
      if (existingService) {
        setError(`El WorkOrder # "${formData.work_order_pet}" ya existe en otro servicio. Por favor, use un código diferente.`);
        return;
      }
    }

    // Validar que los colaboradores tengan pago asignado para la unidad
    if (formData.unit_id && formData.worker_ids.length > 0) {
      const selectedUnit = units.find(u => u.id === formData.unit_id);
      if (selectedUnit) {
        const workersWithoutPayment = formData.worker_ids.filter(workerId => {
          const worker = workers.find(w => w.id === workerId);
          if (!worker) return true;
          
          // Verificar si el trabajador tiene pago asignado para esta unidad
          const hasUnitRate = worker.unit_rates && worker.unit_rates[formData.unit_id] !== undefined;
          const hasHourlyRate = worker.hourly_rate && worker.hourly_rate > 0;
          
          return !hasUnitRate && !hasHourlyRate;
        });

        if (workersWithoutPayment.length > 0) {
          const workerNames = workersWithoutPayment.map(workerId => {
            const worker = workers.find(w => w.id === workerId);
            return worker ? worker.name : 'Trabajador desconocido';
          }).join(', ');
          
          setError(`Los siguientes colaboradores no tienen pago asignado para la unidad "${selectedUnit.name}": ${workerNames}\n\nPor favor, configure el pago para estos colaboradores antes de continuar.`);
          return;
        }
      }
    }

    try {
      const serviceData = {
        ...formData,
        total_cost: totalCost,
        historical_unit_price: historicalUnitPrice,
        extras: formData.extras || []
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await createService(serviceData);
        
        // Actualizar correlativos para servicios Touch Up, Landscaping y Terceros
        if (formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros') {
          try {
            const workOrderNumber = parseInt(formData.work_order.substring(1), 10);
            if (!isNaN(workOrderNumber)) {
              const configUpdate: any = {};
              
              if (formData.service_type === 'Touch Up') {
                configUpdate.last_touch_up_number = Math.max(config?.last_touch_up_number || 0, workOrderNumber);
              } else if (formData.service_type === 'Landscaping') {
                configUpdate.last_landscaping_number = Math.max(config?.last_landscaping_number || 0, workOrderNumber);
              } else if (formData.service_type === 'Terceros') {
                configUpdate.last_terceros_number = Math.max(config?.last_terceros_number || 0, workOrderNumber);
              }
              
              if (Object.keys(configUpdate).length > 0) {
                await updateConfig(configUpdate);
              }
            }
          } catch (correlativoError) {
            console.error('Error al actualizar correlativo:', correlativoError);
            // No lanzar error aquí, el servicio ya se guardó
          }
        }
      }
      onClose();
    } catch (err) {
      setError('Error al guardar el servicio');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este servicio?')) {
      try {
        await deleteService(serviceId);
      } catch (err) {
        setError('Error al eliminar el servicio');
      }
    }
  };


  const handlePDFImport = async (extractedData: ExtractedServiceData[]) => {
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const data of extractedData) {
        try {
          // Buscar la unidad por nombre
          const unit = units.find(u => 
            u.name.toLowerCase().includes(data.unitName.toLowerCase()) ||
            data.unitName.toLowerCase().includes(u.name.toLowerCase())
          );

          if (!unit) {
            console.warn(`Unidad no encontrada: ${data.unitName}`);
            errorCount++;
            continue;
          }

          // Crear el servicio
          const serviceData = {
            unit_id: unit.id,
            worker_ids: [], // Se puede asignar trabajadores manualmente después
            start_date: data.scheduledDate || new Date().toISOString().split('T')[0],
            execution_date: data.scheduledDate || '',
            start_time: '09:00', // Hora por defecto
            end_time: '17:00', // Hora por defecto
            pay_by_hour: true,
            total_cost: 0, // Se puede calcular después
            work_order: data.workOrder || '',
            service_type: (data.serviceType as ServiceType) || 'Departure Clean',
            has_pets: false,
            work_order_pet: '',
            deep_cleaning: false,
            extras: [],
          };

          await createService(serviceData);
          successCount++;
        } catch (error) {
          console.error('Error creando servicio:', error);
          errorCount++;
        }
      }

      toast({
        title: 'Importación completada',
        description: `${successCount} servicios creados, ${errorCount} errores`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });

      onPDFClose();
    } catch (error) {
      toast({
        title: 'Error en la importación',
        description: 'Error al procesar los datos del PDF',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        Cargando servicios...
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Servicios</Heading>
        <HStack spacing={3}>
          <Button
            leftIcon={<FaFilePdf />}
            colorScheme="purple"
            variant="outline"
            onClick={onPDFOpen}
          >
            Importar PDF
          </Button>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            onClick={() => handleOpenModal()}
          >
            Nuevo Servicio
          </Button>
        </HStack>
      </HStack>

      <Card bg={cardBg}>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Fecha</Th>
                <Th>Unidad</Th>
                <Th>Trabajadores</Th>
                <Th>Tipo</Th>
                <Th>Costo</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {services.map((service) => (
                <Tr key={service.id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {new Date(service.start_date).toLocaleDateString()}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {service.start_time} - {service.end_time}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    {units.find(u => u.id === service.unit_id)?.name || 'N/A'}
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {service.worker_ids.length} trabajador(es)
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue" variant="subtle">
                      {service.service_type || 'Departure Clean'}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontWeight="medium">
                      $ {service.total_cost.toFixed(2)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="green" variant="subtle">
                      Programado
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(service)}
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(service.id)}
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
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        size="xl"
      >
        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Fecha de Inicio</FormLabel>
                <DatePicker
                  value={formData.start_date}
                  onChange={(date) => setFormData({ ...formData, start_date: date })}
                  placeholder="Seleccionar fecha de inicio"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Fecha de Ejecución</FormLabel>
                <DatePicker
                  value={formData.execution_date}
                  onChange={(date) => setFormData({ ...formData, execution_date: date })}
                  placeholder="Seleccionar fecha de ejecución"
                  minDate={formData.start_date}
                />
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Hora de Inicio</FormLabel>
                <TimePicker
                  value={formData.start_time}
                  onChange={(time) => setFormData({ ...formData, start_time: time })}
                  placeholder="Seleccionar hora de inicio"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Hora de Fin</FormLabel>
                <TimePicker
                  value={formData.end_time}
                  onChange={(time) => setFormData({ ...formData, end_time: time })}
                  placeholder="Seleccionar hora de fin"
                  minTime={formData.start_time}
                />
              </FormControl>
            </HStack>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Unidad</FormLabel>
              <Select2
                options={units.map(unit => ({
                  value: unit.id,
                  label: unit.name
                }))}
                value={formData.unit_id}
                onChange={(value) => setFormData({ ...formData, unit_id: value })}
                placeholder="Seleccionar unidad"
                isRequired={true}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Trabajadores</FormLabel>
              <MultiSelect
                options={workers.map(worker => ({
                  value: worker.id,
                  label: worker.name
                }))}
                value={formData.worker_ids}
                onChange={(values) => setFormData({ ...formData, worker_ids: values })}
                placeholder="Seleccionar trabajadores"
                maxHeight="200px"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Tipo de Servicio</FormLabel>
              <Select2
                options={serviceTypes.map(type => ({
                  value: type,
                  label: type
                }))}
                value={formData.service_type}
                onChange={(value) => setFormData({ ...formData, service_type: value as ServiceType })}
                placeholder="Seleccionar tipo de servicio"
                isRequired={true}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Costo Total</FormLabel>
              <Box>
                <NumberInput
                  value={totalCost}
                  isReadOnly
                  size="lg"
                  bg="gray.50"
                >
                  <NumberInputField borderRadius="md" />
                </NumberInput>
                <VStack align="start" spacing={1} mt={2} fontSize="sm" color="gray.600">
                  {formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros' ? (
                    <Text fontSize="xs" color="blue.600">
                      Servicio {formData.service_type}: Solo se cobran extras y cargos adicionales
                    </Text>
                  ) : (
                    <>
                      <Text>Precio base: ${historicalUnitPrice.toFixed(2)}</Text>
                      {formData.has_pets && <Text>🐾 Cargo por mascotas: $50.00</Text>}
                      {formData.deep_cleaning && <Text>🧽 Deep Cleaning (x2): ${(totalCost * 2).toFixed(2)}</Text>}
                    </>
                  )}
                </VStack>
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Orden de Trabajo</FormLabel>
              <Input
                value={formData.work_order}
                onChange={(e) => {
                  setFormData({ ...formData, work_order: e.target.value });
                  const error = validateWorkOrderUniqueness(e.target.value);
                  setWorkOrderError(error);
                }}
                placeholder={
                  (formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros') 
                    ? 'Generado automáticamente' 
                    : 'Código de orden de trabajo'
                }
                size="lg"
                borderRadius="md"
                isReadOnly={formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros'}
                bg={formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros' ? 'gray.100' : 'white'}
                borderColor={workOrderError ? 'red.500' : undefined}
              />
              {workOrderError && (
                <Text fontSize="sm" color="red.500" mt={1}>
                  {workOrderError}
                </Text>
              )}
              {(formData.service_type === 'Touch Up' || formData.service_type === 'Landscaping' || formData.service_type === 'Terceros') && (
                <Text fontSize="xs" color="blue.600" mt={1}>
                  El WorkOrder se genera automáticamente para servicios {formData.service_type}
                </Text>
              )}
            </FormControl>

            <HStack spacing={4} w="full">
              <Checkbox
                isChecked={formData.has_pets}
                onChange={(e) => setFormData({ ...formData, has_pets: e.target.checked })}
              >
                Incluye mascotas
              </Checkbox>

              <Checkbox
                isChecked={formData.deep_cleaning}
                onChange={(e) => setFormData({ ...formData, deep_cleaning: e.target.checked })}
              >
                Limpieza profunda
              </Checkbox>
            </HStack>

            {formData.has_pets && (
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Orden de Trabajo - Mascotas</FormLabel>
                <Input
                  value={formData.work_order_pet}
                  onChange={(e) => {
                    setFormData({ ...formData, work_order_pet: e.target.value });
                    if (e.target.value.trim()) {
                      const existingService = services.find(s => 
                        (s.work_order && s.work_order.toLowerCase() === e.target.value.toLowerCase()) ||
                        (s.work_order_pet && s.work_order_pet.toLowerCase() === e.target.value.toLowerCase())
                      );
                      
                      if (existingService) {
                        setWorkOrderPetError(`El WorkOrder # "${e.target.value}" ya existe en otro servicio.`);
                      } else {
                        setWorkOrderPetError(null);
                      }
                    } else {
                      setWorkOrderPetError(null);
                    }
                  }}
                  placeholder="Código de orden de trabajo para mascotas"
                  size="lg"
                  borderRadius="md"
                  borderColor={workOrderPetError ? 'red.500' : undefined}
                />
                {workOrderPetError && (
                  <Text fontSize="sm" color="red.500" mt={1}>
                    {workOrderPetError}
                  </Text>
                )}
              </FormControl>
            )}

            <HStack spacing={4} w="full" pt={4}>
              <Button 
                type="submit" 
                colorScheme="brand" 
                flex={1}
                size="lg"
                fontWeight="medium"
              >
                {editingService ? 'Actualizar' : 'Crear'}
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

      <Modal
        isOpen={isPDFOpen}
        onClose={onPDFClose}
        title="Importar Servicios desde PDF"
        size="4xl"
      >
        <PDFBulkImporter
          onImport={handlePDFImport}
          onClose={onPDFClose}
        />
      </Modal>
    </Box>
  );
};

export default Services;
