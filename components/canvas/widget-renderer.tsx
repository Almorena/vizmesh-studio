"use client"

import { useEffect, useState, useMemo } from "react"
import { AlertCircle } from "lucide-react"
import { getCustomThemeCSS, getWidgetBackground, type WidgetTheme } from "@/lib/widget-themes"

interface WidgetRendererProps {
  componentCode: string
  data?: any
  theme?: WidgetTheme
  title?: string
  className?: string
  widgetIndex?: number
}

/**
 * Safely renders AI-generated React components in an isolated iframe
 * Uses srcdoc and postMessage for secure communication
 */
export function WidgetRenderer({ componentCode, data, theme, title, className, widgetIndex = 0 }: WidgetRendererProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Reset loading when data changes
  useEffect(() => {
    // Data changed, component will re-render
  }, [data])

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "WIDGET_READY") {
        setLoading(false)
        setError(null)
      } else if (event.data.type === "WIDGET_ERROR") {
        setError(event.data.error)
        setLoading(false)
      }
    }

    window.addEventListener("message", handleMessage)

    // Set a timeout to stop loading after 10 seconds
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 10000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [])

  // Reset loading state when code, data, or theme changes
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Auto-hide loading after 1 second
    const autoHideTimeout = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(autoHideTimeout)
  }, [componentCode, data, theme])

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-red-50 rounded-lg ${className}`}>
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="text-sm font-medium text-red-900">Widget Error</p>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const sandboxHTML = createSandboxHTML(componentCode, data, theme, title, widgetIndex)

  // Create a stable key based on data content to force iframe recreation when data changes
  const iframeKey = useMemo(() => {
    return `iframe-${JSON.stringify(data).slice(0, 100)}-${componentCode.length}`
  }, [data, componentCode])

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-pulse text-sm text-gray-500">Loading widget...</div>
        </div>
      )}
      <iframe
        key={iframeKey}
        srcDoc={sandboxHTML}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        title="Widget Sandbox"
      />
    </div>
  )
}

/**
 * Creates the HTML document for the iframe sandbox
 * Includes React, Recharts, and the AI-generated component code
 */
function createSandboxHTML(componentCode: string, data: any, theme?: WidgetTheme, title?: string, widgetIndex: number = 0): string {
  // Serialize data and title safely
  const dataJSON = JSON.stringify(data || {});
  const titleJSON = JSON.stringify(title || '');

  // Get theme CSS if theme is specified (with custom colors if available)
  const themeCSS = theme ? getCustomThemeCSS(theme) : '';

  // Get widget background color based on theme and index
  const widgetBg = theme ? getWidgetBackground(theme, widgetIndex) : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    /* Base styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
    }

    body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      ${widgetBg ? `background: ${widgetBg} !important;` : 'background: #f0f0f0 !important;'}
    }

    #root {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* Theme CSS */
    ${themeCSS}

    /* Utility classes */
    .chart-container {
      max-width: 100%;
      margin: 0 auto;
      height: 100%;
    }

    .data-card {
      margin-bottom: 1.5rem;
    }

    h1 { font-size: 2.5rem; margin-bottom: 1rem; color: inherit !important; }
    h2 { font-size: 2rem; margin-bottom: 0.75rem; color: inherit !important; }
    h3 { font-size: 1.5rem; margin-bottom: 0.5rem; color: inherit !important; }
    p { margin-bottom: 0.5rem; line-height: 1.6; color: inherit !important; }

    /* Force visibility of all text elements */
    div, span, li, td, th, label {
      color: inherit !important;
    }

    .metric {
      font-size: 3rem;
      font-weight: 600;
      margin: 1rem 0;
    }

    .metric-label {
      font-size: 0.875rem;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    // Make data and title available globally
    window.widgetData = ${dataJSON};
    window.widgetTitle = ${titleJSON};

    // Data and title are available as window.widgetData and window.widgetTitle

    // Wait for Chart.js and Babel to load
    window.addEventListener('load', function() {
      try {
        // Register Chart.js components
        if (window.Chart) {
          const { Chart: ChartJS } = window;
          ChartJS.register(
            ChartJS.CategoryScale,
            ChartJS.LinearScale,
            ChartJS.BarElement,
            ChartJS.LineElement,
            ChartJS.PointElement,
            ChartJS.ArcElement,
            ChartJS.Title,
            ChartJS.Tooltip,
            ChartJS.Legend
          );
        }

        // Create simple React wrapper components for Chart.js
        window.BarChart = function({ data, options }) {
          const canvasRef = React.useRef(null);

          React.useEffect(() => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              new Chart(ctx, {
                type: 'bar',
                data: data,
                options: options || {}
              });
            }
          }, [data, options]);

          return React.createElement('canvas', { ref: canvasRef });
        };

        window.LineChart = function({ data, options }) {
          const canvasRef = React.useRef(null);

          React.useEffect(() => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              new Chart(ctx, {
                type: 'line',
                data: data,
                options: options || {}
              });
            }
          }, [data, options]);

          return React.createElement('canvas', { ref: canvasRef });
        };

        window.PieChart = function({ data, options }) {
          const canvasRef = React.useRef(null);

          React.useEffect(() => {
            if (canvasRef.current) {
              const ctx = canvasRef.current.getContext('2d');
              new Chart(ctx, {
                type: 'pie',
                data: data,
                options: options || {}
              });
            }
          }, [data, options]);

          return React.createElement('canvas', { ref: canvasRef });
        };

        // Add title if provided
        if (window.widgetTitle) {
          const titleEl = document.createElement('h2');
          titleEl.textContent = window.widgetTitle;
          titleEl.style.marginBottom = '1.5rem';
          titleEl.style.fontSize = '1.5rem';
          titleEl.style.fontWeight = '600';
          document.body.insertBefore(titleEl, document.getElementById('root'));
        }

        // Make data available as 'data' variable for widget code
        const data = window.widgetData;

        console.log('[Sandbox] About to render with data:', {
          type: Array.isArray(data) ? 'array' : typeof data,
          length: Array.isArray(data) ? data.length : 'n/a',
          keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 5) : null
        });

        // Transpile and execute the widget code
        try {
          const widgetCode = \`${componentCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

          // Check if code contains JSX (< followed by uppercase letter or common HTML tags)
          const hasJSX = /<[A-Z]|<div|<span|<p|<h[1-6]|<table|<ul|<ol|<li/.test(widgetCode);

          if (hasJSX && window.Babel) {
            const transpiledCode = window.Babel.transform(widgetCode, {
              presets: ['react']
            }).code;

            // Execute the transpiled code
            eval(transpiledCode);

            // Try to render the widget if a Widget component was defined
            if (typeof Widget === 'function') {
              const rootElement = document.getElementById('root');

              // Use ReactDOM to render the component
              if (window.ReactDOM && window.React) {
                const element = window.React.createElement(Widget, { data: data });
                window.ReactDOM.render(element, rootElement);
              } else {
                console.error('[Sandbox] React or ReactDOM not available');
              }
            }
          } else {
            // Execute directly if no JSX detected or Babel not available
            eval(widgetCode);
          }
        } catch (evalError) {
          console.error('[Sandbox] Error executing widget code:', evalError);
          console.error('[Sandbox] Error stack:', evalError.stack);
          throw evalError;
        }

        // Helper function to convert React elements to DOM
        function createDOMFromReactElement(element) {
          if (typeof element === 'string' || typeof element === 'number') {
            return document.createTextNode(element);
          }

          if (!element || !element.type) {
            return document.createTextNode('');
          }

          const { type, props } = element;

          // Handle array of elements
          if (Array.isArray(element)) {
            const fragment = document.createDocumentFragment();
            element.forEach(child => {
              fragment.appendChild(createDOMFromReactElement(child));
            });
            return fragment;
          }

          const domElement = document.createElement(type);

          // Set attributes
          if (props) {
            Object.keys(props).forEach(key => {
              if (key === 'children') {
                // Handle children
                const children = Array.isArray(props.children) ? props.children : [props.children];
                children.forEach(child => {
                  if (child !== null && child !== undefined) {
                    domElement.appendChild(createDOMFromReactElement(child));
                  }
                });
              } else if (key === 'style' && typeof props[key] === 'object') {
                // Handle style object
                Object.assign(domElement.style, props[key]);
              } else if (key === 'className') {
                domElement.className = props[key];
              } else if (key.startsWith('on') && typeof props[key] === 'function') {
                // Handle events
                const eventName = key.substring(2).toLowerCase();
                domElement.addEventListener(eventName, props[key]);
              } else if (typeof props[key] !== 'function' && typeof props[key] !== 'object') {
                // Handle other attributes
                domElement.setAttribute(key, props[key]);
              }
            });
          }

          return domElement;
        }

        // Notify parent that widget is ready
        window.parent.postMessage({ type: 'WIDGET_READY' }, '*');

      } catch (error) {
        console.error('[Sandbox] Error:', error);
        window.parent.postMessage({
          type: 'WIDGET_ERROR',
          error: error.message
        }, '*');

        document.getElementById('root').innerHTML =
          '<div style="padding: 20px; text-align: center; color: #dc2626;">' +
          '<h3>Error rendering widget</h3>' +
          '<p style="font-size: 14px; color: #991b1b;">' + error.message + '</p>' +
          '</div>';
      }
    });
  </script>
</body>
</html>`
}
