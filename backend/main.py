from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import Base, engine, get_db


app = FastAPI(
    title="MYPE Voz API",
    version="0.2.0",
)

Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Tipos permitidos
# -----------------------------

PaymentMethod = Literal[
    "efectivo",
    "yape",
    "plin",
    "tarjeta",
    "transferencia",
    "fiado",
    "mixto",
]

OperationType = Literal[
    "venta",
    "gasto",
    "venta_fiada",
    "compra_mercaderia",
    "pago_deuda",
]


# -----------------------------
# Esquemas Pydantic
# -----------------------------

class InterpretRequest(BaseModel):
    texto: str = Field(min_length=1)
    registrado_por: str | None = None


class InterpretedProduct(BaseModel):
    id: int | None = None
    nombre: str
    cantidad: float = Field(gt=0)
    precio_unitario: float | None = Field(default=None, ge=0)
    subtotal: float | None = Field(default=None, ge=0)


class InterpretedOperation(BaseModel):
    tipo_operacion: OperationType
    productos: list[InterpretedProduct] = Field(default_factory=list)
    monto_total: float | None = Field(default=None, ge=0)
    metodo_pago: PaymentMethod | None = None
    cliente: str | None = None
    categoria_gasto: str | None = None
    monto_pagado: float = Field(default=0, ge=0)
    monto_fiado: float = Field(default=0, ge=0)
    registrado_por: str | None = None
    campos_faltantes: list[str] = Field(default_factory=list)
    advertencias: list[str] = Field(default_factory=list)


class InterpretResponse(BaseModel):
    operacion: InterpretedOperation
    requiere_confirmacion: bool


class ProductResponse(BaseModel):
    id: int
    nombre: str
    categoria: str
    precio: float
    stock_actual: float
    stock_minimo: float
    estado: Literal[
        "disponible",
        "stock_bajo",
        "agotado",
    ]


class InventoryEffect(BaseModel):
    producto: str
    stock_anterior: float
    stock_actual: float
    stock_minimo: float
    estado: Literal[
        "disponible",
        "stock_bajo",
        "agotado",
    ]


class CashEffect(BaseModel):
    metodo: str
    saldo_anterior: float
    monto_agregado: float
    saldo_actual: float


class ConfirmOperationResponse(BaseModel):
    mensaje: str
    inventario: list[InventoryEffect]
    caja: CashEffect | None = None
    alertas: list[str]


# -----------------------------
# Funciones auxiliares
# -----------------------------

def obtener_estado_stock(producto: models.Product) -> str:
    if producto.current_stock <= 0:
        return "agotado"

    if producto.current_stock <= producto.minimum_stock:
        return "stock_bajo"

    return "disponible"


def obtener_saldo_caja(
    db: Session,
    metodo_pago: str,
) -> float:
    movimientos = (
        db.query(models.CashMovement)
        .filter(
            models.CashMovement.payment_method == metodo_pago
        )
        .all()
    )

    saldo = 0.0

    for movimiento in movimientos:
        if movimiento.movement_type in {
            "saldo_inicial",
            "ingreso",
        }:
            saldo += movimiento.amount

        elif movimiento.movement_type == "egreso":
            saldo -= movimiento.amount

    return saldo


# -----------------------------
# Rutas
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "MYPE Voz API funcionando"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok"
    }


@app.post(
    "/api/interpretar",
    response_model=InterpretResponse,
)
def interpretar_operacion(
    solicitud: InterpretRequest,
):
    operacion_simulada = InterpretedOperation(
        tipo_operacion="venta",
        productos=[
            InterpretedProduct(
                id=1,
                nombre="Gaseosa personal",
                cantidad=3,
                precio_unitario=4,
                subtotal=12,
            )
        ],
        monto_total=12,
        metodo_pago="yape",
        cliente=None,
        categoria_gasto=None,
        monto_pagado=12,
        monto_fiado=0,
        registrado_por=solicitud.registrado_por,
        campos_faltantes=[],
        advertencias=[],
    )

    return InterpretResponse(
        operacion=operacion_simulada,
        requiere_confirmacion=True,
    )


