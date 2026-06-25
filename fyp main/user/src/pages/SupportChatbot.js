import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../config/api';

const quickSuggestions = [
  'How do I register?',
  'How does fingerprint setup work?',
  'How do I login with face recognition?',
  'My friend wants to use the same laptop',
  'How do I cast my vote?',
  'I lost my device. What now?'
];

const pageShell = {
  minHeight: '100vh',
  background:
    'linear-gradient(180deg, #f8fbfa 0%, #edf5f4 100%)',
  padding: '2rem 1rem 3rem'
};

const panelSurface = {
  background: 'rgba(255,255,255,0.94)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  boxShadow: '0 24px 60px rgba(15, 23, 42, 0.10)',
  borderRadius: 28
};

const SupportChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content:
        'Hello. I am your iVotePK support assistant. You can ask me about registration, fingerprint, face recognition, login, recovery, elections, candidates, and secure voting.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const helperHints = useMemo(
    () => ['Ask step by step', 'Ask in simple words', 'Ask about website pages only'],
    []
  );

  const handleSend = async (event) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    const text = newMessage.trim();
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    setTimeout(async () => {
      try {
        const history = messages.slice(-10).map((message) => ({
          role: message.type === 'assistant' ? 'assistant' : 'user',
          text: message.content
        }));

        const res = await fetch(`${API_BASE}/api/public/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history })
        });
        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'assistant',
            content: (res.ok && data?.success && data?.reply) || 'I am sorry, I could not answer that just now.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'assistant',
            content: 'I am sorry, the support service is temporarily unavailable. Please try again in a moment.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 450);
  };

  return (
    <div style={pageShell}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <section
          style={{
            ...panelSurface,
            background:
              'linear-gradient(135deg, rgba(15, 77, 58, 0.98) 0%, rgba(21, 111, 99, 0.96) 58%, rgba(30, 64, 175, 0.94) 100%)',
            color: 'white',
            padding: '30px 26px',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
            <div style={{ flex: '1 1 320px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', fontWeight: 700, marginBottom: 18 }}>
                Human-Like Support
              </div>
              <h1 style={{ color: 'white', margin: 0, fontSize: '2.3rem' }}>Voter Support Chatbot</h1>
              <p style={{ color: 'rgba(255,255,255,0.88)', margin: '10px 0 0 0', maxWidth: 760 }}>
                Ask natural questions about the iVotePK website and get short, helpful answers about registration, biometrics, login, recovery, elections, candidates, and voting.
              </p>
            </div>
            <div style={{ flex: '0 0 320px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{ padding: 18, borderRadius: 32, background: 'rgba(255,255,255,0.10)', boxShadow: '0 18px 48px rgba(0,0,0,0.16)' }}>
                <img
                  src="/assets/bot.png"
                  alt="Chatbot"
                  style={{
                    width: 260,
                    maxWidth: '100%',
                    height: 'auto',
                    display: 'block',
                    borderRadius: 22,
                    boxShadow: '0 12px 30px rgba(0,0,0,0.12)'
                  }}
                />
              </div>
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.88)', margin: '10px 0 0 0', maxWidth: 760 }}>
            Ask natural questions about the iVotePK website and get short, helpful answers about registration, biometrics, login, recovery, elections, candidates, and voting.
          </p>
        </section>

        <div style={{ ...panelSurface, padding: '18px 18px 0 18px' }}>
          <p style={{ color: '#64748b', marginTop: 0, marginBottom: 12 }}>{helperHints.join(' • ')}</p>

          <div
            style={{
              height: '62vh',
              overflowY: 'auto',
              padding: '6px 4px 14px'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 12
                }}
              >
                <div
                  style={{
                    maxWidth: '78%',
                    padding: '12px 14px',
                    borderRadius: 18,
                    background: message.type === 'user' ? 'linear-gradient(135deg, #0f766e, #065f46)' : '#f1f5f9',
                    color: message.type === 'user' ? '#ffffff' : '#1e293b',
                    boxShadow: message.type === 'user' ? '0 12px 24px rgba(15,118,110,0.18)' : 'none'
                  }}
                >
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{message.content}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>{message.timestamp}</div>
                </div>
              </div>
            ))}

            {isTyping && <div style={{ color: '#64748b', fontSize: 13 }}>Assistant is typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setNewMessage(suggestion)}
                style={{
                  border: '1px solid #dbe7f3',
                  background: '#ffffff',
                  borderRadius: 999,
                  padding: '7px 12px',
                  cursor: 'pointer',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <p style={{ color: '#475569', marginBottom: 10, fontSize: 14 }}>Responses may take a few seconds while the assistant checks iVotePK website guidance and backend AI support.</p>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, paddingBottom: 18 }}>
            <input
              type="text"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Ask anything about the iVotePK website..."
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: 16,
                padding: '13px 14px'
              }}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping}
              style={{
                border: 'none',
                background: isTyping ? '#94a3b8' : 'linear-gradient(135deg, #0f766e, #065f46)',
                color: '#fff',
                borderRadius: 16,
                padding: '13px 18px',
                cursor: isTyping ? 'not-allowed' : 'pointer',
                fontWeight: 800
              }}
            >
              {isTyping ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SupportChatbot;
