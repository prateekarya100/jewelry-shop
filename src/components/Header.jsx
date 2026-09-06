import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import { useStore } from '../context/StoreContext.jsx';
import Logo from './Logo.jsx';

export default function Header({ onOpenCart, onOpenAdmin, categories, onSelectCategory, onOpenAccount }) {
  const { cartCount } = useStore();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const [navOpen, setNavOpen] = useState(false);

  const navLinks = categories.slice(0, 5);

  return (
    <>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          bgcolor: 'primary.main',
          borderBottom: '1px solid',
          borderColor: scrolled ? 'rgba(250,241,236,0.14)' : 'transparent',
          boxShadow: scrolled ? '0 4px 20px rgba(17,12,20,0.25)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: 'auto', width: '100%', height: 78, px: { xs: 2, sm: 4 } }}>
          <Box component="a" href="#top" sx={{ mr: { xs: 'auto', md: 4 }, display: 'flex' }}>
            <Logo />
          </Box>

          <Stack direction="row" spacing={3.5} sx={{ flex: 1, justifyContent: 'center', display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((c) => (
              <Button
                key={c}
                onClick={() => onSelectCategory(c)}
                sx={{
                  color: 'rgba(250,241,236,0.82)', fontWeight: 500, p: '4px 0', minWidth: 'auto',
                  borderRadius: 0, position: 'relative',
                  '&::after': {
                    content: '""', position: 'absolute', left: 0, right: 0, bottom: 0, height: 2,
                    bgcolor: 'secondary.main', transform: 'scaleX(0)', transition: 'transform 0.2s ease',
                  },
                  '&:hover': { color: 'primary.contrastText', bgcolor: 'transparent', '&::after': { transform: 'scaleX(1)' } },
                }}
                disableRipple
              >
                {c}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Button onClick={onOpenAdmin} sx={{ color: 'rgba(250,241,236,0.85)', display: { xs: 'none', sm: 'inline-flex' }, '&:hover': { color: 'primary.contrastText', bgcolor: 'rgba(250,241,236,0.08)' } }}>
              Admin
            </Button>
            <Tooltip title="Your account">
              <IconButton onClick={onOpenAccount} aria-label="Your account" sx={{ color: 'primary.contrastText' }}>
                <PersonOutlineRoundedIcon />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onOpenCart} aria-label="Open bag" sx={{ color: 'primary.contrastText' }}>
              <Badge badgeContent={cartCount} sx={{ '& .MuiBadge-badge': { bgcolor: 'secondary.main', color: 'secondary.contrastText' } }}>
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
            <IconButton sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'primary.contrastText' }} onClick={() => setNavOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={navOpen} onClose={() => setNavOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }} role="presentation" onClick={() => setNavOpen(false)}>
          <List>
            {navLinks.map((c) => (
              <ListItemButton key={c} onClick={() => onSelectCategory(c)}>
                {c}
              </ListItemButton>
            ))}
            <ListItemButton onClick={onOpenAdmin}>Admin</ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
