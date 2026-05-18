export function formatProductPrice(p) {
  if (!p) return "";
  if (p.has_variants && p.price_from != null) {
    const from = Number(p.price_from);
    const to = Number(p.price_to ?? from);
    if (to > from) return `From ₹${from.toFixed(2)}`;
    return `₹${from.toFixed(2)}`;
  }
  return `₹${Number(p.selling_price || 0).toFixed(2)}`;
}
