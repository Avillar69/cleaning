import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const bg = useColorModeValue('white', 'gray.800');

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // La redirección se manejará automáticamente por el useEffect
    // cuando el estado del usuario se actualice a través de onAuthStateChange
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
    } else {
      setError('Revisa tu correo para confirmar tu cuenta');
    }
    setLoading(false);
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Box bg={bg} p={8} borderRadius="lg" shadow="lg">
          <VStack spacing={6}>
            <Box textAlign="center">
              <Heading size="lg" color="brand.600" mb={2}>
                KD Cleaning
              </Heading>
              <Text color="gray.600">
                Sistema de gestión de limpieza
              </Text>
            </Box>

            <Tabs w="full" variant="enclosed">
              <TabList>
                <Tab>Iniciar Sesión</Tab>
                <Tab>Registrarse</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <form onSubmit={handleSignIn}>
                    <VStack spacing={4}>
                      {error && (
                        <Alert status="error">
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}

                      <FormControl>
                        <FormLabel>Correo electrónico</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contraseña</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        w="full"
                        isLoading={loading}
                        loadingText="Iniciando sesión..."
                      >
                        Iniciar Sesión
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                <TabPanel px={0}>
                  <form onSubmit={handleSignUp}>
                    <VStack spacing={4}>
                      {error && (
                        <Alert status={error.includes('confirmar') ? 'info' : 'error'}>
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}

                      <FormControl>
                        <FormLabel>Correo electrónico</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contraseña</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="brand"
                        size="lg"
                        w="full"
                        isLoading={loading}
                        loadingText="Creando cuenta..."
                      >
                        Crear Cuenta
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthPage;
