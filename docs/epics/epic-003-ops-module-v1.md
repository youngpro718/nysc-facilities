# Epic 003: Operations Module v1

**Epic ID:** EPIC-003  
**Title:** Operations Module v1 - Core Functionality  
**Status:** 📋 Planning  
**Priority:** 🔴 Critical  
**Target:** Sprint 5-6 (3 weeks)  
**Owner:** Product Team  
**Created:** October 25, 2025

---

## 📋 Executive Summary

Implement the core Operations Module (v1) with essential functionality for managing facilities operations. This epic focuses on delivering a minimum viable product that allows staff to view facility details, update statuses, track changes through audit trails, enforce role-based permissions, and provide clear user feedback through toast notifications.

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Room Detail Panel** - Comprehensive view of facility information
2. **Status Updates** - Quick action system for changing facility status
3. **Audit Trail** - Complete history of all changes
4. **Role-Based Permissions** - Secure access control
5. **User Feedback** - Clear success/error notifications

### Success Criteria
- ✅ Room detail panel displays all relevant information
- ✅ Status updates work with proper validation
- ✅ All changes recorded in audit trail
- ✅ Role-based permissions enforced at UI and API level
- ✅ Toast notifications provide clear feedback
- ✅ < 500ms response time for status updates
- ✅ 100% audit trail coverage for critical operations

---

## 🗺️ User Journey

```
User Flow: Facility Status Update
┌─────────────────────────────────────────────────────────────┐
│  1. User navigates to Operations (/ops)                      │
│     ↓                                                         │
│  2. User clicks on facility card                             │
│     ↓                                                         │
│  3. Room detail panel slides in (STORY-009)                  │
│     ↓                                                         │
│  4. User reviews facility information                        │
│     ↓                                                         │
│  5. User clicks "Update Status" (checks permissions)         │
│     ↓                                                         │
│  6. Status update modal appears (STORY-010)                  │
│     ↓                                                         │
│  7. User selects new status and adds notes                   │
│     ↓                                                         │
│  8. System validates and saves (STORY-011 audit)             │
│     ↓                                                         │
│  9. Success toast appears (STORY-013)                        │
│     ↓                                                         │
│  10. Panel refreshes with updated data                       │
│     ↓                                                         │
│  11. Audit trail shows new entry (STORY-011)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Scope & Stories

This epic is broken down into **5 user stories** covering:

### **Core Features**
1. **[STORY-009](../stories/story-009-room-detail-panel.md)** - Room Detail Panel
2. **[STORY-010](../stories/story-010-status-update-action.md)** - Status Update Action
3. **[STORY-011](../stories/story-011-audit-trail-record.md)** - Audit Trail Record

### **Infrastructure**
4. **[STORY-012](../stories/story-012-permissions-role-gates.md)** - Permissions & Role Gates
5. **[STORY-013](../stories/story-013-success-error-toasts.md)** - Success/Error Toasts

---

## 🏗️ Technical Architecture

### Component Hierarchy
```
Operations Page (/ops)
├── IssueList (grid view)
│   └── IssueCard (compact)
│       └── onClick → opens RoomDetailPanel
│
├── RoomDetailPanel (STORY-009)
│   ├── RoomHeader
│   ├── RoomInformation
│   ├── StatusBadge
│   ├── ActionButtons (with permission checks)
│   │   └── UpdateStatusButton → StatusUpdateModal
│   ├── AuditTrailSection (STORY-011)
│   └── CloseButton
│
├── StatusUpdateModal (STORY-010)
│   ├── StatusSelector
│   ├── NotesTextarea
│   ├── SubmitButton
│   └── CancelButton
│
└── ToastContainer (STORY-013)
    └── Toast (success/error/info/warning)
```

### Data Flow
```
Component → Hook → Service → Database
    ↓         ↓        ↓         ↓
  UI State  React   Business  PostgreSQL
            Query    Logic     + RLS
```

### Service Layer
```typescript
// operationsService.ts (already created)
- getIssueById(id)           // STORY-009
- updateIssue(id, updates)   // STORY-010
- getIssueHistory(id)        // STORY-011

// New methods to add:
- updateIssueStatus(id, status, notes)  // STORY-010
- getAuditTrail(table, recordId)        // STORY-011
- checkPermission(userId, action)       // STORY-012
```

---

## 🔐 Security & Permissions

### Role Hierarchy
```
Administrator (full access)
    ↓
Manager (approve/assign)
    ↓
Facilities Staff (update status)
    ↓
Staff (view only)
    ↓
