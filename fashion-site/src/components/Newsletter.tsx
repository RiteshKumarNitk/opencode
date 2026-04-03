'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setMessage('Thanks for subscribing! You\'ll receive exclusive deals in your inbox.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="py-16 bg-indigo-600">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-3">Subscribe to Our Newsletter</h2>
        <p className="text-indigo-200 mb-8">Get exclusive deals and updates straight to your inbox</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-xl mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 disabled:opacity-70 transition"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-200' : 'text-red-200'}`}>
            {message}
          </p>
        )}
      </div>
    </section>
  );
}