import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, LogEntry, Participant, Location, ActionCategory, Tag } from '../types';

export const useFirebase = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData.displayName,
              role: userData.role || 'viewer',
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastActive: new Date().toISOString()
            });
          } else {
            // Create user document if it doesn't exist
            const newUser = {
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              role: 'viewer' as const,
              createdAt: serverTimestamp(),
              lastActive: serverTimestamp()
            };
            
            await setDoc(userRef, newUser);
            
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: newUser.displayName,
              role: newUser.role,
              createdAt: new Date().toISOString(),
              lastActive: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string, role: 'admin' | 'logger' | 'viewer' = 'viewer') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Save user data to Firestore
      const userRef = doc(db, 'users', result.user.uid);
      await setDoc(userRef, {
        email,
        displayName,
        role,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      return result.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  const addLogEntry = async (entry: Omit<LogEntry, 'id' | 'createdAt' | 'createdBy'>) => {
    if (!currentUser) throw new Error('User not authenticated');

    const logRef = collection(db, 'logEntries');
    
    const docRef = await addDoc(logRef, {
      ...entry,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('✅ Nova entrada criada com ID:', docRef.id);
    return docRef.id;
  };

  const updateLogEntry = async (entryId: string, updates: Partial<LogEntry>) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🔄 Tentando atualizar entrada:', entryId, updates);
      
      // Usar o ID exato do documento
      const entryRef = doc(db, 'logEntries', entryId);
      const entrySnap = await getDoc(entryRef);

      if (!entrySnap.exists()) {
        console.error('❌ Documento não encontrado:', entryId);
        
        // Listar todos os documentos para debug
        const logEntriesRef = collection(db, 'logEntries');
        const snapshot = await getDocs(logEntriesRef);
        
        console.log('📋 IDs disponíveis na coleção:');
        snapshot.forEach((doc) => {
          console.log('  -', doc.id);
        });
        
        throw new Error(`Entrada não encontrada no banco de dados`);
      }

      const entryData = entrySnap.data();
      console.log('🔍 Dados da entrada encontrada:', entryData);

      // Verificar permissões
      const canEdit = currentUser.role === 'admin' || 
                     currentUser.role === 'logger' || 
                     entryData.createdBy === currentUser.uid;

      if (!canEdit) {
        throw new Error('Sem permissão para editar esta entrada');
      }

      // Preparar dados para atualização
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };

      console.log('💾 Atualizando com dados:', updateData);

      // Atualizar o documento
      await updateDoc(entryRef, updateData);

      console.log('✅ Entrada atualizada com sucesso');
      return true;

    } catch (error: any) {
      console.error('❌ Erro detalhado ao atualizar entrada:', {
        error: error.message,
        code: error.code,
        entryId,
        updates,
        currentUser: currentUser?.uid
      });

      // Mensagens de erro mais específicas
      if (error.code === 'permission-denied') {
        throw new Error('Sem permissão para editar. Verifique suas credenciais.');
      } else if (error.code === 'not-found') {
        throw new Error('Entrada não encontrada. Pode ter sido removida.');
      } else if (error.code === 'unavailable') {
        throw new Error('Serviço temporariamente indisponível. Tente novamente.');
      } else if (error.message.includes('network')) {
        throw new Error('Erro de conexão. Verifique sua internet.');
      } else {
        throw new Error(`Erro ao salvar: ${error.message}`);
      }
    }
  };

  const deleteLogEntry = async (entryId: string) => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    try {
      console.log('🗑️ Tentando excluir entrada:', entryId);
      
      const entryRef = doc(db, 'logEntries', entryId);
      const entrySnap = await getDoc(entryRef);

      if (!entrySnap.exists()) {
        throw new Error('Entrada não encontrada');
      }

      const entryData = entrySnap.data();

      // Verificar permissões
      const canDelete = currentUser.role === 'admin' || 
                       currentUser.role === 'logger' || 
                       entryData.createdBy === currentUser.uid;

      if (!canDelete) {
        throw new Error('Sem permissão para excluir esta entrada');
      }

      await deleteDoc(entryRef);
      console.log('✅ Entrada excluída com sucesso');
      return true;

    } catch (error: any) {
      console.error('❌ Erro ao excluir entrada:', error);
      throw new Error(`Erro ao excluir: ${error.message}`);
    }
  };

  const deleteAllLogEntries = async () => {
    if (!currentUser) {
      throw new Error('Usuário não autenticado');
    }

    if (currentUser.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir todas as entradas');
    }

    try {
      console.log('🗑️ Excluindo todas as entradas...');
      
      const logEntriesRef = collection(db, 'logEntries');
      const snapshot = await getDocs(logEntriesRef);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`✅ ${snapshot.size} entradas excluídas com sucesso`);
      return snapshot.size;

    } catch (error: any) {
      console.error('❌ Erro ao excluir todas as entradas:', error);
      throw new Error(`Erro ao excluir todas as entradas: ${error.message}`);
    }
  };

  const useRealtimeData = <T>(collectionName: string): [T[], boolean] => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!currentUser) {
        setData([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const dataArray: T[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          dataArray.push({
            id: doc.id, // SEMPRE usar o ID real do documento
            ...docData,
            createdAt: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: docData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as T);
        });
        setData(dataArray);
        setLoading(false);
      }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error);
        // Se for erro de permissão, tentar novamente após um delay
        if (error.code === 'permission-denied') {
          console.log(`Retrying ${collectionName} after permission error...`);
          setTimeout(() => {
            setLoading(true);
          }, 2000);
        }
        setLoading(false);
      });

      return unsubscribe;
    }, [collectionName, currentUser]);

    return [data, loading];
  };

  return {
    currentUser,
    loading,
    login,
    register,
    logout,
    addLogEntry,
    updateLogEntry,
    deleteLogEntry,
    deleteAllLogEntries,
    useRealtimeData
  };
};