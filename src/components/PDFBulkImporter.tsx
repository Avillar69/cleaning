import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Spinner,
  HStack,
  IconButton,
  Divider,
  Badge,
  List,
  ListItem
} from '@chakra-ui/react';
import { PDFExtractionService, ExtractedServiceData } from '../services/pdfExtractionService';
import { FaFilePdf, FaUpload, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface PDFBulkImporterProps {
  onImport: (rows: ExtractedServiceData[]) => void;
  onClose: () => void;
}

const PDFBulkImporter: React.FC<PDFBulkImporterProps> = ({ onImport, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedServiceData[] | null>(null);
  const toast = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Por favor selecciona un archivo PDF válido.');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo PDF primero.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const rows = await PDFExtractionService.extractMultipleServicesFromPDF(selectedFile);
      setExtractedData(rows);
      
      toast({
        title: 'Datos extraídos exitosamente',
        description: `Se encontraron ${rows.length} servicios en el PDF`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error al importar el PDF';
      setError(errorMessage);
      
      // Mostrar mensaje más específico para errores de API
      let userMessage = errorMessage;
      if (errorMessage.includes('503') || errorMessage.includes('overloaded')) {
        userMessage = 'La API de Gemini está sobrecargada. Se intentará un método alternativo de extracción.';
      } else if (errorMessage.includes('429')) {
        userMessage = 'Límite de solicitudes excedido. Se intentará un método alternativo de extracción.';
      }
      
      toast({
        title: 'Error al procesar PDF',
        description: userMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (extractedData) {
      onImport(extractedData);
      onClose();
    }
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="lg" maxW="2xl" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold" color="gray.800">
            Importador de Servicios desde PDF
          </Text>
          <IconButton
            aria-label="Cerrar"
            icon={<FaTimes />}
            variant="ghost"
            onClick={onClose}
            color="gray.500"
            _hover={{ color: "gray.700" }}
          />
        </HStack>

        <Divider />

        {/* File Upload Area */}
        <Box
          border="2px dashed"
          borderColor={selectedFile ? "green.300" : "gray.300"}
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg={selectedFile ? "green.50" : "gray.50"}
          transition="all 0.2s"
          _hover={{ borderColor: selectedFile ? "green.400" : "gray.400" }}
        >
          {selectedFile ? (
            <VStack spacing={4}>
              <HStack spacing={3}>
                <FaFilePdf size={24} color="#e53e3e" />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium" color="green.800">
                    {selectedFile.name}
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </VStack>
              </HStack>
              
              <Button
                colorScheme="blue"
                leftIcon={<FaUpload />}
                onClick={handleImport}
                isLoading={isLoading}
                loadingText="Procesando..."
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Extrayendo datos...' : 'Extraer Datos'}
              </Button>
            </VStack>
          ) : (
            <VStack spacing={4}>
              <FaFilePdf size={48} color="#a0aec0" />
              <VStack spacing={2}>
                <Text fontSize="lg" fontWeight="medium" color="gray.700">
                  Selecciona un PDF con tabla de servicios
                </Text>
                <Text fontSize="sm" color="gray.500">
                  El archivo debe contener una tabla con: WorkOrder, Unidad, Tipo de Servicio, Fecha
                </Text>
              </VStack>
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="pdf-bulk-upload"
              />
              <Button
                as="label"
                htmlFor="pdf-bulk-upload"
                colorScheme="blue"
                leftIcon={<FaUpload />}
                cursor="pointer"
                size="lg"
              >
                Seleccionar PDF
              </Button>
            </VStack>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error al procesar archivo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Box textAlign="center" py={4}>
            <Spinner size="lg" color="blue.500" />
            <VStack spacing={2} mt={2}>
              <Text color="gray.600" fontWeight="medium">
                Procesando PDF con Gemini AI...
              </Text>
              <Text fontSize="sm" color="gray.500">
                Esto puede tomar unos momentos. Si la API está sobrecargada, se reintentará automáticamente.
              </Text>
            </VStack>
          </Box>
        )}

        {/* Extracted Data Preview */}
        {extractedData && (
          <Box>
            <HStack justify="space-between" align="center" mb={4}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.800">
                Datos Extraídos
              </Text>
              <Badge colorScheme="green" fontSize="sm">
                {extractedData.length} servicios
              </Badge>
            </HStack>

            <Box
              maxH="300px"
              overflowY="auto"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              bg="gray.50"
            >
              <List spacing={2}>
                {extractedData.map((service, index) => (
                  <ListItem key={index} p={2} bg="white" borderRadius="md" border="1px solid" borderColor="gray.100">
                    <HStack spacing={4} align="start">
                      <Badge colorScheme="blue" minW="fit-content">
                        #{index + 1}
                      </Badge>
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="medium">
                            Orden:
                          </Text>
                          <Text fontSize="sm" color="gray.700">
                            {service.workOrder || 'N/A'}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="medium">
                            Unidad:
                          </Text>
                          <Text fontSize="sm" color="gray.700">
                            {service.unitName || 'N/A'}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="medium">
                            Tipo:
                          </Text>
                          <Text fontSize="sm" color="gray.700">
                            {service.serviceType || 'N/A'}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Text fontSize="sm" fontWeight="medium">
                            Fecha:
                          </Text>
                          <Text fontSize="sm" color="gray.700">
                            {service.scheduledDate || 'N/A'}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            </Box>

            <HStack justify="center" spacing={4} mt={4}>
              <Button
                colorScheme="green"
                leftIcon={<FaCheck />}
                onClick={handleConfirmImport}
                size="lg"
              >
                Confirmar Importación
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedData(null);
                  setSelectedFile(null);
                }}
                size="lg"
              >
                Cancelar
              </Button>
            </HStack>
          </Box>
        )}

        {/* Instructions */}
        <Box bg="blue.50" p={4} borderRadius="md" border="1px solid" borderColor="blue.200">
          <HStack spacing={2} mb={2}>
            <FaExclamationTriangle color="#3182ce" />
            <Text fontSize="sm" fontWeight="semibold" color="blue.800">
              Formato esperado por fila:
            </Text>
          </HStack>
          <List spacing={1} fontSize="sm" color="blue.700" mb={3}>
            <ListItem>• WorkOrder ID</ListItem>
            <ListItem>• Unidad/Propiedad</ListItem>
            <ListItem>• Tipo de Servicio</ListItem>
            <ListItem>• Fecha (YYYY-MM-DD)</ListItem>
          </List>
          <Text fontSize="xs" color="blue.600" fontStyle="italic">
            💡 Si la API de Gemini está sobrecargada, se usará un método alternativo de extracción.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default PDFBulkImporter;
