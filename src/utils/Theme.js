import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    type: 'light',
    primary: {
      main: '#b912b1',
      light: '#d166c8',
      dark: '#9805a4',
      contrastText: 'rgba(255,255,255,0.93)',
    },
    secondary: {
      main: '#2036c1',
      light: '#3149d8',
      dark: '#132a96',
    },
    background: {
      paper: '#191f46',
      default: '#0f1539',
    },
    text: {
      primary: 'rgba(255,255,255,0.87)',
      secondary: 'rgba(255,255,255,0.54)',
      disabled: 'rgba(255,255,255,0.38)',
      hint: 'rgba(255,255,255,0.38)',
    },
  },
});