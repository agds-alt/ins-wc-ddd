// src/hooks/usePerformance.ts - Monitor performance metrics
import { useEffect } from 'react';
import { logger } from '../lib/logger';

export const usePerformance = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    logger.debug(`Component mounted: ${componentName}`);

    return () => {
      const duration = performance.now() - startTime;
      logger.debug(`Component unmounted: ${componentName}`, {
        lifetime: `${duration.toFixed(2)}ms`,
      });
    };
  }, [componentName]);

  // Track page load performance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const logPagePerformance = () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (perfData) {
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          ttfb: perfData.responseStart - perfData.requestStart,
          download: perfData.responseEnd - perfData.responseStart,
          domParse: perfData.domInteractive - perfData.responseEnd,
          domReady: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          onload: perfData.loadEventEnd - perfData.loadEventStart,
          total: perfData.loadEventEnd - perfData.fetchStart,
        };

        logger.info('Page performance', {
          url: window.location.pathname,
          metrics: Object.entries(metrics).map(([key, value]) => 
            `${key}: ${value.toFixed(2)}ms`
          ).join(', '),
          slowPage: metrics.total > 3000,
        });

        // Warn about slow metrics
        if (metrics.ttfb > 800) {
          logger.warn('Slow Time To First Byte (TTFB)', {
            ttfb: `${metrics.ttfb.toFixed(2)}ms`,
            threshold: '800ms',
          });
        }

        if (metrics.total > 3000) {
          logger.warn('Slow page load', {
            total: `${metrics.total.toFixed(2)}ms`,
            threshold: '3000ms',
          });
        }
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      logPagePerformance();
    } else {
      window.addEventListener('load', logPagePerformance);
      return () => window.removeEventListener('load', logPagePerformance);
    }
  }, []);
};

// Track specific operations
export const useOperationTimer = () => {
  return (label: string) => {
    return logger.startTimer(label);
  };
};

// Track API calls
export const logApiCall = (
  method: string,
  url: string,
  startTime: number,
  status?: number,
  error?: any
) => {
  const duration = performance.now() - startTime;
  
  if (error) {
    logger.error(`API ${method} ${url} failed`, {
      method,
      url,
      duration: `${duration.toFixed(2)}ms`,
      error: error.message || error,
    });
  } else {
    const level = status && status >= 400 ? 'warn' : 'info';
    logger[level](`API ${method} ${url}`, {
      status,
      duration: `${duration.toFixed(2)}ms`,
      slow: duration > 1000,
    });
  }
};