import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Logo from './Logo.jsx';

const PAYMENT_METHODS = [
  { icon: QrCode2OutlinedIcon, label: 'UPI' },
  { icon: CreditCardOutlinedIcon, label: 'Cards' },
  { icon: AccountBalanceOutlinedIcon, label: 'Netbanking' },
  { icon: LocalShippingOutlinedIcon, label: 'Cash on delivery' },
];

export default function Footer({ onSelectCategory }) {
  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', pt: 6, pb: 3, mt: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ mb: 1.5 }}>
              <Logo size={30} wordmarkSize={19} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(250,241,236,0.65)' }}>
              Small-batch fine jewellery, made to be worn daily and kept for years.
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 4 }}>
            <FooterCol title="Shop" onSelectCategory={onSelectCategory} links={[
              'Rings', 'Necklaces', 'Earrings', 'Bangles',
            ]} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 4 }}>
            <FooterCol title="Support" links={[
              ['Shipping & returns', '#'], ['Ring size guide', '#'], ['Care instructions', '#'], ['Contact us', '#'],
            ]} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(250,241,236,0.14)' }} />

        <Stack direction="row" spacing={3} flexWrap="wrap" rowGap={1.5} justifyContent="center" sx={{ mb: 1 }}>
          {PAYMENT_METHODS.map((p) => (
            <Stack key={p.label} direction="row" alignItems="center" spacing={0.75}>
              <p.icon sx={{ fontSize: 18, color: 'rgba(250,241,236,0.6)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(250,241,236,0.6)' }}>{p.label}</Typography>
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 3, borderColor: 'rgba(250,241,236,0.14)' }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" sx={{ fontSize: 13, color: 'rgba(250,241,236,0.55)' }}>
          <span>© {new Date().getFullYear()} Priyasa Fashion</span>
          <span>Demo storefront — payments run in a safe test flow.</span>
        </Stack>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'rgba(250,241,236,0.45)' }}>
          Designed and developed by{' '}
          <Box component="a" href="https://tomcatdevs.com" target="_blank" rel="noopener" sx={{ color: 'rgba(250,241,236,0.65)', '&:hover': { color: '#fff' } }}>
            tomcatdevs.com
          </Box>
        </Typography>
      </Container>
    </Box>
  );
}

function FooterCol({ title, links, onSelectCategory }) {
  return (
    <>
      <Typography variant="overline" sx={{ color: 'secondary.light', display: 'block', mb: 1.5 }}>{title}</Typography>
      <Stack spacing={1}>
        {links.map((link) => {
          const isCategory = typeof link === 'string';
          const label = isCategory ? link : link[0];
          const href = isCategory ? undefined : link[1];
          return (
            <Typography
              key={label}
              component={isCategory ? 'button' : 'a'}
              href={href}
              onClick={isCategory ? () => onSelectCategory(label) : undefined}
              variant="body2"
              sx={{
                color: 'rgba(250,241,236,0.78)', textDecoration: 'none', textAlign: 'left',
                background: 'none', border: 'none', p: 0, font: 'inherit', cursor: 'pointer',
                '&:hover': { color: '#fff' },
              }}
            >
              {label}
            </Typography>
          );
        })}
      </Stack>
    </>
  );
}
