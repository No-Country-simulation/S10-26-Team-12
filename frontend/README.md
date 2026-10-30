# Frontend — RepuSense

Interfaz construida con **React 19 + Vite**. Por ahora es un scaffold mínimo que
verifica el estado del backend y de PostgreSQL mediante `/api/health`.

## Estructura

```
src/
├── main.jsx      # Punto de entrada de React
├── App.jsx       # Pantalla de estado del scaffold
├── App.css       # Estilos de la pantalla
└── index.css     # Reset y estilos globales
```

## Scripts

Docker Compose es el único flujo soportado. Los scripts se ejecutan dentro del
contenedor `frontend`:

```bash
docker compose exec frontend npm run dev      # ya corre al levantar el entorno
docker compose exec frontend npm run build    # Build de producción en dist/
docker compose exec frontend npm run lint     # ESLint
docker compose exec frontend npm run preview  # Previsualizar el build
```

El servidor de desarrollo queda disponible en http://localhost:5173 al ejecutar
`docker compose up --build` desde la raíz del repositorio.

## Variable de entorno

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | URL base del backend |

Vite expone las variables con prefijo `VITE_` en tiempo de build/dev. En Docker
Compose se define en `docker-compose.yml` / `.env` y llega al navegador a través del
contenedor.

## Estado

- Pantalla de estado del sistema: lista.
- Consumo de `/api/health`: listo.
- Dashboard de prospectos, filtros y exportación: pendiente de implementar.
