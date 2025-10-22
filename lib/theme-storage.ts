/**
 * Theme Storage Utilities
 * Handles saving and loading custom theme configurations from localStorage
 */

export interface ThemeColors {
  background: string
  text: string
  accent: string
  border: string
  heading?: string
  subtext?: string
  dashboardBackground?: string
}

export interface WidgetBackgrounds {
  color1: string
  color2: string
  color3: string
}

export interface CustomThemes {
  modern: ThemeColors
  neutral: ThemeColors
  dark: ThemeColors
  modernBackgrounds: WidgetBackgrounds
  neutralBackgrounds: WidgetBackgrounds
  darkBackgrounds: WidgetBackgrounds
}

const STORAGE_KEY = 'vizmesh_custom_themes'

/**
 * Save custom theme configurations to localStorage
 */
export function saveCustomThemes(themes: CustomThemes): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
  } catch (error) {
    console.error('Failed to save custom themes:', error)
    throw new Error('Failed to save theme customizations')
  }
}

/**
 * Load custom theme configurations from localStorage
 */
export function loadCustomThemes(): CustomThemes | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as CustomThemes
  } catch (error) {
    console.error('Failed to load custom themes:', error)
    return null
  }
}

/**
 * Clear custom theme configurations from localStorage
 */
export function clearCustomThemes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear custom themes:', error)
  }
}

/**
 * Check if custom themes are stored
 */
export function hasCustomThemes(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch (error) {
    return false
  }
}
