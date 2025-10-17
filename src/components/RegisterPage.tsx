import { useState } from 'react';
import { Phone, User, Lock } from 'lucide-react';
import { sendVerificationCode, registerUser } from '../services/authService';

interface RegisterPageProps {
  onSuccess: (userId: string) => void;
  onSwitchToLogin: () => void;
}

export default function RegisterPage({ onSuccess, onSwitchToLogin }: RegisterPageProps) {
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setError('');
    if (!phoneNumber || !username || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await sendVerificationCode(phoneNumber);
    setLoading(false);

    if (result.success) {
      setStep('verification');
    } else {
      setError(result.error || 'Failed to send verification code');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerifyAndRegister = async () => {
    setError('');
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    const result = await registerUser(phoneNumber, username, password, fullCode);
    setLoading(false);

    if (result.user) {
      onSuccess(result.user.id);
    } else {
      setError(result.error || 'Registration failed');
    }
  };
  
  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    const result = await sendVerificationCode(phoneNumber);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to resend code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          {/* <div className="text-6xl mb-4">🌾</div> */}
          <div className="text-6xl mb-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '15vh' }}>
                        <img src='src/images/logo.png' alt="yaung chi"
                        style={{ width: '200px', height: '150px', }}/>
          </div>
          <h1 className="text-3xl font-bold mb-2">Yaung Chi</h1>
          <p className="text-gray-600">AI Agriculture Assistant</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label>Full Name / Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 py-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  className="w-full pl-10 py-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 py-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label>Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 py-2 border rounded"
                />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              {loading ? 'Sending...' : 'Get OTP'}
            </button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-green-600">
                Login
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-gray-600">Enter 6-digit code sent to {phoneNumber}</p>
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  className="w-12 h-12 text-center border rounded"
                />
              ))}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={handleVerifyAndRegister}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              {loading ? 'Verifying...' : 'Verify & Register'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>

            <button onClick={() => setStep('phone')} className="text-gray-600 text-sm mt-2">
              Change Phone Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
