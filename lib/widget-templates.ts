/**
 * Widget templates for different themes
 * These provide working examples for each visual theme
 */

export const WIDGET_TEMPLATES = {
  modern: {
    name: "Modern Dashboard",
    description: "Colorful metric cards with gradients",
    code: `
// Create metric cards with modern styling
const root = document.getElementById('root');

root.innerHTML = \`
  <div>
    <h1>Dashboard Overview</h1>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
      <div class="data-card">
        <div class="metric-label">Total Revenue</div>
        <div class="metric">$\${widgetData.revenue || '124.5K'}</div>
        <p style="opacity: 0.8;">↑ 12.5% from last month</p>
      </div>

      <div class="data-card">
        <div class="metric-label">Active Users</div>
        <div class="metric">\${widgetData.users || '8,432'}</div>
        <p style="opacity: 0.8;">↑ 8.2% from last month</p>
      </div>

      <div class="data-card">
        <div class="metric-label">Conversion Rate</div>
        <div class="metric">\${widgetData.conversion || '3.2%'}</div>
        <p style="opacity: 0.8;">↓ 0.5% from last month</p>
      </div>
    </div>

    <div class="chart-container" style="margin-top: 3rem;">
      <canvas id="myChart"></canvas>
    </div>
  </div>
\`;

// Create chart
const ctx = document.getElementById('myChart');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue Trend',
      data: widgetData.chartData || [65, 72, 81, 84, 92, 105],
      borderColor: '#ffd700',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: '#ffffff', font: { size: 14 } }
      }
    },
    scales: {
      y: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#ffffff' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  }
});
`
  },

  neutral: {
    name: "Neutral Analytics",
    description: "Clean minimal design with bar chart",
    code: `
// Create minimalist analytics view
const root = document.getElementById('root');

root.innerHTML = \`
  <div>
    <h2>Performance Metrics</h2>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin: 2rem 0;">
      <div>
        <div class="metric-label">Sessions</div>
        <div class="metric" style="color: var(--widget-text);">\${widgetData.sessions || '12,458'}</div>
      </div>

      <div>
        <div class="metric-label">Bounce Rate</div>
        <div class="metric" style="color: var(--widget-text);">\${widgetData.bounce || '42%'}</div>
      </div>

      <div>
        <div class="metric-label">Avg. Duration</div>
        <div class="metric" style="color: var(--widget-text);">\${widgetData.duration || '3:24'}</div>
      </div>
    </div>

    <div class="chart-container">
      <canvas id="myChart"></canvas>
    </div>
  </div>
\`;

// Create bar chart
const ctx = document.getElementById('myChart');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Daily Visits',
      data: widgetData.chartData || [120, 150, 180, 165, 190, 145, 95],
      backgroundColor: '#171717',
      borderColor: '#171717',
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: '#000000', font: { size: 12, weight: '300' } }
      }
    },
    scales: {
      y: {
        ticks: { color: '#737373', font: { weight: '300' } },
        grid: { color: '#e5e5e5' }
      },
      x: {
        ticks: { color: '#737373', font: { weight: '300' } },
        grid: { display: false }
      }
    }
  }
});
`
  },

  dark: {
    name: "Dark Analytics",
    description: "Professional dark theme with dual chart",
    code: `
// Create dark professional dashboard
const root = document.getElementById('root');

root.innerHTML = \`
  <div>
    <h1>System Metrics</h1>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-top: 2rem;">
      <div class="data-card">
        <div class="metric-label">CPU Usage</div>
        <div class="metric" style="color: var(--widget-accent);">\${widgetData.cpu || '68%'}</div>
      </div>

      <div class="data-card">
        <div class="metric-label">Memory</div>
        <div class="metric" style="color: var(--widget-accent);">\${widgetData.memory || '4.2 GB'}</div>
      </div>

      <div class="data-card">
        <div class="metric-label">Network</div>
        <div class="metric" style="color: var(--widget-accent);">\${widgetData.network || '125 Mbps'}</div>
      </div>

      <div class="data-card">
        <div class="metric-label">Uptime</div>
        <div class="metric" style="color: var(--widget-accent);">\${widgetData.uptime || '99.9%'}</div>
      </div>
    </div>

    <div class="chart-container" style="margin-top: 3rem;">
      <canvas id="myChart"></canvas>
    </div>
  </div>
\`;

// Create area chart
const ctx = document.getElementById('myChart');
new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'CPU',
        data: widgetData.cpuData || [45, 52, 68, 71, 65, 58, 48],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Memory',
        data: widgetData.memoryData || [38, 42, 48, 52, 49, 45, 40],
        borderColor: '#bd00ff',
        backgroundColor: 'rgba(189, 0, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: { color: '#e0e0e0', font: { size: 13 } }
      }
    },
    scales: {
      y: {
        ticks: { color: '#a0a0a0' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      x: {
        ticks: { color: '#a0a0a0' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  }
});
`
  }
}

export function getTemplateForTheme(theme: string) {
  return WIDGET_TEMPLATES[theme as keyof typeof WIDGET_TEMPLATES] || WIDGET_TEMPLATES.neutral
}
