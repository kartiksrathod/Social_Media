import { useEffect, useRef, useState } from 'react';
import { PERFORMANCE_CONFIG, logPerformance } from '../config/performance';

/**
 * Hook to monitor component performance
 * Tracks render count and render time
 * 
 * @param {string} componentName - Name of the component being monitored
 * @returns {Object} Performance metrics
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const renderTimes = useRef([]);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    renderTimes.current.push(timeSinceLastRender);
    lastRenderTime.current = now;

    if (PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
      logPerformance(`${componentName} render #${renderCount.current}`, {
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        timeSinceMount: `${now - mountTime.current}ms`,
        avgRenderInterval: renderTimes.current.length > 1
          ? `${(renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length).toFixed(2)}ms`
          : 'N/A'
      });
    }
  });

  return {
    renderCount: renderCount.current,
    avgRenderInterval: renderTimes.current.length > 1
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length
      : 0
  };
}

/**
 * Hook to measure and log page load performance
 */
export function usePageLoadMetrics(pageName) {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measureMetrics();
    } else {
      window.addEventListener('load', measureMetrics);
      return () => window.removeEventListener('load', measureMetrics);
    }

    function measureMetrics() {
      if (!window.performance || !window.performance.timing) return;

      const timing = window.performance.timing;
      const navigation = window.performance.getEntriesByType('navigation')[0];

      const pageMetrics = {
        // Core Web Vitals approximation
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        
        // Detailed metrics
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        domProcessing: timing.domComplete - timing.domLoading,
        
        // Modern metrics (if available)
        fcp: navigation?.fetchStart ? (performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0) : 0,
        lcp: 0, // Would need PerformanceObserver for accurate LCP
      };

      setMetrics(pageMetrics);

      if (PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
        console.log(`[Performance] ${pageName} load metrics:`, {
          'DOM Content Loaded': `${pageMetrics.domContentLoaded}ms`,
          'Load Complete': `${pageMetrics.loadComplete}ms`,
          'DNS Lookup': `${pageMetrics.dns}ms`,
          'TCP Connection': `${pageMetrics.tcp}ms`,
          'Request Time': `${pageMetrics.request}ms`,
          'Response Time': `${pageMetrics.response}ms`,
          'DOM Processing': `${pageMetrics.domProcessing}ms`,
          'First Contentful Paint': `${pageMetrics.fcp}ms`
        });
      }
    }
  }, [pageName]);

  return metrics;
}

/**
 * Hook to track memory usage (Chrome only)
 */
export function useMemoryMonitor() {
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    if (!performance.memory || !PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) return;

    const interval = setInterval(() => {
      const memoryInfo = {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2), // MB
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2), // MB
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2), // MB
        usage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1) // %
      };

      setMemory(memoryInfo);

      logPerformance('Memory Usage', {
        used: `${memoryInfo.usedJSHeapSize}MB`,
        total: `${memoryInfo.totalJSHeapSize}MB`,
        limit: `${memoryInfo.jsHeapSizeLimit}MB`,
        percentage: `${memoryInfo.usage}%`
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memory;
}

/**
 * Hook to detect slow renders
 * Warns if component render takes longer than threshold
 */
export function useRenderTimeWarning(componentName, thresholdMs = 16) {
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > thresholdMs && PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
      console.warn(
        `[Performance Warning] ${componentName} rendered slowly: ${renderTime.toFixed(2)}ms (threshold: ${thresholdMs}ms)`
      );
    }

    renderStartTime.current = performance.now();
  });
}

/**
 * Hook to track API request performance
 */
export function useAPIPerformanceTracker() {
  const requests = useRef([]);

  const trackRequest = (endpoint, duration, cached = false) => {
    requests.current.push({ endpoint, duration, cached, timestamp: Date.now() });

    if (PERFORMANCE_CONFIG.DEBUG_PERFORMANCE) {
      logPerformance(`API Request: ${endpoint}`, {
        duration: `${duration}ms`,
        cached: cached ? 'Yes (instant)' : 'No',
        totalRequests: requests.current.length
      });
    }
  };

  const getStats = () => {
    if (requests.current.length === 0) return null;

    const cachedCount = requests.current.filter(r => r.cached).length;
    const avgDuration = requests.current
      .filter(r => !r.cached)
      .reduce((sum, r) => sum + r.duration, 0) / (requests.current.length - cachedCount || 1);

    return {
      totalRequests: requests.current.length,
      cachedRequests: cachedCount,
      cacheHitRate: `${((cachedCount / requests.current.length) * 100).toFixed(1)}%`,
      avgDuration: `${avgDuration.toFixed(2)}ms`
    };
  };

  return { trackRequest, getStats };
}
