from decimal import Decimal


def calc_profit_margin(cost: Decimal, selling: Decimal) -> Decimal:
    if selling <= 0:
        return Decimal("0")
    return round((selling - cost) / selling * 100, 2)


def variant_to_dict(v, include_cost: bool = False) -> dict:
    d = {
        "id": v.id,
        "product_id": v.product_id,
        "label": v.label,
        "weight_grams": v.weight_grams,
        "selling_price": float(v.selling_price),
        "stock": v.stock,
        "is_default": bool(v.is_default),
        "sort_order": v.sort_order,
    }
    if include_cost:
        d["cost_price"] = float(v.cost_price)
    return d


def product_to_dict(p, include_cost=False, include_variants=True):
    variants = []
    if include_variants and hasattr(p, "variants"):
        variants = [
            variant_to_dict(v, include_cost=include_cost)
            for v in sorted(p.variants, key=lambda x: (x.sort_order, x.weight_grams or 0))
        ]

    if variants:
        prices = [v["selling_price"] for v in variants]
        min_p, max_p = min(prices), max(prices)
        total_stock = sum(v["stock"] for v in variants)
        default = next((v for v in variants if v.get("is_default")), variants[0])
        selling = default["selling_price"]
    else:
        min_p = max_p = selling = float(p.selling_price)
        total_stock = p.stock

    d = {
        "id": p.id,
        "category_id": p.category_id,
        "name": p.name,
        "description": p.description,
        "price": float(p.price),
        "stock": total_stock if variants else p.stock,
        "selling_price": selling,
        "image": p.image,
        "rating": float(p.rating),
        "total_reviews": p.total_reviews,
        "featured": p.featured,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "variants": variants,
        "has_variants": len(variants) > 0,
        "price_from": min_p,
        "price_to": max_p,
    }
    if include_cost:
        d["cost_price"] = float(p.cost_price)
        d["profit_margin"] = float(p.profit_margin)
    return d


def user_public(u):
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "phone": u.phone,
        "role": u.role,
        "is_verified": u.is_verified,
        "profile_image": u.profile_image,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }
