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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useCustomerAuth } from '../context/CustomerAuthContext.jsx';
import { formatINR } from '../utils/storage.js';
import { getStatusMeta } from '../utils/orderStatus.js';
import { printOrder, downloadOrder } from '../utils/orderExport.js';
import paymentConfig from '../config/payment.js';

export default function MyOrders({ onClose }) {
  const { token, customer, logout } = useCustomerAuth();
  const [orders, setOrders] = useState(null); // null = loading
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${paymentConfig.backendBaseUrl}/api/customer/orders`, {
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
  }, [token]);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Playfair Display', serif" }}>
        My orders
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
          <Typography color="text.secondary">No orders yet — once you place one, it'll show up here.</Typography>
        )}

        {orders && orders.length > 0 && (
          <Stack spacing={1.25}>
            {orders.map((o) => (
              <CustomerOrderAccordion key={o.id} order={o} />
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

function CustomerOrderAccordion({ order: o }) {
  const status = o.fulfillmentStatus || 'pending';
  const meta = getStatusMeta(status);
  const isPaid = o.paymentMethod !== 'cod';

  return (
    <Accordion variant="outlined" disableGutters sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={0.5} sx={{ width: '100%', pr: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>{o.id}</Typography>
            <Typography variant="caption" color="text.secondary">{new Date(o.date).toLocaleDateString()}</Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{formatINR(o.total)}</Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mb: 1 }}>
          <Tooltip title="Print">
            <IconButton size="small" onClick={() => printOrder(o)}><PrintOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => downloadOrder(o)}><DownloadOutlinedIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
        <Stack spacing={0.5} sx={{ mb: 1 }}>
          {o.items.map((i) => (
            <Stack key={i.productId} direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
              <Typography variant="body2">{i.title} × {i.qty}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatINR(i.unitPrice * i.qty)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {isPaid ? (o.paymentRef ? `Ref: ${o.paymentRef}` : 'Paid') : 'Cash on delivery'}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{formatINR(o.total)}</Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
