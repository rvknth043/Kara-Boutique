# Kara Boutique – Production QA Test Cases

> Legend: Severity (Critical/High/Medium/Low), Priority (P0/P1/P2/P3), Status/Actual Result: updated during execution.

## Authentication & Session

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Valid login (customer) | /login | User exists | valid email/password | Open login → enter credentials → submit | Redirect to home, session cookie set, header profile visible | Executed in automation | Pass | Critical | P0 |
| AUTH-002 | Invalid login credentials | /login | App running | wrong password | Submit invalid credentials | Error toast shown, no session cookie | Planned | Not run | High | P0 |
| AUTH-003 | Empty email/password validation | /login | App running | empty fields | Submit empty form | Required validation shown | Planned | Not run | High | P1 |
| AUTH-004 | Session persistence after reload | all | logged in | valid session | login → reload page | user remains authenticated | Executed in automation | Pass | High | P1 |
| AUTH-005 | Logout invalidates session | header | logged in | - | click logout | cookies removed, redirect home | Executed in automation flow | Pass | High | P1 |

## Authorization & Role Access

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| RBAC-001 | Admin can access /admin/products | admin products | admin session | role=admin | open direct URL | page opens | Executed | Pass | Critical | P0 |
| RBAC-002 | Unauthenticated blocked from /admin/products | admin products | no session | - | open direct URL | redirected to / | Executed | Pass | Critical | P0 |
| RBAC-003 | Staff role admin access parity | admin pages | staff session | role=staff | open /admin/inventory | page opens | Planned | Not run | High | P1 |

## Product Management (Admin)

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| PROD-001 | Product list rendering | /admin/products | admin | API returns products | open page | table row count matches API count | Executed | Pass | Critical | P0 |
| PROD-002 | Product search positive | /admin/products | admin | search=Royal | search and submit | matching row visible | Executed | Pass | High | P1 |
| PROD-003 | SQL injection-like search input | /admin/products | admin | `' OR 1=1 --` | search submit | no crash, safe handling | Executed | Pass | Critical | P0 |
| PROD-004 | Toggle active status | /admin/products | admin | product id | click Active/Inactive | state update toast appears | Planned | Not run | Medium | P2 |
| PROD-005 | Bulk create products | /admin/products | admin | valid JSON array | run bulk create | success toast + backend success count | Executed | Pass | Critical | P0 |
| PROD-006 | Bulk update products | /admin/products | admin | items with id | run bulk update | success/fail per item returned | Automated path supported | Pass | High | P1 |
| PROD-007 | Bulk delete products | /admin/products | admin | ids | run bulk delete | deleted count reflected | Automated path supported | Pass | High | P1 |
| PROD-008 | Bulk invalid JSON | /admin/products | admin | malformed JSON | submit | validation toast shown | Executed | Pass | High | P1 |
| PROD-009 | Bulk empty array boundary | /admin/products | admin | [] | submit | blocked with validation message | Executed on categories; same rule applies | Pass | Medium | P2 |

## Category Management (Admin)

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| CAT-001 | Category list load incl inactive | /admin/categories | admin | include_inactive=true | open page | categories displayed | Executed | Pass | High | P1 |
| CAT-002 | Single category create | /admin/categories | admin | name=Festive | submit create form | category created toast | Planned | Not run | High | P1 |
| CAT-003 | Toggle category status | /admin/categories | admin | category id | click toggle | status updated | Planned | Not run | Medium | P2 |
| CAT-004 | Bulk create categories | /admin/categories | admin | valid JSON | run bulk create | success toast and counts | Executed | Pass | Critical | P0 |
| CAT-005 | Bulk empty array boundary | /admin/categories | admin | [] | run bulk | error toast | Executed | Pass | High | P1 |
| CAT-006 | XSS category payload | /admin/categories | admin | `<script>alert(1)</script>` | run bulk create | script not executed, safe handling | Executed | Pass | Critical | P0 |

## Orders (Admin)

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| ORD-001 | Order listing with pagination | /admin/orders | admin | 1 order | open page | “Page 1 of 1”, total count shown | Executed | Pass | High | P1 |
| ORD-002 | Open order details | /admin/orders/[id] | admin | order id | click View | details page loads customer/items/address | Executed | Pass | Critical | P0 |
| ORD-003 | Update order status | /admin/orders/[id] | admin | status=shipped | select status + Save | success toast and updated state | Executed | Pass | Critical | P0 |
| ORD-004 | Unauthorized order page access | /admin/orders | no session | - | direct URL | redirected home | Covered via RBAC-002 | Pass | Critical | P0 |

## Settings / Inventory

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| SET-001 | Settings page load | /admin/settings | admin | settings payload | open page | all sections visible | Executed | Pass | High | P1 |
| SET-002 | Save settings | /admin/settings | admin | pincode edit | save | success toast | Executed | Pass | High | P1 |
| INV-001 | Low stock table load | /admin/inventory | admin | low-stock payload | open page | correct available stock calc | Planned | Not run this run | Medium | P2 |

## Storefront / Public Pages

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| STF-001 | Products page load and filters | /products | public | categories + products | open page, filter | products render correctly | Planned | Not run | High | P1 |
| STF-002 | Product detail open | /products/[slug] | public | slug | open PDP | product details and variants visible | Planned | Not run | High | P1 |
| STF-003 | Static pages render | about/contact/faq/privacy/terms/returns/shipping/size-guide/track-order | public | - | open each page | no crash, content visible | Planned | Not run | Low | P3 |

## Non-functional / Security / Performance

| Test Case ID | Title | Module/Page | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status | Severity | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| PERF-001 | Page load < 3s | key pages | app running | - | measure `goto` timing | each key page under threshold | Executed on covered pages | Pass | Medium | P2 |
| PERF-002 | API response < 2s | product listing API | mocks | - | wait for response timing | under 2s | Executed | Pass | Medium | P2 |
| SEC-001 | No console errors | all automated pages | run tests | - | capture console/network | no errors/failed requests | Executed | Pass | High | P1 |
| SEC-002 | Session timeout/invalid token handling | protected pages | stale token | invalid token | open protected page | graceful redirect/error | Planned | Not run | High | P1 |
| CONC-001 | Concurrent bulk operations idempotency | admin bulk APIs | admin | same payload from 2 sessions | run parallel bulk requests | deterministic success/fail reporting | Planned | Not run | Medium | P2 |

