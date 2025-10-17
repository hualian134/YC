import { useState } from 'react';
import { User as UserIcon, Lock } from 'lucide-react';
import { loginUser } from '../services/authService';

interface LoginPageProps {
    onSuccess: (userId: string) => void;
    onSwitchToRegister: () => void;
}

export default function LoginPage({ onSuccess, onSwitchToRegister }: LoginPageProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        if (!phoneNumber || !password) {
            setError('Please fill all fields');
            return;
        }

        setLoading(true);
        const result = await loginUser(phoneNumber, password);
        setLoading(false);

        if (result.user) {
            onSuccess(result.user.id);
        } else {
            setError(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    {/* <div className="text-6xl mb-4">🌾</div> */}
                    <div className="text-6xl mb-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '15vh' }}>
                        <img src='https://ptkubzirhhyzsjhbfloe.supabase.co/storage/v1/object/public/chat-images/logo.png' alt="yaung chi"
                        style={{ width: '200px', height: '150px', }}/>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Yaung Chi</h1>
                    <p className="text-gray-600">AI Agriculture Assistant</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label>Phone Number</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
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

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="text-center text-sm text-gray-600 mt-2">
                        Don't have an account?{' '}
                        <button onClick={onSwitchToRegister} className="text-green-600">
                            Register
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
