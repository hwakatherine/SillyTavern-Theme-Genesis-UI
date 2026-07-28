/*
 * Genesis UI v0.1.7-hoverfix.1
 * Lightweight glassmorphism RPG interface for SillyTavern.
 * VoidDrift-inspired floating avatar layout, without banners.
 */

const GENESIS_UI_SETTINGS_KEY = 'SillyTavernGenesisUI';
const GENESIS_UI_DYNAMIC_STYLE_ID = 'genesis-ui-dynamic-style';
const GENESIS_UI_PANEL_ID = 'genesis-ui-settings-panel';

const DEFAULT_SETTINGS = Object.freeze({
    settingsVersion: '0.1.7',
    enabled: true,
    bigAvatars: true,
    mobileSafeMode: true,
    controlsOnTop: true,

    // v0.1.1: default is lighter than 350px because the first test proved that the UI enjoys dying dramatically.
    desktopAvatarSize: 304,
    mobileAvatarSize: 150,
    avatarRadius: 0,
    avatarGap: 18,
    avatarTopPull: 0,
    textTopPadding: 0,

    glassOpacity: 0.20,
    borderOpacity: 0.00,
    messageRadius: 22,
    shadowIntensity: 0.30,
    textPanelOpacityBoost: 0.08,
    messageBackdropBlur: 0,

    userMessageColor: '#2878ff',
    userMessageOpacity: 0.20,
    userGlowColor: '#5ab4ff',
    userGlowStrength: 0.45,

    botMessageColor: '#ff7828',
    botMessageOpacity: 0.18,
    botGlowColor: '#ffaa46',
    botGlowStrength: 0.45,
});

const SETTING_GROUPS = [
    {
        title: 'Core',
        settings: [
            { key: 'enabled', label: 'Enable Genesis UI', type: 'checkbox' },
            { key: 'bigAvatars', label: 'Enable floating avatars', type: 'checkbox' },
            { key: 'mobileSafeMode', label: 'Mobile safe mode', type: 'checkbox' },
            { key: 'controlsOnTop', label: 'Keep message controls above avatars', type: 'checkbox' }
        ]
    },
    {
        title: 'Avatars',
        settings: [
            { key: 'desktopAvatarSize', label: 'Desktop avatar width', type: 'range', min: 90, max: 430, step: 2, suffix: 'px' },
            { key: 'mobileAvatarSize', label: 'Mobile avatar width', type: 'range', min: 60, max: 220, step: 2, suffix: 'px' },
            { key: 'avatarRadius', label: 'Avatar corner radius', type: 'range', min: 0, max: 60, step: 1, suffix: 'px' },
            { key: 'avatarGap', label: 'Gap between avatar and text', type: 'range', min: 0, max: 44, step: 1, suffix: 'px' },
            { key: 'avatarTopPull', label: 'Avatar upward pull (0 = no lift)', type: 'range', min: 0, max: 130, step: 1, suffix: 'px' },
            { key: 'textTopPadding', label: 'Text top padding', type: 'range', min: 0, max: 120, step: 1, suffix: 'px' }
        ]
    },
    {
        title: 'Glass effect',
        settings: [
            { key: 'glassOpacity', label: 'Base glass opacity', type: 'range', min: 0, max: 1, step: 0.01 },
            { key: 'borderOpacity', label: 'Border opacity', type: 'range', min: 0, max: 1, step: 0.01 },
            { key: 'messageRadius', label: 'Message corner radius', type: 'range', min: 0, max: 60, step: 1, suffix: 'px' },
            { key: 'shadowIntensity', label: 'Shadow intensity', type: 'range', min: 0, max: 1, step: 0.01 },
            { key: 'textPanelOpacityBoost', label: 'Text readability boost', type: 'range', min: 0, max: 0.25, step: 0.01 },
            { key: 'messageBackdropBlur', label: 'Message true background blur', type: 'range', min: 0, max: 64, step: 1, suffix: 'px' }
        ]
    },
    {
        title: 'User message',
        settings: [
            { key: 'userMessageColor', label: 'User message color', type: 'color' },
            { key: 'userMessageOpacity', label: 'User message opacity', type: 'range', min: 0, max: 1, step: 0.01 },
            { key: 'userGlowColor', label: 'User neon color', type: 'color' },
            { key: 'userGlowStrength', label: 'User neon strength', type: 'range', min: 0, max: 1, step: 0.01 }
        ]
    },
    {
        title: 'Bot message',
        settings: [
            { key: 'botMessageColor', label: 'Bot message color', type: 'color' },
            { key: 'botMessageOpacity', label: 'Bot message opacity', type: 'range', min: 0, max: 1, step: 0.01 },
            { key: 'botGlowColor', label: 'Bot neon color', type: 'color' },
            { key: 'botGlowStrength', label: 'Bot neon strength', type: 'range', min: 0, max: 1, step: 0.01 }
        ]
    }
];

