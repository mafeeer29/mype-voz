# MYPE Voz — Frontend

Aplicación web móvil para pequeños negocios familiares del Perú. Permite registrar y comprender las operaciones del negocio usando voz o texto en lenguaje cotidiano.

## Tecnologías usadas

- **React 19** + **TypeScript**
- **Vite** como bundler y servidor de desarrollo
- **React Router** para navegación entre pantallas
- **Tailwind CSS v4** para estilos
- **Lucide React** para iconos
- Diseño **mobile-first**, accesible y en español

## Cómo instalar

```bash
cd frontend
npm install
```

## Cómo ejecutar

```bash
npm run dev
```

La aplicación se abre en `http://localhost:5173`.

Otros comandos:

- `npm run build` — genera el build de producción en `dist/`
- `npm run lint` — ejecuta Oxlint

## Estructura principal

```
src/
├── components/
│   ├── layout/        # AppHeader, BottomNavigation, PageContainer
│   ├── common/        # Button, Modal, LoadingState, EmptyState, StatusBadge, CurrencyAmount
│   ├── dashboard/     # MetricCard, DailySummaryCard
│   ├── operations/    # OperationForm, OperationConfirmation, OperationEditForm, OperationSuccess
│   ├── inventory/     # ProductCard, StockAlert
│   └── debts/         # DebtCard, PaymentModal
├── pages/             # HomePage, RegisterPage, InventoryPage, DebtsPage, AssistantPage
├── config/            # appConfig.ts (nombre, eslogan, negocio)
├── data/              # mockData.ts (datos simulados)
├── services/          # api.ts (funciones para el backend futuro)
├── types/             # operation, inventory, debt, summary
├── utils/             # currency.ts (formato de soles)
├── context/           # AppContext.tsx (estado en memoria)
├── App.tsx            # Rutas
└── main.tsx           # Entry point
```

## Qué partes usan mocks

Todo el frontend funciona con **datos simulados** en memoria:

- Resumen del día, productos, deudas y operación interpretada provienen de `src/data/mockData.ts`.
- El estado compartido (persona activa, inventario, deudas, resumen, historial) vive en `src/context/AppContext.tsx` y se actualiza en memoria al confirmar operaciones o registrar pagos.
- El botón de micrófono es **visual**: no realiza reconocimiento de voz real.
- La interpretación de frases simula una respuesta después de un breve estado de carga.

## Dónde se conectará el backend

`src/services/api.ts` contiene las funciones tipadas que en el futuro llamarán a la API de **FastAPI**:

- `interpretOperation(text, registeredBy)` → `POST /api/operations/interpret`
- `confirmOperation(operation)` → `POST /api/operations/confirm`
- `checkBackendHealth()` → `GET /api/health`

Actualmente estas funciones lanzan un error intencional (`"Backend todavía no conectado"`) para indicar que deben usarse los datos simulados. Cuando el backend esté listo, se reemplazará el contenido de estas funciones por llamadas `fetch` reales y se sustituirán los datos de `mockData.ts` por las respuestas de la API.

## Flujo principal

1. **Inicio** — saludo, resumen del día y botón "Registrar operación".
2. **Registrar** — escribe o dicta una frase, pulsa "Interpretar".
3. **Confirmar** — revisa los datos interpretados; puedes editar o cancelar.
4. **Éxito** — se muestran los efectos simulados en caja e inventario, y alertas de stock.
5. **Inventario, Deudas y Asistente** — navegables y funcionales con datos locales.
