import { loadCustomThemes, type ThemeColors, type WidgetBackgrounds } from "./theme-storage"

export type WidgetTheme = "modern" | "neutral" | "dark"

export interface ThemePreset {
  id: WidgetTheme
  name: string
  description: string
  preview: {
    background: string
    text: string
    accent: string
    border: string
  }
  css: string
}

export const WIDGET_THEMES: Record<WidgetTheme, ThemePreset> = {
  modern: {
    id: "modern",
    name: "Modern & Colorful",
    description: "Soft pastel colors for a gentle look",
    preview: {
      background: "#fef4f4",
      text: "#2d3748",
      accent: "#f687b3",
      border: "#ffd4e5"
    },
    css: `
      /* Modern & Colorful Theme - Pastel Colors */
      :root {
        /* Three pastel colors that rotate per widget */
        --pastel-pink: #fef4f4;
        --pastel-blue: #f0f9ff;
        --pastel-mint: #f0fdf4;

        --widget-text: #2d3748;
        --widget-heading: #1a202c;
        --widget-subtext: #4a5568;
        --widget-accent: #f687b3;
        --widget-border: #ffd4e5;
        --widget-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      body {
        /* Default to pink pastel, but will be overridden per widget */
        background: var(--pastel-pink);
        color: var(--widget-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 2rem;
        min-height: 100vh;
      }

      h1, h2, h3 {
        color: var(--widget-heading);
        font-weight: 600;
      }

      .chart-container, .data-card {
        background: rgba(255, 255, 255, 0.6);
        border: 1px solid rgba(0, 0, 0, 0.05);
        border-radius: 16px;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
        box-shadow: var(--widget-shadow);
      }
    `
  },

  neutral: {
    id: "neutral",
    name: "Neutral & Clean",
    description: "Minimal monochrome design",
    preview: {
      background: "#ffffff",
      text: "#000000",
      accent: "#666666",
      border: "#e5e5e5"
    },
    css: `
      /* Neutral & Clean Theme */
      :root {
        --widget-bg: #ffffff;
        --widget-text: #000000;
        --widget-heading: #000000;
        --widget-subtext: #737373;
        --widget-accent: #171717;
        --widget-border: #e5e5e5;
        --widget-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        --widget-card-bg: #fafafa;
        --widget-card-border: #e5e5e5;
      }

      body {
        background: var(--widget-bg);
        color: var(--widget-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 2rem;
        min-height: 100vh;
      }

      h1, h2, h3 {
        color: var(--widget-heading);
        font-weight: 300;
        letter-spacing: -0.02em;
      }

      .chart-container, .data-card {
        background: var(--widget-card-bg);
        border: 1px solid var(--widget-card-border);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: var(--widget-shadow);
      }
    `
  },

  dark: {
    id: "dark",
    name: "Dark & Professional",
    description: "Sleek dark theme for tech environments",
    preview: {
      background: "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)",
      text: "#e0e0e0",
      accent: "#00d4ff",
      border: "#4a5568"
    },
    css: `
      /* Dark & Professional Theme */
      :root {
        --widget-bg: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        --widget-text: #e0e0e0;
        --widget-heading: #ffffff;
        --widget-subtext: #a0aec0;
        --widget-accent: #00d4ff;
        --widget-border: #4a5568;
        --widget-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        --widget-card-bg: rgba(255, 255, 255, 0.05);
        --widget-card-border: rgba(255, 255, 255, 0.1);
      }

      body {
        background: var(--widget-bg);
        color: var(--widget-text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 2rem;
        min-height: 100vh;
      }

      h1, h2, h3 {
        color: var(--widget-heading);
        font-weight: 500;
      }

      .chart-container, .data-card {
        background: var(--widget-card-bg);
        border: 1px solid var(--widget-card-border);
        border-radius: 16px;
        padding: 1.5rem;
        backdrop-filter: blur(10px);
        box-shadow: var(--widget-shadow);
      }
    `
  }
}

export function getThemeCSS(theme: WidgetTheme): string {
  return WIDGET_THEMES[theme].css
}

export function getThemePreview(theme: WidgetTheme) {
  return WIDGET_THEMES[theme].preview
}

export function getThemeBackground(theme: WidgetTheme): string {
  const customThemes = loadCustomThemes()

  // If custom dashboard background exists, use it
  if (customThemes) {
    const dashboardBg = customThemes[theme].dashboardBackground
    if (dashboardBg) {
      return dashboardBg
    }
  }

  // Fall back to default theme background
  return WIDGET_THEMES[theme].preview.background
}

/**
 * Get widget background color based on theme and widget index
 * Returns one of 3 colors in rotation for each theme
 * Uses custom colors from localStorage if available
 */
