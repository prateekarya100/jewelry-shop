import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { useStore } from '../context/StoreContext.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function PolicyPage({ title, updated, children }) {
  const { categories } = useStore();
  const navigate = useNavigate();

  function goHome(cat) {
    navigate('/');
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        categories={categories}
        onOpenCart={goHome}
        onOpenAdmin={() => navigate('/')}
        onSelectCategory={goHome}
        onOpenAccount={() => navigate('/')}
      />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="md">
          <Breadcrumbs sx={{ mb: 3 }}>
            <Link component="button" onClick={() => navigate('/')} underline="hover" color="inherit" sx={{ fontSize: 14 }}>
              Home
            </Link>
            <Typography color="text.primary" sx={{ fontSize: 14 }}>{title}</Typography>
          </Breadcrumbs>

          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 }, mb: 1 }}>{title}</Typography>
          {updated && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Last updated: {updated}
            </Typography>
          )}

          <Box sx={{
            '& h2': { fontSize: 20, mt: 4, mb: 1.5, fontFamily: "'Playfair Display', serif" },
            '& p': { mb: 2, lineHeight: 1.75, color: 'text.primary', fontSize: 15.5 },
            '& ul': { mb: 2, pl: 3, lineHeight: 1.8, fontSize: 15.5 },
            '& li': { mb: 0.5 },
            '& a': { color: 'secondary.dark' },
          }}>
            {children}
          </Box>
        </Container>
      </Box>
      <Footer onSelectCategory={goHome} />
    </Box>
  );
}
