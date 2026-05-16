from extensions import db
from models import InventoryLog, Product, StockAlert


def log_inventory(product_id: int, action_type: str, quantity: int, previous_stock: int, new_stock: int):
    row = InventoryLog(
        product_id=product_id,
        action_type=action_type,
        quantity=quantity,
        previous_stock=previous_stock,
        new_stock=new_stock,
    )
    db.session.add(row)


def sync_stock_alert(product: Product, threshold: int = 25):
    if product.stock > threshold:
        StockAlert.query.filter_by(product_id=product.id, alert_status="open").update({"alert_status": "resolved"})
        return
    existing = StockAlert.query.filter_by(product_id=product.id, alert_status="open").first()
    if existing:
        existing.current_stock = product.stock
        return
    alert = StockAlert(
        product_id=product.id,
        current_stock=product.stock,
        threshold_value=threshold,
        alert_status="open",
    )
    db.session.add(alert)
