import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen, FiChevronDown, FiChevronUp, FiCloudRain, FiDroplet,
  FiEdit3, FiSend, FiZap
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/agrisathi-mark.svg';
import config from '../config/config';
import '../styles/Chatbot.css';

const prompts = [
  { icon: FiDroplet, label: 'Irrigation', question: 'How should I plan irrigation for my crop this week?' },
  { icon: FiBookOpen, label: 'Plant health', question: 'What are the early signs of disease I should watch for?' },
  { icon: FiCloudRain, label: 'Weather', question: 'How can I protect crops during heavy monsoon rain?' },
  { icon: FiZap, label: 'Soil', question: 'How can I improve soil fertility using organic methods?' }
];

function Chatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState(() => new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const renderInlineText = (text) => text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part
  );

  const renderMessage = (text) => {
    const lines = text.split('\n');
    const content = [];
    let list = [];
    let listType = 'ul';
    const flushList = () => {
      if (!list.length) return;
      const List = listType;
      content.push(<List key={`list-${content.length}`}>{list.map((line, index) => <li key={index}>{renderInlineText(line)}</li>)}</List>);
      list = [];
    };
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || /^-{3,}$/.test(trimmed)) { flushList(); return; }
      if (/^[-*•]\s/.test(trimmed)) {
        if (list.length && listType !== 'ul') flushList();
        listType = 'ul';
        list.push(trimmed.replace(/^[-*•]\s/, ''));
        return;
      }
      if (/^\d+[.)]\s/.test(trimmed)) {
        if (list.length && listType !== 'ol') flushList();
        listType = 'ol';
        list.push(trimmed.replace(/^\d+[.)]\s/, ''));
        return;
      }
      flushList();
      if (/^#{1,6}\s/.test(trimmed)) content.push(<h4 key={index}>{renderInlineText(trimmed.replace(/^#{1,6}\s/, ''))}</h4>);
      else content.push(<p key={index}>{renderInlineText(trimmed)}</p>);
    });
    flushList();
    return content;
  };

  useEffect(() => {
    if (!user) { setIsInitializing(false); return; }
    initializeChat();
    fetchAiStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: isInitializing ? 'auto' : 'smooth' }); }, [messages, isTyping, isInitializing]);

  const initializeChat = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.chatbot.history), config.getFetchConfig());
      if (!response.ok) throw new Error('Could not load conversation');
      const data = await response.json();
      setMessages(data.data.length ? data.data : [{ from: 'bot', text: `Welcome, ${user.name}. What would you like to work through today?`, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages([{ from: 'bot', text: 'Welcome to AgriSathi AI. What would you like to work through today?', timestamp: new Date().toISOString() }]);
    } finally {
      setIsInitializing(false);
    }
  };

  const fetchAiStatus = async () => {
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.chatbot.status));
      if (response.ok) setAiStatus((await response.json()).data);
    } catch { setAiStatus(null); }
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);
    setIsTyping(true);
    setError(null);
    setMessages((current) => [...current, { from: 'user', text: textToSend, timestamp: new Date().toISOString() }]);
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.chatbot.message), config.getFetchConfig({ method: 'POST', body: JSON.stringify({ message: textToSend }) }));
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Failed to get a response');
      setMessages((current) => [...current, data.data.botMessage]);
    } catch (sendError) {
      setError(sendError.message);
      setMessages((current) => [...current, { from: 'bot', text: 'I could not complete that answer. Please try again or ask the question another way.', timestamp: new Date().toISOString(), isError: true }]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 124)}px`;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Start a new conversation and clear this history?')) return;
    try {
      const response = await fetch(config.getApiUrl(config.endpoints.chatbot.history), config.getFetchConfig({ method: 'DELETE' }));
      if (!response.ok) throw new Error('Could not clear conversation');
      setMessages([{ from: 'bot', text: `Fresh start, ${user.name}. What would you like to solve?`, timestamp: new Date().toISOString() }]);
      setExpandedMessages(new Set());
    } catch (clearError) { setError(clearError.message); }
  };

  const toggleExpanded = (index) => {
    setExpandedMessages((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const isFreshConversation = messages.length <= 1;

  if (!user) {
    return <div className="assistant-page page-shell"><div className="assistant-auth"><img src={logo} alt="" /><span className="eyebrow">AgriSathi intelligence</span><h1>Your field assistant is ready.</h1><p>Sign in to ask questions and keep your agricultural conversations available between visits.</p><Link to="/login" className="button button-primary">Sign in to continue</Link></div></div>;
  }

  return (
    <div className="assistant-page page-shell">
      <section className="assistant-shell">
        <header className="assistant-header">
          <div className="assistant-identity"><span className="assistant-mark"><img src={logo} alt="" /><i /></span><div><span className="assistant-kicker">AGRICULTURAL INTELLIGENCE</span><h1>Ask AgriSathi</h1></div></div>
          <div className="assistant-header-meta"><span className="assistant-online"><i /> Online{aiStatus?.model ? ` · ${aiStatus.model}` : ''}</span><button onClick={clearChat} title="Start a new conversation"><FiEdit3 /><span>New conversation</span></button></div>
        </header>

        <div className="conversation-window">
          {isInitializing ? <div className="conversation-loading"><span /><p>Opening your field notebook…</p></div> : (
            <div className="conversation-stream" aria-live="polite">
              {isFreshConversation && <div className="conversation-welcome"><span className="welcome-icon"><FiEdit3 /></span><span className="eyebrow">A clear place to think</span><h2>What are we growing through today?</h2><p>Ask about a crop, symptom, soil condition, weather risk, or farm decision. Give useful details for a more specific answer.</p></div>}

              {!isFreshConversation && messages.map((message, index) => {
                const isLong = message.from === 'bot' && message.text.length > 700;
                const expanded = expandedMessages.has(index);
                return <article key={`${message.timestamp}-${index}`} className={`conversation-message ${message.from} ${message.isError ? 'error' : ''}`}>
                  <div className="message-avatar">{message.from === 'bot' ? <img src={logo} alt="" /> : user.name.charAt(0).toUpperCase()}</div>
                  <div className="message-body">
                    <div className="message-meta"><strong>{message.from === 'bot' ? 'AgriSathi' : 'You'}</strong><time>{formatTimestamp(message.timestamp)}</time></div>
                    <div className={`message-text ${isLong ? 'collapsible' : ''} ${expanded ? 'expanded' : ''}`}>{message.from === 'bot' ? renderMessage(message.text) : message.text}</div>
                    {isLong && <button className="expand-answer" onClick={() => toggleExpanded(index)}>{expanded ? <><FiChevronUp /> Show less</> : <><FiChevronDown /> Read complete answer</>}</button>}
                  </div>
                </article>;
              })}

              {isTyping && <article className="conversation-message bot typing"><div className="message-avatar"><img src={logo} alt="" /></div><div className="message-body"><div className="message-meta"><strong>AgriSathi</strong><span>Thinking through your question</span></div><div className="typing-indicator"><i /><i /><i /></div></div></article>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="assistant-composer">
          <div className="prompt-rail" aria-label="Suggested agricultural questions">
            {prompts.map(({ icon: Icon, label, question }) => <button key={label} onClick={() => sendMessage(question)} disabled={isLoading}>{React.createElement(Icon)}<span>{label}</span></button>)}
          </div>
          {error && <div className="assistant-error"><span>{error}</span><button onClick={() => setError(null)}>Dismiss</button></div>}
          <div className="composer-box">
            <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask about your crop, symptoms, soil, or weather…" disabled={isLoading} rows={1} />
            <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} aria-label="Send message"><FiSend /></button>
          </div>
          <div className="composer-note"><span>Enter to send · Shift + Enter for a new line</span><span>General guidance—verify chemical treatment with a local expert.</span></div>
        </footer>
      </section>
    </div>
  );
}

export default Chatbot;
