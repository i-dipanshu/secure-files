import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        gap: 2,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="text.secondary">
        Loading ZKP Authentication...
      </Typography>
    </Box>
  );
};

export default LoadingScreen; 