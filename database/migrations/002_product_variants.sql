-- Pack sizes (250g, 500g, 1kg, etc.) per product
USE dream_health_foods;

CREATE TABLE IF NOT EXISTS product_variants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  label VARCHAR(50) NOT NULL,
  weight_grams INT UNSIGNED NULL,
  selling_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_variants_product (product_id),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default pack per existing product (1 kg) using current price/stock
INSERT INTO product_variants (product_id, label, weight_grams, selling_price, cost_price, stock, is_default, sort_order)
SELECT p.id, '1 kg', 1000, p.selling_price, p.cost_price, p.stock, 1, 3
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id);

-- Example multi-pack for Whole Wheat Atta (product id 1 when seeded)
INSERT INTO product_variants (product_id, label, weight_grams, selling_price, cost_price, stock, is_default, sort_order)
SELECT 1, '250g', 250, ROUND(p.selling_price * 0.28, 2), ROUND(p.cost_price * 0.28, 2), 120, 0, 1 FROM products p WHERE p.id = 1
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = 1 AND v.label = '250g');

INSERT INTO product_variants (product_id, label, weight_grams, selling_price, cost_price, stock, is_default, sort_order)
SELECT 1, '500g', 500, ROUND(p.selling_price * 0.52, 2), ROUND(p.cost_price * 0.52, 2), 100, 0, 2 FROM products p WHERE p.id = 1
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = 1 AND v.label = '500g');

INSERT INTO product_variants (product_id, label, weight_grams, selling_price, cost_price, stock, is_default, sort_order)
SELECT 1, '2 kg', 2000, ROUND(p.selling_price * 1.85, 2), ROUND(p.cost_price * 1.85, 2), 60, 0, 4 FROM products p WHERE p.id = 1
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = 1 AND v.label = '2 kg');

INSERT INTO product_variants (product_id, label, weight_grams, selling_price, cost_price, stock, is_default, sort_order)
SELECT 1, '5 kg', 5000, ROUND(p.selling_price * 4.4, 2), ROUND(p.cost_price * 4.4, 2), 40, 0, 5 FROM products p WHERE p.id = 1
  AND NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = 1 AND v.label = '5 kg');

ALTER TABLE cart ADD COLUMN variant_id INT UNSIGNED NULL AFTER product_id;
UPDATE cart c
JOIN product_variants v ON v.product_id = c.product_id AND v.is_default = 1
SET c.variant_id = v.id
WHERE c.variant_id IS NULL;

ALTER TABLE cart
  ADD KEY idx_cart_variant (variant_id),
  ADD CONSTRAINT fk_cart_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE CASCADE;

ALTER TABLE cart DROP INDEX uq_cart_user_product;
ALTER TABLE cart ADD UNIQUE KEY uq_cart_user_variant (user_id, variant_id);

ALTER TABLE order_items
  ADD COLUMN variant_id INT UNSIGNED NULL AFTER product_id,
  ADD COLUMN variant_label VARCHAR(50) NULL AFTER variant_id;

UPDATE order_items oi
JOIN product_variants v ON v.product_id = oi.product_id AND v.is_default = 1
SET oi.variant_id = v.id, oi.variant_label = v.label
WHERE oi.variant_id IS NULL;