let mutationObserver = null;
let refreshScheduled = false;
let resizeHandlerAttached = false;

function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function getContextSafe() {
    try {
        return globalThis.SillyTavern?.getContext?.() || null;
    } catch (error) {
        console.warn('[Genesis UI] Could not get SillyTavern context:', error);
        return null;
    }
}

function getSettings() {
    const context = getContextSafe();
    if (!context) return cloneDefaults();

    if (!context.extensionSettings) context.extensionSettings = {};
    if (!context.extensionSettings[GENESIS_UI_SETTINGS_KEY]) {
        context.extensionSettings[GENESIS_UI_SETTINGS_KEY] = cloneDefaults();
    }

    const settings = context.extensionSettings[GENESIS_UI_SETTINGS_KEY];

    // v0.1.2 migration: v0.1.1 defaults pulled avatars upward and framed the whole portrait area too aggressively.
    // Only rewrite the old shipped defaults; custom user values can still be adjusted manually.
    if (settings.settingsVersion !== '0.1.6') {
        if (settings.avatarTopPull === undefined || Number(settings.avatarTopPull) === 72) settings.avatarTopPull = 0;
        if (settings.textTopPadding === undefined || Number(settings.textTopPadding) === 46) settings.textTopPadding = 0;
        if (settings.avatarRadius === undefined || Number(settings.avatarRadius) === 18) settings.avatarRadius = 0;
        if (settings.borderOpacity === undefined || Number(settings.borderOpacity) === 0.30) settings.borderOpacity = 0;
        settings.settingsVersion = '0.1.7-hoverfix.1';
        saveSettings();
    }

    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (settings[key] === undefined) settings[key] = value;
    }
    return settings;
}

function saveSettings() {
    const context = getContextSafe();
    try {
        context?.saveSettingsDebounced?.();
    } catch (error) {
        console.warn('[Genesis UI] Could not save settings:', error);
    }
}

function clampNumber(value, min, max) {
    const n = Number(value);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex) {
    const clean = String(hex || '').replace('#', '').trim();
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '255, 255, 255';
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
}

