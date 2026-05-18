# Database

## Fresh install

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

`schema.sql` creates database `dream_health_foods` and all tables (including `product_variants` and `order_items.item_status`).

## Migrations (existing databases)

If you created the DB before newer features, run:

```bash
mysql -u root -p dream_health_foods < migrations/run_all_new_changes.sql
```

Individual scripts:

| File | Change |
|------|--------|
| `001_order_item_status.sql` | Per-line fulfillment status |
| `002_product_variants.sql` | Pack sizes + cart/order variant columns |
| `run_all_new_changes.sql` | Combined script (idempotent where possible) |

**Note:** “Duplicate column” errors mean that step is already applied — safe to continue.

## Seed data

`seed.sql` adds sample categories, products, variants, and users.  
Default password for seeded accounts: **`Password123!`**
