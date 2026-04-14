

## Plan: Generate Documentation for Notification Center and Agenda Panel

### What will be created
A single Markdown file at `/mnt/documents/NOTIFICACOES_AGENDA_DOCUMENTATION.md` covering:

1. **Architecture Overview** -- TopBar as host, NotificationCenter (Popover) and AgendaPanel (Sheet) as children
2. **TopBar Component** -- sticky bar, glassmorphism styling, state management for agenda open/close
3. **NotificationCenter** -- interface `AppNotification`, 4 notification types (approved, adjustment, evaluated, info), color/icon config, mock seed data, `formatRelativeTime` helper, unread badge counter, mark-read and mark-all-read actions, Popover + ScrollArea UI
4. **AgendaPanel** -- interface `AgendaEvent`, 3 event types (meeting, task, reminder), mock events, Sheet slide-over panel, date formatting with `date-fns` pt-BR locale, event cards with time/location/online indicators, disabled Google Calendar button (planned integration)
5. **Backend -- CSM Alerts** -- Edge Function `generate-csm-alerts` (auth check + calls `generate_csm_alerts` RPC), DB function that generates alerts for critical/low health scores from `crm_cards` into `crm_alerts` table
6. **Current State & Roadmap** -- both frontend features use mock/seed data only (no DB persistence yet), Google Calendar integration planned, notification center not yet connected to real approval events from `projects`/`evaluations` tables

### Implementation
Single `code--exec` command writing the complete `.md` file to `/mnt/documents/`.

### Files
- `/mnt/documents/NOTIFICACOES_AGENDA_DOCUMENTATION.md` (new)

