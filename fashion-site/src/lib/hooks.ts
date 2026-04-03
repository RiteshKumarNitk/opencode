import { useState, useEffect, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export function useComparison() {
  const [compareList, setCompareList] = useLocalStorage<string[]>('compare_list', []);

  const addToCompare = useCallback((productId: string) => {
    setCompareList((prev) => {
      if (prev.length >= 4) return prev;
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  }, [setCompareList]);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareList((prev) => prev.filter((id) => id !== productId));
  }, [setCompareList]);

  const isInCompare = useCallback((productId: string) => {
    return compareList.includes(productId);
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, [setCompareList]);

  return { compareList, addToCompare, removeFromCompare, isInCompare, clearCompare };
}

export function useChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ id: string; text: string; isUser: boolean; timestamp: Date }[]>([
    { id: '1', text: 'Hello! How can I help you today?', isUser: false, timestamp: new Date() },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((text: string) => {
    const userMessage = { id: Date.now().toString(), text, isUser: true, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botResponse = { 
        id: (Date.now() + 1).toString(), 
        text: getAutoReply(text), 
        isUser: false, 
        timestamp: new Date() 
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1500);
  }, []);

  return { isOpen, setIsOpen, messages, sendMessage, isTyping };
}

function getAutoReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('order') || lower.includes('track')) return "You can track your order in the Orders section. Would you like me to help you with that?";
  if (lower.includes('return')) return "We offer easy returns within 30 days. Go to Orders > Return Request to initiate.";
  if (lower.includes('shipping') || lower.includes('delivery')) return "Standard shipping takes 5-7 business days. Express delivery available at checkout.";
  if (lower.includes('payment') || lower.includes('pay')) return "We accept COD, Cards, UPI, and Wallets. All payments are secure!";
  if (lower.includes('hello') || lower.includes('hi')) return "Hi there! How can I assist you today?";
  return "Thanks for reaching out! Is there anything specific I can help you with?";
}

export function useNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const subscribe = useCallback(async () => {
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! 🎉');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  }, [email]);

  return { email, setEmail, status, message, subscribe };
}