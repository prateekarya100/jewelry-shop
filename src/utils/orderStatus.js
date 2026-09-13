export const STATUS_META = {
  pending: { label: 'Pending', bg: 'rgba(184,112,63,0.15)', color: '#8f5630' },
  confirmed: { label: 'Confirmed', bg: 'rgba(28,20,32,0.08)', color: '#1c1420' },
  shipped: { label: 'Out for delivery', bg: 'rgba(55,138,221,0.13)', color: '#1b5fa0' },
  delivered: { label: 'Delivered', bg: 'rgba(74,122,82,0.15)', color: '#355b3b' },
  cancelled: { label: 'Cancelled', bg: 'rgba(122,32,54,0.13)', color: '#7a2036' },
};

export const STATUS_ORDER = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pending;
}
