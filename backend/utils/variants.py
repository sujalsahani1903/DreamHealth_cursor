from decimal import Decimal

from extensions import db
from models import Product, ProductVariant
from utils.serializers import calc_profit_margin

PACK_WEIGHT_GRAMS = {
    "250g": 250,
    "500g": 500,
    "1kg": 1000,
    "1 kg": 1000,
    "2kg": 2000,
    "2 kg": 2000,
    "5kg": 5000,
    "5 kg": 5000,
}


def label_to_grams(label: str) -> int | None:
    key = (label or "").strip().lower().replace(" ", "")
    for k, g in PACK_WEIGHT_GRAMS.items():
        if k.replace(" ", "") == key:
            return g
    return None


def sync_product_aggregate(product: Product) -> None:
    """Keep product row in sync as catalog summary from variants."""
    variants = list(product.variants)
    if not variants:
        return
    default = next((v for v in variants if v.is_default), variants[0])
    product.selling_price = default.selling_price
    product.cost_price = default.cost_price
    product.price = default.selling_price
    product.stock = sum(int(v.stock) for v in variants)
    product.profit_margin = calc_profit_margin(
        Decimal(str(product.cost_price)), Decimal(str(product.selling_price))
    )


def upsert_product_variants(product: Product, variants_data: list) -> None:
    if not variants_data:
        return
    kept_ids: list[int] = []
    for i, vd in enumerate(variants_data):
        label = (vd.get("label") or "").strip()
        if not label:
            continue
        vid = vd.get("id")
        v = None
        if vid:
            v = ProductVariant.query.filter_by(id=int(vid), product_id=product.id).first()
        if not v:
            v = ProductVariant(product_id=product.id)
            db.session.add(v)
        v.label = label
        v.weight_grams = vd.get("weight_grams") or label_to_grams(label)
        v.selling_price = Decimal(str(vd.get("selling_price") or 0))
        v.cost_price = Decimal(str(vd.get("cost_price") or 0))
        v.stock = int(vd.get("stock") or 0)
        v.is_default = bool(vd.get("is_default"))
        v.sort_order = int(vd.get("sort_order") if vd.get("sort_order") is not None else i)
        db.session.flush()
        kept_ids.append(v.id)

    if not kept_ids:
        return

    has_default = ProductVariant.query.filter(
        ProductVariant.id.in_(kept_ids), ProductVariant.is_default.is_(True)
    ).first()
    if not has_default:
        first = ProductVariant.query.get(kept_ids[0])
        if first:
            first.is_default = True

    ProductVariant.query.filter(
        ProductVariant.product_id == product.id, ~ProductVariant.id.in_(kept_ids)
    ).delete(synchronize_session=False)
    sync_product_aggregate(product)


def get_default_variant(product: Product) -> ProductVariant | None:
    if not product.variants:
        return None
    return next((v for v in product.variants if v.is_default), product.variants[0])


def resolve_variant(product: Product, variant_id: int | None) -> ProductVariant | None:
    if variant_id:
        return ProductVariant.query.filter_by(id=variant_id, product_id=product.id).first()
    return get_default_variant(product)
