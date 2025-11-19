import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';

// ☁️ CONEXIÓN A LA NUBE
const URL_REGISTRO = 'https://digu-api.onrender.com/registro';

// Paleta DIGU
const Colores = {
  primary: '#005A9C',
  secondary: '#00AFFF',
  background: '#F5F7FA',
  text: '#1E1E1E',
  textSecondary: '#7F8C8D',
  white: '#FFFFFF',
  success: '#27ae60',
  border: '#EAEAEA'
};

export default function PantallaRegistro({ volver }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegistro = async () => {
    if (!nombre || !email || !cedula || !password) {
      Alert.alert('Error', 'Por favor, llena todos los campos obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const datosUsuario = { nombre, email: email.toLowerCase(), cedula, telefono, password };
      const respuesta = await fetch(URL_REGISTRO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUsuario),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        Alert.alert('¡Bienvenido a DIGU!', 'Tu cuenta ha sido creada exitosamente.');
        volver();
      } else {
        Alert.alert('Error de Registro', data.error || 'No se pudo crear la cuenta.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo conectar al servidor en la nube.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.botonVolver} onPress={volver}>
        <Ionicons name="arrow-back-outline" size={28} color={Colores.primary} />
      </TouchableOpacity>
      
      <Text style={styles.titulo}>Crea tu cuenta en DIGU</Text>
      <Text style={styles.subtitulo}>Regístrate en segundos.</Text>

      <Text style={styles.label}>Nombre Completo*</Text>
      <TextInput style={styles.input} placeholder="Tu nombre y apellido" value={nombre} onChangeText={setNombre} />
      
      <Text style={styles.label}>Correo Electrónico*</Text>
      <TextInput style={styles.input} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      
      <Text style={styles.label}>Cédula (V/E)*</Text>
      <TextInput style={styles.input} placeholder="V-12345678" value={cedula} onChangeText={setCedula} />
      
      <Text style={styles.label}>Teléfono (Opcional)</Text>
      <TextInput style={styles.input} placeholder="0412-123-4567" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      
      <Text style={styles.label}>Contraseña*</Text>
      <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" secureTextEntry={true} value={password} onChangeText={setPassword} />

      <TouchableOpacity 
        style={styles.botonRegistrar} 
        onPress={handleRegistro} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colores.white} />
        ) : (
          <Text style={styles.textoBoton}>CREAR CUENTA</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.background },
  scrollContent: { padding: 25, paddingTop: Platform.OS === 'ios' ? 70 : 40 },
  botonVolver: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 30, left: 20, padding: 10, zIndex: 10 },
  titulo: { fontSize: 28, fontFamily: 'Inter-Bold', color: Colores.text, textAlign: 'center', marginTop: 40 },
  subtitulo: { fontSize: 16, fontFamily: 'Inter-Regular', color: Colores.textSecondary, textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 14, fontFamily: 'Inter-Medium', color: Colores.textSecondary, marginBottom: 8, marginLeft: 5 },
  input: { backgroundColor: Colores.white, borderWidth: 1, borderColor: Colores.border, borderRadius: 15, padding: 18, fontSize: 16, fontFamily: 'Inter-Regular', marginBottom: 15 },
  botonRegistrar: { backgroundColor: Colores.success, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 2 },
  textoBoton: { color: Colores.white, fontSize: 16, fontFamily: 'Inter-Bold' },
});