function applySettings() {
    const settings = getSettings();
    const body = document.body;

    body.classList.toggle('genesis-ui-enabled', !!settings.enabled);
    body.classList.toggle('genesis-ui-big-avatars', !!settings.bigAvatars);
    body.classList.toggle('genesis-ui-mobile-safe-enabled', !!settings.mobileSafeMode);
    body.classList.toggle('genesis-ui-controls-on-top', !!settings.controlsOnTop);
    body.classList.toggle('genesis-ui-message-blur-enabled', Number(settings.messageBackdropBlur) > 0);

    let style = document.getElementById(GENESIS_UI_DYNAMIC_STYLE_ID);
    if (!style) {
        style = document.createElement('style');
        style.id = GENESIS_UI_DYNAMIC_STYLE_ID;
        document.head.appendChild(style);
    }

    const desktopAvatarSize = clampNumber(settings.desktopAvatarSize, 90, 430);
    const mobileAvatarSize = clampNumber(settings.mobileAvatarSize, 60, 220);
    const avatarRadius = clampNumber(settings.avatarRadius, 0, 60);
    const avatarGap = clampNumber(settings.avatarGap, 0, 44);
    const avatarTopPull = clampNumber(settings.avatarTopPull, 0, 130);
    const textTopPadding = clampNumber(settings.textTopPadding, 0, 120);
    const glassOpacity = clampNumber(settings.glassOpacity, 0, 1);
    const borderOpacity = clampNumber(settings.borderOpacity, 0, 1);
    const messageRadius = clampNumber(settings.messageRadius, 0, 60);
    const shadowIntensity = clampNumber(settings.shadowIntensity, 0, 1);
    const textPanelOpacityBoost = clampNumber(settings.textPanelOpacityBoost, 0, 0.25);
    const messageBackdropBlur = clampNumber(settings.messageBackdropBlur, 0, 64);
    const userMessageOpacity = clampNumber(settings.userMessageOpacity, 0, 1);
    const userGlowStrength = clampNumber(settings.userGlowStrength, 0, 1);
    const botMessageOpacity = clampNumber(settings.botMessageOpacity, 0, 1);
    const botGlowStrength = clampNumber(settings.botGlowStrength, 0, 1);

    style.textContent = `
:root {
  --genesis-ui-avatar-size-desktop: ${desktopAvatarSize}px;
  --genesis-ui-avatar-size-mobile: ${mobileAvatarSize}px;
  --genesis-ui-avatar-radius: ${avatarRadius}px;
  --genesis-ui-avatar-gap: ${avatarGap}px;
  --genesis-ui-avatar-top-pull: ${avatarTopPull}px;
  --genesis-ui-text-top-padding: ${textTopPadding}px;

  --genesis-ui-glass-opacity: ${glassOpacity};
  --genesis-ui-border-opacity: ${borderOpacity};
  --genesis-ui-message-radius: ${messageRadius}px;
  --genesis-ui-shadow-strength: ${shadowIntensity};
  --genesis-ui-text-panel-opacity-boost: ${textPanelOpacityBoost};
  --genesis-ui-message-backdrop-blur: ${messageBackdropBlur}px;

  --genesis-ui-user-bg-rgb: ${hexToRgb(settings.userMessageColor)};
  --genesis-ui-user-bg-opacity: ${userMessageOpacity};
  --genesis-ui-user-glow-rgb: ${hexToRgb(settings.userGlowColor)};
  --genesis-ui-user-glow-strength: ${userGlowStrength};

  --genesis-ui-bot-bg-rgb: ${hexToRgb(settings.botMessageColor)};
  --genesis-ui-bot-bg-opacity: ${botMessageOpacity};
  --genesis-ui-bot-glow-rgb: ${hexToRgb(settings.botGlowColor)};
  --genesis-ui-bot-glow-strength: ${botGlowStrength};
}
    `.trim();

    scheduleMessageRefresh();
}

function getMessageId(element) {
    const raw = element.getAttribute('mesid') || element.dataset?.mesid || element.getAttribute('data-mesid');
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function classifyMessage(element) {
    const context = getContextSafe();
    const mesId = getMessageId(element);
    const chat = context?.chat;
    const chatItem = mesId !== null && Array.isArray(chat) ? chat[mesId] : null;

    const avatarImg = element.querySelector('.avatar img');
    const avatarSrc = String(avatarImg?.getAttribute('src') || '').toLowerCase();
    const nameText = String(element.querySelector('.name_text')?.textContent || element.querySelector('.ch_name')?.textContent || '').trim().toLowerCase();
    const looksLikeStUtilityMessage = /^(assistant|system|sillytavern|silly tavern)$/i.test(nameText)
        || /(?:\/img\/|img\/)(?:ai4|logo|st-|sillytavern|default)/i.test(avatarSrc)
        || element.classList.contains('genesis-ui-system-message');

    if (chatItem?.is_system || looksLikeStUtilityMessage || element.classList.contains('is_system') || element.classList.contains('system_mes')) return 'system';
    if (typeof chatItem?.is_user === 'boolean') return chatItem.is_user ? 'user' : 'bot';

    const attrCandidates = [
        element.getAttribute('is_user'),
        element.getAttribute('data-is-user'),
        element.dataset?.isUser,
        element.dataset?.is_user
    ].filter(Boolean).map(String).map(x => x.toLowerCase());

    if (attrCandidates.includes('true') || attrCandidates.includes('1')) return 'user';
    if (attrCandidates.includes('false') || attrCandidates.includes('0')) return 'bot';

    if (element.classList.contains('user') || element.classList.contains('is_user') || element.classList.contains('user_mes')) return 'user';
    if (element.classList.contains('system') || element.classList.contains('system_mes')) return 'system';

    return 'bot';
}

function setClassIfNeeded(element, className, shouldHave) {
    if (element.classList.contains(className) !== shouldHave) {
        element.classList.toggle(className, shouldHave);
    }
}

function refreshMessageTypes() {
    const messages = document.querySelectorAll('#chat .mes');
    messages.forEach((mes) => {
        const type = classifyMessage(mes);
        setClassIfNeeded(mes, 'genesis-ui-user-message', type === 'user');
        setClassIfNeeded(mes, 'genesis-ui-bot-message', type === 'bot');
        setClassIfNeeded(mes, 'genesis-ui-system-message', type === 'system');

        if (type === 'user' || type === 'bot') {
            const wanted = type === 'user' ? 'true' : 'false';
            if (mes.getAttribute('is_user') !== wanted) {
                mes.setAttribute('is_user', wanted);
            }
        } else if (type === 'system' && mes.hasAttribute('is_user')) {
            // Older Genesis UI builds could stamp ST utility messages as bot messages.
            // Remove our misleading marker so system/no-API cards don't grow a billboard-sized ST logo.
            mes.removeAttribute('is_user');
        }
    });
}

function scheduleMessageRefresh() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    requestAnimationFrame(() => {
        refreshScheduled = false;
        refreshMessageTypes();
    });
}

