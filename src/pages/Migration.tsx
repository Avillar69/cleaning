import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Progress,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { migrateDataFromFirebase, formatFirebaseData } from '../utils/migration';

const Migration: React.FC = () => {
  const { user } = useAuth();
  const [firebaseData, setFirebaseData] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationStatus, setMigrationStatus] = useState('');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');

  const handleMigration = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'No hay usuario autenticado',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!firebaseData.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, pega los datos de Firebase',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsMigrating(true);
    setMigrationProgress(0);
    setMigrationStatus('Iniciando migración...');

    try {
      // Parsear datos de Firebase
      const parsedData = JSON.parse(firebaseData);
      const formattedData = formatFirebaseData(parsedData);

      setMigrationProgress(20);
      setMigrationStatus('Procesando datos...');

      // Ejecutar migración
      const result = await migrateDataFromFirebase(formattedData, user.id);

      if (result.success) {
        setMigrationProgress(100);
        setMigrationStatus('¡Migración completada exitosamente!');
        
        toast({
          title: 'Éxito',
          description: 'Datos migrados correctamente',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setMigrationStatus('Error durante la migración');
        toast({
          title: 'Error',
          description: 'Error durante la migración',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setMigrationStatus('Error al procesar los datos');
      toast({
        title: 'Error',
        description: 'Error al procesar los datos de Firebase',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearData = () => {
    setFirebaseData('');
    setMigrationProgress(0);
    setMigrationStatus('');
  };

  return (
    <Box>
      <Heading size="lg" mb={6}>Migración de Datos</Heading>
      
      <VStack spacing={6} align="stretch">
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Instrucciones de Migración</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Paso 1: Exportar datos desde la aplicación original</AlertTitle>
                  <AlertDescription>
                    Ve a la aplicación original (Firebase) y ejecuta en la consola del navegador:
                    <Text as="code" bg="gray.100" p={1} borderRadius="md" mt={2} display="block">
                      window.exportData()
                    </Text>
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Paso 2: Copiar los datos exportados</AlertTitle>
                  <AlertDescription>
                    Copia todos los datos que aparecen en la consola y pégalos en el campo de abajo.
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Paso 3: Ejecutar la migración</AlertTitle>
                  <AlertDescription>
                    Una vez pegados los datos, haz clic en "Migrar Datos" para transferir toda la información a Supabase.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Datos de Firebase</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Pega aquí los datos exportados desde la aplicación original:
              </Text>
              
              <Textarea
                value={firebaseData}
                onChange={(e) => setFirebaseData(e.target.value)}
                placeholder="Pega aquí los datos JSON exportados desde Firebase..."
                rows={10}
                fontFamily="mono"
                fontSize="sm"
              />

              <HStack spacing={4}>
                <Button
                  colorScheme="brand"
                  onClick={handleMigration}
                  isLoading={isMigrating}
                  loadingText="Migrando..."
                  isDisabled={!firebaseData.trim()}
                >
                  Migrar Datos
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleClearData}
                  isDisabled={isMigrating}
                >
                  Limpiar
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {isMigrating && (
          <Card bg={cardBg}>
            <CardHeader>
              <Heading size="md">Progreso de Migración</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Progress value={migrationProgress} colorScheme="brand" />
                <Text fontSize="sm" color="gray.600">
                  {migrationStatus}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">¿Qué se migra?</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text>Tipos de Unidades</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Clientes</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Trabajadores</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Unidades</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Servicios</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Pagos</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Facturas</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Configuración</Text>
                <Badge colorScheme="blue">Migrado</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Migration;
