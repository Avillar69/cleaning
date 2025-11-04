import React, { useRef, useEffect } from 'react';
import { Input, InputProps } from '@chakra-ui/react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface TimePickerProps extends Omit<InputProps, 'onChange'> {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  timeFormat?: string;
  minTime?: string;
  maxTime?: string;
  disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar hora',
  timeFormat = 'H:i',
  minTime,
  maxTime,
  disabled = false,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);
  const onChangeRef = useRef(onChange);

  // Actualizar la referencia de onChange
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current) return;

    // Destruir instancia anterior si existe
    if (flatpickrRef.current) {
      try {
        flatpickrRef.current.destroy();
      } catch (e) {
        // Ignorar errores al destruir
      }
      flatpickrRef.current = null;
    }

    // Crear nueva instancia
    const config: any = {
      enableTime: true,
      noCalendar: true,
      dateFormat: timeFormat || 'H:i',
      onChange: (_selectedDates: Date[], dateStr: string) => {
        if (onChangeRef.current) {
          onChangeRef.current(dateStr);
        }
      },
      time_24hr: true,
      locale: {
        firstDayOfWeek: 1, // Lunes
        weekdays: {
          shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        },
        months: {
          shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
      }
    };

    // Solo agregar opciones si tienen valores válidos
    if (value && value.trim() !== '') {
      config.defaultDate = value;
    }
    if (minTime && minTime.trim() !== '') {
      config.minTime = minTime;
    }
    if (maxTime && maxTime.trim() !== '') {
      config.maxTime = maxTime;
    }
    if (disabled) {
      config.disable = [];
    }

    flatpickrRef.current = flatpickr(inputRef.current as HTMLElement, config);

    return () => {
      if (flatpickrRef.current) {
        try {
          flatpickrRef.current.destroy();
        } catch (e) {
          // Ignorar errores al destruir
        }
        flatpickrRef.current = null;
      }
    };
  }, [timeFormat, minTime, maxTime, disabled]);

  useEffect(() => {
    if (flatpickrRef.current && value !== undefined && value !== '') {
      try {
        flatpickrRef.current.setDate(value, false);
      } catch (e) {
        // Ignorar errores al establecer fecha
      }
    }
  }, [value]);

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      readOnly
      {...props}
    />
  );
};

export default TimePicker;