User (view own issues)
```

### Permission Matrix
| Action | Admin | Manager | Facilities Staff | Staff | User |
|--------|-------|---------|------------------|-------|------|
| View Details | ✅ | ✅ | ✅ | ✅ | Own Only |
| Update Status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Assign Issues | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Issues | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit Trail | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 📈 Performance Requirements

### Response Time Targets
- **Panel Load:** < 300ms
- **Status Update:** < 500ms
- **Audit Trail Load:** < 400ms
- **Permission Check:** < 50ms (cached)

### Optimization Strategies
1. **React Query Caching** - 5-minute stale time for details
2. **Optimistic Updates** - Immediate UI feedback
3. **Permission Caching** - Cache user permissions
4. **Lazy Loading** - Load audit trail on tab open
5. **Debounced Search** - 300ms debounce on filters

---

## 🧪 Testing Strategy

### Unit Tests
- Service methods (100% coverage)
- Permission checks (all roles)
- Validation logic
- Toast notifications

### Integration Tests
- Room detail panel loading
- Status update flow
- Audit trail recording
- Permission enforcement

### E2E Tests
- Complete user journey
- Role-based access
- Error scenarios
- Toast notifications

---

## 📊 Story Points Breakdown

| Story | Title | Points | Priority |
|-------|-------|--------|----------|
| STORY-009 | Room Detail Panel | 5 | 🔴 Critical |
| STORY-010 | Status Update Action | 3 | 🔴 Critical |
| STORY-011 | Audit Trail Record | 5 | 🔴 Critical |
| STORY-012 | Permissions & Role Gates | 5 | 🔴 Critical |
| STORY-013 | Success/Error Toasts | 2 | 🟡 High |
| **Total** | | **20** | |

---

## 📅 Timeline

### **Week 1: Foundation (STORY-012, STORY-013)**
- Days 1-2: Implement permission system
- Days 3-4: Implement toast notifications
- Day 5: Testing and integration

### **Week 2: Core Features (STORY-009, STORY-010)**
- Days 1-3: Build room detail panel
- Days 4-5: Implement status update action

### **Week 3: Audit & Polish (STORY-011)**
- Days 1-2: Implement audit trail
- Days 3-4: Integration testing
- Day 5: Bug fixes and polish

---

## 🔗 Dependencies

### Depends On
- **EPIC-001:** Schema Stabilization (audit_logs table)
- **EPIC-002:** UI Architecture (service layer, components)
- **Route Scaffolding:** Operations page component

### Blocks
- **EPIC-004:** Advanced Operations Features
- **EPIC-005:** Reporting & Analytics

---

## 🎯 Acceptance Criteria

### Epic is considered COMPLETE when:
- [ ] All 5 stories completed and deployed
- [ ] Room detail panel displays all information
- [ ] Status updates work with validation
- [ ] Audit trail records all changes
- [ ] Permissions enforced at all levels
- [ ] Toast notifications provide clear feedback
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance targets met
- [ ] Documentation complete
- [ ] QA sign-off received

---

## 📚 Documentation Deliverables

### Technical Documentation
- [ ] Service layer API documentation
- [ ] Component documentation (Storybook)
- [ ] Permission system guide
- [ ] Audit trail schema documentation

### User Documentation
- [ ] Operations module user guide
- [ ] Status update workflow
- [ ] Permission roles explanation
- [ ] Troubleshooting guide

---

## ⚠️ Risks & Mitigation

### Risk 1: Permission System Complexity
**Impact:** High  
**Probability:** Medium  
**Mitigation:** Start with simple role-based checks, iterate based on needs

### Risk 2: Audit Trail Performance
**Impact:** Medium  
**Probability:** Low  
**Mitigation:** Implement pagination, lazy loading, and proper indexing

### Risk 3: Real-time Updates
**Impact:** Low  
**Probability:** Medium  
**Mitigation:** Use React Query polling, consider WebSocket for v2

### Risk 4: Mobile Responsiveness
**Impact:** Medium  
**Probability:** Low  
**Mitigation:** Test on mobile devices early, use responsive design patterns

---

## 📊 Success Metrics

### Quantitative
- **Adoption Rate:** 80% of staff using operations module within 2 weeks
- **Status Update Time:** < 30 seconds average
- **Error Rate:** < 2% of status updates fail
- **Performance:** 95% of operations complete in < 500ms
- **User Satisfaction:** > 4/5 rating

### Qualitative
- Staff report improved workflow efficiency
- Reduced time to update facility status
- Clear visibility into facility changes
- Confidence in permission system
- Positive feedback on user experience

---

## 🔄 Future Enhancements (v2)

### Not in Scope for v1
- Bulk status updates
- Advanced filtering
- Custom workflows
- Email notifications
- Mobile app
- Offline support
- Advanced reporting
- Integration with external systems

---

## 👥 Stakeholders

### Primary
- **Facilities Manager** - Main user of operations module
- **Facilities Staff** - Daily users for status updates
- **IT Admin** - Permission management

### Secondary
- **Building Manager** - Oversight and reporting
- **Maintenance Team** - Issue resolution
- **Executive Team** - High-level metrics

---

## 📝 Notes

### Design Decisions
1. **Slide-in Panel vs Modal:** Chose slide-in for better context retention
2. **Optimistic Updates:** Immediate feedback improves UX
3. **Role-Based Permissions:** Simple role hierarchy for v1
4. **Toast Duration:** 5 seconds for success, 10 seconds for errors

### Technical Decisions
1. **React Query:** For server state management
2. **Zustand:** For permission state caching
3. **Sonner:** For toast notifications
4. **Radix UI:** For accessible components

---

## 🔗 Related Epics

- **EPIC-001:** Schema Stabilization (provides audit_logs table)
- **EPIC-002:** UI Architecture (provides service layer pattern)
- **EPIC-004:** Advanced Operations (builds on this foundation)

---

**Epic Owner:** Product Team  
**Tech Lead:** Development Team  
**Last Updated:** October 25, 2025  
**Next Review:** November 1, 2025
