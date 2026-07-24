# Genesis UI for SillyTavern

Genesis UI is a lightweight glassmorphism RPG interface extension for SillyTavern.
<img width="1867" height="931" alt="image" src="https://github.com/user-attachments/assets/4567daa1-84ab-43c4-96c7-aee75975db3b" />


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


## v0.1.3

- System/no-API/ST Assistant utility messages no longer get giant RPG avatars.
- Older Genesis UI `is_user` markers are removed from system utility messages during refresh.

## v0.1.4

- Removed True glass blur toggle.
- Removed Glass blur amount and Glass saturation sliders.
- Kept the lightweight glass look through opacity, border, radius, shadow, text readability boost, and message colors.
