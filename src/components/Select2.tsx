import React from 'react';
import Select, { SingleValue } from 'react-select';
import { useColorModeValue } from '@chakra-ui/react';

interface Select2Option {
  value: string;
  label: string;
}

interface Select2Props {
  options: Select2Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const Select2: React.FC<Select2Props> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  isRequired = false,
  isDisabled = false,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const textColor = useColorModeValue('gray.900', 'white');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: bg,
      borderColor: state.isFocused ? '#3182ce' : borderColor,
      borderWidth: '1px',
      borderRadius: '6px',
      minHeight: '48px',
      boxShadow: state.isFocused ? '0 0 0 1px #3182ce' : 'none',
      '&:hover': {
        borderColor: '#3182ce',
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '8px 12px',
    }),
    input: (provided: any) => ({
      ...provided,
      color: textColor,
      margin: '0',
      padding: '0',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: placeholderColor,
      fontSize: '16px',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: textColor,
      fontSize: '16px',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? '#3182ce' 
        : state.isFocused 
        ? '#ebf8ff' 
        : bg,
      color: state.isSelected ? 'white' : textColor,
      fontSize: '16px',
      padding: '12px 16px',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3182ce' : '#ebf8ff',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      zIndex: 9999,
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '4px 0',
      maxHeight: '200px',
    }),
    indicatorSeparator: (provided: any) => ({
      ...provided,
      backgroundColor: borderColor,
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: placeholderColor,
      '&:hover': {
        color: textColor,
      },
    }),
  };

  const selectedOption = options.find(option => option.value === value);

  const handleChange = (selectedOption: SingleValue<Select2Option>) => {
    if (selectedOption) {
      onChange(selectedOption.value);
    }
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable={!isRequired}
      styles={customStyles}
      classNamePrefix="select2"
    />
  );
};

export default Select2;



