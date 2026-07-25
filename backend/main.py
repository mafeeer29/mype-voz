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
    precio_unitario: float | None = Field(
        default=None,
        ge=0,
    )
    subtotal: float | None = Field(
        default=None,
        ge=0,
    )


class InterpretedOperation(BaseModel):
    tipo_operacion: OperationType
    productos: list[InterpretedProduct] = Field(
        default_factory=list,
    )
    monto_total: float | None = Field(
        default=None,
        ge=0,
    )
    metodo_pago: PaymentMethod | None = None
    cliente: str | None = None
    categoria_gasto: str | None = None
    monto_pagado: float = Field(
        default=0,
        ge=0,
    )
    monto_fiado: float = Field(
        default=0,
        ge=0,
    )
    registrado_por: str | None = None
    campos_faltantes: list[str] = Field(
        default_factory=list,
    )
    advertencias: list[str] = Field(
        default_factory=list,
    )


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


class DebtEffect(BaseModel):
    cliente: str
    saldo_anterior: float
    monto_agregado: float
    saldo_actual: float


class DebtResponse(BaseModel):
    id: int
    cliente: str
    monto_original: float
    saldo_pendiente: float
    estado: str

class DebtPaymentRequest(BaseModel):
    monto: float = Field(gt=0)
    metodo_pago: PaymentMethod
    registrado_por: str | None = None


class DebtPaymentResponse(BaseModel):
    mensaje: str
    deuda_id: int
    cliente: str
    saldo_anterior: float
    monto_pagado: float
    saldo_actual: float
    estado: str
    caja: CashEffect


class ExpenseRequest(BaseModel):
    monto: float = Field(gt=0)
    categoria: str = Field(min_length=1)
    metodo_pago: PaymentMethod
    descripcion: str | None = None
    registrado_por: str | None = None


class ExpenseResponse(BaseModel):
    mensaje: str
    categoria: str
    descripcion: str | None = None
    monto: float
    metodo_pago: str
    saldo_anterior: float
    saldo_actual: float

class MerchandisePurchaseProduct(BaseModel):
    id: int
    cantidad: float = Field(gt=0)


class MerchandisePurchaseRequest(BaseModel):
    productos: list[MerchandisePurchaseProduct] = Field(
        min_length=1,
    )
    monto_total: float = Field(gt=0)
    metodo_pago: PaymentMethod
    proveedor: str | None = None
    descripcion: str | None = None
    registrado_por: str | None = None


class InventoryIncreaseEffect(BaseModel):
    producto: str
    stock_anterior: float
    cantidad_agregada: float
    stock_actual: float
    stock_minimo: float
    estado: Literal[
        "disponible",
        "stock_bajo",
        "agotado",
    ]


class MerchandisePurchaseResponse(BaseModel):
    mensaje: str
    inventario: list[InventoryIncreaseEffect]
    metodo_pago: str
    monto_pagado: float
    saldo_anterior: float
    saldo_actual: float

class OperationResponse(BaseModel):
    id: int
    tipo_operacion: str
    monto: float
    metodo_pago: str | None = None
    cliente: str | None = None
    categoria: str | None = None
    descripcion: str | None = None
    registrado_por: str | None = None
    fecha: str


class ConfirmOperationResponse(BaseModel):
    mensaje: str
    inventario: list[InventoryEffect]
    caja: CashEffect | None = None
    deuda: DebtEffect | None = None
    alertas: list[str]


# -----------------------------
# Funciones auxiliares
# -----------------------------

def obtener_estado_stock(
    producto: models.Product,
) -> str:
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
            models.CashMovement.payment_method
            == metodo_pago
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


def obtener_saldo_deuda(
    db: Session,
    cliente: str,
) -> float:
    deudas = (
        db.query(models.Debt)
        .filter(
            models.Debt.customer_name == cliente,
            models.Debt.pending_balance > 0,
        )
        .all()
    )

    return sum(
        deuda.pending_balance
        for deuda in deudas
    )


# -----------------------------
# Rutas generales
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


# -----------------------------
# Interpretación simulada
# -----------------------------

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


# -----------------------------
# Inventario
# -----------------------------

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


