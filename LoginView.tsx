import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

interface LoginViewProps {
    onLoginAsGuest?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginAsGuest }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    // Pour le dev local, on peut rediriger vers localhost
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Lien de connexion envoyé ! Vérifiez vos emails.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <Lock className="text-blue-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Connexion GJJ Tracker</h1>
                    <p className="text-slate-400 text-sm">
                        Entrez votre email pour recevoir un lien de connexion magique ("Magic Link"). Pas de mot de passe à retenir !
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : (
                            <>
                                Recevoir le lien <ArrowRight className="ml-2" size={18} />
                            </>
                        )}
                    </button>

                    {onLoginAsGuest && (
                        <div className="pt-4 border-t border-slate-800 mt-4">
                            <button
                                type="button"
                                onClick={onLoginAsGuest}
                                className="w-full text-slate-400 hover:text-white text-sm font-semibold py-2 transition-colors flex items-center justify-center gap-2"
                            >
                                🧪 Mode Invité / Démo (Hors-ligne)
                            </button>
                        </div>
                    )}
                </form>

                {message && (
                    <div className={`mt-6 p-4 rounded-lg text-sm flex items-start ${message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-900/50' : 'bg-red-900/20 text-red-300 border border-red-900/50'}`}>
                        {message.type === 'success' ? <div className="text-xl mr-2">📧</div> : <div className="text-xl mr-2">⚠️</div>}
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