function startMessageObserver() {
    const chat = document.getElementById('chat');
    if (!chat || mutationObserver) return;

    mutationObserver = new MutationObserver((mutations) => {
        if (mutations.some(m => m.addedNodes?.length || m.removedNodes?.length)) {
            scheduleMessageRefresh();
        }
    });

    // v0.1.1: childList only. No attribute observation, because the previous version could trigger a dumb little mutation feedback loop.
    mutationObserver.observe(chat, { childList: true, subtree: false });
}

function createSettingControl(setting, settings) {
    const row = document.createElement('div');
    row.className = `genesis-ui-setting-row genesis-ui-setting-${setting.type}`;

    const label = document.createElement('label');
    label.textContent = setting.label;
    label.htmlFor = `genesis-ui-${setting.key}`;

    if (setting.type === 'checkbox') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `genesis-ui-${setting.key}`;
        input.checked = !!settings[setting.key];
        input.addEventListener('change', () => {
            settings[setting.key] = input.checked;
            applySettings();
            saveSettings();
        });
        row.appendChild(input);
        row.appendChild(label);
        return row;
    }

    row.appendChild(label);

    if (setting.type === 'range') {
        const wrap = document.createElement('div');
        wrap.className = 'genesis-ui-range-wrap';

        const input = document.createElement('input');
        input.type = 'range';
        input.id = `genesis-ui-${setting.key}`;
        input.min = setting.min;
        input.max = setting.max;
        input.step = setting.step;
        input.value = settings[setting.key];

        const number = document.createElement('input');
        number.type = 'number';
        number.min = setting.min;
        number.max = setting.max;
        number.step = setting.step;
        number.value = settings[setting.key];

        const suffix = document.createElement('span');
        suffix.className = 'genesis-ui-suffix';
        suffix.textContent = setting.suffix || '';

        const update = (value) => {
            const safe = clampNumber(value, Number(setting.min), Number(setting.max));
            settings[setting.key] = safe;
            input.value = safe;
            number.value = safe;
            applySettings();
            saveSettings();
        };

        input.addEventListener('input', () => update(input.value));
        number.addEventListener('change', () => update(number.value));

        wrap.appendChild(input);
        wrap.appendChild(number);
        wrap.appendChild(suffix);
        row.appendChild(wrap);
        return row;
    }

    if (setting.type === 'color') {
        const wrap = document.createElement('div');
        wrap.className = 'genesis-ui-color-wrap';

        const input = document.createElement('input');
        input.type = 'color';
        input.id = `genesis-ui-${setting.key}`;
        input.value = settings[setting.key] || DEFAULT_SETTINGS[setting.key];

        const text = document.createElement('input');
        text.type = 'text';
        text.value = input.value;
        text.placeholder = '#ffffff';

        const swatches = document.createElement('div');
        swatches.className = 'genesis-ui-swatches';
        const presetColors = ['#ffffff', '#4aa3ff', '#00e5ff', '#2fffd0', '#ff5fc8', '#a76dff', '#58ff73', '#ffe66d', '#ff4040', '#ff9a2f'];

        const updateColor = (value) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
            const normalized = value.toLowerCase();
            settings[setting.key] = normalized;
            input.value = normalized;
            text.value = normalized;
            applySettings();
            saveSettings();
        };

        input.addEventListener('input', () => updateColor(input.value));
        text.addEventListener('change', () => updateColor(text.value.trim()));

        presetColors.forEach((color) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'genesis-ui-swatch';
            button.title = color;
            button.style.backgroundColor = color;
            button.addEventListener('click', () => updateColor(color));
            swatches.appendChild(button);
        });

        wrap.appendChild(input);
        wrap.appendChild(text);
        wrap.appendChild(swatches);
        row.appendChild(wrap);
        return row;
    }

    return row;
}

