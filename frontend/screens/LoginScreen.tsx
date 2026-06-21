import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { login } from '../service/auth.api';
import { registerForPushNotifications } from '../service/notification.service';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Load stored lockout state on component mount
  useEffect(() => {
    const loadLockoutState = async () => {
      try {
        const storedAttempts = await AsyncStorage.getItem('failed_attempts');
        const storedLockoutUntil = await AsyncStorage.getItem('lockout_until');
        
        if (storedAttempts) {
          setFailedAttempts(parseInt(storedAttempts, 10));
        }
        
        if (storedLockoutUntil) {
          const lockoutTime = parseInt(storedLockoutUntil, 10);
          const now = Date.now();
          if (lockoutTime > now) {
            const remaining = Math.ceil((lockoutTime - now) / 1000);
            setLockoutSeconds(remaining);
          } else {
            // Lockout expired while app was closed
            await AsyncStorage.removeItem('lockout_until');
            await AsyncStorage.setItem('failed_attempts', '0');
            setFailedAttempts(0);
          }
        }
      } catch (err) {
        console.error('Error loading lockout state:', err);
      }
    };
    loadLockoutState();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            AsyncStorage.setItem('failed_attempts', '0');
            AsyncStorage.removeItem('lockout_until');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [lockoutSeconds]);

  const handleLogin = async () => {
    if (lockoutSeconds > 0) {
      Alert.alert(
        'Cuenta Bloqueada',
        `Has agotado tus intentos. Espera ${lockoutSeconds} segundos.`
      );
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    // Email format validation (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error de formato', 'Por favor, introduce un correo electrónico válido');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });

      if (response.success) {
        setFailedAttempts(0);
        await AsyncStorage.setItem('failed_attempts', '0');
        await AsyncStorage.removeItem('lockout_until');

        try {
          await registerForPushNotifications();
          console.log('Notificaciones push registradas');
        } catch (pushError) {
          console.error('Error registrando push (no crítico):', pushError);
        }

        Alert.alert(
          'Login exitoso',
          'Bienvenido al sistema de incidencias',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('Panel'),
            },
          ]
        );
      } else {
        // Only increment attempts for actual authentication failures (wrong password/email),
        // not connection errors.
        if (response.message !== 'Error de conexión con el servidor') {
          const newAttempts = failedAttempts + 1;
          setFailedAttempts(newAttempts);
          await AsyncStorage.setItem('failed_attempts', newAttempts.toString());
          
          if (newAttempts >= 3) {
            const lockoutUntil = Date.now() + 30 * 1000;
            await AsyncStorage.setItem('lockout_until', lockoutUntil.toString());
            setLockoutSeconds(30);
            Alert.alert(
              'Cuenta Bloqueada',
              'Has agotado tus 3 intentos. Por favor, espera 30 segundos para volver a intentarlo.'
            );
          } else {
            Alert.alert(
              'Error de autenticación',
              `Correo o contraseña incorrectos. Te quedan ${3 - newAttempts} intentos.`
            );
          }
        } else {
          Alert.alert('Error', response.message || 'Credenciales inválidas');
        }
      }
    } catch (error) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <StatusBar style="light" />

        {/* Logo de la app */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={50} color="#fff" />
          </View>
          <Text style={styles.appName}>Incidencias TI</Text>
          <Text style={styles.appSlogan}>Sistema de reportes BIGANDER</Text>
        </View>

        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Contraseña"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye' : 'eye-off'}
              size={24}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            (loading || lockoutSeconds > 0) && { backgroundColor: '#475569' }
          ]}
          onPress={handleLogin}
          disabled={loading || lockoutSeconds > 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : lockoutSeconds > 0 ? (
            <Text style={styles.primaryButtonText}>Bloqueado ({lockoutSeconds}s)</Text>
          ) : (
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        {lockoutSeconds > 0 && (
          <Text style={styles.lockoutText}>
            Demasiados intentos fallidos. Por favor, espera {lockoutSeconds} segundos.
          </Text>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>Crear cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A237E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  appSlogan: {
    fontSize: 12,
    color: '#94a3b8',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    color: '#38bdf8',
    fontSize: 16,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyeButton: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  primaryButton: {
    backgroundColor: '#1A237E',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1A237E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    color: '#38bdf8',
    fontSize: 15,
  },
  lockoutText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});