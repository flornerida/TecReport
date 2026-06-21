import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { register } from '../service/auth.api';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }: any) {

  const [nombre, setNombre] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [telefono, setTelefono] = useState(''); 
  const [area, setArea] = useState('Sistemas');
  const [cargo, setCargo] = useState('');

  const [loading, setLoading] = useState(false);

  const [nombreError, setNombreError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');

  // Áreas de la empresa
  const areas = [
    "Sistemas",
    "Soporte Técnico",
    "Ventas",
    "Contabilidad",
    "Recursos Humanos",
    "Marketing",
    "Logística",
    "Administración",
    "Gerencia",
    "Atención al Cliente"
  ];

  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  const validateNombre = (nombre: string) => {
    const regex = /^[A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)*$/;
    return regex.test(nombre.trim());
  };

  const formatNombreInput = (text: string) => {
    return text
      .replace(/[^A-Za-zÀ-ÿ ]/g, '') 
      .replace(/\s+/g, ' ')           
      .trimStart();               
  };

  const handleRegister = async () => {

    setNombreError('');
    setEmailError('');
    setPasswordError('');
    setTelefonoError('');

    let valid = true;

    if (!nombre) {
      setNombreError("Completa el nombre");
      valid = false;
    } else if (!validateNombre(nombre)) {
      setNombreError("Solo letras y un espacio entre palabras");
      valid = false;
    }

    if (!email) {
      setEmailError("Ingresa un correo");
      valid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Correo no válido");
      valid = false;
    }

    if (!password) {
      setPasswordError("Ingresa una contraseña");
      valid = false;
    } else if (!validatePassword(password)) {
      setPasswordError("Mín 8 caracteres, 1 mayúscula y 1 número");
      valid = false;
    }

    if (telefono && !/^[0-9]{9}$/.test(telefono)) {
      setTelefonoError("El teléfono debe tener 9 números");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    const response = await register({
      nombre,       
      email,
      password,
      telefono: telefono || undefined, 
      area: area,
      cargo: cargo || undefined
    });

    setLoading(false);

    if (response.success) {
      Alert.alert("Éxito", "Usuario registrado correctamente", [
        {
          text: "OK",
          onPress: () => navigation.replace("Login")
        }
      ]);
    } else {
      Alert.alert("Error", response.message || "No se pudo registrar");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <StatusBar style="light" />

        <Text style={styles.title}>Registro de Usuario</Text>
        <Text style={styles.subtitle}>Sistema de Incidencias BIGANDER</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre y Apellido"
          placeholderTextColor="#94a3b8"
          value={nombre}
          onChangeText={(text) => setNombre(formatNombreInput(text))}
        />
        {nombreError ? <Text style={styles.error}>{nombreError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

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
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="#94a3b8"
            />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

        <Text style={styles.passwordHint}>
          La contraseña debe tener: 8+ caracteres, 1 mayúscula, 1 número
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Teléfono (opcional)"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          maxLength={9}
          value={telefono}
          onChangeText={setTelefono}
        />
        {telefonoError ? <Text style={styles.error}>{telefonoError}</Text> : null}

        <Text style={styles.label}>Área de trabajo</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={area}
            onValueChange={(itemValue) => setArea(itemValue)}
            style={styles.picker}
            dropdownIconColor="#94a3b8"
          >
            {areas.map((a, index) => (
              <Picker.Item key={index} label={a} value={a} color="#000" />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Cargo (opcional)"
          placeholderTextColor="#94a3b8"
          value={cargo}
          onChangeText={setCargo}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Registrarse</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#1e293b',
    color: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 5,
    width: '100%',
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginLeft: 5,
  },
  passwordHint: {
    color: '#94a3b8',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginLeft: 5,
  },
  label: {
    color: "white",
    alignSelf: "flex-start",
    marginBottom: 5,
    fontSize: 16,
    marginTop: 5,
  },
  pickerContainer: {
    width: "100%",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    color: "white",
    backgroundColor: "#1e293b",
    width: "100%",
  },
  button: {
    backgroundColor: '#22c55e',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 20,
  },
  loginText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  loginLink: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});