import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { TransitionGroup } from 'react-transition-group';
import Collapse from '@mui/material/Collapse';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../utils/storage.js';

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartDrawer({ open, onClose, onCheckout }) {
  const { cartDetailed, updateCartQty, removeFromCart, cartSubtotal } = useStore();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontSize: 20 }}>Your bag</Typography>
        <IconButton onClick={onClose} aria-label="Close bag"><CloseIcon /></IconButton>
      </Stack>

      {cartDetailed.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, px: 3, color: 'text.secondary' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 40, opacity: 0.4, mb: 1.5 }} />
          <Typography>Your bag is empty.</Typography>
          <Typography variant="body2">Add something you'll want to keep.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ px: 3, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
              <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: remaining === 0 ? 'success.main' : 'secondary.dark' }} />
              <Typography variant="body2" sx={{ fontSize: 12.5, fontWeight: 700, color: remaining === 0 ? 'success.main' : 'text.secondary' }}>
                {remaining === 0
                  ? "You've unlocked free shipping!"
                  : `Add ${formatINR(remaining)} more for free shipping`}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 5, borderRadius: 3, bgcolor: 'rgba(36,26,31,0.08)',
                '& .MuiLinearProgress-bar': { bgcolor: remaining === 0 ? 'success.main' : 'secondary.main', borderRadius: 3 },
              }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 1 }}>
            <TransitionGroup component={Stack} spacing={2.5} sx={{ py: 1 }}>
              {cartDetailed.map((item) => (
                <Collapse key={item.productId}>
                  <Stack direction="row" spacing={1.5}>
                    <Box component="img" src={item.product.images?.[0]} alt={item.product.title}
                      sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{item.product.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{formatINR(item.unitPrice)} each</Typography>
                      <Stack direction="row" alignItems="center" sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, width: 'fit-content' }}>
                        <IconButton size="small" onClick={() => updateCartQty(item.productId, item.qty - 1)}><RemoveIcon sx={{ fontSize: 15 }} /></IconButton>
                        <Typography sx={{ minWidth: 20, textAlign: 'center', fontSize: 13.5 }}>{item.qty}</Typography>
                        <IconButton size="small" onClick={() => updateCartQty(item.productId, item.qty + 1)}><AddIcon sx={{ fontSize: 15 }} /></IconButton>
                      </Stack>
                    </Box>
                    <Stack alignItems="flex-end" justifyContent="space-between">
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatINR(item.lineTotal)}</Typography>
                      <Button size="small" color="error" onClick={() => removeFromCart(item.productId)} sx={{ p: 0, minWidth: 'auto', fontSize: 12.5 }}>
                        Remove
                      </Button>
                    </Stack>
                  </Stack>
                </Collapse>
              ))}
            </TransitionGroup>
          </Box>

          <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" justifyContent="space-between" sx={{ fontSize: 17, mb: 0.5 }}>
              <Typography sx={{ fontSize: 17 }}>Subtotal</Typography>
              <Typography sx={{ fontSize: 17, fontWeight: 700 }}>{formatINR(cartSubtotal)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Shipping and any taxes are calculated at checkout.</Typography>
            <Button fullWidth variant="contained" color="primary" size="large" sx={{ mt: 1.75 }} onClick={onCheckout}>
              Checkout
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}
