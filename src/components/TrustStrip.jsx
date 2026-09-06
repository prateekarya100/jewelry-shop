import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';

const POINTS = [
  { icon: VisibilityOutlinedIcon, title: 'See it before you buy it', text: 'A short video on every piece, filmed close enough to see how the metal catches light.' },
  { icon: VerifiedOutlinedIcon, title: 'Certified materials', text: '18k gold vermeil, 925 silver and lab-grown stones only — never plated over base metal.' },
  { icon: PaymentsOutlinedIcon, title: 'Pay your way', text: 'Cash on delivery, scan-to-pay UPI, or card through Razorpay — whatever you trust.' },
  { icon: AutorenewOutlinedIcon, title: '7-day exchange', text: "Doesn't sit right? Exchange it within 7 days, no questions about why." },
];

export default function TrustStrip() {
  return (
    <Box id="story" sx={{ bgcolor: 'background.paper', py: { xs: 6, md: 7 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {POINTS.map((p) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.title}>
              <Stack direction="row" alignItems="flex-start" spacing={1.75}>
                <Box sx={{
                  flexShrink: 0, width: 46, height: 46, borderRadius: '50%',
                  bgcolor: 'rgba(184,112,63,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p.icon sx={{ color: 'secondary.dark', fontSize: 21 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: 'primary.main', mb: 0.5, fontSize: 16 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13.5 }}>
                    {p.text}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
