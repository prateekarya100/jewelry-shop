import React, { useState } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../utils/storage.js';
import AspectMedia from './AspectMedia.jsx';

export default function ProductCard({ product, variant = 'normal', onOpen }) {
  const { getRatingSummary, addToCart } = useStore();
  const { avg, count } = getRatingSummary(product.id);
  const [saved, setSaved] = useState(false);
  const hasDiscount = product.discount > 0;
  const finalPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
  const featured = variant === 'featured';
  const stock = product.stock ?? null;
  const lowStock = stock !== null && stock > 0 && stock <= 5;
  const outOfStock = stock === 0;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'visible',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 24px 44px rgba(36,26,31,0.16)' },
        '&:hover img': { transform: 'scale(1.06)' },
      }}
    >
      <CardActionArea onClick={() => onOpen(product)} sx={{ display: 'block', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative' }}>
          <AspectMedia
            ratio={featured ? '4 / 5' : '1 / 1'}
            src={product.images?.[0]}
            alt={product.title}
            radius={0}
            imgSx={{ transition: 'transform 0.5s ease', filter: outOfStock ? 'grayscale(0.6)' : 'none' }}
          />

          <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 12, left: 12 }}>
            {hasDiscount && (
              <Chip
                size="small"
                label={`-${product.discount}%`}
                sx={{ bgcolor: 'error.main', color: '#fff', fontWeight: 800, height: 24, fontSize: 11.5 }}
              />
            )}
            {lowStock && !outOfStock && (
              <Chip
                size="small"
                label={`Only ${stock} left`}
                sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', fontWeight: 800, height: 24, fontSize: 11 }}
              />
            )}
          </Stack>

          {product.video && (
            <Chip
              size="small"
              icon={<PlayArrowRoundedIcon sx={{ fontSize: 14 }} />}
              label="Watch"
              sx={{
                position: 'absolute', bottom: 12, left: 12,
                bgcolor: 'rgba(28,20,32,0.82)', color: '#fff',
                '& .MuiChip-icon': { color: '#fff' },
                height: 24, fontSize: 11,
              }}
            />
          )}

          {outOfStock && (
            <Box sx={{
              position: 'absolute', inset: 0, bgcolor: 'rgba(28,20,32,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Chip label="Sold out" sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 800 }} />
            </Box>
          )}
        </Box>
      </CardActionArea>

      {/* Floating wishlist + add buttons, overlapping the image/content seam */}
      <Box sx={{ position: 'relative', height: 0 }}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ position: 'absolute', right: 14, top: -22, zIndex: 2 }}
        >
          <Tooltip title={saved ? 'Saved' : 'Save for later'}>
            <IconButton
              onClick={() => setSaved((s) => !s)}
              size="small"
              aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
              sx={{
                bgcolor: '#fff', width: 40, height: 40, boxShadow: '0 4px 12px rgba(36,26,31,0.18)',
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              {saved ? (
                <FavoriteRoundedIcon sx={{ fontSize: 18, color: 'error.main' }} />
              ) : (
                <FavoriteBorderRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              )}
            </IconButton>
          </Tooltip>
          {!outOfStock && (
            <Tooltip title="Add to bag">
              <IconButton
                onClick={() => addToCart(product.id, 1)}
                size="small"
                aria-label="Add to bag"
                sx={{
                  bgcolor: 'secondary.main', color: 'secondary.contrastText', width: 40, height: 40,
                  boxShadow: '0 4px 14px rgba(184,112,63,0.45)',
                  '&:hover': { bgcolor: 'secondary.dark' },
                }}
              >
                <AddRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pt: 2, pb: '18px !important', minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'secondary.dark', fontWeight: 700, letterSpacing: '0.02em', fontSize: 11.5 }}>
          {product.category}
        </Typography>
        <Typography
          variant={featured ? 'h5' : 'h6'}
          sx={{
            fontSize: featured ? 22 : 17, cursor: 'pointer', lineHeight: 1.25,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', wordBreak: 'break-word',
          }}
          onClick={() => onOpen(product)}
        >
          {product.title}
        </Typography>
        <Typography
          variant="body2" color="text.secondary"
          sx={{ fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {product.tagline}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, minWidth: 0 }}>
          <Rating value={avg} precision={0.5} readOnly size="small" sx={{ color: 'secondary.main', flexShrink: 0 }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {count > 0 ? `(${count})` : 'No reviews yet'}
          </Typography>
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap" sx={{ mt: 'auto', pt: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 }, color: 'primary.main' }}>
            {formatINR(finalPrice)}
          </Typography>
          {hasDiscount && (
            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontSize: 13 }}>
              {formatINR(product.price)}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
