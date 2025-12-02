import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from "@/api";
import DisclaimerModal from '@/components/ui/DisclaimerModal';
import "@/styles/pages/_register.scss";

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', roleNames: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'roleNames') {
      setForm(prev => ({
        ...prev,
        roleNames: checked
          ? [...prev.roleNames, value]
          : prev.roleNames.filter(r => r !== value)
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const openDisclaimer = (e) => {
    e.preventDefault();
    setShowDisclaimer(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password || form.roleNames.length === 0) {
      setError('Email, password, and at least one role required');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Safety Disclaimer.');
      return;
    }

    setLoading(true);
    try {
      await api.register(form.email, form.password, form.roleNames);
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-page__card">
        <h2>Create Your Account</h2>

        {error && <div className="register-page__error">{error}</div>}

        <form onSubmit={handleSubmit} className="register-page__form">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="register-page__input"
            required
            disabled={loading}
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="register-page__input"
            required
            disabled={loading}
          />

          <div className="register-page__roles">
            <p>Choose your role(s):</p>
            {['owner', 'sitter'].map(role => (
              <label key={role}>
                <input
                  type="checkbox"
                  name="roleNames"
                  value={role}
                  checked={form.roleNames.includes(role)}
                  onChange={handleChange}
                  disabled={loading}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>

          <label className="register-page__agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            I have read and agree to the{' '}
            <a href="#" onClick={openDisclaimer}>Safety Disclaimer</a>.
          </label>

          <button type="submit" className="register-page__button" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <div className="register-page__footer">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>

      <DisclaimerModal isOpen={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </div>
  );
}