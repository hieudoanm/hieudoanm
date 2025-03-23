// Import your global CSS file
import '@x4/styles/global.css';
import { Stack } from 'expo-router';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient: QueryClient = new QueryClient();

const RootLayoutNav = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}></Stack>
    </QueryClientProvider>
  );
};

export default RootLayoutNav;
