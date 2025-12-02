# Project View Screen with Multi-Stage Workflow

## Overview
This feature implements a comprehensive project management workflow with 6 distinct stages that guide projects from initial client contact through to completion.

## Stages

### Stage 0: New Client
- **Task**: Introduction
- **Progression**: Moves to Stage 1 when introduction is marked as complete

### Stage 1: Document Preparation
- **Task**: Document Checklist
- **Description**: Users mark each document as collected one by one
- **Progression**: Moves to Stage 2 when all documents are marked as collected

### Stage 2: Submission Review
- **Tasks**:
  1. Reviewed by Supervisor
  2. Ready to Submit
- **Progression**: Moves to Stage 3 when both tasks are completed

### Stage 3: Submission
- **Statuses**:
  1. On Hold
  2. Compiling
  3. Submitted to DTI
- **Progression**: Moves to Stage 4 when status is "Submitted to DTI"

### Stage 4: Tracking
- **Required Information**:
  1. Type of Submission (Mobile or VFS)
  2. Submission Center
  3. Date of Submission
  4. Visa Ref
  5. VFS Receipt
  6. Receipt Number
- **Progression**: Moves to Stage 5 when all tracking information is captured

### Stage 5: Completion
- **Description**: Final stage showing project completion and summary of submission details

## Implementation Details

### New Files Created
1. `/src/pages/ProjectDetails.tsx` - Main project detail page with multi-stage workflow
2. `/src/pages/ProjectsPage.tsx` - Projects list page with navigation to details
3. `/src/pages/LeadsPage.tsx` - Leads management page
4. `/src/pages/UsersPage.tsx` - Users management page
5. `/src/layouts/DashboardLayout.tsx` - Dashboard layout with sidebar
6. `/src/routes/ProtectedRoute.tsx` - Protected route wrapper
7. `/database/migrations/001_create_project_stages.sql` - Database schema for project stages

### Modified Files
1. `/src/App.tsx` - Updated routing structure to support dashboard and project details

### Database Schema
A new table `project_stages` has been created to track:
- Current stage number (0-5)
- Introduction completion status
- Supervisor review status
- Submission readiness status
- Submission status (on_hold, compiling, submitted)
- Tracking information (stored as JSONB)

### Routing Structure
```
/dashboard
  /projects - List of all projects
  /projects/:id - Detailed view of specific project with stages
  /leads - Leads management
  /users - Users management
```

## Usage

1. **Navigate to Projects**: From the dashboard, click on "Projects"
2. **Select a Project**: Click on any project card to view its details
3. **Progress Through Stages**: 
   - Complete tasks in each stage to progress
   - Stages unlock sequentially
   - Previous stages can be viewed but current/future stages are accessible based on progression
4. **Track Completion**: Visual progress indicator shows current stage and completion status

## Features

- ✅ Visual stage progress indicator
- ✅ Tab-based navigation between stages
- ✅ Automatic progression when stage requirements are met
- ✅ Document checklist integration
- ✅ Submission status tracking
- ✅ Comprehensive tracking information capture
- ✅ Completion summary view
- ✅ Real-time data persistence to database

## Technical Stack
- React with TypeScript
- React Router for navigation
- Shadcn UI components (Tabs, Cards, Checkbox, Input, Select)
- Supabase for backend/database
- Sonner for toast notifications

## Database Migration
To set up the required database table, run the SQL migration file:
```sql
database/migrations/001_create_project_stages.sql
```

This will create the `project_stages` table with all necessary fields and indexes.
