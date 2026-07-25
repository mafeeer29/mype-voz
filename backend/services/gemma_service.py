import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError


BACKEND_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)

LM_STUDIO_BASE_URL = os.getenv("LM_STUDIO_BASE_URL")
LM_STUDIO_MODEL = os.getenv("LM_STUDIO_MODEL")

if not LM_STUDIO_BASE_URL:
    raise EnvironmentError(
        f"LM_STUDIO_BASE_URL no está definida. Se buscó en: {ENV_PATH}"
    )

if not LM_STUDIO_MODEL:
    raise EnvironmentError(
        f"LM_STUDIO_MODEL no está definida. Se buscó en: {ENV_PATH}"
    )
client = OpenAI(
    base_url=LM_STUDIO_BASE_URL,
    api_key="lm-studio",
)

SYSTEM_PROMPT = """
Eres el componente de interpretación de MYPE Voz, una aplicación para
pequeños comercios del Perú.

Tu única tarea es convertir una frase cotidiana en una operación estructurada.

Tipos permitidos:
- venta
- gasto
- venta_fiada
- compra_mercaderia
- pago_deuda

Métodos de pago permitidos:
- efectivo
- yape
- plin
- tarjeta
- transferencia
- fiado
- mixto

Devuelve exclusivamente un objeto JSON válido.
No incluyas explicaciones, markdown ni bloques de código.

Estructura obligatoria:

{
  "tipo_operacion": "venta",
  "productos": [
    {
      "id": null,
      "nombre": "gaseosa",
      "cantidad": 3,
      "precio_unitario": 4,
      "subtotal": 12
    }
  ],
  "monto_total": 12,
  "metodo_pago": "yape",
  "cliente": null,
  "categoria_gasto": null,
  "monto_pagado": 12,
  "monto_fiado": 0,
  "registrado_por": null,
  "campos_faltantes": [],
  "advertencias": []
}

Reglas:
- No inventes información ausente.
- Cuando falte un valor, usa null y agrega su nombre a campos_faltantes.
- Calcula subtotal solo cuando existan cantidad y precio_unitario.
- monto_total debe ser la suma de subtotales cuando sea posible.
- Si es venta fiada, metodo_pago debe ser "fiado".
- Si una parte fue pagada y otra quedó fiada, usa metodo_pago "mixto".
- Conserva nombres de personas y productos.
- Los importes son números, sin símbolos monetarios.
"""


def extraer_json(texto: str) -> dict[str, Any]:
    contenido = texto.strip()

    if contenido.startswith("```"):
        contenido = contenido.replace("```json", "")
        contenido = contenido.replace("```", "")
        contenido = contenido.strip()

    inicio = contenido.find("{")
    fin = contenido.rfind("}")

    if inicio == -1 or fin == -1:
        raise ValueError("Gemma no devolvió un objeto JSON válido en la respuesta.")

    json_texto = contenido[inicio : fin + 1].strip()

    if not json_texto:
        raise ValueError("Gemma devolvió una respuesta vacía después de extraer JSON.")

    try:
        return json.loads(json_texto)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"No se pudo parsear JSON de la respuesta de Gemma: {exc.msg}"
        ) from exc


def probar_conexion() -> dict[str, Any]:
    try:
        return client.models.list()
    except OpenAIError as exc:
        raise RuntimeError(
            "Error al consultar los modelos de Gemma en LM Studio."
        ) from exc


def interpretar_con_gemma(
    texto: str,
    registrado_por: str | None = None,
) -> dict[str, Any]:
    if not texto.strip():
        raise ValueError("El texto para interpretar no puede estar vacío.")

    try:
        respuesta = client.chat.completions.create(
            model=LM_STUDIO_MODEL,
            temperature=0.1,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": (
                        f"Texto del comerciante: {texto}\n"
                        f"Persona que registra: {registrado_por or 'no indicada'}"
                    ),
                },
            ],
        )
    except OpenAIError as exc:
        raise RuntimeError(
            "Error en la comunicación con Gemma a través de LM Studio."
        ) from exc

    contenido = getattr(respuesta.choices[0].message, "content", "")

    if not contenido:
        raise ValueError("Gemma devolvió una respuesta vacía.")

    operacion = extraer_json(contenido)

    if registrado_por:
        operacion["registrado_por"] = registrado_por

    return operacion


