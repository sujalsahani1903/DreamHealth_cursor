-- Dream Health Foods — seed data
-- Default password for seeded users: Password123!

USE dream_health_foods;

SET NAMES utf8mb4;

INSERT INTO users (id, name, email, phone, password, role, is_verified, profile_image, created_at) VALUES
(1, 'Dream Admin', 'admin@dreamhealthfoods.com', '+917719180111', '$2b$12$QKadvhCbmc.UtH3E4VbnkOLxLfisOMwSNC.6pEnenbL053pwfAoju', 'admin', 1, NULL, NOW()),
(2, 'Priya Sharma', 'priya@example.com', '+919900000001', '$2b$12$QKadvhCbmc.UtH3E4VbnkOLxLfisOMwSNC.6pEnenbL053pwfAoju', 'user', 1, NULL, NOW());

INSERT INTO addresses (user_id, address_line, city, state, pincode, country) VALUES
(2, '12 MG Road', 'Siliguri', 'West Bengal', '734001', 'India');

INSERT INTO categories (id, name, image) VALUES
(1, 'Atta', 'https://images.unsplash.com/photo-1599490659213-e2b9520bd087?w=800&q=80'),
(2, 'Millet', 'https://images.unsplash.com/photo-1586201375768-838b01972027?w=800&q=80'),
(3, 'Sattu', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80'),
(4, 'Health Mixes', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80');

INSERT INTO suppliers (supplier_name, contact_person, phone, email, address) VALUES
('North Bengal Grains Co.', 'Ramesh Agarwal', '+913532500001', 'sales@nbgrains.example', 'Eastern By Pass, Siliguri'),
('Himalayan Organic Mills', 'Sunita Rai', '+913532500002', 'procurement@hom.example', 'Darjeeling Road, Siliguri'),
('Ganga Valley Wheat Traders', 'Amit Verma', '+913532500003', 'amit@gvwt.example', 'Sevoke Road, Siliguri');

INSERT INTO raw_materials (name, supplier, quantity, purchase_price, purchase_date, remaining_stock) VALUES
('Premium Sharbati Wheat', 'North Bengal Grains Co.', 5000, 28.50, CURDATE(), 4200),
('Whole Bajra', 'Himalayan Organic Mills', 2000, 42.00, CURDATE(), 1650),
('Foxtail Millet', 'Himalayan Organic Mills', 1500, 55.00, CURDATE(), 1200),
('Roasted Gram (Chana)', 'Ganga Valley Wheat Traders', 3000, 48.00, CURDATE(), 2400);

INSERT INTO products (category_id, name, description, price, stock, cost_price, selling_price, profit_margin, image, rating, total_reviews, featured) VALUES
(1, 'Whole Wheat Atta', 'Stone-ground whole wheat flour rich in fiber. Ideal for soft rotis and parathas.', 129.00, 180, 78.00, 129.00, 39.53, 'https://images.unsplash.com/photo-1599490659213-e2b9520bd087?w=800&q=80', 4.70, 42, 1),
(1, 'Multigrain Atta', 'Blend of wheat, oats, barley and flax for balanced everyday nutrition.', 189.00, 140, 112.00, 189.00, 40.74, 'https://images.unsplash.com/photo-1615485925606-5bfe16d9b8d0?w=800&q=80', 4.60, 31, 1),
(1, 'Diabetic Atta', 'Low-GI atta with millets and legumes to support steady energy release.', 219.00, 95, 135.00, 219.00, 38.36, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80', 4.80, 18, 1),
(1, 'All Millet Atta', 'Nutrient-dense atta combining major millets for traditional wellness.', 209.00, 110, 128.00, 209.00, 38.76, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 4.55, 24, 0),
(1, 'Customised Mixgrain Atta', 'Tailored multigrain mix crafted for your family’s health goals (contact us).', 249.00, 60, 150.00, 249.00, 39.76, 'https://images.unsplash.com/photo-1517686469429-8bdb88b9d907?w=800&q=80', 4.90, 12, 1),
(2, 'Foxtail Millet (Kangni)', 'Whole foxtail millet — light, easy to digest, great for upma and khichdi.', 165.00, 200, 95.00, 165.00, 42.42, 'https://images.unsplash.com/photo-1586201375768-838b01972027?w=800&q=80', 4.65, 28, 0),
(2, 'Pearl Millet (Bajra)', 'Classic bajra grains for winter warmth and iron-rich meals.', 145.00, 220, 82.00, 145.00, 43.45, 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&q=80', 4.50, 36, 0),
(2, 'Little Millet (Kutki)', 'Tiny grains packed with minerals — perfect for porridge and mixed rice.', 175.00, 150, 100.00, 175.00, 42.86, 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80', 4.72, 15, 0),
(2, 'Kodo Millet', 'Traditional millet known for gut-friendly fiber and steady carbs.', 169.00, 130, 98.00, 169.00, 42.01, 'https://images.unsplash.com/photo-1506368083636-6defb67639a7?w=800&q=80', 4.58, 19, 0),
(2, 'Barnyard Millet (Sanwa)', 'Fast-cooking millet ideal for fasting-friendly recipes.', 185.00, 115, 108.00, 185.00, 41.62, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80', 4.63, 11, 0),
(3, 'Chana Sattu', 'Roasted gram sattu — refreshing summer drink and protein-rich stuffing.', 139.00, 240, 72.00, 139.00, 48.20, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80', 4.75, 52, 1),
(3, 'Makka Sattu', 'Corn sattu with earthy sweetness — great for litti and regional drinks.', 129.00, 175, 68.00, 129.00, 47.29, 'https://images.unsplash.com/photo-1574323347407-f5e1ad145d9d?w=800&q=80', 4.52, 22, 0),
(3, 'All Millet Sattu', 'Fine roasted millet blend for high-fiber smoothies and savory mixes.', 159.00, 160, 88.00, 159.00, 44.65, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', 4.68, 17, 1),
(3, 'Barley Sattu', 'Cooling roasted barley flour — traditional summer cooler base.', 149.00, 140, 80.00, 149.00, 46.31, 'https://images.unsplash.com/photo-1517686469429-8bdb88b9d907?w=800&q=80', 4.40, 9, 0),
(4, 'Protein Power Mix', 'Breakfast mix with millets, nuts and seeds for sustained energy.', 229.00, 90, 140.00, 229.00, 38.86, 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80', 4.77, 26, 1),
(4, 'Women Wellness Mix', 'Iron and calcium focused blend with ragi and sesame.', 239.00, 85, 148.00, 239.00, 38.08, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80', 4.82, 14, 0),
(4, 'Kids Growth Mix', 'Mildly sweet multigrain porridge mix loved by children.', 199.00, 100, 118.00, 199.00, 40.70, 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80', 4.66, 33, 0),
(4, 'Active Lifestyle Mix', 'Post-workout friendly mix with complex carbs and natural sweetness.', 249.00, 75, 155.00, 249.00, 37.75, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', 4.71, 20, 0),
(4, 'Golden Turmeric Latte Mix', 'Turmeric, pepper and millet malt for golden milk evenings.', 219.00, 88, 132.00, 219.00, 39.73, 'https://images.unsplash.com/photo-1556679343-c7306c19756b?w=800&q=80', 4.59, 16, 0),
(1, 'Heritage Khapli Wheat Atta', 'Ancient wheat variety with robust flavor and lower gluten feel.', 199.00, 70, 120.00, 199.00, 39.70, 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80', 4.84, 27, 1),
(2, 'Finger Millet (Ragi)', 'Calcium-rich ragi whole grain for porridge, ladoos and dosas.', 155.00, 190, 90.00, 155.00, 41.94, 'https://images.unsplash.com/photo-1506368083636-6defb67639a7?w=800&q=80', 4.73, 41, 1),
(3, 'Mixed Pulse Sattu', 'Roasted chana, moong and urad blend for savory protein drinks.', 169.00, 125, 92.00, 169.00, 45.56, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80', 4.61, 13, 0);

INSERT INTO stock_alerts (product_id, current_stock, threshold_value, alert_status)
SELECT p.id, p.stock, 80, 'open' FROM products p WHERE p.name = 'Customised Mixgrain Atta' LIMIT 1;
