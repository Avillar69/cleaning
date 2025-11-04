import React from 'react';
import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
} from '@chakra-ui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: string;
  closeOnOverlayClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = false,
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <ChakraModal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={size}
      closeOnOverlayClick={closeOnOverlayClick}
      closeOnEsc={true}
    >
      <ModalOverlay 
        bg="blackAlpha.600" 
        backdropFilter="blur(4px)"
      />
      <ModalContent 
        bg={bg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        boxShadow="2xl"
        mx={4}
        my={8}
      >
        <ModalHeader 
          fontSize="xl" 
          fontWeight="semibold"
          pb={4}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          {title}
        </ModalHeader>
        <ModalCloseButton 
          size="lg"
          top={4}
          right={4}
        />
        <ModalBody 
          py={6}
          px={6}
        >
          {children}
        </ModalBody>
        {footer && (
          <ModalFooter 
            pt={4}
            pb={6}
            px={6}
            borderTop="1px solid"
            borderColor={borderColor}
            gap={3}
          >
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </ChakraModal>
  );
};

export default Modal;
