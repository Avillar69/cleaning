import React, { useState, useMemo, useEffect } from 'react';
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
import { FaFilePdf, FaEnvelope, FaDownload } from 'react-icons/fa';
import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import DatePicker from '../components/DatePicker';
import type { Invoice, Service } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

// Función helper para verificar si un servicio está facturado
const isServiceInvoiced = (serviceId: string, invoices: Invoice[], excludeInvoiceId?: string) => {
  return invoices.some(invoice => 
    invoice.id !== excludeInvoiceId && invoice.services.includes(serviceId)
  );
};

interface InvoiceFormProps {
  onSave: (invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  editingInvoice?: Invoice;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave, onClose, editingInvoice }) => {
  const { services = [], clients = [], units = [], invoices = [], config } = useData();
  const toast = useToast();

  // Filtrar servicios de tipo "Touch Up" que no están ya facturados
  const availableServices = useMemo(() => {
    const invoicedServiceIds = new Set<string>();
    invoices.forEach(invoice => {
      if (editingInvoice && invoice.id === editingInvoice.id) {
        return; // Excluir servicios de la factura que estamos editando
      }
      invoice.services.forEach(serviceId => {
        invoicedServiceIds.add(serviceId);
      });
    });

    return services.filter(service => 
      service.service_type === 'Touch Up' && !invoicedServiceIds.has(service.id)
    );
  }, [services, invoices, editingInvoice]);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  // Inicializar formulario si se está editando
  useEffect(() => {
    if (editingInvoice) {
      setSelectedClientId(editingInvoice.client_id);
      setSelectedServices(editingInvoice.services);
      setInvoiceData({
        invoice_number: editingInvoice.invoice_number,
        issue_date: editingInvoice.issue_date,
        due_date: editingInvoice.due_date,
        notes: editingInvoice.notes || '',
      });
    } else {
      // Generar número de factura automático correlativo
      const nextNumber = (config?.last_invoice_number || 0) + 1;
      setInvoiceData(prev => ({
        ...prev,
        invoice_number: `INV-${nextNumber.toString().padStart(4, '0')}`
      }));
    }
  }, [editingInvoice, config]);

  // Calcular total de la factura
  const totalAmount = useMemo(() => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.total_cost || 0);
    }, 0);
  }, [selectedServices, services]);

  const handleServiceToggle = (serviceId: string) => {
    if (!editingInvoice && isServiceInvoiced(serviceId, invoices)) {
      toast({
        title: 'Servicio ya facturado',
        description: 'Este servicio ya está incluido en otra factura.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectAll = () => {
    if (selectedServices.length === availableServices.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(availableServices.map(s => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast({
        title: 'Cliente requerido',
        description: 'Por favor, seleccione un cliente.',
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
    if (!invoiceData.invoice_number.trim()) {
      toast({
        title: 'Número de factura requerido',
        description: 'Por favor, ingrese el número de factura.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
      invoice_number: invoiceData.invoice_number.trim(),
      client_id: selectedClientId,
      services: selectedServices,
      total_amount: totalAmount,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      status: editingInvoice?.status || 'draft',
      notes: invoiceData.notes.trim(),
    };

    onSave(invoice);
  };

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        {/* Selección de cliente */}
        <FormControl isRequired>
          <FormLabel>Cliente</FormLabel>
          <Select 
            value={selectedClientId} 
            onChange={(e) => setSelectedClientId(e.target.value)}
            placeholder="Seleccione un cliente..."
          >
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.email}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Información de la factura */}
        <HStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Número de Factura</FormLabel>
            <Input
              value={invoiceData.invoice_number}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
              readOnly
              bg={useColorModeValue('gray.50', 'gray.700')}
            />
            <Text fontSize="xs" color="blue.500" mt={1}>
              El número de factura se genera automáticamente
            </Text>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Fecha de Emisión</FormLabel>
            <DatePicker
              value={invoiceData.issue_date}
              onChange={(date) => setInvoiceData(prev => ({ ...prev, issue_date: date }))}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Fecha de Vencimiento</FormLabel>
            <DatePicker
              value={invoiceData.due_date}
              onChange={(date) => setInvoiceData(prev => ({ ...prev, due_date: date }))}
            />
          </FormControl>
        </HStack>

        {/* Lista de servicios "Touch Up" */}
        {availableServices.length > 0 ? (
          <FormControl>
            <HStack justify="space-between" mb={2}>
              <Box>
                <FormLabel mb={0}>Servicios "Touch Up" Disponibles</FormLabel>
                <Text fontSize="sm" color="gray.600">
                  {availableServices.length} servicio(s) disponible(s) para facturar
                </Text>
              </Box>
              <Button
                size="sm"
                variant="link"
                onClick={handleSelectAll}
              >
                {selectedServices.length === availableServices.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </Button>
            </HStack>
            
            <Box
              maxH="300px"
              overflowY="auto"
              borderWidth={1}
              borderRadius="md"
              p={2}
              bg={cardBg}
            >
              <VStack spacing={2} align="stretch">
                {availableServices.map(service => {
                  const unit = units.find(u => u.id === service.unit_id);
                  const client = clients.find(c => c.id === unit?.client_id);
                  
                  return (
                    <Card key={service.id} size="sm" variant="outline">
                      <CardBody p={3}>
                        <HStack align="start">
                          <Checkbox
                            isChecked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            mt={1}
                          />
                          <Box flex={1}>
                            <HStack justify="space-between" mb={1}>
                              <Box>
                                <Text fontWeight="bold">{unit?.name || 'Unidad eliminada'}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  Cliente: {client?.name || 'Cliente eliminado'}
                                </Text>
                                <Text fontSize="sm" color="gray.600">
                                  {formatDateDDMMYYYY(getServiceEffectiveDate(service))} - {service.start_time} a {service.end_time}
                                </Text>
                                {service.work_order && (
                                  <Text fontSize="sm" color="blue.600" fontWeight="medium">
                                    Work Order: {service.work_order}
                                  </Text>
                                )}
                              </Box>
                              <Text fontWeight="bold" color="green.600">
                                ${service.total_cost.toFixed(2)}
                              </Text>
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
        ) : (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">No hay servicios "Touch Up" disponibles para facturar.</Text>
              <Text fontSize="sm">
                Todos los servicios de tipo "Touch Up" ya han sido incluidos en facturas existentes.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Notas */}
        <FormControl>
          <FormLabel>Notas (opcional)</FormLabel>
          <Textarea
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notas adicionales sobre la factura"
            rows={3}
          />
        </FormControl>

        {/* Total de la factura */}
        {selectedServices.length > 0 && (
          <Card bg="green.50" borderColor="green.200">
            <CardBody>
              <HStack justify="space-between">
                <Text fontWeight="bold" color="green.800">Total de la Factura:</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  ${totalAmount.toFixed(2)}
                </Text>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Botones */}
        <HStack justify="flex-end" spacing={3} mt={4}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            colorScheme="blue"
            isDisabled={selectedServices.length === 0}
          >
            {editingInvoice ? 'Actualizar Factura' : 'Crear Factura'}
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

const Invoices: React.FC = () => {
  const { 
    invoices, 
    services, 
    clients, 
    units, 
    config,
    createInvoice, 
    updateInvoice, 
    deleteInvoice,
    updateConfig,
    loading 
  } = useData();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');

  // Filtrar facturas por fecha
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice => invoice.issue_date >= dateFilter.startDate && invoice.issue_date <= dateFilter.endDate)
      .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
  }, [invoices, dateFilter]);

  const handleOpenModal = (invoice?: Invoice) => {
    setEditingInvoice(invoice || null);
    onOpen();
  };

  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
        toast({
          title: 'Factura actualizada',
          description: 'La factura se ha actualizado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createInvoice(invoiceData);
        
        // Actualizar el número de factura en la configuración
        if (config) {
          const nextNumber = (config.last_invoice_number || 0) + 1;
          await updateConfig({ last_invoice_number: nextNumber });
        }
        
        toast({
          title: 'Factura creada',
          description: 'La factura se ha creado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      setEditingInvoice(null);
    } catch (error) {
      console.error('Error al guardar factura:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la factura. Por favor, intente nuevamente.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta factura?')) {
      try {
        await deleteInvoice(invoiceId);
        toast({
          title: 'Factura eliminada',
          description: 'La factura se ha eliminado correctamente.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error al eliminar factura:', error);
        toast({
          title: 'Error',
          description: 'Error al eliminar la factura. Por favor, intente nuevamente.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.client_id);
    if (!client?.email) {
      toast({
        title: 'Email no disponible',
        description: 'El cliente no tiene email registrado.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Crear el PDF
    const doc = new jsPDF();
    const invoiceServices = services.filter(s => invoice.services.includes(s.id));
    
    const totalInvoiceAmount = invoiceServices.reduce((total, service) => {
      return total + service.total_cost;
    }, 0);
    
    // Configuración de colores suaves y minimalistas
    const headerColor: [number, number, number] = [66, 165, 245]; // Azul suave
    const textColor: [number, number, number] = [55, 71, 79]; // Gris oscuro
    const lightGray: [number, number, number] = [245, 245, 245]; // Gris claro
    
    // Número de factura
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.invoice_number}-INVOICE`, 120, 25);
    
    // Información de la empresa
    let yPosition = 30;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('K&D Cleaning services', 20, yPosition);
    yPosition += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('26 Stanhope Rd', 20, yPosition);
    yPosition += 4;
    doc.text('Goose Creek', 20, yPosition);
    yPosition += 4;
    doc.text('South Carolina', 20, yPosition);
    yPosition += 4;
    doc.text('29445', 20, yPosition);
    
    yPosition += 10;
    
    // Información del cliente
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(client.name, 20, yPosition);
    yPosition += 4;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (client.address) {
      doc.text(client.address, 20, yPosition);
      yPosition += 4;
    }
    
    yPosition += 10;
    
    // Detalles de la factura
    const detailsStartX = 100;
    yPosition = 65;
    
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(detailsStartX - 5, yPosition - 8, 85, 20, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Invoice #', detailsStartX, yPosition);
    doc.text('Invoice Date', detailsStartX, yPosition + 6);
    doc.text('Due Date', detailsStartX, yPosition + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_number, detailsStartX + 60, yPosition);
    doc.text(formatDateDDMMYYYY(invoice.issue_date), detailsStartX + 60, yPosition + 6);
    doc.text(formatDateDDMMYYYY(invoice.due_date), detailsStartX + 60, yPosition + 12);
    
    yPosition += 25;
    
    // Tabla de servicios
    const tableData: any[] = [];
    
    tableData.push([
      { content: 'Item', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'Description', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'Unit Price', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } },
      { content: 'Quantity', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } },
      { content: 'Amount', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } }
    ]);
    
    invoiceServices.forEach((service) => {
      const serviceDate = formatDateDDMMYYYY(getServiceEffectiveDate(service));
      tableData.push([
        'Service',
        `Cleaning Services ${serviceDate}`,
        `${service.total_cost.toFixed(2)}`,
        '1.00',
        `${service.total_cost.toFixed(2)}`
      ]);
    });

    autoTable(doc, {
      startY: yPosition,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: headerColor as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
    });
    
    // Resumen de totales
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const summaryStartX = 110;
    
    const summaryData = [
      ['Subtotal', totalInvoiceAmount.toFixed(2)],
      ['Total', totalInvoiceAmount.toFixed(2)],
      ['Amount Paid', '0.00'],
      ['Balance Due', `$${totalInvoiceAmount.toFixed(2)}`]
    ];
    
    autoTable(doc, {
      startY: finalY,
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: summaryStartX, right: 20 },
      didDrawCell: function(data: any) {
        if (data.row.index === 3) {
          doc.setFillColor(240, 240, 240);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setFont('helvetica', 'bold');
        }
      }
    });

    // Crear enlace mailto
    const subject = `Factura ${invoice.invoice_number} - K&D Cleaning`;
    const body = `Estimado/a ${client.name},

Adjunto encontrará la factura ${invoice.invoice_number} por los servicios realizados.

Detalles de la factura:
- Número: ${invoice.invoice_number}
- Fecha de emisión: ${formatDateDDMMYYYY(invoice.issue_date)}
- Fecha de vencimiento: ${formatDateDDMMYYYY(invoice.due_date)}
- Total a pagar: $${totalInvoiceAmount.toFixed(2)}

${invoice.notes ? `Notas: ${invoice.notes}` : ''}

Por favor, no dude en contactarnos si tiene alguna pregunta.

Saludos cordiales,
K&D Cleaning`;

    // Nota: En una aplicación real, aquí se adjuntaría el PDF al email
    // Por ahora, solo abrimos el cliente de email
    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    // Marcar como enviado
    try {
      await updateInvoice(invoice.id, { status: 'sent' });
      toast({
        title: 'Email enviado',
        description: 'Cliente de email abierto. La factura se marcó como enviada.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al actualizar estado de factura:', error);
    }
  };

  const handleDownloadPDF = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.client_id);
    const invoiceServices = services.filter(s => invoice.services.includes(s.id));
    
    const totalInvoiceAmount = invoiceServices.reduce((total, service) => {
      return total + service.total_cost;
    }, 0);
    
    const doc = new jsPDF();
    const headerColor: [number, number, number] = [66, 165, 245];
    const textColor: [number, number, number] = [55, 71, 79];
    const lightGray: [number, number, number] = [245, 245, 245];
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.invoice_number}-INVOICE`, 120, 25);
    
    let yPosition = 30;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('K&D Cleaning services', 20, yPosition);
    yPosition += 5;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('26 Stanhope Rd', 20, yPosition);
    yPosition += 4;
    doc.text('Goose Creek', 20, yPosition);
    yPosition += 4;
    doc.text('South Carolina', 20, yPosition);
    yPosition += 4;
    doc.text('29445', 20, yPosition);
    
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(client?.name || 'Cliente eliminado', 20, yPosition);
    yPosition += 4;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (client?.address) {
      doc.text(client.address, 20, yPosition);
      yPosition += 4;
    }
    
    yPosition += 10;
    
    const detailsStartX = 100;
    yPosition = 65;
    
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(detailsStartX - 5, yPosition - 8, 85, 20, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Invoice #', detailsStartX, yPosition);
    doc.text('Invoice Date', detailsStartX, yPosition + 6);
    doc.text('Due Date', detailsStartX, yPosition + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoice_number, detailsStartX + 60, yPosition);
    doc.text(formatDateDDMMYYYY(invoice.issue_date), detailsStartX + 60, yPosition + 6);
    doc.text(formatDateDDMMYYYY(invoice.due_date), detailsStartX + 60, yPosition + 12);
    
    yPosition += 25;
    
    const tableData: any[] = [];
    tableData.push([
      { content: 'Item', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'Description', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold' } },
      { content: 'Unit Price', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } },
      { content: 'Quantity', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } },
      { content: 'Amount', styles: { fillColor: headerColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' } }
    ]);
    
    invoiceServices.forEach((service) => {
      const serviceDate = formatDateDDMMYYYY(getServiceEffectiveDate(service));
      tableData.push([
        'Service',
        `Cleaning Services ${serviceDate}`,
        `${service.total_cost.toFixed(2)}`,
        '1.00',
        `${service.total_cost.toFixed(2)}`
      ]);
    });

    autoTable(doc, {
      startY: yPosition,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 5,
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: headerColor as [number, number, number],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const summaryStartX = 110;
    
    const summaryData = [
      ['Subtotal', totalInvoiceAmount.toFixed(2)],
      ['Total', totalInvoiceAmount.toFixed(2)],
      ['Amount Paid', '0.00'],
      ['Balance Due', `$${totalInvoiceAmount.toFixed(2)}`]
    ];
    
    autoTable(doc, {
      startY: finalY,
      body: summaryData,
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 4,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: summaryStartX, right: 20 },
      didDrawCell: function(data: any) {
        if (data.row.index === 3) {
          doc.setFillColor(240, 240, 240);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setFont('helvetica', 'bold');
        }
      }
    });

    const fileName = `Factura_${invoice.invoice_number}_${invoice.issue_date}.pdf`;
    doc.save(fileName);
  };

  const handleDownloadExcel = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.client_id);
    const invoiceServices = services.filter(s => invoice.services.includes(s.id));
    
    const rows: any[] = [];
    invoiceServices.forEach(service => {
      const unit = units.find(u => u.id === service.unit_id);
      rows.push({
        'Work Order': service.work_order || '-',
        'Unidad': unit?.name || 'Unidad eliminada',
        'Cliente': client?.name || 'Cliente eliminado',
        'Fecha': formatDateDDMMYYYY(getServiceEffectiveDate(service)),
        'Monto': `$${service.total_cost.toFixed(2)}`
      });
    });

    rows.push({ 'Work Order': '', 'Unidad': '', 'Cliente': '', 'Fecha': 'TOTAL', 'Monto': `$${invoice.total_amount.toFixed(2)}` });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Factura');
    const fileName = `Factura_${invoice.invoice_number}_${invoice.issue_date}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
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
        <Heading size="lg">Facturas</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleOpenModal()}
        >
          Nueva Factura
        </Button>
      </HStack>

      {/* Filtros de fecha */}
      <Card bg={cardBg} mb={6}>
        <CardBody>
          <HStack spacing={4} flexWrap="wrap">
            <Text fontWeight="medium">Filtrar por fecha de emisión:</Text>
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
          </HStack>
        </CardBody>
      </Card>

      {filteredInvoices.length > 0 ? (
        <VStack spacing={4} align="stretch">
          {filteredInvoices.map(invoice => {
            const client = clients.find(c => c.id === invoice.client_id);
            const invoiceServices = services.filter(s => invoice.services.includes(s.id));
            
            return (
              <Card key={invoice.id} bg={cardBg}>
                <CardBody>
                  <HStack justify="space-between" align="start" flexWrap="wrap">
                    <Box flex={1} minW="300px">
                      <HStack spacing={4} mb={2} flexWrap="wrap">
                        <Heading size="md" color="blue.600">{invoice.invoice_number}</Heading>
                        <Text>{client?.name || 'Cliente eliminado'}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {formatDateDDMMYYYY(invoice.issue_date)}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Vence: {formatDateDDMMYYYY(invoice.due_date)}
                        </Text>
                        <Heading size="md" color="green.600">
                          ${invoice.total_amount.toFixed(2)}
                        </Heading>
                        <Badge colorScheme={
                          invoice.status === 'paid' ? 'green' :
                          invoice.status === 'sent' ? 'blue' :
                          invoice.status === 'overdue' ? 'red' : 'gray'
                        }>
                          {invoice.status}
                        </Badge>
                      </HStack>
                      
                      {/* Servicios incluidos */}
                      {invoiceServices.length > 0 && (
                        <HStack spacing={2} flexWrap="wrap" mt={2}>
                          {invoiceServices.map(service => {
                            const unit = units.find(u => u.id === service.unit_id);
                            return (
                              <Badge key={service.id} colorScheme="blue" p={1}>
                                {unit?.name || 'Unidad eliminada'} 
                                {service.work_order && ` (${service.work_order})`}
                                <Text as="span" color="green.600" ml={1}>
                                  ${service.total_cost.toFixed(2)}
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
                        aria-label="Descargar PDF"
                        icon={<FaFilePdf />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDownloadPDF(invoice)}
                      />
                      <IconButton
                        aria-label="Descargar Excel"
                        icon={<FaDownload />}
                        colorScheme="green"
                        size="sm"
                        onClick={() => handleDownloadExcel(invoice)}
                      />
                      <IconButton
                        aria-label="Enviar por Email"
                        icon={<FaEnvelope />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => handleSendEmail(invoice)}
                      />
                      <IconButton
                        aria-label="Editar Factura"
                        icon={<EditIcon />}
                        colorScheme="yellow"
                        size="sm"
                        onClick={() => handleOpenModal(invoice)}
                      />
                      <IconButton
                        aria-label="Eliminar Factura"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
              No hay facturas registradas en el período seleccionado.
            </Text>
            <Text color="gray.400" fontSize="sm" mt={2}>
              {invoices.length > 0 
                ? 'Intenta cambiar el filtro de fechas para ver más facturas.'
                : 'Comienza creando tu primera factura.'
              }
            </Text>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          setEditingInvoice(null);
        }}
        title={editingInvoice ? "Editar Factura" : "Nueva Factura"}
        size="xl"
      >
        <InvoiceForm 
          onSave={handleSaveInvoice} 
          onClose={() => {
            onClose();
            setEditingInvoice(null);
          }} 
          editingInvoice={editingInvoice || undefined}
        />
      </Modal>
    </Box>
  );
};

export default Invoices;