function renderSettingsPanel() {
    if (document.getElementById(GENESIS_UI_PANEL_ID)) return;

    const settings = getSettings();
    const target = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings') || document.body;

    const panel = document.createElement('div');
    panel.id = GENESIS_UI_PANEL_ID;
    panel.className = 'genesis-ui-settings-panel';

    const header = document.createElement('div');
    header.className = 'genesis-ui-settings-header';
    header.innerHTML = `
        <div>
            <strong>Genesis UI</strong>
        </div>
    `;

    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.textContent = 'Reset';
    resetButton.className = 'menu_button genesis-ui-reset-button';
    resetButton.addEventListener('click', () => {
        const context = getContextSafe();
        if (context?.extensionSettings) {
            context.extensionSettings[GENESIS_UI_SETTINGS_KEY] = cloneDefaults();
        }
        document.getElementById(GENESIS_UI_PANEL_ID)?.remove();
        renderSettingsPanel();
        applySettings();
        saveSettings();
    });

    header.appendChild(resetButton);
    panel.appendChild(header);

    SETTING_GROUPS.forEach((group) => {
        const details = document.createElement('details');
        details.className = 'genesis-ui-settings-group';
        details.open = group.title === 'Core' || group.title === 'Avatars';

        const summary = document.createElement('summary');
        summary.textContent = group.title;
        details.appendChild(summary);

        group.settings.forEach((setting) => {
            details.appendChild(createSettingControl(setting, settings));
        });

        panel.appendChild(details);
    });

    const note = document.createElement('div');
    note.className = 'genesis-ui-settings-note';
    note.textContent = 'Tip: v0.1.7 tests real message-only blur by making the chat panel transparent while the slider is above 0. Start at 18–28px; keep opacity below 0.55 if you want to actually see blur.';
    panel.appendChild(note);

    target.appendChild(panel);
}

function addExtensionMenuButton() {
    const menu = document.getElementById('extensionsMenu');
    if (!menu || document.getElementById('genesis-ui-menu-button')) return;

    const button = document.createElement('div');
    button.id = 'genesis-ui-menu-button';
    button.className = 'list-group-item flex-container flexGap5 interactable';
    button.tabIndex = 0;
    button.title = 'Genesis UI settings';
    button.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i><span>Genesis UI</span>';
    button.addEventListener('click', () => {
        document.getElementById(GENESIS_UI_PANEL_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    menu.appendChild(button);
}

function updateViewportClass() {
    document.body.classList.toggle('genesis-ui-small-viewport', window.innerWidth <= 768);
}

function initGenesisUI() {
    getSettings();
    renderSettingsPanel();
    applySettings();
    scheduleMessageRefresh();
    startMessageObserver();
    addExtensionMenuButton();

    if (!resizeHandlerAttached) {
        resizeHandlerAttached = true;
        window.addEventListener('resize', updateViewportClass, { passive: true });
    }
    updateViewportClass();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGenesisUI, { once: true });
} else {
    queueMicrotask(initGenesisUI);
}

export { applySettings as applyGenesisUISettings };