export function getWidgetBackground(theme: WidgetTheme, index: number): string {
  const customThemes = loadCustomThemes()

  let backgrounds: string[]

  switch (theme) {
    case "modern":
      backgrounds = customThemes ? [
        customThemes.modernBackgrounds.color1,
        customThemes.modernBackgrounds.color2,
        customThemes.modernBackgrounds.color3
      ] : [
        '#fef4f4', // Pastel Pink (default)
        '#f0f9ff', // Pastel Blue (default)
        '#f0fdf4'  // Pastel Mint (default)
      ]
      break

    case "neutral":
      backgrounds = customThemes ? [
        customThemes.neutralBackgrounds.color1,
        customThemes.neutralBackgrounds.color2,
        customThemes.neutralBackgrounds.color3
      ] : [
        '#ffffff', // White (default)
        '#fafafa', // Light Gray (default)
        '#f5f5f5'  // Lighter Gray (default)
      ]
      break

    case "dark":
      backgrounds = customThemes ? [
        customThemes.darkBackgrounds.color1,
        customThemes.darkBackgrounds.color2,
        customThemes.darkBackgrounds.color3
      ] : [
        '#2d3748', // Dark Blue Gray (default)
        '#1a202c', // Darker Blue Gray (default)
        '#2c3e50'  // Dark Slate (default)
      ]
      break

    default:
      backgrounds = ['#ffffff', '#fafafa', '#f5f5f5']
  }

  return backgrounds[index % 3]
}

/**
 * @deprecated Use getWidgetBackground instead
 * Get pastel background color for Modern theme based on widget index
 */
export function getPastelColor(index: number): string {
  return getWidgetBackground('modern', index)
}

/**
 * Get custom theme CSS with user customizations applied
 * Falls back to default theme CSS if no customizations exist
 */
export function getCustomThemeCSS(theme: WidgetTheme): string {
  const customThemes = loadCustomThemes()

  if (!customThemes) {
    return WIDGET_THEMES[theme].css
  }

  // Apply custom colors based on theme
  switch (theme) {
    case "modern":
      return `
        /* Modern & Colorful Theme - Custom Colors */
        :root {
          /* Three colors that rotate per widget */
          --widget-bg-1: ${customThemes.modernBackgrounds.color1};
          --widget-bg-2: ${customThemes.modernBackgrounds.color2};
          --widget-bg-3: ${customThemes.modernBackgrounds.color3};

          --widget-text: ${customThemes.modern.text};
          --widget-heading: #1a202c;
          --widget-subtext: #4a5568;
          --widget-accent: ${customThemes.modern.accent};
          --widget-border: ${customThemes.modern.border};
          --widget-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        body {
          background: ${customThemes.modern.background};
          color: var(--widget-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }

        h1, h2, h3 {
          color: var(--widget-heading);
          font-weight: 600;
        }

        .chart-container, .data-card {
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          box-shadow: var(--widget-shadow);
        }
      `

    case "neutral":
      return `
        /* Neutral & Clean Theme - Custom Colors */
        :root {
          /* Three colors that rotate per widget */
          --widget-bg-1: ${customThemes.neutralBackgrounds.color1};
          --widget-bg-2: ${customThemes.neutralBackgrounds.color2};
          --widget-bg-3: ${customThemes.neutralBackgrounds.color3};

          --widget-bg: ${customThemes.neutral.background};
          --widget-text: ${customThemes.neutral.text};
          --widget-heading: #000000;
          --widget-subtext: #737373;
          --widget-accent: ${customThemes.neutral.accent};
          --widget-border: ${customThemes.neutral.border};
          --widget-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          --widget-card-bg: #fafafa;
          --widget-card-border: ${customThemes.neutral.border};
        }

        body {
          background: var(--widget-bg);
          color: var(--widget-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }

        h1, h2, h3 {
          color: var(--widget-heading);
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        .chart-container, .data-card {
          background: var(--widget-card-bg);
          border: 1px solid var(--widget-card-border);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: var(--widget-shadow);
        }
      `

    case "dark":
      return `
        /* Dark & Professional Theme - Custom Colors */
        :root {
          /* Three colors that rotate per widget */
          --widget-bg-1: ${customThemes.darkBackgrounds.color1};
          --widget-bg-2: ${customThemes.darkBackgrounds.color2};
          --widget-bg-3: ${customThemes.darkBackgrounds.color3};

          --widget-bg: ${customThemes.dark.background};
          --widget-text: ${customThemes.dark.text};
          --widget-heading: #ffffff;
          --widget-subtext: #a0aec0;
          --widget-accent: ${customThemes.dark.accent};
          --widget-border: ${customThemes.dark.border};
          --widget-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          --widget-card-bg: rgba(255, 255, 255, 0.05);
          --widget-card-border: rgba(255, 255, 255, 0.1);
        }

        body {
          background: var(--widget-bg);
          color: var(--widget-text);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: 2rem;
          min-height: 100vh;
        }

        h1, h2, h3 {
          color: var(--widget-heading);
          font-weight: 500;
        }

        .chart-container, .data-card {
          background: var(--widget-card-bg);
          border: 1px solid var(--widget-card-border);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          box-shadow: var(--widget-shadow);
        }
      `

    default:
      return WIDGET_THEMES[theme].css
  }
}
