import { createTheme } from '@mui/material/styles';

// "Midnight Boutique" — jewelry shown the way it looks best: against deep,
// near-black plum, with warm copper and wine accents instead of gold and
// rosewood. Light blush panels punctuate the dark, rather than one flat
// cream page throughout.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1c1420', light: '#2a1f30', dark: '#110c14', contrastText: '#faf1ec' },
    secondary: { main: '#b8703f', light: '#d69566', dark: '#8f5630', contrastText: '#1c1420' },
    error: { main: '#7a2036', light: '#9a3a52' },
    success: { main: '#4a7a52' },
    background: { default: '#faf1ec', paper: '#ffffff' },
    text: { primary: '#241a1f', secondary: 'rgba(36,26,31,0.62)' },
    divider: 'rgba(36,26,31,0.11)',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'Outfit', -apple-system, sans-serif",
    h1: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
    h2: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
    h3: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 },
    h5: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 },
    h6: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 100, paddingTop: 12, paddingBottom: 12, paddingLeft: 26, paddingRight: 26 },
        containedPrimary: {
          boxShadow: '0 4px 14px rgba(28,20,32,0.28)',
          '&:hover': { boxShadow: '0 8px 22px rgba(28,20,32,0.36)', backgroundColor: '#110c14' },
        },
        containedSecondary: {
          boxShadow: '0 4px 14px rgba(184,112,63,0.35)',
          '&:hover': { boxShadow: '0 8px 22px rgba(184,112,63,0.45)' },
        },
        sizeLarge: { paddingTop: 15, paddingBottom: 15, paddingLeft: 32, paddingRight: 32, fontSize: 15.5 },
        outlined: { borderWidth: 1.5 },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 700, borderRadius: 8 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(36,26,31,0.06)',
          border: 'none',
          borderRadius: 20,
          backgroundColor: '#fffdfb',
        },
      },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 24 } },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: 'rgba(36,26,31,0.08)' } },
    },
  },
});

export default theme;
