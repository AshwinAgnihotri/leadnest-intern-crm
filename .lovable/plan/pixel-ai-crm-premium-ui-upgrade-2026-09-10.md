# Pixel AI CRM Premium UI Upgrade

## Goal
Upgrade the existing CRM into a cohesive, responsive glass-noir productivity workspace while preserving every current route, permission, query, mutation, and account workflow.

## What will change
- Establish the selected sophisticated glass-noir design system: charcoal surfaces, restrained teal accents, crisp typography, subtle glass depth, semantic status colors, and consistent spacing.
- Modernize the shared sidebar, top bar, navigation states, buttons, inputs, cards, tables, dialogs, dropdowns, badges, skeletons, empty states, notifications, and toast presentation.
- Add lightweight 150–220ms page, card, row, control, and panel transitions with reduced-motion support.
- Upgrade the dashboard with a dynamic greeting, clearer KPI hierarchy, real-data progress visuals, recent activity, and existing quick actions.
- Improve leads, filters, sorting, follow-ups, lead forms, lead details, notes, activity, intern views, Admin Panel, and User Management using their existing data and actions.
- Improve desktop, tablet, and mobile layouts while retaining dense desktop workflows.

## Safety boundaries
- No database, authentication, RLS, role, permission, route, or server-function changes.
- Existing Intern/Admin sign-in behavior and wrong-tab protection remain unchanged.
- Existing CRUD, filtering, sorting, follow-up, notes, notifications, activity, account management, and work-time logic remain unchanged.
- No fake trends, activities, notifications, or statistics.

## Technical approach
- Extend semantic tokens and reusable motion/empty-state styles in the global stylesheet.
- Refine existing shared UI primitives so improvements propagate consistently.
- Restyle route presentation in place and add only small visual helper components where repetition warrants it.
- Resolve the reported authentication-page hydration warning without changing its behavior.
- Validate key authenticated and public screens with browser checks at desktop and mobile sizes, plus targeted interaction checks for existing controls.