# -----------------------------
# Confirmación de operaciones
# -----------------------------

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
            detail=(
                "Por ahora solo se pueden "
                "confirmar ventas."
            ),
        )

    if not operacion.productos:
        raise HTTPException(
            status_code=422,
            detail=(
                "La venta debe incluir al menos "
                "un producto."
            ),
        )

    es_venta_fiada = (
        operacion.tipo_operacion == "venta_fiada"
        or operacion.metodo_pago == "fiado"
        or operacion.monto_fiado > 0
    )

    if es_venta_fiada and not operacion.cliente:
        raise HTTPException(
            status_code=422,
            detail=(
                "Una venta fiada debe incluir "
                "el nombre del cliente."
            ),
        )

    if (
        es_venta_fiada
        and operacion.monto_fiado <= 0
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Una venta fiada debe tener "
                "un monto fiado mayor que cero."
            ),
        )

    efectos_inventario: list[InventoryEffect] = []
    alertas: list[str] = []
    efecto_caja: CashEffect | None = None
    efecto_deuda: DebtEffect | None = None

    try:
        # Actualizar inventario
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
                        f"Stock bajo de "
                        f"{producto.name}: quedan "
                        f"{producto.current_stock} "
                        "unidades."
                    )
                )

            if estado == "agotado":
                alertas.append(
                    f"{producto.name} se ha agotado."
                )

        # Registrar ingreso en caja
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

        # Registrar deuda
        if operacion.monto_fiado > 0:
            if not operacion.cliente:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "La operación fiada necesita "
                        "un cliente."
                    ),
                )

            saldo_anterior_deuda = obtener_saldo_deuda(
                db,
                operacion.cliente,
            )

            nueva_deuda = models.Debt(
                customer_name=operacion.cliente,
                original_amount=operacion.monto_fiado,
                pending_balance=operacion.monto_fiado,
                status="pendiente",
            )

            db.add(nueva_deuda)

            efecto_deuda = DebtEffect(
                cliente=operacion.cliente,
                saldo_anterior=saldo_anterior_deuda,
                monto_agregado=operacion.monto_fiado,
                saldo_actual=(
                    saldo_anterior_deuda
                    + operacion.monto_fiado
                ),
            )

                # Guardar la operación en el historial.
        descripcion_productos = ", ".join(
            (
                f"{item.cantidad:g} "
                f"{item.nombre}"
            )
            for item in operacion.productos
        )

        historial = models.Operation(
            operation_type=operacion.tipo_operacion,
            amount=operacion.monto_total or 0,
            payment_method=operacion.metodo_pago,
            customer_name=operacion.cliente,
            category=None,
            description=(
                f"Venta de {descripcion_productos}"
            ),
            registered_by=operacion.registrado_por,
        )

        db.add(historial)

        # Guardar inventario, caja y deuda juntos
        db.commit()

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo confirmar "
                "la operación."
            ),
        ) from error

    return ConfirmOperationResponse(
        mensaje="Venta registrada correctamente",
        inventario=efectos_inventario,
        caja=efecto_caja,
        deuda=efecto_deuda,
        alertas=alertas,
    )


# -----------------------------
# Consulta de caja
# -----------------------------

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


# -----------------------------
# Consulta de deudas
# -----------------------------

@app.get(
    "/api/deudas",
    response_model=list[DebtResponse],
)
def obtener_deudas(
    db: Session = Depends(get_db),
):
    deudas = (
        db.query(models.Debt)
        .filter(models.Debt.pending_balance > 0)
        .order_by(
            models.Debt.customer_name,
            models.Debt.created_at,
        )
        .all()
    )

    return [
        DebtResponse(
            id=deuda.id,
            cliente=deuda.customer_name,
            monto_original=deuda.original_amount,
            saldo_pendiente=deuda.pending_balance,
            estado=deuda.status,
        )
        for deuda in deudas
    ]


