import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ☁️ CONEXIÓN A LA NUBE
const URL_SOLICITUD = 'https://digu-api.onrender.com/solicitud-conductor';

// ⚠️ ¡PON TU NÚMERO AQUÍ! (Formato internacional sin el +)
const WHATSAPP_ADMIN = '584120000000'; 

// Paleta DIGU
const Colores = {
  primary: '#005A9C',
  background: '#F5F7FA',
  text: '#1E1E1E',
  textSecondary: '#7F8C8D',
  white: '#FFFFFF',
  success: '#27ae60',
  border: '#EAEAEA'
};

export default function PantallaSolicitudConductor({ volver }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [ano, setAno] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSolicitud = async () => {
    if (!nombre || !email || !cedula || !password || !telefono || !modelo || !placa || !ano) {
      Alert.alert('Faltan Datos', 'Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const datos = { nombre, email: email.toLowerCase(), cedula, telefono, password, modelo, placa, ano };
      const respuesta = await fetch(URL_SOLICITUD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await respuesta.json();

      if (respuesta.ok) {
        Alert.alert(
          '¡Solicitud Recibida!',
          'Tus datos han sido guardados. Ahora serás redirigido al WhatsApp de la administración.',
          [
            { text: 'Ir a WhatsApp', onPress: () => {
              const mensaje = `Hola Diego, soy ${nombre} (C.I: ${cedula}). Acabo de registrar mi ${modelo} placa ${placa} en la app DIGU. Aquí envío mis documentos.`;
              const url = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensaje)}`;
              Linking.openURL(url);
              volver();
            }}
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'No se pudo enviar la solicitud.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo conectar al servidor en la nube.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={volver} style={styles.botonVolver}>
          <Ionicons name="arrow-back" size={28} color={Colores.primary} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Únete a DIGU</Text>
      </View>
      
      <Text style={styles.subtitulo}>Registro de Conductores</Text>

      <Text style={styles.sectionTitle}>Datos Personales</Text>
      <TextInput style={styles.input} placeholder="Nombre Completo" value={nombre} onChangeText={setNombre} />
      <TextInput style={styles.input} placeholder="Correo Electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
      <View style={styles.row}>
        <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Cédula" value={cedula} onChangeText={setCedula} />
        <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Teléfono" keyboardType="phone-pad" value={telefono} onChangeText={setTelefono} />
      </View>
      <TextInput style={styles.input} placeholder="Crea una Contraseña" secureTextEntry={true} value={password} onChangeText={setPassword} />
      
      <View style={styles.separador} />

      <Text style={styles.sectionTitle}>Datos del Vehículo</Text>
      <TextInput style={styles.input} placeholder="Modelo (Ej: Bera SBR / Toyota Corolla)" value={modelo} onChangeText={setModelo} />
      <View style={styles.row}>
        <TextInput style={[styles.input, {flex: 1, marginRight: 5}]} placeholder="Placa" autoCapitalize="characters" value={placa} onChangeText={setPlaca} />
        <TextInput style={[styles.input, {flex: 1, marginLeft: 5}]} placeholder="Año" keyboardType="number-pad" value={ano} onChangeText={setAno} />
      </View>

      <TouchableOpacity 
        style={styles.botonRegistrar} 
        onPress={handleSolicitud} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colores.white} />
        ) : (
          <Text style={styles.textoBoton}>ENVIAR SOLICITUD</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.notaPie}>* Al enviar, deberás contactar al administrador para activar tu cuenta.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.background },
  scrollContent: { padding: 25, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  botonVolver: { marginRight: 15 },
  titulo: { fontSize: 28, fontFamily: 'Inter-Bold', color: Colores.text },
  subtitulo: { fontSize: 16, fontFamily: 'Inter-Regular', color: Colores.textSecondary, marginBottom: 30 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter-Bold', color: Colores.primary, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: Colores.white, borderWidth: 1, borderColor: Colores.border, borderRadius: 12, padding: 15, fontSize: 16, fontFamily: 'Inter-Regular', marginBottom: 15, color: Colores.text },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  separador: { height: 1, backgroundColor: '#DDD', marginVertical: 20 },
  botonRegistrar: { backgroundColor: Colores.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10, elevation: 3, shadowColor: Colores.primary, shadowOpacity: 0.3 },
  textoBoton: { color: Colores.white, fontSize: 16, fontFamily: 'Inter-Bold' },
  notaPie: { marginTop: 20, textAlign: 'center', color: Colores.textSecondary, fontSize: 12, fontStyle: 'italic' }
});