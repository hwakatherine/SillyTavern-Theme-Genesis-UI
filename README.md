# Genesis UI for SillyTavern

Genesis UI is a lightweight glassmorphism RPG interface extension for SillyTavern.
<img width="1867" height="931" alt="image" src="https://github.com/user-attachments/assets/4567daa1-84ab-43c4-96c7-aee75975db3b" />

<img width="477" height="507" alt="image" src="https://github.com/user-attachments/assets/c3fefeb0-96dc-4491-bbee-d9f822d25d90" />

<img width="976" height="615" alt="image" src="https://github.com/user-attachments/assets/dd048592-7512-4de0-a5f9-4f8027937aa3" />


## Installation

1. Unzip the folder `SillyTavern-Genesis-UI`.
2. Put the folder into one of these SillyTavern extension locations:
   - `SillyTavern/data/<your-user-handle>/extensions/SillyTavern-Genesis-UI`
   - or `SillyTavern/public/scripts/extensions/third-party/SillyTavern-Genesis-UI`
3. Restart or refresh SillyTavern.
4. Open Extensions settings.
5. Find **Genesis UI** and adjust the sliders/colors.

## v0.1.4 changes

- Replaced the grid/avatar-column layout with VoidDrift-style floating avatars.
- Removed banner logic entirely.
- Removed the heavy True glass blur mode entirely because it was not worth the lag.
- Removed Glass blur amount and Glass saturation controls because the visible effect was negligible in the current layout.
- Reworked the message observer to avoid attribute feedback loops and freezing.
- Default large avatar width is now 304px. You can set it back to 350px in the settings.
- Bot avatars float right on desktop; user avatars float left.
- Mobile safe mode uses smaller left-floating avatars.

## Notes

This is still a test build. If SillyTavern or another theme overrides message layout with very strong CSS, disable the other theme first and test Genesis UI on the standard ST theme.

