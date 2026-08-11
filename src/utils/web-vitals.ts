// src/utils/web-vitals.ts
// Track Core Web Vitals and send to analytics
// Note: Requires 'npm install web-vitals' to be fully functional

interface MetricData {
  name: string;
  value: number;
  delta?: number;
  id: string;
}

// Extend window interface for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Web Vitals tracking
 * Dynamically loads the web-vitals library to avoid blocking if not installed
 * 
 * Install with: npm install web-vitals
 */
export function initWebVitals() {
  // Check if performance API is available
  if (!('PerformanceObserver' in window)) {
    if (import.meta.env.DEV) {
      console.warn('Web Vitals not supported in this browser');
    }
    return;
  }

  const sendMetric = (metric: MetricData) => {
    // Send to Google Analytics (if loaded)
    try {
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to send Google Analytics event:', error);
      }
    }

    // Send to your own analytics service (optional)
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Analytics endpoint not available');
      }
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value * 100) / 100}ms`);
    }
  };

  // Dynamically import web-vitals to avoid hard dependency
  try {
    // @ts-ignore - web-vitals might not be installed
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Track metrics
      getCLS(sendMetric);
      getFID(sendMetric);
      getFCP(sendMetric);
      getLCP(sendMetric);
      getTTFB(sendMetric);
    }).catch(() => {
      if (import.meta.env.DEV) {
        console.info('web-vitals library not installed. To enable Web Vitals tracking, run: npm install web-vitals');
      }
    });
  } catch {
    if (import.meta.env.DEV) {
      console.info('web-vitals not available');
    }
  }
}

/**
 * Usage in src/main.tsx:
 * 
 * import { initWebVitals } from './utils/web-vitals';
 * 
 * // Initialize Web Vitals tracking in production
 * if (import.meta.env.PROD) {
 *   initWebVitals();
 * }
 */
