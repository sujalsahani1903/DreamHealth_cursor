export function paymentMethodLabel(method) {
  if (method === "cod") return "Cash on Delivery";
  if (method === "stripe") return "Online (Stripe)";
  return method || "—";
}

export function paymentStatusLabel(status, method) {
  if (status === "paid") return "Paid";
  if (method === "cod" && status === "pending") return "COD — pay on delivery";
  if (status === "pending") return "Payment pending";
  return status || "—";
}
