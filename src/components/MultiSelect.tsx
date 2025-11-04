import React from 'react';
import Select, { MultiValue } from 'react-select';
import { useColorModeValue } from '@chakra-ui/react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  maxHeight?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value = [],
  onChange,
  placeholder = "Seleccionar...",
  isDisabled = false,
  maxHeight = "200px",
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
      flexWrap: 'wrap',
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
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#3182ce',
      borderRadius: '4px',
      margin: '2px',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'white',
      fontSize: '14px',
      padding: '4px 8px',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#2c5aa0',
        color: 'white',
      },
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
      maxHeight: maxHeight,
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

  const selectedOptions = options.filter(option => value.includes(option.value));

  const handleChange = (selectedOptions: MultiValue<MultiSelectOption>) => {
    const values = selectedOptions.map(option => option.value);
    onChange(values);
  };

  return (
    <Select
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isMulti
      isClearable
      styles={customStyles}
      classNamePrefix="multiselect"
    />
  );
};

export default MultiSelect;



