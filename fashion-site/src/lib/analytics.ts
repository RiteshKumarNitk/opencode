'use client';

import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const trackEvent = useCallback(async (eventType: string, metadata?: Record<any, any>) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, metadata }),
      });
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, []);

  const trackPageView = useCallback((page: string) => {
    trackEvent('page_view', { page, referrer: document.referrer });
  }, [trackEvent]);

  const trackProductView = useCallback((productId: string, productName: string, category?: string) => {
    trackEvent('product_view', { productId, productName, category, source: 'direct' });
  }, [trackEvent]);

  const trackAddToCart = useCallback((productId: string, price: number, quantity: number) => {
    trackEvent('add_to_cart', { productId, price, quantity });
  }, [trackEvent]);

  const trackBeginCheckout = useCallback((cartValue: number, itemCount: number) => {
    trackEvent('begin_checkout', { cartValue, itemCount });
  }, [trackEvent]);

  const trackPurchase = useCallback((orderId: string, value: number, currency: string = 'INR') => {
    trackEvent('purchase', { orderId, value, currency });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent('search', { query, resultsCount });
  }, [trackEvent]);

  const trackClick = useCallback((element: string, target: string) => {
    trackEvent('click', { element, target });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackProductView,
    trackAddToCart,
    trackBeginCheckout,
    trackPurchase,
    trackSearch,
    trackClick,
  };
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const page = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'page_view',
        metadata: { page, referrer: typeof window !== 'undefined' ? document.referrer : '' },
      }),
    }).catch(() => {});
  }, [pathname, searchParams]);

  return <>{children}</>;
}

export default useAnalytics;