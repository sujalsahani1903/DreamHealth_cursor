# Database

Fresh:

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

Older DB from before variants / line-item status:

```bash
mysql -u root -p dream_health_foods < migrations/run_all_new_changes.sql
```

Duplicate column errors = that migration already ran.

Seed password: `Password123!`
