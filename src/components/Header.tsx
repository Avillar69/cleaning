import React from 'react';
import {
  Box,
  Flex,
  IconButton,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, signOut } = useAuth();
  const bg = useColorModeValue('white', 'gray.800');

  return (
    <Box
      bg={bg}
      px={6}
      py={4}
      borderBottom="1px"
      borderColor="gray.200"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <Flex align="center" gap={4}>
          <IconButton
            aria-label="Menu"
            icon={<HamburgerIcon />}
            variant="ghost"
            onClick={onMenuClick}
            display={{ base: 'flex', md: 'none' }}
          />
          <Text fontSize="xl" fontWeight="bold" color="brand.600">
            KD Cleaning
          </Text>
        </Flex>

        <Menu>
          <MenuButton>
            <Avatar size="sm" name={user?.email} />
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => signOut()}>
              Cerrar Sesión
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default Header;