@app.post(
    "/api/deudas/{deuda_id}/pagar",
    response_model=DebtPaymentResponse,
)
def pagar_deuda(
    deuda_id: int,
    pago: DebtPaymentRequest,
    db: Session = Depends(get_db),
):
    deuda = db.get(models.Debt, deuda_id)

    if deuda is None:
        raise HTTPException(
            status_code=404,
            detail=f"No existe la deuda con ID {deuda_id}.",
        )

    if deuda.pending_balance <= 0:
        raise HTTPException(
            status_code=400,
            detail="La deuda ya está pagada.",
        )

    if pago.metodo_pago in {
        "fiado",
        "mixto",
    }:
        raise HTTPException(
            status_code=422,
            detail=(
                "El pago de una deuda debe realizarse "
                "con efectivo, Yape, Plin, tarjeta "
                "o transferencia."
            ),
        )

    if pago.monto > deuda.pending_balance:
        raise HTTPException(
            status_code=422,
            detail=(
                f"El pago no puede superar el saldo pendiente. "
                f"Saldo disponible: S/ {deuda.pending_balance:.2f}."
            ),
        )

    saldo_anterior_deuda = deuda.pending_balance
    saldo_anterior_caja = obtener_saldo_caja(
        db,
        pago.metodo_pago,
    )

    try:
        # Reducir el saldo pendiente de la deuda.
        deuda.pending_balance -= pago.monto

        if deuda.pending_balance <= 0:
            deuda.pending_balance = 0
            deuda.status = "pagada"
        else:
            deuda.status = "pendiente"

        # Registrar el dinero recibido en caja.
        movimiento = models.CashMovement(
            movement_type="ingreso",
            payment_method=pago.metodo_pago,
            amount=pago.monto,
            description=(
                f"Pago de deuda de {deuda.customer_name} "
                f"registrado por "
                f"{pago.registrado_por or 'usuario'}"
            ),
        )

        db.add(movimiento)

        # Guardar el pago de deuda en el historial.
        historial = models.Operation(
            operation_type="pago_deuda",
            amount=pago.monto,
            payment_method=pago.metodo_pago,
            customer_name=deuda.customer_name,
            category=None,
            description=(
                f"Pago de deuda de {deuda.customer_name}"
            ),
            registered_by=pago.registrado_por,
        )

        db.add(historial)

        db.commit()
        db.refresh(deuda)

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar el pago de la deuda.",
        ) from error

    efecto_caja = CashEffect(
        metodo=pago.metodo_pago,
        saldo_anterior=saldo_anterior_caja,
        monto_agregado=pago.monto,
        saldo_actual=(
            saldo_anterior_caja
            + pago.monto
        ),
    )

    return DebtPaymentResponse(
        mensaje="Pago registrado correctamente",
        deuda_id=deuda.id,
        cliente=deuda.customer_name,
        saldo_anterior=saldo_anterior_deuda,
        monto_pagado=pago.monto,
        saldo_actual=deuda.pending_balance,
        estado=deuda.status,
        caja=efecto_caja,
    )


@app.post(
    "/api/gastos",
    response_model=ExpenseResponse,
)
def registrar_gasto(
    gasto: ExpenseRequest,
    db: Session = Depends(get_db),
):
    if gasto.metodo_pago in {
        "fiado",
        "mixto",
    }:
        raise HTTPException(
            status_code=422,
            detail=(
                "El gasto debe pagarse con efectivo, "
                "Yape, Plin, tarjeta o transferencia."
            ),
        )

    saldo_anterior = obtener_saldo_caja(
        db,
        gasto.metodo_pago,
    )

    if gasto.monto > saldo_anterior:
        raise HTTPException(
            status_code=422,
            detail=(
                f"No hay saldo suficiente en "
                f"{gasto.metodo_pago}. "
                f"Saldo disponible: S/ {saldo_anterior:.2f}."
            ),
        )

    try:
        movimiento = models.CashMovement(
            movement_type="egreso",
            payment_method=gasto.metodo_pago,
            amount=gasto.monto,
            description=(
                gasto.descripcion
                or (
                    f"Gasto de categoría "
                    f"{gasto.categoria}"
                )
            ),
        )

        db.add(movimiento)

        historial = models.Operation(
            operation_type="gasto",
            amount=gasto.monto,
            payment_method=gasto.metodo_pago,
            customer_name=None,
            category=gasto.categoria,
            description=(
                gasto.descripcion
                or f"Gasto de categoría {gasto.categoria}"
            ),
            registered_by=gasto.registrado_por,
        )

        db.add(historial)
        db.commit()
    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar el gasto.",
        ) from error

    saldo_actual = saldo_anterior - gasto.monto

    return ExpenseResponse(
        mensaje="Gasto registrado correctamente",
        categoria=gasto.categoria,
        descripcion=gasto.descripcion,
        monto=gasto.monto,
        metodo_pago=gasto.metodo_pago,
        saldo_anterior=saldo_anterior,
        saldo_actual=saldo_actual,
    )


