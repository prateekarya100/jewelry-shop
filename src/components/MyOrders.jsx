import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog as ConfirmDialog from '@mui/material/Dialog';
import DialogTitle as ConfirmTitle from '@mui/material/DialogTitle';
import DialogContent as ConfirmContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
import { formatINR } from '../utils/storage.js';
import paymentConfig from '../config/payment.js';

export default function MyOrders({ onClose }) {
  const { token, customer, logout } = useCustomerAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${paymentConfig.backendBaseUrl}/api/orders/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Could not load your orders');
        const data = await res.json();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  const handleOrderUpdate = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Playfair Display', serif" }}>
        My Orders
        <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Signed in as {customer?.name} ({customer?.email || customer?.phone})
        </Typography>

        {orders === null && !error && (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
        )}

        {error && <Typography color="error.main">{error}</Typography>}

        {orders && orders.length === 0 && (
          <Typography color="text.secondary">No orders yet. Once you place one, it'll show up here.</Typography>
        )}

        {orders && orders.length > 0 && (
          <Stack spacing={1.25}>
            {orders.map((o) => (
              <OrderAccordion key={o.id} order={o} token={token} onOrderUpdate={handleOrderUpdate} />
            ))}
          </Stack>
        )}

        <Button color="inherit" size="small" onClick={() => { logout(); onClose(); }} sx={{ mt: 3 }}>
          Sign out
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function OrderAccordion({ order: o, token, onOrderUpdate }) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const getStatusColor = (status) => {
    const statusMap = {
      pending: { bg: '#fef3c7', color: '#b45309' },
      processing: { bg: '#dbeafe', color: '#1e40af' },
      confirmed: { bg: '#dbeafe', color: '#1e40af' },
      shipped: { bg: '#d1fae5', color: '#065f46' },
      delivered: { bg: '#d1d5db', color: '#1f2937' },
      cancelled: { bg: '#fee2e2', color: '#991b1b' }
    };
    return statusMap[status?.toLowerCase()] || { bg: '#f3f4f6', color: '#374151' };
  };

  const canCancel = !o.shipment_id && !["shipped", "delivered", "cancelled"].includes(o.status?.toLowerCase());

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`${paymentConfig.backendBaseUrl}/api/orders/${o.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Could not cancel order');
      }
      alert('Order cancelled successfully');
      setCancelDialogOpen(false);
      onOrderUpdate();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  const meta = getStatusColor(o.status);

  return (
    <>
      <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={0.5} sx={{ width: '100%', pr: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{o.id}</Typography>
              <Typography variant="caption" color="text.secondary">{new Date(o.created_at).toLocaleDateString()}</Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip size="small" label={o.status || 'pending'} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
              <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{formatINR(o.total)}</Typography>
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Divider sx={{ mb: 2 }} />

          {/* Order Items */}
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {o.items?.map((i) => (
              <Stack key={i.id} direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
                <Typography variant="body2">{i.title} × {i.qty}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatINR(i.unitPrice * i.qty)}</Typography>
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Payment Info */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {o.payment_method === 'cod' ? 'Cash on delivery' : `Paid (${o.payment_ref || 'via Razorpay'})`}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{formatINR(o.total)}</Typography>
          </Stack>

          {/* Shipping/Tracking Info */}
          {o.shipment_id && (
            <Box sx={{ bgcolor: '#f0f9ff', p: 1.5, borderRadius: 1, mb: 2, border: '1px solid #0284c7' }}>
              <Stack spacing={0.75}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocalShippingIcon fontSize="small" sx={{ color: '#0369a1' }} />
                  <Typography sx={{ fontWeight: 600, color: '#0369a1' }}>Shipment Tracking</Typography>
                </Stack>
                <Typography variant="body2">
                  <strong>Shipment ID:</strong> {o.shipment_id}
                </Typography>
                {o.tracking_number && (
                  <Typography variant="body2">
                    <strong>AWB/Tracking:</strong> {o.tracking_number}
                  </Typography>
                )}
                {o.carrier && (
                  <Typography variant="body2">
                    <strong>Carrier:</strong> {o.carrier}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {/* Status Messages */}
          {o.status?.toLowerCase() === 'shipped' && !o.tracking_number && (
            <Typography variant="body2" sx={{ color: '#0369a1', mb: 1 }}>
              📦 Your order is on the way. Tracking info will appear soon.
            </Typography>
          )}

          {o.status?.toLowerCase() === 'delivered' && (
            <Typography variant="body2" sx={{ color: '#059669', mb: 1 }}>
              ✓ Order delivered. Thank you for your purchase!
            </Typography>
          )}

          {o.status?.toLowerCase() === 'cancelled' && (
            <Typography variant="body2" sx={{ color: '#dc2626', mb: 1 }}>
              ✗ This order has been cancelled.
            </Typography>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => setCancelDialogOpen(true)}
              sx={{ mt: 1 }}
            >
              Cancel Order
            </Button>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog open={cancelDialogOpen} onClose={() => !cancelling && setCancelDialogOpen(false)}>
        <ConfirmTitle>Cancel Order?</ConfirmTitle>
        <ConfirmContent>
          <Typography>
            Are you sure you want to cancel order <strong>{o.id}</strong>? This action cannot be undone.
          </Typography>
        </ConfirmContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} disabled={cancelling}>Keep Order</Button>
          <Button
            onClick={handleCancel}
            variant="contained"
            color="error"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
          </Button>
        </DialogActions>
      </ConfirmDialog>
    </>
  );
}