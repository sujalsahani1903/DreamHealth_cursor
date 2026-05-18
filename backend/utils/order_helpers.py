from decimal import Decimal

ITEM_STATUSES = ("pending", "processing", "shipped", "delivered", "cancelled")


def serialize_order_item(item):
    p = item.product
    qty = int(item.quantity)
    unit = Decimal(str(item.price))
    base_name = p.name if p else "Unknown product"
    label = item.variant_label or (item.variant.label if item.variant else None)
    display_name = f"{base_name} ({label})" if label else base_name
    return {
        "id": item.id,
        "product_id": item.product_id,
        "variant_id": item.variant_id,
        "variant_label": label,
        "name": display_name,
        "image": p.image if p else None,
        "quantity": qty,
        "unit_price": float(unit),
        "line_total": float(unit * qty),
        "item_status": item.item_status or "pending",
    }


def sync_order_status(order):
    # roll up line statuses to order.order_status
    items = list(order.items)
    if not items:
        return
    statuses = [i.item_status or "pending" for i in items]
    active = [s for s in statuses if s != "cancelled"]
    if not active:
        order.order_status = "cancelled"
    elif all(s == "delivered" for s in active):
        order.order_status = "delivered"
    elif all(s in ("delivered", "shipped") for s in active):
        order.order_status = "shipped"
    elif any(s in ("shipped", "delivered") for s in active):
        order.order_status = "processing"
    elif any(s == "processing" for s in active):
        order.order_status = "processing"
    else:
        order.order_status = "pending"