CONSULTA_SYSTEM_PROMPT = """
Eres el clasificador de intención de MYPE Voz, una aplicación para pequeños
comercios del Perú.

Tu única tarea es clasificar el mensaje del usuario en UNA sola intención.

INTENCIONES PERMITIDAS:
- saludo
- registrar_operacion
- consultar_resumen_hoy
- consultar_ventas
- consultar_gastos
- consultar_caja
- consultar_deudas
- consultar_stock_bajo
- consultar_agotados
- consultar_inventario
- desconocida

PRIORIDAD DE CLASIFICACIÓN:

1. registrar_operacion
2. consultar_resumen_hoy
3. consultar_ventas
4. consultar_gastos
5. consultar_caja
6. consultar_deudas
7. consultar_stock_bajo
8. consultar_agotados
9. consultar_inventario
10. saludo
11. desconocida

REGLA PRINCIPAL:

Si el mensaje contiene un saludo y además describe una operación o hace una
consulta del negocio, ignora el saludo y clasifica según la operación o consulta.

Ejemplos:
- "Hola, vendí tres gaseosas" → registrar_operacion
- "Buenas, ¿cuánto vendimos hoy?" → consultar_ventas
- "Hola, ¿cómo nos fue hoy?" → consultar_resumen_hoy
- "Hola" → saludo

DEFINICIÓN DE CADA INTENCIÓN:

1. registrar_operacion

Usa esta intención cuando el usuario informa o declara que realizó una operación
del negocio y desea registrarla.

Incluye:
- ventas;
- ventas fiadas;
- gastos;
- compras de mercadería;
- pagos de deuda recibidos;
- cobros;
- ingresos o egresos que desea registrar.

Indicadores frecuentes:
- vendí
- se vendió
- gasté
- pagué
- compré
- recibí
- cobré
- fié
- llevó fiado
- me pagaron
- ingresaron
- salieron

Ejemplos:
- "Vendí tres gaseosas a cuatro soles cada una"
- "Hola, vendí tres gaseosas por Yape"
- "Rosa llevó veinte soles fiados"
- "Gasté treinta soles en transporte"
- "Compré dos cajas de agua por ochenta soles"
- "Juan pagó diez soles de su deuda"

No uses registrar_operacion cuando el usuario pregunta por operaciones pasadas.

2. consultar_resumen_hoy

Usa esta intención cuando el usuario pide un resumen, balance o evaluación
general del negocio durante el día actual.

Ejemplos:
- "¿Cómo nos fue hoy?"
- "Dame el resumen de hoy"
- "¿Qué pasó hoy en el negocio?"
- "¿Cómo estuvo el negocio hoy?"
- "Hazme un balance de hoy"

3. consultar_ventas

Usa esta intención cuando el usuario pregunta por ventas, ingresos por ventas o
cuánto se vendió.

Ejemplos:
- "¿Cuánto vendimos?"
- "¿Cuáles fueron las ventas de hoy?"
- "¿Cuánto se vendió?"
- "Dime el total de ventas"

No uses esta intención cuando el usuario declara una venta para registrarla.

4. consultar_gastos

Usa esta intención cuando el usuario pregunta por gastos, egresos o cuánto se
gastó.

Ejemplos:
- "¿Cuánto gastamos?"
- "¿Cuáles fueron los gastos?"
- "Dime los egresos de hoy"
- "¿En qué gastamos dinero?"

No uses esta intención cuando el usuario declara un gasto para registrarlo.

5. consultar_caja

Usa esta intención cuando el usuario pregunta por dinero disponible, saldo,
efectivo, Yape, Plin, tarjeta, transferencia o caja.

Ejemplos:
- "¿Cuánto hay en caja?"
- "¿Cuánto efectivo tenemos?"
- "¿Cuánto debería haber en Yape?"
- "¿Cuál es el saldo disponible?"
- "¿Cuánto dinero hay ahora?"

6. consultar_deudas

Usa esta intención cuando el usuario pregunta por clientes que deben, ventas
fiadas, cuentas por cobrar o saldos pendientes.

Ejemplos:
- "¿Quiénes nos deben?"
- "¿Cuánto tenemos por cobrar?"
- "Muéstrame los fiados"
- "¿Qué deudas están pendientes?"

7. consultar_stock_bajo

Usa esta intención cuando el usuario pregunta qué productos están por agotarse,
quedan pocos o necesitan reposición.

Ejemplos:
- "¿Qué productos tienen poco stock?"
- "¿Qué debemos reponer?"
- "¿Qué productos están por acabarse?"
- "¿De qué queda poco?"

8. consultar_agotados

Usa esta intención cuando el usuario pregunta qué productos ya no tienen stock o
se acabaron completamente.

Ejemplos:
- "¿Qué productos están agotados?"
- "¿Qué productos ya no quedan?"
- "¿Qué se acabó?"
- "¿Cuáles tienen stock cero?"

9. consultar_inventario

Usa esta intención cuando el usuario pregunta por productos, cantidades o
existencias en general y no específicamente por stock bajo o agotado.

Ejemplos:
- "¿Qué productos tenemos?"
- "Muéstrame el inventario"
- "¿Cuántas gaseosas quedan?"
- "¿Cuánto stock hay?"

10. saludo

Usa esta intención únicamente cuando el mensaje sea solo un saludo, despedida o
frase social sin una operación ni consulta del negocio.

Ejemplos:
- "Hola"
- "Buenos días"
- "Buenas tardes"
- "Gracias"
- "Adiós"

11. desconocida

Usa esta intención cuando el mensaje no esté relacionado con el negocio o no se
pueda clasificar con seguridad.

Ejemplos:
- "Cuéntame un chiste"
- "¿Cuál es la capital de Francia?"
- "No sé"
- "Ayúdame"

REGLAS PARA CASOS AMBIGUOS:

- "Vendí tres gaseosas" → registrar_operacion
- "¿Cuánto vendimos?" → consultar_ventas
- "Gasté veinte soles" → registrar_operacion
- "¿Cuánto gastamos?" → consultar_gastos
- "Rosa llevó veinte soles fiados" → registrar_operacion
- "¿Cuánto debe Rosa?" → consultar_deudas
- "Compré dos cajas de agua" → registrar_operacion
- "¿Cuántas cajas de agua quedan?" → consultar_inventario
- "¿Cómo nos fue hoy?" → consultar_resumen_hoy
- "Hola, vendí tres gaseosas" → registrar_operacion
- "Hola, ¿cuánto hay en caja?" → consultar_caja

FORMATO DE RESPUESTA:

Devuelve exclusivamente un objeto JSON válido con esta estructura exacta:

{
  "intencion": "nombre_de_la_intencion"
}

No incluyas:
- explicaciones;
- markdown;
- bloques de código;
- texto antes o después del JSON;
- intenciones fuera de la lista permitida.
"""


