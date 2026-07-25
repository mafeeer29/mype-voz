from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


# --------------------------------
# Tabla de productos e inventario
# --------------------------------

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    sale_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    current_stock: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )

    minimum_stock: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )


# --------------------------------
# Tabla de movimientos de caja
# --------------------------------

class CashMovement(Base):
    __tablename__ = "cash_movements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    movement_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    payment_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )


# --------------------------------
# Tabla de ventas fiadas y deudas
# --------------------------------

class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    customer_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    original_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    pending_balance: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pendiente",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        onupdate=datetime.now,
        nullable=False,
    )