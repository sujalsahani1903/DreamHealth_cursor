-- Dream Health Foods — MySQL 8+ schema
-- Database: dream_health_foods

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS dream_health_foods
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dream_health_foods;

DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS stock_alerts;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS email_otps;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS raw_materials;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  profile_image VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE email_otps (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  email VARCHAR(190) NOT NULL,
  otp VARCHAR(255) NOT NULL COMMENT 'bcrypt hash of OTP',
  purpose ENUM('signup','login','forgot_password') NOT NULL,
  expires_at DATETIME NOT NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_otps_email_purpose (email, purpose),
  KEY idx_email_otps_expires (expires_at),
  CONSTRAINT fk_email_otps_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE addresses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state VARCHAR(120) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  country VARCHAR(120) NOT NULL DEFAULT 'India',
  PRIMARY KEY (id),
  KEY idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  image VARCHAR(512) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL COMMENT 'legacy/display base price',
  stock INT NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(12,2) NOT NULL,
  profit_margin DECIMAL(6,2) NOT NULL DEFAULT 0.00 COMMENT 'percentage',
  image VARCHAR(512) NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_reviews INT UNSIGNED NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_featured (featured),
  KEY idx_products_selling_price (selling_price),
  KEY idx_products_rating (rating),
  FULLTEXT KEY ft_products_name_desc (name, description),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_user_product (user_id, product_id),
  KEY idx_cart_user (user_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wishlists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe',
  order_status ENUM('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  stripe_session_id VARCHAR(255) NULL,
  shipping_address TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (order_status),
  KEY idx_orders_payment (payment_status),
  KEY idx_orders_created (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE order_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id INT UNSIGNED NOT NULL,
  stripe_payment_intent VARCHAR(255) NULL,
  stripe_charge_id VARCHAR(255) NULL,
  receipt_url VARCHAR(512) NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_order (order_id),
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  feedback TEXT NOT NULL,
  admin_reply TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_product_order (user_id, product_id, order_id),
  KEY idx_reviews_product (product_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(120) NULL,
  phone VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  address TEXT NULL,
  PRIMARY KEY (id),
  KEY idx_suppliers_name (supplier_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE raw_materials (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  supplier VARCHAR(200) NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  purchase_date DATE NULL,
  remaining_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_raw_materials_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventory_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  action_type ENUM('add','subtract','sale','adjust') NOT NULL,
  quantity INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_inventory_logs_product (product_id),
  KEY idx_inventory_logs_created (created_at),
  CONSTRAINT fk_inventory_logs_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_alerts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  current_stock INT NOT NULL,
  threshold_value INT NOT NULL,
  alert_status ENUM('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
  PRIMARY KEY (id),
  KEY idx_stock_alerts_product (product_id),
  KEY idx_stock_alerts_status (alert_status),
  CONSTRAINT fk_stock_alerts_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
