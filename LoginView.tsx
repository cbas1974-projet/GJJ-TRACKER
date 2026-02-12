import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, Mail, Loader2, ArrowRight, UserPlus, LogIn, User, Eye, EyeOff } from 'lucide-react';

interface LoginViewProps {
    onLoginAsGuest?: () => void;
    onSignUp?: (email: string, password: string, name: string) => Promise<{ error?: string }>;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginAsGuest, onSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // La redirection est gérée automatiquement par onAuthStateChange dans useGJJData
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Email ou mot de passe incorrect.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setMessage({ type: 'error', text: 'Veuillez entrer votre prénom.' });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            if (onSignUp) {
                const result = await onSignUp(email, password, name.trim());
                if (result.error) throw new Error(result.error);
            } else {
                // Fallback si onSignUp n'est pas fourni
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (data.user) {
                    await supabase.from('profiles').insert({
                        id: data.user.id,
                        display_name: name.trim(),
                        role: 'student'
                    });
                }
            }
            setMessage({ type: 'success', text: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.' });
            setIsSignUp(false);
            setPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erreur lors de la création du compte.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        {isSignUp ? (
                            <UserPlus className="text-green-500" size={32} />
                        ) : (
                            <Lock className="text-blue-500" size={32} />
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">
                        {isSignUp ? 'Créer un Compte' : 'Connexion GJJ Tracker'}
                    </h1>
                    <p className="text-slate-400 text-sm">
                        {isSignUp
                            ? 'Entrez votre prénom, email et un mot de passe pour vous inscrire.'
                            : 'Entrez votre email et mot de passe pour accéder à votre profil.'
                        }
                    </p>
                </div>

                <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
                    {/* Champ Prénom (visible uniquement en mode inscription) */}
                    {isSignUp && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prénom</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Votre prénom"
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-2.5 pl-10 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Champ Email */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-2.5 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Champ Mot de passe */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Bouton principal */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${isSignUp
                                ? 'bg-green-600 hover:bg-green-500 text-white'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : isSignUp ? (
                            <>
                                <UserPlus size={18} className="mr-2" /> Créer mon compte
                            </>
                        ) : (
                            <>
                                <LogIn size={18} className="mr-2" /> Se connecter
                            </>
                        )}
                    </button>

                    {/* Toggle entre Login et Sign Up */}
                    <div className="pt-4 border-t border-slate-800 mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setMessage(null);
                            }}
                            className="text-slate-400 hover:text-white text-sm font-semibold transition-colors"
                        >
                            {isSignUp ? '← Déjà un compte ? Se connecter' : 'Nouveau ? Créer un compte →'}
                        </button>
                    </div>

                    {/* Mode Invité (Démo) */}
                    {onLoginAsGuest && (
                        <div className="pt-2 border-t border-slate-800 mt-2">
                            <button
                                type="button"
                                onClick={onLoginAsGuest}
                                className="w-full text-slate-500 hover:text-slate-300 text-xs font-semibold py-2 transition-colors flex items-center justify-center gap-2"
                            >
                                🧪 Mode Invité / Démo (Hors-ligne)
                            </button>
                        </div>
                    )}
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-lg text-sm flex items-start ${message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-900/50' : 'bg-red-900/20 text-red-300 border border-red-900/50'}`}>
                        {message.type === 'success' ? <div className="text-xl mr-2">✅</div> : <div className="text-xl mr-2">⚠️</div>}
                        <div>{message.text}</div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                        Vos données seront synchronisées et sécurisées dans le cloud.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
