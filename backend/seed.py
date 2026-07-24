from database import Base, SessionLocal, engine
from models import CashMovement, Product

PRODUCTS = [
    {
        "name": "Gaseosa personal",
        "category": "Bebidas",
        "sale_price": 4.0,
        "current_stock": 8,
        "minimum_stock": 6,
    },
    {
        "name": "Aceite",
        "category": "Abarrotes",
        "sale_price": 10.0,
        "current_stock": 12,
        "minimum_stock": 5,
    },
    {
        "name": "Leche",
        "category": "Lácteos",
        "sale_price": 4.5,
        "current_stock": 0,
        "minimum_stock": 4,
    },
]

INITIAL_CASH = [
    {
        "movement_type": "saldo_inicial",
        "payment_method": "efectivo",
        "amount": 50.0,
        "description": "Saldo inicial de efectivo",
    },
    {
        "movement_type": "saldo_inicial",
        "payment_method": "yape",
        "amount": 20.0,
        "description": "Saldo inicial de Yape",
    },
    {
        "movement_type": "saldo_inicial",
        "payment_method": "plin",
        "amount": 10.0,
        "description": "Saldo inicial de Plin",
    },
]

def seed_database() -> None:
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        existing_products = db.query(Product).count()

        if existing_products == 0:
            for product_data in PRODUCTS:
                db.add(Product(**product_data))

            print("Productos iniciales agregados.")
        else:
            print("La base ya contiene productos.")

        existing_movements = db.query(CashMovement).count()

        if existing_movements == 0:
            for movement_data in INITIAL_CASH:
                db.add(CashMovement(**movement_data))

            print("Saldos iniciales de caja agregados.")
        else:
            print("La base ya contiene movimientos de caja.")

        db.commit()
        print("Datos iniciales verificados correctamente.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()