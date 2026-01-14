import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isEmailLink, setIsEmailLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      router.push('/auth/complete');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEmailLink) {
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/complete`,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setEmailSent(true);
        toast.success('Sign-in link sent to your email!');
      } else if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Logged in successfully!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-dark mb-2">LED</h1>
          <p className="text-gray-600">WhatsApp Bot Deployment Platform</p>
        </div>

        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="text-green-600 text-lg">📧</div>
            <p className="text-gray-600">Check your email and click the sign-in link!</p>
            <button
              onClick={() => { setEmailSent(false); setIsEmailLink(false); }}
              className="text-secondary hover:underline"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            {!isEmailLink && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Loading...' : isEmailLink ? 'Send Sign-in Link' : isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>
        )}

        {!emailSent && (
          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setIsEmailLink(false); }}
              className="text-secondary hover:underline block w-full"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
            <button
              onClick={() => { setIsEmailLink(!isEmailLink); setIsSignUp(false); }}
              className="text-secondary hover:underline block w-full"
            >
              {isEmailLink ? 'Use password instead' : 'Sign in with email link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
