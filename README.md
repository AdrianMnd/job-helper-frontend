# Job Assistant - Frontend

React + TypeScript + Vite. Tablero Kanban de candidaturas + generacion de
CV/carta con Gemini a traves del backend.

## Setup

```bash
npm install
npm run dev
```

## Integrar shadcn/ui

El proyecto ya tiene Tailwind, el alias `@/` y `src/lib/utils.ts` (helper `cn`)
preparados, que es lo que la CLI de shadcn espera encontrar. Para inicializarlo:

```bash
npx shadcn@latest init
```

Te va a preguntar por el estilo base y el color; cualquiera vale para este
proyecto. Luego, para anadir un componente concreto:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
```

Cada comando copia el codigo fuente del componente a `src/components/ui/`.
A partir de ahi es codigo tuyo: se puede leer, modificar y versionar como
cualquier otro archivo del repo (no es una dependencia de npm oculta).

## Que es custom y que es shadcn/ui en este proyecto

| Custom (`src/components`, `src/pages`) | shadcn/ui (`src/components/ui`, tras `add`) |
|---|---|
| Tablero Kanban y columnas | Dialog (confirmar generacion de CV/carta) |
| ApplicationCard | Dropdown (selector de estado) |
| Formulario de perfil | Toast (notificaciones) |
| Comparador de versiones de documentos | Tabs (separar CV / carta) |

## Estructura

```
src/
  pages/          Vistas: KanbanBoard, ApplicationDetail, Profile
  components/     Componentes propios del dominio
  components/ui/  (se rellena con `npx shadcn add ...`)
  lib/utils.ts     Helper cn() que usan los componentes de shadcn
```
