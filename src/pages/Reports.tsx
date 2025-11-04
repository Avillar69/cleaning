import React from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Card,
  CardBody,
} from '@chakra-ui/react';

const Reports: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      <Heading size="lg" mb={6}>Reportes</Heading>
      
      <Card bg={cardBg}>
        <CardBody>
          <Text>Página de Reportes - En desarrollo</Text>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Reports;
