import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Fade from '@mui/material/Fade';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import AspectMedia from './AspectMedia.jsx';

const REASSURANCE = [
  { icon: LocalShippingOutlinedIcon, text: 'Free shipping over ₹999' },
  { icon: VerifiedOutlinedIcon, text: 'Certified materials' },
  { icon: AutorenewOutlinedIcon, text: '7-day exchange' },
];

export default function Hero() {
  return (
    <Box id="top" sx={{ bgcolor: 'primary.main', pt: { xs: 7, md: 10 }, pb: { xs: 8, md: 11 }, position: 'relative', overflow: 'hidden' }}>
      {/* Subtle decorative arc, purely ornamental */}
      <Box sx={{
        position: 'absolute', top: -120, right: -120, width: 360, height: 360, borderRadius: '50%',
        border: '1px solid rgba(184,112,63,0.18)', pointerEvents: 'none', display: { xs: 'none', md: 'block' },
      }} />
      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        <Grid container spacing={{ xs: 5, md: 7 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Fade in timeout={600}>
              <Box>
                <Chip
                  label="Handcrafted in small batches"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(184,112,63,0.16)', color: 'secondary.light', fontWeight: 700,
                    height: 28, fontSize: 12.5, px: 0.5, border: '1px solid rgba(184,112,63,0.3)',
                  }}
                />
                <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 56 }, lineHeight: 1.12, maxWidth: '12ch', mt: 2.5, color: 'primary.contrastText' }}>
                  Jewellery for the{' '}
                  <Box component="em" sx={{ fontStyle: 'italic', color: 'secondary.light' }}>
                    moments
                  </Box>{' '}
                  you actually wear it in.
                </Typography>
                <Typography variant="body1" sx={{ mt: 3, maxWidth: '42ch', color: 'rgba(250,241,236,0.68)', fontSize: 16.5, lineHeight: 1.65 }}>
                  Every piece in this shop is photographed on real hands, filmed up close so you
                  can see how it catches light, and finished by someone whose name we know.
                </Typography>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mt: 4.5 }}>
                  <Button href="#shop" variant="contained" color="secondary" size="large">
                    Shop the edit
                  </Button>
                  <Button
                    href="#story"
                    sx={{ color: 'primary.contrastText', fontWeight: 600, p: 0, minWidth: 'auto', '&:hover': { bgcolor: 'transparent', color: 'secondary.light' } }}
                  >
                    Our story ↓
                  </Button>
                </Stack>

                <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ mt: 5, rowGap: 1.5 }}>
                  {REASSURANCE.map((r) => (
                    <Stack key={r.text} direction="row" alignItems="center" spacing={0.75}>
                      <r.icon sx={{ fontSize: 18, color: 'secondary.light' }} />
                      <Typography variant="body2" sx={{ fontSize: 13, color: 'rgba(250,241,236,0.68)', fontWeight: 500 }}>
                        {r.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Fade>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <AspectMedia
                  ratio={{ xs: '4 / 3', sm: '3 / 4.4' }}
                  src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=900&auto=format&fit=crop"
                  alt="Hand-hammered gold cuff bangle"
                  radius={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <Stack spacing={2} direction={{ xs: 'row', sm: 'column' }}>
                  <AspectMedia
                    ratio="1 / 1"
                    src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&auto=format&fit=crop"
                    alt="Gold solitaire ring detail"
                    radius={2}
                    sx={{ flex: { xs: 1, sm: 'unset' } }}
                  />
                  <AspectMedia
                    ratio="1 / 1.05"
                    src="https://images.unsplash.com/photo-1620656798579-1984d9e87df7?q=80&w=900&auto=format&fit=crop"
                    alt="Layered gold necklace on neckline"
                    radius={2}
                    sx={{ flex: { xs: 1, sm: 'unset' } }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