@app.get(
    "/api/inventario",
    response_model=list[ProductResponse],
)
def obtener_inventario(
    db: Session = Depends(get_db),
):
    productos = (
        db.query(models.Product)
        .filter(models.Product.active.is_(True))
        .order_by(models.Product.name)
        .all()
    )

    return [
        ProductResponse(
            id=producto.id,
            nombre=producto.name,
            categoria=producto.category,
            precio=producto.sale_price,
            stock_actual=producto.current_stock,
            stock_minimo=producto.minimum_stock,
            estado=obtener_estado_stock(producto),
        )
        for producto in productos
    ]


@app.post(
    "/api/operaciones/confirmar",
    response_model=ConfirmOperationResponse,
)
def confirmar_operacion(
    operacion: InterpretedOperation,
    db: Session = Depends(get_db),
):
    if operacion.tipo_operacion not in {
        "venta",
        "venta_fiada",
    }:
        raise HTTPException(
            status_code=400,
            detail="Por ahora solo se pueden confirmar ventas.",
        )

    if not operacion.productos:
        raise HTTPException(
            status_code=422,
            detail="La venta debe incluir al menos un producto.",
        )

    efectos_inventario: list[InventoryEffect] = []
    alertas: list[str] = []
    efecto_caja: CashEffect | None = None

    try:
        for item in operacion.productos:
            if item.id is None:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"El producto {item.nombre} "
                        "no tiene ID."
                    ),
                )

            producto = db.get(
                models.Product,
                item.id,
            )

            if producto is None:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        f"No existe el producto "
                        f"con ID {item.id}."
                    ),
                )

            stock_anterior = producto.current_stock

            if item.cantidad > stock_anterior:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"No hay stock suficiente "
                        f"de {producto.name}. "
                        f"Disponible: {stock_anterior}."
                    ),
                )

            producto.current_stock -= item.cantidad

            estado = obtener_estado_stock(producto)

            efectos_inventario.append(
                InventoryEffect(
                    producto=producto.name,
                    stock_anterior=stock_anterior,
                    stock_actual=producto.current_stock,
                    stock_minimo=producto.minimum_stock,
                    estado=estado,
                )
            )

            if estado == "stock_bajo":
                alertas.append(
                    (
                        f"Stock bajo de {producto.name}: "
                        f"quedan "
                        f"{producto.current_stock} "
                        "unidades."
                    )
                )

            if estado == "agotado":
                alertas.append(
                    f"{producto.name} se ha agotado."
                )

        if (
            operacion.metodo_pago
            and operacion.metodo_pago != "fiado"
            and operacion.monto_pagado > 0
        ):
            saldo_anterior = obtener_saldo_caja(
                db,
                operacion.metodo_pago,
            )

            movimiento = models.CashMovement(
                movement_type="ingreso",
                payment_method=operacion.metodo_pago,
                amount=operacion.monto_pagado,
                description=(
                    f"Venta registrada por "
                    f"{operacion.registrado_por or 'usuario'}"
                ),
            )

            db.add(movimiento)

            efecto_caja = CashEffect(
                metodo=operacion.metodo_pago,
                saldo_anterior=saldo_anterior,
                monto_agregado=operacion.monto_pagado,
                saldo_actual=(
                    saldo_anterior
                    + operacion.monto_pagado
                ),
            )

        db.commit()

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="No se pudo confirmar la operación.",
        ) from error

    return ConfirmOperationResponse(
        mensaje="Venta registrada correctamente",
        inventario=efectos_inventario,
        caja=efecto_caja,
        alertas=alertas,
    )


@app.get("/api/caja")
def obtener_caja(
    db: Session = Depends(get_db),
):
    metodos = [
        "efectivo",
        "yape",
        "plin",
        "tarjeta",
        "transferencia",
    ]

    return {
        metodo: obtener_saldo_caja(
            db,
            metodo,
        )
        for metodo in metodos
    }