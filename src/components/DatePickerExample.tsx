import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
} from '@chakra-ui/react';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import DateTimePicker from './DateTimePicker';

const DatePickerExample: React.FC = () => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [datetime, setDatetime] = useState('');

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Ejemplo de Date/Time Pickers</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Seleccionar Fecha</FormLabel>
            <DatePicker
              value={date}
              onChange={setDate}
              placeholder="Seleccionar fecha"
            />
            {date && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                Fecha seleccionada: {date}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Seleccionar Hora</FormLabel>
            <TimePicker
              value={time}
              onChange={setTime}
              placeholder="Seleccionar hora"
            />
            {time && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                Hora seleccionada: {time}
              </Text>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Seleccionar Fecha y Hora</FormLabel>
            <DateTimePicker
              value={datetime}
              onChange={setDatetime}
              placeholder="Seleccionar fecha y hora"
            />
            {datetime && (
              <Text fontSize="sm" color="gray.600" mt={2}>
                Fecha y hora seleccionada: {datetime}
              </Text>
            )}
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default DatePickerExample;
