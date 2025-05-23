'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';

// Create theme with Material UI's standard dark mode
const theme = createTheme({
    colorSchemes: {
        dark: true, // Enable automatic dark mode support
        light: true, // Enable light mode support
    },
    cssVariables: true, // Enable CSS variables for better performance
});

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    return (
        <MuiThemeProvider theme={theme} defaultMode="dark">
            <CssBaseline />
            {children}
        </MuiThemeProvider>
    );
} 