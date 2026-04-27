# Leancore Construction Quality Dashboard

## Overview
Leancore is a responsive, interactive web-based dashboard designed to manage and track Lean/Six Sigma construction quality projects. It utilizes a modern "Bento Grid" design aesthetic—characterized by clean lines, high-contrast borders, and structured, card-based layouts. 

## Purpose
The primary purpose of this application is to provide project managers and quality control (QC) teams with an at-a-glance view of their active project. It visually organizes the standard Lean/Six Sigma DMAIC methodology (Define, Measure, Analyze, Improve, Control) while keeping execution tasks, live performance metrics, and vital project artifacts accessible on a single page.

## Key Features
*   **Interactive DMAIC Timeline:** Visually tracks the life cycle of the project through the five core Lean/Six Sigma phases. You can navigate between phases to see their contexts.
*   **Phase Execution Checklist:** A functional task list specific to the active phase. Users can mark tasks as done (which visually strikes them out) to track daily/weekly progress.
*   **Live KPI Pulse:** A real-time data visualization card showing critical metrics such as Defect Rate, Cycle Time, Material Waste, and Compliance, complete with micro-indicators for targets.
*   **Artifact Vault:** A centralized, simulated repository for essential project files like SIPOC diagrams, inspection logs, and signed charters.
*   **Responsive Bento Layout:** The UI shifts intelligently from a vertical stack on mobile devices to a beautifully proportioned 12-column grid on larger screens.

## How to Use
1.  **Navigate Phases:** Click on the phase buttons (DEFINE, MEASURE, ANALYZE, IMPROVE, CONTROL) in the top timeline to switch the current active context.
2.  **Manage Tasks:** In the "Phase Execution" card, click the checkboxes next to any task to toggle its completion status. 
3.  **Advance the Project:** Once all tasks in a phase are complete, click the "Complete Phase & Advance" button at the bottom of the execution card. This will automatically progress the timeline to the exact next phase until the project is marked complete.
4.  **Review Stats:** Monitor the "Live KPI Pulse" card to keep an eye on active construction metrics.

## Tech Stack
*   **Framework:** React 19 / Vite
*   **Styling:** Tailwind CSS v4 (utilizing utility classes for layout, typography, and interactive states)
*   **Icons:** Lucide React
*   **Typography:** Inter (imported via Google Fonts for a crisp, legible sans-serif aesthetic)
