# Changelog

## 1.2.5 - 2026-06-24
- Added gender marker to employee personal information
- Added employee ID field to employee personal information
- Updated dropdowns in New Employee dialog to use Select component
- Removed some unused state
- Added ability to cancel onboarding for employees (this will remove the employee from view, but preserve all data)
- Fixed bug where reattempting quiz after failure would push results twice

## 1.2.4 - 2026-06-14
- Fixed bug where start date on table appeared one day behind
- Fixed bug where start date on offer letter would appear one day behind
- Added reauthentication requirement when viewing Social Security Card / Other I-9 Supporting Documentation


## 1.2.3 - 2026-06-13
- Added password verification before accessing tax documents
- Added support for dynamically adding EIN to W-4 documents
- Added notice to remind admin to use Sign/Complete Documents feature for I-9
- Added position of admin to I-9 field
- Reorganized ordering of steps
- Added new step, "How to Use SurePayroll"


## 1.2.2 - 2026-06-13

- Fixed bug causing the offer letter for caregivers/nurses to be generated too early
- Fixed bug with active time counter not incrementing when progress was reset


## 1.2.1 - 2026-06-10

- Removed part about onboarding time being recorded on welcome screen
- Fixed bug where start date on detail screen appeared to be a day behind


## 1.2.0 - 2026-06-04

- Added new documents to Forms & Agreements page
- Added support for viewing offer letter/direct deposit authorization form
- Added new quiz progress tracker
- Added support for uploading Bloodborne Pathogens Certificate on admin side
- Fixed handling of sensitive information display


## 1.1.1 - 2026-05-30

- Fixed bug where audit logs show timestamps in incorrect time zone


## 1.1.0 - 2026-05-29

- Added support for editing employee information post-creation
- Fixed issue where W-4 would show up as an option for admins to download when not applicable
- Fixed bug with time zones on documents (moved everything to Eastern Time)
- Fixed wording on confirmation dialog
- Fixed date filtering on admin logs page
- Added more slides/questions to New Hire Orientation Page
- Fixed bug where resetting all progress for an employee would not add an expiry date


## 1.0.0 - 2026-05-27

- Initial production release