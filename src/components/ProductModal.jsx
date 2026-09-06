import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Fade from '@mui/material/Fade';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../utils/storage.js';
import AspectMedia from './AspectMedia.jsx';

function isYouTube(url) {
  return /youtube\.com|youtu\.be/.test(url || '');
}
function toYouTubeEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
  } catch {
    return url;
  }
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

export default function ProductModal({ product, onClose, onAddToCart }) {
  const { getReviews, getRatingSummary, addReview } = useStore();
  const fullScreen = useMediaQuery('(max-width:760px)');
  const [activeImg, setActiveImg] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSent, setReviewSent] = useState(false);

  const reviews = getReviews(product.id);
  const { avg, count } = getRatingSummary(product.id);
  const finalPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
  const images = product.images || [];

  function nextImg() { setShowVideo(false); setActiveImg((i) => (i + 1) % images.length); }
  function prevImg() { setShowVideo(false); setActiveImg((i) => (i - 1 + images.length) % images.length); }

  function submitReview(e) {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    addReview(product.id, reviewForm);
    setReviewForm({ name: '', rating: 5, comment: '' });
    setReviewSent(true);
    window.setTimeout(() => setReviewSent(false), 2200);
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} TransitionComponent={Fade} transitionDuration={220}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'background.paper' } }}>
        <CloseIcon fontSize="small" />
      </IconButton>

      <DialogContent sx={{ p: 0 }}>
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }} sx={{ bgcolor: '#f2e2d8', p: { xs: 2.5, md: 3.5 } }}>
            <Box sx={{ position: 'relative' }}>
              {showVideo && product.video ? (
                <AspectMedia ratio="1 / 1">
                  {isYouTube(product.video) ? (
                    <Box component="iframe" src={toYouTubeEmbed(product.video)} title={`${product.title} demo video`}
                      allow="autoplay; encrypted-media" allowFullScreen
                      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
                  ) : (
                    <Box component="video" src={product.video} controls autoPlay playsInline
                      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </AspectMedia>
              ) : (
                <AspectMedia ratio="1 / 1" src={images[activeImg]} alt={product.title} />
              )}

              {!showVideo && images.length > 1 && (
                <>
                  <IconButton onClick={prevImg} size="small" sx={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton onClick={nextImg} size="small" sx={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: '#fff' } }}>
                    <ChevronRightIcon />
                  </IconButton>
                </>
              )}
            </Box>

            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
              {images.map((img, i) => (
                <Box
                  key={img + i}
                  onClick={() => { setShowVideo(false); setActiveImg(i); }}
                  sx={{
                    width: 54, height: 54, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                    border: '2px solid', borderColor: !showVideo && i === activeImg ? 'secondary.main' : 'transparent',
                  }}
                >
                  <Box component="img" src={img} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ))}
              {product.video && (
                <Box
                  onClick={() => setShowVideo(true)}
                  sx={{
                    width: 54, height: 54, borderRadius: 1, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'primary.main', color: 'primary.contrastText',
                    border: '2px solid', borderColor: showVideo ? 'secondary.main' : 'transparent',
                  }}
                >
                  <PlayArrowRoundedIcon fontSize="small" />
                </Box>
              )}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ p: { xs: 2.5, md: 4 } }}>
            <Chip
              label={product.category}
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: 11, fontWeight: 700, color: 'secondary.dark', borderColor: 'secondary.light' }}
            />
            <Typography variant="h4" sx={{ fontSize: 28, mt: 1 }}>{product.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{product.tagline}</Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
              <Rating value={avg} precision={0.5} readOnly sx={{ color: 'secondary.main' }} />
              {count > 0 && <Typography variant="body2" color="text.secondary">({count})</Typography>}
            </Stack>

            <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: 27, color: 'primary.main' }}>{formatINR(finalPrice)}</Typography>
              {product.discount > 0 && (
                <>
                  <Typography sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>{formatINR(product.price)}</Typography>
                  <Chip size="small" label={`Save ${product.discount}%`} sx={{ bgcolor: 'rgba(60,110,74,0.1)', color: 'success.main', fontWeight: 700 }} />
                </>
              )}
            </Stack>

            <Typography variant="body2" sx={{ mt: 2.5, lineHeight: 1.65, color: 'text.primary' }}>{product.description}</Typography>
            {product.material && (
              <Typography variant="body2" sx={{ mt: 1.5 }}><strong>Material:</strong> {product.material}</Typography>
            )}

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Stack direction="row" alignItems="center" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IconButton size="small" onClick={() => setQty((q) => Math.max(1, q - 1))}><RemoveIcon fontSize="small" /></IconButton>
                <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{qty}</Typography>
                <IconButton size="small" onClick={() => setQty((q) => q + 1)}><AddIcon fontSize="small" /></IconButton>
              </Stack>
              <Button fullWidth variant="contained" color="primary" size="large" onClick={() => onAddToCart(product.id, qty)}>
                Add to bag — {formatINR(finalPrice * qty)}
              </Button>
            </Stack>

            <Divider sx={{ my: 3.5 }} />

            <Typography variant="h6" sx={{ fontSize: 18 }}>Reviews {count > 0 && `(${count})`}</Typography>
            {reviews.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No reviews yet. Be the first to share how it wears.
              </Typography>
            )}
            <List dense sx={{ mt: 0.5 }}>
              {reviews.slice(0, 6).map((r) => (
                <ListItem key={r.id} alignItems="flex-start" disableGutters>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34, fontSize: 13 }}>{initials(r.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">{r.name}</Typography>
                        <Rating value={r.rating} readOnly size="small" sx={{ color: 'secondary.main' }} />
                      </Stack>
                    }
                    secondary={r.comment}
                  />
                </ListItem>
              ))}
            </List>

            <Box component="form" onSubmit={submitReview} sx={{ mt: 1.5, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Typography variant="subtitle2" sx={{ mb: 1.25 }}>Leave a review</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <TextField
                  size="small" fullWidth placeholder="Your name" value={reviewForm.name}
                  onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))} required
                />
                <Rating
                  value={reviewForm.rating}
                  onChange={(_, v) => setReviewForm((f) => ({ ...f, rating: v || 1 }))}
                  sx={{ color: 'secondary.main', whiteSpace: 'nowrap' }}
                />
              </Stack>
              <TextField
                size="small" fullWidth multiline minRows={2} placeholder="How does it look and feel?"
                value={reviewForm.comment} onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))} required
              />
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1.5 }}>
                <Button type="submit" variant="outlined" size="small">Submit review</Button>
                <Fade in={reviewSent}><Typography variant="body2" color="success.main">Thank you!</Typography></Fade>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
