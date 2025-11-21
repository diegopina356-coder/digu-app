import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ⚠️ TU NÚMERO DE SOPORTE (Formato internacional)
const WHATSAPP_SOPORTE = '584141666779'; 

const Colores = {
  primary: '#005A9C',
  background: '#F5F7FA',
  text: '#1E1E1E',
  textSecondary: '#7F8C8D',
  white: '#FFFFFF',
  border: '#EAEAEA'
};

export default function PantallaSoporte({ usuario, volver }) {
  const [mensaje, setMensaje] = useState('');

  const enviarReporte = () => {
    if (mensaje.trim().length < 10) {
      Alert.alert("Mensaje muy corto", "Por favor detalla un poco más tu problema.");
      return;
    }

    // Preparamos el mensaje para WhatsApp
    const texto = `Hola Soporte DIGU. Soy ${usuario.nombre} (ID: ${usuario.id}).\n\nReporte: ${mensaje}`;
    const url = `https://wa.me/${WHATSAPP_SOPORTE}?text=${encodeURIComponent(texto)}`;

    Linking.openURL(url);
    // Opcional: Volver al mapa después de enviar
    // volver(); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={volver} style={styles.botonVolver}>
          <Ionicons name="arrow-back" size={28} color={Colores.primary} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Soporte Técnico</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconoGigante}>
          <Ionicons name="headset" size={80} color={Colores.primary} />
        </View>

        <Text style={styles.subtitulo}>¿En qué podemos ayudarte?</Text>
        <Text style={styles.descripcion}>
          Cuéntanos tu problema con un viaje, la app o un pago. Te responderemos lo antes posible.
        </Text>

        <Text style={styles.label}>Detalle del problema:</Text>
        <TextInput
          style={styles.inputArea}
          placeholder="Escribe aquí..."
          multiline={true}
          numberOfLines={6}
          value={mensaje}
          onChangeText={setMensaje}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.botonEnviar} onPress={enviarReporte}>
          <Text style={styles.textoBoton}>ENVIAR REPORTE</Text>
          <Ionicons name="logo-whatsapp" size={20} color="white" style={{marginLeft: 10}} />
        </TouchableOpacity>

        <Text style={styles.nota}>Serás redirigido a nuestro WhatsApp oficial.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.background, paddingTop: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  botonVolver: { padding: 5 },
  titulo: { fontSize: 24, fontFamily: 'Inter-Bold', color: Colores.text, marginLeft: 15 },
  content: { padding: 25, alignItems: 'center' },
  iconoGigante: { marginBottom: 20, backgroundColor: '#E6F0F6', padding: 30, borderRadius: 100 },
  subtitulo: { fontSize: 20, fontFamily: 'Inter-Bold', color: Colores.text, marginBottom: 10 },
  descripcion: { fontSize: 14, fontFamily: 'Inter-Regular', color: Colores.textSecondary, textAlign: 'center', marginBottom: 30 },
  label: { alignSelf: 'flex-start', fontSize: 14, fontFamily: 'Inter-Bold', color: Colores.primary, marginBottom: 10 },
  inputArea: {
    width: '100%', backgroundColor: Colores.white, borderWidth: 1, borderColor: Colores.border,
    borderRadius: 15, padding: 15, fontSize: 16, fontFamily: 'Inter-Regular', minHeight: 150, marginBottom: 20
  },
  botonEnviar: {
    flexDirection: 'row', backgroundColor: Colores.primary, paddingVertical: 15, paddingHorizontal: 30,
    borderRadius: 30, alignItems: 'center', elevation: 5, shadowColor: Colores.primary, shadowOpacity: 0.3
  },
  textoBoton: { color: Colores.white, fontSize: 16, fontFamily: 'Inter-Bold' },
  nota: { marginTop: 20, fontSize: 12, color: Colores.textSecondary }
});