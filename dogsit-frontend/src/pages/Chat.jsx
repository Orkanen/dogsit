import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import api from "../api/index";

const messageStyle = (isOwn) => ({
  maxWidth: '70%',
  padding: '0.75rem 1rem',
  margin: '0.5rem 0',
  borderRadius: '18px',
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  background: isOwn ? '#f59e0b' : '#e5e7eb',
  color: isOwn ? 'white' : 'black',
});

export default function Chat() {
  const { matchId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const messagesEndRef = useRef(null);
  const socket = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await api.getMessages(matchId, localStorage.getItem('token'));
        setMessages(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMessages();

    socket.current = getSocket();
    socket.current.emit('join-match', parseInt(matchId));

    socket.current.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.current?.off('new-message');
      socket.current?.emit('leave-match', parseInt(matchId));
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.current.emit('send-message', {
      matchId: parseInt(matchId),
      message: input.trim()
    });
    setInput('');
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading chat...</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <Link to="/matches" style={{ color: '#1d4ed8', textDecoration: 'underline' }}>
        ← Back to Matches
      </Link>

      <div style={{
        height: '70vh',
        overflowY: 'auto',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '8px',
        margin: '1rem 0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender.id === user.id ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              {msg.sender.id === user.id ? 'You' : msg.sender.profile?.firstName || 'User'}
            </div>
            <div style={messageStyle(msg.sender.id === user.id)}>
              {msg.message}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', textAlign: msg.sender.id === user.id ? 'right' : 'left' }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}