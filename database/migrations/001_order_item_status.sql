-- Per-product fulfillment status on order line items
USE dream_health_foods;

ALTER TABLE order_items
  ADD COLUMN item_status ENUM('pending','processing','shipped','delivered','cancelled')
  NOT NULL DEFAULT 'pending'
  AFTER price;

-- Paid orders: mark existing line items as processing
UPDATE order_items oi
JOIN orders o ON o.id = oi.order_id
SET oi.item_status = 'processing'
WHERE o.payment_status = 'paid' AND oi.item_status = 'pending';