@app.post(
    "/api/compras-mercaderia",
    response_model=MerchandisePurchaseResponse,
)
def registrar_compra_mercaderia(
    compra: MerchandisePurchaseRequest,
    db: Session = Depends(get_db),
):
    if compra.metodo_pago in {
        "fiado",
        "mixto",
    }:
        raise HTTPException(
            status_code=422,
            detail=(
                "La compra debe pagarse con efectivo, "
                "Yape, Plin, tarjeta o transferencia."
            ),
        )

    saldo_anterior = obtener_saldo_caja(
        db,
        compra.metodo_pago,
    )

    if compra.monto_total > saldo_anterior:
        raise HTTPException(
            status_code=422,
            detail=(
                f"No hay saldo suficiente en "
                f"{compra.metodo_pago}. "
                f"Saldo disponible: S/ {saldo_anterior:.2f}."
            ),
        )

    efectos_inventario: list[InventoryIncreaseEffect] = []

    try:
        for item in compra.productos:
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
            producto.current_stock += item.cantidad

            estado = obtener_estado_stock(producto)

            efectos_inventario.append(
                InventoryIncreaseEffect(
                    producto=producto.name,
                    stock_anterior=stock_anterior,
                    cantidad_agregada=item.cantidad,
                    stock_actual=producto.current_stock,
                    stock_minimo=producto.minimum_stock,
                    estado=estado,
                )
            )

        movimiento = models.CashMovement(
            movement_type="egreso",
            payment_method=compra.metodo_pago,
            amount=compra.monto_total,
            description=(
                compra.descripcion
                or (
                    "Compra de mercadería"
                    + (
                        f" a {compra.proveedor}"
                        if compra.proveedor
                        else ""
                    )
                )
            ),
        )

        db.add(movimiento)

        # Guardar la compra de mercadería en el historial.
        descripcion_productos = ", ".join(
            (
                f"{item.cantidad:g} unidades "
                f"del producto con ID {item.id}"
            )
            for item in compra.productos
        )

        historial = models.Operation(
            operation_type="compra_mercaderia",
            amount=compra.monto_total,
            payment_method=compra.metodo_pago,
            customer_name=None,
            category="mercadería",
            description=(
                compra.descripcion
                or f"Compra de {descripcion_productos}"
            ),
            registered_by=compra.registrado_por,
        )

        db.add(historial)
        db.commit()

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo registrar "
                "la compra de mercadería."
            ),
        ) from error

    saldo_actual = (
        saldo_anterior
        - compra.monto_total
    )

    return MerchandisePurchaseResponse(
        mensaje=(
            "Compra de mercadería "
            "registrada correctamente"
        ),
        inventario=efectos_inventario,
        metodo_pago=compra.metodo_pago,
        monto_pagado=compra.monto_total,
        saldo_anterior=saldo_anterior,
        saldo_actual=saldo_actual,
    )


@app.get(
    "/api/operaciones",
    response_model=list[OperationResponse],
)
def obtener_operaciones(
    db: Session = Depends(get_db),
):
    operaciones = (
        db.query(models.Operation)
        .order_by(models.Operation.created_at.desc())
        .all()
    )

    return [
        OperationResponse(
            id=operacion.id,
            tipo_operacion=operacion.operation_type,
            monto=operacion.amount,
            metodo_pago=operacion.payment_method,
            cliente=operacion.customer_name,
            categoria=operacion.category,
            descripcion=operacion.description,
            registrado_por=operacion.registered_by,
            fecha=operacion.created_at.isoformat(),
        )
        for operacion in operaciones
    ]