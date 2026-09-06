import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseIcon from '@mui/icons-material/Close';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { useStore } from '../context/StoreContext.jsx';
import { formatINR } from '../utils/storage.js';

const EMPTY_FORM = {
  title: '', category: '', tagline: '', description: '',
  price: '', discount: '', images: '', video: '', material: '', stock: '',
};

export default function AdminStudio({ onClose }) {
  const { products, addProduct, updateProduct, deleteProduct, orders, setIsAdmin } = useStore();
  const fullScreen = useMediaQuery('(max-width:760px)');
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  function resetForm() { setForm(EMPTY_FORM); setEditingId(null); }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      title: p.title, category: p.category, tagline: p.tagline || '',
      description: p.description || '', price: p.price, discount: p.discount || 0,
      images: (p.images || []).join(', '), video: p.video || '',
      material: p.material || '', stock: p.stock ?? '',
    });
    setTab(0);
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim() || !form.price) return;
    const payload = {
      title: form.title.trim(), category: form.category.trim(), tagline: form.tagline.trim(),
      description: form.description.trim(), price: Number(form.price) || 0, discount: Number(form.discount) || 0,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      video: form.video.trim(), material: form.material.trim(), stock: Number(form.stock) || 0,
    };
    if (payload.images.length === 0) {
      payload.images = ['https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=900&auto=format&fit=crop'];
    }
    if (editingId) updateProduct(editingId, payload); else addProduct(payload);
    resetForm();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3 }}>
        <CloseIcon fontSize="small" />
      </IconButton>
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
          <Typography variant="h5" sx={{ fontSize: 22 }}>Studio</Typography>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flex: 1, minHeight: 'auto' }}>
            <Tab label="Catalogue" sx={{ minHeight: 'auto' }} />
            <Tab label={`Orders (${orders.length})`} sx={{ minHeight: 'auto' }} />
          </Tabs>
          <Button size="small" color="inherit" onClick={() => { setIsAdmin(false); onClose(); }}>Sign out</Button>
        </Stack>

        {tab === 0 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6.5 }}>
              <Paper variant="outlined" sx={{ p: 2.5 }} component="form" onSubmit={submit}>
                <Typography variant="subtitle1" sx={{ mb: 1.75 }}>{editingId ? 'Edit product' : 'Add a new product'}</Typography>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Section / category" placeholder="e.g. Rings" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Tagline" value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Description" multiline minRows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Price (₹)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Discount (%)" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
                  </Grid>
                  <Grid size={12}>
                    <TextField fullWidth size="small" label="Image URLs (comma separated)" placeholder="https://…, https://…" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField fullWidth size="small" label="Demo video URL (.mp4 or YouTube)" value={form.video} onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" type="number" label="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
                  {editingId && <Button color="inherit" onClick={resetForm}>Cancel edit</Button>}
                  <Button type="submit" variant="contained">{editingId ? 'Save changes' : 'Add product'}</Button>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5.5 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Live catalogue ({products.length})</Typography>
              <Stack spacing={1} sx={{ maxHeight: 460, overflowY: 'auto', pr: 0.5 }}>
                {products.map((p) => (
                  <Paper key={p.id} variant="outlined" sx={{ p: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box component="img" src={p.images?.[0]} alt="" sx={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 1 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>{p.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.category} · {formatINR(p.price)}{p.discount ? ` · -${p.discount}%` : ''}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => startEdit(p)}><EditOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteProduct(p.id)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <Stack spacing={1.5}>
            {orders.length === 0 && <Typography color="text.secondary">No orders yet.</Typography>}
            {orders.map((o) => (
              <Paper key={o.id} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>{o.id}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(o.date).toLocaleString()}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {o.customer.name} · {o.customer.phone} · {o.customer.city}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Payment: {o.paymentMethod.toUpperCase()} {o.paymentRef ? `(${o.paymentRef})` : ''}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14 }}>
                  {o.items.map((i) => (
                    <li key={i.productId}>{i.title} × {i.qty} — {formatINR(i.unitPrice * i.qty)}</li>
                  ))}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>Total: {formatINR(o.total)}</Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
