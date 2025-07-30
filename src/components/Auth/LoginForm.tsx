import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, User, Play, Zap } from 'lucide-react';
import { useFirebase } from '../../hooks/useFirebase';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await login(email, password);
        console.log('✅ Login realizado com sucesso:', user.uid);
      } else {
        const user = await register(email, password, displayName);
        console.log('✅ Registro realizado com sucesso:', user.uid);
      }
      onSuccess();
    } catch (err: any) {
      console.error('❌ Erro de autenticação:', err);
      // Traduzir erros comuns do Firebase
      let errorMessage = err.message;
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta';
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou senha inválidos. Verifique suas credenciais.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl mb-6 shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
            <Play className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            SIS<span className="text-yellow-400">LOGUER</span>
          </h1>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center transform -rotate-12">
              <span className="text-black font-bold text-sm">START</span>
            </div>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          
          <p className="text-blue-100 text-lg font-medium">
            {isLogin ? 'DADOS DE ACESSO' : 'CRIAR CONTA'}
          </p>
          
          <div className="mt-6 text-center">
            <p className="text-white/80 text-sm">USO AUTORIZADO POR</p>
            <p className="text-white font-bold text-lg tracking-wider">
              Indevice Produções
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/15 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    placeholder="NOME COMPLETO"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="USUÁRIO"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70">
                  🔒
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/70 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  placeholder="SENHA"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-900 focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-2xl"
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>ENTRANDO...</span>
                </div>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>ENTRAR</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
            >
              {isLogin
                ? "Não tem conta? Criar nova conta"
                : 'Já tem conta? Fazer login'}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="bg-cyan-400/20 backdrop-blur-sm rounded-2xl p-4 border border-cyan-400/30">
            <p className="text-cyan-100 text-sm font-medium">
              © 2025 INDEVICE PRODUCOES, EVENTOS, COMUNICACAO E ARTISTICO LTDA - ME<br />
              CNPJ: 48.379.142/0001-38<br />
              Todos os direitos reservados. O uso não autorizado deste software é proibido e sujeito às penalidades da lei<br />
              Registro Nº: 000984.0247118/2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;