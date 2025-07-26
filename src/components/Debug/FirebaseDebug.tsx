import React, { useState } from 'react';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const FirebaseDebug: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setDebugInfo(null);

    try {
      console.log('🔍 Testando conexão Firebase...');
      
      // Teste 1: Verificar configuração
      console.log('📋 Configuração Firebase:', {
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId
      });

      // Teste 2: Tentar login
      console.log('🔐 Tentando login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login bem-sucedido:', userCredential.user.uid);

      // Teste 3: Verificar dados do usuário no Firestore
      console.log('📊 Verificando dados do usuário...');
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
      
      console.log('👤 Dados do usuário:', userData);

      setDebugInfo({
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          emailVerified: userCredential.user.emailVerified
        },
        userData: userData,
        message: 'Login realizado com sucesso!'
      });

    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      setDebugInfo({
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md z-50">
      <h3 className="font-bold text-lg mb-4">🔧 Debug Firebase</h3>
      
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          onClick={testConnection}
          disabled={loading || !email || !password}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>
      </div>

      {debugInfo && (
        <div className="mt-4 p-3 rounded text-sm">
          {debugInfo.success ? (
            <div className="bg-green-100 text-green-800">
              <div className="font-bold">✅ Sucesso!</div>
              <div>UID: {debugInfo.user.uid}</div>
              <div>Email: {debugInfo.user.email}</div>
              <div>Verificado: {debugInfo.user.emailVerified ? 'Sim' : 'Não'}</div>
              {debugInfo.userData ? (
                <div>Role: {debugInfo.userData.role || 'Não definido'}</div>
              ) : (
                <div className="text-orange-600">⚠️ Dados do usuário não encontrados no Firestore</div>
              )}
            </div>
          ) : (
            <div className="bg-red-100 text-red-800">
              <div className="font-bold">❌ Erro</div>
              <div>Código: {debugInfo.error.code}</div>
              <div>Mensagem: {debugInfo.error.message}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FirebaseDebug;