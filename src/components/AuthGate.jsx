import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';

/** Single-owner sign-in. Financial endpoints remain protected on the server. */
export default function AuthGate({ children }) {
  const [state, setState] = useState('checking');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const checkSession = useCallback(async () => {
    setState('checking');
    setMessage('');
    try {
      await api.session();
      setState('authenticated');
    } catch (error) {
      setState('signed-out');
      if (error.status !== 401) setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    checkSession();
    const onAuthRequired = () => {
      setPassword('');
      setMessage('Your session ended. Please sign in again.');
      setState('signed-out');
    };
    window.addEventListener('finsight:auth-required', onAuthRequired);
    return () => window.removeEventListener('finsight:auth-required', onAuthRequired);
  }, [checkSession]);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await api.login(password);
      setPassword('');
      setState('authenticated');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await api.logout();
      setPassword('');
      setMessage('');
      setState('signed-out');
    } catch {
      window.alert('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'authenticated') return children({ onLogout: handleLogout });

  return (
    <main className="fs-auth-screen">
      <div className="fs-auth-aura fs-auth-aura-violet" aria-hidden="true" />
      <div className="fs-auth-aura fs-auth-aura-cyan" aria-hidden="true" />
      <section className="fs-card fs-card-pad fs-auth-card" aria-labelledby="auth-title">
        <div className="fs-auth-brand">
          <span className="fs-auth-brand-icon"><ShieldCheck size={20} /></span>
          <span>FIN<span>SIGHT</span></span>
        </div>
        <div className="fs-auth-icon"><LockKeyhole size={24} /></div>
        <div className="fs-eyebrow">YOUR PRIVATE WORKSPACE</div>
        <h1 id="auth-title">Welcome back.</h1>
        <p className="fs-auth-copy">Sign in to open your financial command center.</p>
        {state === 'checking' ? (
          <p className="fs-sm fs-dim" role="status">Checking your session…</p>
        ) : (
          <form onSubmit={handleLogin}>
            <label className="fs-field" htmlFor="finsight-password">
              <span className="fs-label">Workspace password</span>
              <input
                className="fs-input"
                id="finsight-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </label>
            {message && <p className="fs-auth-error" role="alert">{message}</p>}
            <button className="fs-btn fs-btn-primary fs-btn-lg fs-btn-block" type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Open FinSight'} <ArrowRight size={16} />
            </button>
          </form>
        )}
        <div className="fs-auth-foot"><ShieldCheck size={14} /> Your workspace is password protected</div>
      </section>
    </main>
  );
}
