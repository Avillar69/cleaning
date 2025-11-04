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
  useColorModeValue,
  Card,
  CardBody,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import { Client } from '../types';

const Clients: React.FC = () => {
  const { clients, createClient, updateClient, deleteClient, loading } = useData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setError('');
    onOpen();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }
      onClose();
    } catch (err) {
      setError('Error al guardar el cliente');
    }
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      try {
        await deleteClient(clientId);
      } catch (err) {
        setError('Error al eliminar el cliente');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="400px">
        Cargando clientes...
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Clientes</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="brand"
          onClick={() => handleOpenModal()}
        >
          Nuevo Cliente
        </Button>
      </HStack>

      <Card bg={cardBg}>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>Dirección</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {clients.map((client) => (
                <Tr key={client.id}>
                  <Td fontWeight="medium">{client.name}</Td>
                  <Td>{client.email}</Td>
                  <Td>{client.phone}</Td>
                  <Td>{client.address}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Editar"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(client)}
                      />
                      <IconButton
                        aria-label="Eliminar"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(client.id)}
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
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                placeholder="Nombre del cliente"
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
                placeholder="Email del cliente"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Teléfono</FormLabel>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Teléfono del cliente"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Dirección</FormLabel>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección del cliente"
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="medium" mb={2}>Notas</FormLabel>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales"
                rows={3}
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
                {editingClient ? 'Actualizar' : 'Crear'}
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

export default Clients;
