import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Ahora recibimos una función "alPresionar"
export default function BarraBusqueda({ alPresionar }) {
  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>¿A dónde quieres ir hoy?</Text>
      
      {/* Cuando tocas la caja, ejecuta la función */}
      <TouchableOpacity style={styles.cajaInput} onPress={alPresionar}>
        <Text style={styles.textoInput}>🔍 Buscar destino...</Text> 
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
  },
  saludo: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
  cajaInput: { backgroundColor: '#f1f2f6', padding: 15, borderRadius: 10 },
  textoInput: { color: '#7f8c8d', fontSize: 16 }
});