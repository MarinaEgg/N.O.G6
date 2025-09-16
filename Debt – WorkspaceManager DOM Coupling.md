Technical Debt Note – WorkspaceManager DOM Coupling
Context

The current implementation of WorkspaceManager combines business logic (managing cards, offsets, zoom, persistence) with UI rendering and DOM manipulation (querySelector, appendChild, style.transform, drag & drop handling).

While this works for the current scope, it introduces a strong coupling to the DOM and the specific runtime environment (browser + global classes such as TextCard/FileCard).

Why this is Technical Debt

Limited reusability
Business logic cannot be reused in other environments (React, Vue, Node.js, server-side rendering, mobile).

Poor testability
Unit testing requires simulating or mocking a DOM, instead of testing pure state transitions.

Reduced maintainability
Any UI change (DOM structure, CSS, framework migration) forces a rewrite of both logic and rendering.

Hidden dependencies
Classes like TextCard/FileCard are expected in the global scope, creating implicit coupling.

Blocked evolution
If the application must support other render targets (Canvas, PDF export, headless API), the current architecture cannot adapt.

Proposed Change

Introduce a separation of concerns between state management and rendering:

Core Layer – WorkspaceStore

Pure JavaScript class managing state (cards, zoom, offsets, persistence).

Exposes methods like addCard(), removeCard(), moveCard(), setZoom().

Emits events or provides a subscription mechanism (subscribe()).

Contains no DOM code.

Renderer Layer – Renderer Implementations

DomRenderer: manipulates the DOM based on store updates.

Future extensions: ReactRenderer, CanvasRenderer, PdfRenderer.

Orchestrator Layer – WorkspaceManager

Bridges the store and the renderer.

Subscribes to store changes and calls the appropriate renderer.

Benefits of Refactoring

Testability: Core logic can be tested with unit tests without a DOM.

Reusability: Same business logic can serve multiple renderers (DOM, React, server).

Maintainability: Bugs in UI code do not affect business logic.

Extensibility: Easy to add new renderers (e.g., export to PDF).

Future-proofing: Easier migration to modern frameworks.

Migration Path

Extract WorkspaceStore from WorkspaceManager (state only, no DOM).

Create a first DomRenderer class that updates the DOM based on store changes.

Refactor WorkspaceManager into an orchestrator that wires the store with the renderer.

Write unit tests for WorkspaceStore.

(Optional) Add a second renderer (e.g., React) to validate architecture flexibility.

When to Prioritize This Refactor

High priority if:

The project will evolve into a product (e.g., SaaS, client deployments).

Automated testing is required.

Future integration with frameworks (React, Vue, etc.) is expected.

Low priority if:

The project remains a short-term prototype (POC).

No testing or external integration is planned.
