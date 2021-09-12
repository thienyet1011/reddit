import { Box } from '@chakra-ui/react';
import React, { ReactNode } from 'react';

type ContainerSize = 'regular' | 'small';

interface IContainerProps {
    children: ReactNode,
    size?: ContainerSize
}

const Container = ({children, size="regular"}: IContainerProps) => {
    return (
      <Box
        maxW={size !== "small" ? "800px" : "400px"}
        w="100%"
        mt={8}
        mx="auto"
      >
        {children}
      </Box>
    );
}

export default Container;