def clasificar_consulta_con_gemma(
    pregunta: str,
) -> dict[str, Any]:
    if not pregunta.strip():
        raise ValueError("La pregunta no puede estar vacía.")

    intenciones_permitidas = {
        "saludo",
        "registrar_operacion",
        "consultar_resumen_hoy",
        "consultar_ventas",
        "consultar_gastos",
        "consultar_caja",
        "consultar_deudas",
        "consultar_stock_bajo",
        "consultar_agotados",
        "consultar_inventario",
        "desconocida",
    }

    for intento in range(2):
        try:
            respuesta = client.chat.completions.create(
                model=LM_STUDIO_MODEL,
                temperature=0,
                max_tokens=60,
                messages=[
                    {
                        "role": "system",
                        "content": CONSULTA_SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": (
                            "Clasifica el siguiente mensaje:\n"
                            f"{pregunta}\n\n"
                            'Devuelve solo: {"intencion": "..."}'
                        ),
                    },
                ],
            )
        except OpenAIError as exc:
            if intento == 1:
                raise RuntimeError(
                    "Error al clasificar la consulta con Gemma."
                ) from exc

            continue

        contenido = getattr(
            respuesta.choices[0].message,
            "content",
            "",
        )

        if not contenido or not contenido.strip():
            continue

        try:
            resultado = extraer_json(contenido)
        except ValueError:
            continue

        intencion = resultado.get("intencion")

        if intencion in intenciones_permitidas:
            return {
                "intencion": intencion,
            }

    return {
        "intencion": "desconocida",
    }
