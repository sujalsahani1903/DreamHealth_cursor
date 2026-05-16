from decimal import Decimal


def calc_profit_margin(cost: Decimal, selling: Decimal) -> Decimal:
    if selling <= 0:
        return Decimal("0")
    return round((selling - cost) / selling * 100, 2)


def product_to_dict(p, include_cost=False):
    d = {
        "id": p.id,
        "category_id": p.category_id,
        "name": p.name,
        "description": p.description,
        "price": float(p.price),
        "stock": p.stock,
        "selling_price": float(p.selling_price),
        "image": p.image,
        "rating": float(p.rating),
        "total_reviews": p.total_reviews,
        "featured": p.featured,
        "created_at": p.created_at.isoformat() if p.created_at else None,
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
