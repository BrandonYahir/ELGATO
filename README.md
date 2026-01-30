# Gato (React + TypeScript + Vite)

## Requisitos
- Node.js 18+ (recomendado)
- npm 9+

## Instalar dependencias
```bash
npm install
```

## Ejecutar el proyecto (modo desarrollo)
```bash
npm run dev
```
Luego abre `http://127.0.0.1:5173`.

## Backend
Este frontend consume el backend Express en `http://localhost:3001`.

Configura la variable de entorno:
```bash
VITE_API_URL=http://localhost:3001
```

En desarrollo puedes omitir la variable y usar el proxy de Vite con rutas `/api`.

## Build y previsualizacion
```bash
npm run build
npm run preview
```

## Tests
### Unitarios (Vitest)
Modo watch:
```bash
npm test
```

Ejecucion unica:
```bash
npm run test:run
```

### E2E (Playwright)
Instalar navegadores la primera vez:
```bash
npm exec playwright install
```

Ejecutar tests E2E:
```bash
npm exec playwright test
```
