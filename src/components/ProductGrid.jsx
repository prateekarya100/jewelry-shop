import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import SortRoundedIcon from '@mui/icons-material/SortRounded';
import { useStore } from '../context/StoreContext.jsx';
import ProductCard from './ProductCard.jsx';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
];

const PAGE_SIZE = 12;

export default function ProductGrid({ products, categories, activeCategory, onCategoryChange, onOpen }) {
  const { getRatingSummary } = useStore();
  const [sortBy, setSortBy] = useState('featured');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [products, activeCategory]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const finalPrice = (p) => Math.round(p.price * (1 - (p.discount || 0) / 100));
    if (sortBy === 'price-asc') list.sort((a, b) => finalPrice(a) - finalPrice(b));
    else if (sortBy === 'price-desc') list.sort((a, b) => finalPrice(b) - finalPrice(a));
    else if (sortBy === 'rating') list.sort((a, b) => getRatingSummary(b.id).avg - getRatingSummary(a.id).avg);
    return list;
  }, [filtered, sortBy, getRatingSummary]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page]
  );

  // Reset to page 1 whenever the filter or sort changes, so you're never
  // stuck looking at an empty "page 3" after narrowing the results.
  useEffect(() => { setPage(1); }, [activeCategory, sortBy]);

  function handlePageChange(_e, value) {
    setPage(value);
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Box component="section" id="shop" sx={{ bgcolor: 'background.default', py: { xs: 5, md: 7 } }}>
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" rowGap={2} sx={{ mb: 3.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: 26, md: 32 } }}>Shop all pieces</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {sorted.length} piece{sorted.length === 1 ? '' : 's'}{activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
            </Typography>
          </Box>

          <FormControl size="small" sx={{ minWidth: 190 }}>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SortRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              }
              sx={{ bgcolor: 'background.paper', borderRadius: 100, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
            >
              {SORTS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction="row" spacing={1.25} flexWrap="wrap" rowGap={1.25} sx={{ mb: 4.5 }}>
          {['All', ...categories].map((cat) => {
            const active = cat === activeCategory;
            return (
              <Chip
                key={cat}
                label={cat}
                onClick={() => onCategoryChange(cat)}
                sx={{
                  height: 36, fontSize: 14, px: 0.5,
                  bgcolor: active ? 'primary.main' : 'background.paper',
                  color: active ? 'primary.contrastText' : 'text.primary',
                  border: '1px solid', borderColor: active ? 'primary.main' : 'divider',
                  '&:hover': { bgcolor: active ? 'primary.main' : 'rgba(184,112,63,0.08)' },
                }}
              />
            );
          })}
        </Stack>

        {sorted.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">No pieces in this category yet.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2, sm: 2.5, md: 3 },
            }}
          >
            {pageItems.map((p) => (
              <Box
                key={p.id}
                sx={{
                  flex: '1 1 240px',
                  minWidth: 0,
                  maxWidth: {
                    xs: 'calc(50% - 8px)',
                    sm: 'calc(33.333% - 14px)',
                    md: 'calc(25% - 18px)',
                    lg: 'calc(20% - 20px)',
                  },
                }}
              >
                <ProductCard product={p} variant="normal" onOpen={onOpen} />
              </Box>
            ))}
          </Box>
        )}

        {pageCount > 1 && (
          <Stack alignItems="center" sx={{ mt: { xs: 4, md: 5 } }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={handlePageChange}
              color="standard"
              shape="rounded"
              siblingCount={0}
              sx={{
                '& .MuiPaginationItem-root': { fontWeight: 600 },
                '& .Mui-selected': { bgcolor: 'primary.main !important', color: 'primary.contrastText' },
              }}
            />
          </Stack>
        )}
      </Container>
    </Box>
  );
}
