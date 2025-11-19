import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ☁️ CONEXIÓN A LA NUBE (RENDER)
const URL_LOGIN = 'https://digu-api.onrender.com/login';

// Paleta DIGU
const Colores = {
  primary: '#005A9C',
  secondary: '#00AFFF',
  background: '#F5F7FA',
  text: '#1E1E1E',
  textSecondary: '#7F8C8D',
  white: '#FFFFFF',
  danger: '#e74c3c'
};

export default function PantallaLogin({ onLoginExitoso, irARegistro, irASolicitud }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Debes ingresar email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const respuesta = await fetch(URL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), password: password }),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        onLoginExitoso(data.token, data.usuario); 
      } else {
        Alert.alert('Error de Login', data.error || 'Credenciales incorrectas.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo conectar al servidor en la nube.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Bienvenido a DIGU</Text>
      <Text style={styles.subtitulo}>Movilidad inteligente, a tu alcance.</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={22} color={Colores.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          placeholderTextColor={Colores.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={22} color={Colores.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={Colores.textSecondary}
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        style={styles.botonLogin} 
        onPress={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colores.white} />
        ) : (
          <Text style={styles.textoBoton}>INICIAR SESIÓN</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.botonCrearCuenta} onPress={irARegistro}>
        <Text style={styles.textoCrearCuenta}>No tengo cuenta, <Text style={{fontWeight: 'bold', color: Colores.primary}}>registrarme</Text></Text>
      </TouchableOpacity>

      <View style={styles.separador} />
      
      <TouchableOpacity style={styles.botonConductor} onPress={irASolicitud}>
        <Text style={styles.textoConductor}>¿Quieres ser conductor?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.background,
    padding: 25,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 34,
    fontFamily: 'Inter-Bold',
    color: Colores.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitulo: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colores.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.white,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  inputIcon: { paddingLeft: 15 },
  input: {
    flex: 1,
    padding: 18,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colores.text,
  },
  botonLogin: {
    backgroundColor: Colores.primary,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  textoBoton: {
    color: Colores.white,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  botonCrearCuenta: { marginTop: 25, alignItems: 'center' },
  textoCrearCuenta: {
    color: Colores.textSecondary,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  separador: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 25,
  },
  botonConductor: {
    backgroundColor: Colores.white,
    borderColor: Colores.primary,
    borderWidth: 1.5,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  textoConductor: {
    color: Colores.primary,
    fontSize: 15,
    fontFamily: 'Inter-Bold',
  }
});