import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import ProductCard from './ProductCard.jsx';

const BLURBS = {
  Rings: 'Solitaires, bands and stacks built to be worn together or alone.',
  Necklaces: 'From a single pendant to a fully layered look, in one clasp.',
  Earrings: 'Light enough for a full day, considered enough for a night out.',
  Bangles: 'Cuffs and bracelets, hand-finished and sized to actually fit.',
};

export default function CategorySection({ category, products, onOpen, tinted }) {
  if (products.length === 0) return null;
  const [featured, ...rest] = products;
  const slug = category.replace(/\s+/g, '-').toLowerCase();

  return (
    <Box component="section" id={`cat-${slug}`} sx={{ py: { xs: 6, md: 8 }, bgcolor: tinted ? '#f3e4dc' : 'background.paper' }}>
      <Container maxWidth="lg">
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" rowGap={1} sx={{ mb: 4.5 }}>
          <Box sx={{ maxWidth: '44ch' }}>
            <Typography variant="h4" sx={{ fontSize: 32, mb: 1 }}>{category}</Typography>
            <Typography variant="body1" color="text.secondary">{BLURBS[category] || 'A small edit, chosen carefully.'}</Typography>
          </Box>
          <Chip
            label={`${products.length} piece${products.length === 1 ? '' : 's'}`}
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary', borderColor: 'divider', fontWeight: 600 }}
          />
        </Stack>

        <Grid container spacing={3.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ProductCard product={featured} variant="featured" onOpen={onOpen} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Grid container spacing={2.5}>
              {rest.map((p) => (
                <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                  <ProductCard product={p} variant="compact" onOpen={onOpen} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
