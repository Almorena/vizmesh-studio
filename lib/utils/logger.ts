/**
 * Centralized logging utility for VizMesh Studio
 *
 * Usage:
 * - logger.debug() - Only visible in development or when NEXT_PUBLIC_DEBUG=true
 * - logger.info() - Always visible, for important info
 * - logger.warn() - Always visible, for warnings
 * - logger.error() - Always visible, for errors
 */

const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true'

export const logger = {
  /**
   * Debug logs - only shown in development or when debug mode is enabled
   * Use for detailed debugging information that shouldn't appear in production
   */
  debug: (scope: string, ...args: any[]) => {
    if (isDev || isDebug) {
      console.log(`[DEBUG][${scope}]`, ...args)
    }
  },

  /**
   * Info logs - always shown
   * Use for important information that should be visible in production
   */
  info: (scope: string, ...args: any[]) => {
    console.log(`[INFO][${scope}]`, ...args)
  },

  /**
   * Warning logs - always shown
   * Use for warnings and potential issues
   */
  warn: (scope: string, ...args: any[]) => {
    console.warn(`[WARN][${scope}]`, ...args)
  },

  /**
   * Error logs - always shown
   * Use for errors and exceptions
   */
  error: (scope: string, ...args: any[]) => {
    console.error(`[ERROR][${scope}]`, ...args)
  }
}

// Export a helper to check if debug mode is enabled
export const isDebugMode = () => isDev || isDebug
