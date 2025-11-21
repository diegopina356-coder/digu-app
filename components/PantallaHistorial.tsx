import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ ¡VERIFICA TU IP!
const TU_IP = '192.168.1.127'; // O usa la URL de Render si vas a generar APK
const URL_BASE = 'https://digu-api.onrender.com'; 
const TASA_BCV = 236.50;

const Colores = {
  primary: '#005A9C',
  background: '#F5F7FA',
  white: '#FFFFFF',
  text: '#1E1E1E',
  textLight: '#7F8C8D',
  green: '#27ae60',
  red: '#c0392b',
  orange: '#F39C12'
};

export default function PantallaHistorial({ usuario, volver }) {
  const [viajes, setViajes] = useState([]);
  const [deudaActual, setDeudaActual] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estadísticas para conductor
  const [totalBruto, setTotalBruto] = useState(0);
  const [comision, setComision] = useState(0);
  const [gananciaNeta, setGananciaNeta] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const respuesta = await fetch(`${URL_BASE}/historial/${usuario.id}`);
      const data = await respuesta.json();
      
      setViajes(data.viajes);
      setDeudaActual(data.saldoActual);

      // Cálculos visuales para el conductor
      if (usuario.rol === 'CONDUCTOR') {
        let bruto = 0;
        data.viajes.forEach(v => {
            if(v.conductorId === usuario.id) bruto += v.precio;
        });
        const comisionApp = bruto * 0.25; 
        const neta = bruto - comisionApp;

        setTotalBruto(bruto);
        setComision(comisionApp);
        setGananciaNeta(neta);
      }

    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la información.");
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const esConductor = item.conductorId === usuario.id;
    const fecha = new Date(item.fecha).toLocaleDateString();
    const hora = new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.tarjeta}>
        <View style={styles.headerTarjeta}>
          <Text style={styles.fecha}>{fecha} - {hora}</Text>
          <Text style={styles.precio}>
             {esConductor ? `+ $${(item.precio * 0.75).toFixed(2)}` : `$${item.precio.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.rutaContainer}>
          <View style={styles.puntoRuta}>
            <Ionicons name="radio-button-on" size={16} color={Colores.green} />
            <Text style={styles.textoRuta} numberOfLines={1}>{item.origen}</Text>
          </View>
          <View style={styles.puntoRuta}>
            <Ionicons name="location" size={16} color={Colores.primary} />
            <Text style={styles.textoRuta} numberOfLines={1}>{item.destino}</Text>
          </View>
        </View>
        
        <View style={styles.footerTarjeta}>
           <Text style={styles.rolTexto}>
             {esConductor ? `Cliente: ${item.cliente.nombre}` : `Conductor: ${item.conductor.nombre}`}
           </Text>
           {item.estrellas ? (
              <View style={{flexDirection:'row'}}><Ionicons name="star" size={14} color="#F1C40F" /><Text style={{fontWeight:'bold', marginLeft:5}}>{item.estrellas}</Text></View>
           ) : <Text style={{fontSize:10, color:'#CCC'}}>--</Text>}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{usuario.rol === 'CONDUCTOR' ? 'Mi Billetera' : 'Mis Viajes'}</Text>
        <TouchableOpacity onPress={volver} style={styles.botonCerrar}>
          <Ionicons name="close" size={28} color={Colores.text} />
        </TouchableOpacity>
      </View>

      {/* --- PANEL DE DEUDA (SOLO CONDUCTOR) --- */}
      {usuario.rol === 'CONDUCTOR' && !loading && (
        <View style={styles.panelDeuda}>
            <Text style={styles.tituloDeuda}>DEUDA CON DIGU (25%)</Text>
            <Text style={styles.montoDeuda}>${deudaActual.toFixed(2)}</Text>
            <Text style={styles.montoDeudaBs}>Bs {(deudaActual * TASA_BCV).toFixed(2)}</Text>
            
            <TouchableOpacity style={styles.botonReportarPago} onPress={() => Alert.alert("Reportar Pago", "Contacta a administración para pagar tu deuda.")}>
                <Text style={styles.textoBotonPago}>REPORTAR PAGO</Text>
            </TouchableOpacity>
            
            {/* CAMBIO AQUÍ: TEXTO DE AVISO */}
            <Text style={styles.notaDeuda}>
              <Ionicons name="calendar-outline" size={12} /> Corte Administrativo: Todos los Sábados.
            </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={Colores.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={viajes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={styles.vacio}>Sin historial reciente.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.background, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: Colores.primary },
  botonCerrar: { padding: 5 },
  lista: { padding: 20 },
  vacio: { textAlign: 'center', marginTop: 50, color: Colores.textLight, fontSize: 16 },
  tarjeta: { backgroundColor: Colores.white, borderRadius: 15, padding: 15, marginBottom: 15, elevation: 3 },
  headerTarjeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  fecha: { color: Colores.textLight, fontSize: 12 },
  precio: { color: Colores.green, fontSize: 18, fontWeight: 'bold' },
  rutaContainer: { marginLeft: 5 },
  puntoRuta: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  textoRuta: { marginLeft: 10, color: Colores.text, fontSize: 14, flex: 1 },
  footerTarjeta: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 10, marginTop: 5, flexDirection: 'row', justifyContent: 'space-between' },
  rolTexto: { fontSize: 12, color: Colores.textLight },

  // Panel Deuda
  panelDeuda: { margin: 20, marginBottom: 5, padding: 20, backgroundColor: Colores.white, borderRadius: 20, elevation: 5, alignItems: 'center', borderLeftWidth: 5, borderLeftColor: Colores.orange },
  tituloDeuda: { fontWeight: 'bold', color: Colores.orange, marginBottom: 5, fontSize: 14 },
  montoDeuda: { fontSize: 32, fontWeight: 'bold', color: Colores.text },
  montoDeudaBs: { fontSize: 16, color: Colores.textLight, marginBottom: 15 },
  botonReportarPago: { backgroundColor: Colores.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  textoBotonPago: { color: Colores.white, fontWeight: 'bold', fontSize: 12 },
  notaDeuda: { marginTop: 15, fontSize: 12, color: Colores.textLight, fontStyle: 'italic' }
});