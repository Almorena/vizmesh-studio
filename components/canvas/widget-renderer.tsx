"use client"

import { useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

interface WidgetRendererProps {
  componentCode: string
  data?: any
  className?: string
}

/**
 * Safely renders AI-generated React components in an isolated iframe
 * Uses srcdoc and postMessage for secure communication
 */
export function WidgetRenderer({ componentCode, data, className }: WidgetRendererProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      console.log("[WidgetRenderer] Received message:", event.data)
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
      console.log("[WidgetRenderer] Timeout reached, assuming widget loaded")
    }, 10000)

    return () => {
      window.removeEventListener("message", handleMessage)
      clearTimeout(timeout)
    }
  }, [])

  // Reset loading state when code or data changes
  useEffect(() => {
    setLoading(true)
    setError(null)

    // Auto-hide loading after 3 seconds if no message received
    const autoHideTimeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => clearTimeout(autoHideTimeout)
  }, [componentCode, data])

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

  const sandboxHTML = createSandboxHTML(componentCode, data)

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="animate-pulse text-sm text-gray-500">Loading widget...</div>
        </div>
      )}
      <iframe
        srcDoc={sandboxHTML}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="Widget Sandbox"
      />
    </div>
  )
}

/**
 * Creates the HTML document for the iframe sandbox
 * Includes React, Recharts, and the AI-generated component code
 */
function createSandboxHTML(componentCode: string, data: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * {
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script>
    console.log('[Sandbox] Starting initialization');
    console.log('[Sandbox] Babel available:', typeof Babel !== 'undefined');

    // Wait for all libraries to load
    window.addEventListener('load', function() {
      console.log('[Sandbox] Window loaded');
      console.log('[Sandbox] React available:', typeof React !== 'undefined');
      console.log('[Sandbox] ReactDOM available:', typeof ReactDOM !== 'undefined');
      console.log('[Sandbox] Chart.js available:', typeof Chart !== 'undefined');

      try {
        // Make React hooks available globally
        const { useState, useEffect, useRef } = React;
        window.useState = useState;
        window.useEffect = useEffect;
        window.useRef = useRef;

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

          // Create React wrapper components for Chart.js
          window.BarChart = function BarChart({ data, options }) {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);

            useEffect(() => {
              if (canvasRef.current) {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
                chartRef.current = new ChartJS(canvasRef.current, {
                  type: 'bar',
                  data: data,
                  options: options || {}
                });
              }
              return () => {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
              };
            }, [data, options]);

            return React.createElement('canvas', { ref: canvasRef });
          };

          window.LineChart = function LineChart({ data, options }) {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);

            useEffect(() => {
              if (canvasRef.current) {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
                chartRef.current = new ChartJS(canvasRef.current, {
                  type: 'line',
                  data: data,
                  options: options || {}
                });
              }
              return () => {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
              };
            }, [data, options]);

            return React.createElement('canvas', { ref: canvasRef });
          };

          window.PieChart = function PieChart({ data, options }) {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);

            useEffect(() => {
              if (canvasRef.current) {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
                chartRef.current = new ChartJS(canvasRef.current, {
                  type: 'pie',
                  data: data,
                  options: options || {}
                });
              }
              return () => {
                if (chartRef.current) {
                  chartRef.current.destroy();
                }
              };
            }, [data, options]);

            return React.createElement('canvas', { ref: canvasRef });
          };

          console.log('[Sandbox] Chart.js components created successfully');
        } else {
          console.error('[Sandbox] Chart.js not found!');
        }

        // Execute AI-generated component code via Babel
        console.log('[Sandbox] Creating Babel script');

        if (typeof Babel === 'undefined') {
          console.error('[Sandbox] Babel not loaded!');
          window.parent.postMessage({
            type: 'WIDGET_ERROR',
            error: 'Babel transpiler not loaded'
          }, '*');
          return;
        }

        try {
          // Transpile and execute the code
          const jsxCode = \`
            console.log('[Sandbox/Babel] Executing widget code');
            try {
              // AI-generated component code
              ${componentCode}

              console.log('[Sandbox/Babel] Widget function defined');

              // Data passed from parent
              const widgetData = ${JSON.stringify(data || {})};
              console.log('[Sandbox/Babel] Widget data:', widgetData);

              // Render the widget
              const container = document.getElementById('root');
              const root = ReactDOM.createRoot(container);
              root.render(React.createElement(Widget, { data: widgetData }));
              console.log('[Sandbox/Babel] Widget rendered');

              // Notify parent that widget is ready
              window.parent.postMessage({ type: 'WIDGET_READY' }, '*');
              console.log('[Sandbox/Babel] WIDGET_READY message sent');
            } catch (error) {
              console.error('[Sandbox/Babel] Widget error:', error);
              window.parent.postMessage({
                type: 'WIDGET_ERROR',
                error: error.message
              }, '*');

              document.getElementById('root').innerHTML = '<div style="padding: 20px; text-align: center; color: #dc2626;"><h3>Error rendering widget</h3><p style="font-size: 14px; color: #991b1b;">' + error.message + '</p></div>';
            }
          \`;

          console.log('[Sandbox] Transpiling JSX...');
          const transpiledCode = Babel.transform(jsxCode, { presets: ['react'] }).code;
          console.log('[Sandbox] JSX transpiled, executing...');

          eval(transpiledCode);
        } catch (error) {
          console.error('[Sandbox] Transpilation error:', error);
          window.parent.postMessage({
            type: 'WIDGET_ERROR',
            error: 'Failed to transpile widget code: ' + error.message
          }, '*');
        }
      } catch (error) {
        console.error('[Sandbox] Setup error:', error);
        window.parent.postMessage({
          type: 'WIDGET_ERROR',
          error: error.message
        }, '*');
      }
    });
  </script>
</body>
</html>`
}
