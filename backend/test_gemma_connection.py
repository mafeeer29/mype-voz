import json


from services.gemma_service import (
    clasificar_consulta_con_gemma,
    interpretar_con_gemma,
    probar_conexion,
)



def main() -> None:
    try:
        modelos = probar_conexion()

        print("Modelos disponibles en Gemma/LM Studio:")
        print(modelos)
        print("\nConexión a Gemma/LM Studio exitosa.")

        print("\nEnviando frase a Gemma...")

        operacion = interpretar_con_gemma(
            texto=(
                "Vendí tres gaseosas a cuatro soles "
                "y me pagaron por Yape"
            ),
            registrado_por="Mafer",
        )

        print("\nOperación interpretada:")
        print(
            json.dumps(
                operacion,
                indent=2,
                ensure_ascii=False,
            )
        )

    except Exception as error:
        print(f"\nError durante la prueba: {error}")
        raise


print("\nPrueba de clasificación de consultas:")

consultas = [
    "Hola",
    "Hola, vendí 3 gaseosas a 4 soles cada una",
    "Buenas, gasté 20 soles en transporte",
    "¿Cuánto vendimos hoy?",
    "Vendí dos aguas",
    "¿Cuánto gastamos?",
    "Rosa llevó 20 soles fiados",
    "¿Cuánto debe Rosa?",
    "¿Cómo nos fue hoy?",
    "¿Cuánto debería haber en efectivo?",
    "¿Qué productos tienen poco stock?",
    "¿Qué productos ya se acabaron?",
    "¿Cuántas gaseosas quedan?",
    "Cuéntame un chiste",
]

for consulta in consultas:
    resultado = clasificar_consulta_con_gemma(
        consulta,
    )

    print(f"{consulta} -> {resultado}")

if __name__ == "__main__":
    main()