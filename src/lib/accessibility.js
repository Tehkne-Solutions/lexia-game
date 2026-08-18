// Accessibility settings — dyslexia font, high contrast, text size

const SETTINGS_KEY = 'lexia_accessibility';

export const DEFAULT_SETTINGS = {
  dyslexiaFont: false,
  highContrast: false,
  textSize: 'md', // sm | md | lg
};

export function loadAccessibilitySettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveAccessibilitySettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function applyAccessibilitySettings(settings) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dyslexia-font', !!settings.dyslexiaFont);
  root.classList.toggle('high-contrast', !!settings.highContrast);
  root.setAttribute('data-text-size', settings.textSize || 'md');
}

// Apply on module load to avoid flash of unstyled content
applyAccessibilitySettings(loadAccessibilitySettings());