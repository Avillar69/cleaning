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
  Select,
  Textarea,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Unit, UnitType } from '../types';

const Units: React.FC = () => {
  const { 
    units, 
    unitTypes, 
    clients,
    createUnit, 
    updateUnit, 
    deleteUnit,
    createUnitType,
    updateUnitType,
    deleteUnitType,
    loading 
  } = useData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingUnitType, setEditingUnitType] = useState<UnitType | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [unitFormData, setUnitFormData] = useState({
    unit_type_id: '',
    client_id: '',
    name: '',
    code_name: '',
    address: '',
    price: 0,
  });
  const [unitTypeFormData, setUnitTypeFormData] = useState({
    name: '',
  });
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleOpenUnitModal = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setUnitFormData({
        unit_type_id: unit.unit_type_id,
        client_id: unit.client_id,
        name: unit.name,
        code_name: unit.code_name,
        address: unit.address,
        price: unit.price,
      });
    } else {
      setEditingUnit(null);
      setUnitFormData({
        unit_type_id: '',
        client_id: '',
        name: '',
        code_name: '',
        address: '',
        price: 0,
      });
    }
    setError('');
    onOpen();
  };

  const handleOpenUnitTypeModal = (unitType?: UnitType) => {
    if (unitType) {
      setEditingUnitType(unitType);
      setUnitTypeFormData({
        name: unitType.name,
      });
    } else {
      setEditingUnitType(null);
      setUnitTypeFormData({
        name: '',
      });
    }
    setError('');
    onOpen();
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUnit) {
        await updateUnit(editingUnit.id, unitFormData);
      } else {
        await createUnit(unitFormData);
      }
      onClose();
    } catch (err) {
      setError('Error al guardar la unidad');
    }
  };

  const handleUnitTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingUnitType) {
        await updateUnitType(editingUnitType.id, unitTypeFormData);
      } else {
        await createUnitType(unitTypeFormData);
      }
      onClose();
    } catch (err) {
      setError('Error al guardar el tipo de unidad');
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta unidad?')) {
      try {
        await deleteUnit(unitId);
      } catch (err) {
        setError('Error al eliminar la unidad');
      }
    }
  };

  const handleDeleteUnitType = async (unitTypeId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este tipo de unidad?')) {
      try {
        await deleteUnitType(unitTypeId);
      } catch (err) {
        setError('Error al eliminar el tipo de unidad');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        Cargando unidades...
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Unidades</Heading>

      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>Unidades</Tab>
          <Tab>Tipos de Unidad</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <HStack justify="space-between" mb={6}>
              <Text fontSize="lg" fontWeight="semibold">Gestión de Unidades</Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={() => handleOpenUnitModal()}
              >
                Nueva Unidad
              </Button>
            </HStack>

            <Card bg={cardBg}>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nombre</Th>
                      <Th>Código</Th>
                      <Th>Cliente</Th>
                      <Th>Tipo</Th>
                      <Th>Precio</Th>
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {units.map((unit) => (
                      <Tr key={unit.id}>
                        <Td fontWeight="medium">{unit.name}</Td>
                        <Td>
                          <Badge colorScheme="blue" variant="subtle">
                            {unit.code_name}
                          </Badge>
                        </Td>
                        <Td>
                          {clients.find(c => c.id === unit.client_id)?.name || 'N/A'}
                        </Td>
                        <Td>
                          {unitTypes.find(t => t.id === unit.unit_type_id)?.name || 'N/A'}
                        </Td>
                        <Td>
                          <Text fontWeight="medium">
                            $ {unit.price.toFixed(2)}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Editar"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenUnitModal(unit)}
                            />
                            <IconButton
                              aria-label="Eliminar"
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteUnit(unit.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel px={0}>
            <HStack justify="space-between" mb={6}>
              <Text fontSize="lg" fontWeight="semibold">Tipos de Unidad</Text>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="brand"
                onClick={() => handleOpenUnitTypeModal()}
              >
                Nuevo Tipo
              </Button>
            </HStack>

            <Card bg={cardBg}>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Nombre</Th>
                      <Th>Acciones</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {unitTypes.map((unitType) => (
                      <Tr key={unitType.id}>
                        <Td fontWeight="medium">{unitType.name}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="Editar"
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenUnitTypeModal(unitType)}
                            />
                            <IconButton
                              aria-label="Eliminar"
                              icon={<DeleteIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDeleteUnitType(unitType.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal para Unidades */}
      <Modal
        isOpen={isOpen && activeTab === 0}
        onClose={onClose}
        title={editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
        size="lg"
      >
        <form onSubmit={handleUnitSubmit}>
          <VStack spacing={6}>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Nombre de la Unidad</FormLabel>
              <Input
                value={unitFormData.name}
                onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                placeholder="Nombre de la unidad"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Código de la Unidad</FormLabel>
              <Input
                value={unitFormData.code_name}
                onChange={(e) => setUnitFormData({ ...unitFormData, code_name: e.target.value })}
                placeholder="Código único"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Cliente</FormLabel>
              <Select
                value={unitFormData.client_id}
                onChange={(e) => setUnitFormData({ ...unitFormData, client_id: e.target.value })}
                placeholder="Seleccionar cliente"
                size="lg"
                borderRadius="md"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Tipo de Unidad</FormLabel>
              <Select
                value={unitFormData.unit_type_id}
                onChange={(e) => setUnitFormData({ ...unitFormData, unit_type_id: e.target.value })}
                placeholder="Seleccionar tipo"
                size="lg"
                borderRadius="md"
              >
                {unitTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Dirección</FormLabel>
              <Textarea
                value={unitFormData.address}
                onChange={(e) => setUnitFormData({ ...unitFormData, address: e.target.value })}
                placeholder="Dirección de la unidad"
                rows={3}
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Precio</FormLabel>
              <NumberInput
                value={unitFormData.price}
                onChange={(_, value) => setUnitFormData({ ...unitFormData, price: value || 0 })}
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
                {editingUnit ? 'Actualizar' : 'Crear'}
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

      {/* Modal para Tipos de Unidad */}
      <Modal
        isOpen={isOpen && activeTab === 1}
        onClose={onClose}
        title={editingUnitType ? 'Editar Tipo de Unidad' : 'Nuevo Tipo de Unidad'}
        size="md"
      >
        <form onSubmit={handleUnitTypeSubmit}>
          <VStack spacing={6}>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Nombre del Tipo</FormLabel>
              <Input
                value={unitTypeFormData.name}
                onChange={(e) => setUnitTypeFormData({ ...unitTypeFormData, name: e.target.value })}
                placeholder="Nombre del tipo de unidad"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <HStack spacing={4} w="full" pt={4}>
              <Button 
                type="submit" 
                colorScheme="brand" 
                flex={1}
                size="lg"
                fontWeight="medium"
              >
                {editingUnitType ? 'Actualizar' : 'Crear'}
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
    </Box>
  );
};

export default Units;
