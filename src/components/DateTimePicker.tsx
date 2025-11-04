import React, { useRef, useEffect } from 'react';
import { Input, InputProps } from '@chakra-ui/react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface DateTimePickerProps extends Omit<InputProps, 'onChange'> {
  value?: string;
  onChange?: (datetime: string) => void;
  placeholder?: string;
  dateFormat?: string;
  timeFormat?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  enableTime?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha y hora',
  dateFormat = 'Y-m-d',
  timeFormat = 'H:i',
  minDate,
  maxDate,
  disabled = false,
  enableTime = true,
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

    const format = enableTime ? `${dateFormat} ${timeFormat}` : dateFormat;

    // Crear nueva instancia
    const config: any = {
      enableTime: enableTime,
      dateFormat: format || 'Y-m-d H:i',
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
    if (minDate && minDate.trim() !== '') {
      config.minDate = minDate;
    }
    if (maxDate && maxDate.trim() !== '') {
      config.maxDate = maxDate;
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
  }, [dateFormat, timeFormat, enableTime, minDate, maxDate, disabled]);

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

export default DateTimePicker;
