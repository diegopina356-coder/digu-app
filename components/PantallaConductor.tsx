import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView from 'react-native-maps';

// Paleta de Colores
const Colores = {
  primary: '#005A9C',
  text: '#1E1E1E',
  textLight: '#F5F7FA',
  white: '#FFFFFF',
  green: '#27ae60',
  red: '#c0392b',
  gray: '#7f8c8d',
  darkBlue: '#2c3e50',
  whatsApp: '#25D366',
  orange: '#F39C12' // Color para dinero
};

export default function PantallaConductor({ usuario, volver, socket }) {
  if (usuario.rol !== 'CONDUCTOR') {
      Alert.alert("Acceso Denegado", "Solo los conductores aprobados pueden usar este modo.");
      volver(); 
      return <View style={{flex: 1, backgroundColor: Colores.background}} />; 
  }

  const [ubicacion, setUbicacion] = useState(null);
  const [enLinea, setEnLinea] = useState(false);
  const [viajeActual, setViajeActual] = useState(null);
  const [viajeAceptado, setViajeAceptado] = useState(false);
  const intervaloGps = useRef(null);
  const [telefonoCliente, setTelefonoCliente] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUbicacion(location.coords);
    })();
  }, []);

  useEffect(() => {
    if (!socket) return; 
    
    const handleNuevoViaje = (datos) => { 
      setEnLinea(curr => { if (curr) setViajeActual(v => !v ? datos : v); return curr; }); 
    };
    const handleApretonDeManos = (datos) => { setTelefonoCliente(datos.telefonoCliente); };
    
    const handleFinViaje = () => {
        Alert.alert("¡Viaje Completado!", "Se ha guardado en tu historial. Listo para el siguiente.");
        setViajeActual(null);
        setViajeAceptado(false);
        setTelefonoCliente(null);
        if (intervaloGps.current) clearInterval(intervaloGps.current);
    };

    socket.on('nuevo-viaje', handleNuevoViaje);
    socket.on('apreton-de-manos-exitoso', handleApretonDeManos);
    socket.on('viaje-terminado-confirmacion', handleFinViaje);
    
    return () => {
      socket.off('nuevo-viaje', handleNuevoViaje);
      socket.off('apreton-de-manos-exitoso', handleApretonDeManos);
      socket.off('viaje-terminado-confirmacion', handleFinViaje);
      if (enLinea) socket.emit('conductor-desconectado', usuario.id);
    };
  }, [enLinea, usuario.id, socket]);

  const toggleTrabajo = () => {
    if (!socket) return Alert.alert("Error", "No conectado al servidor");
    if (enLinea) {
      socket.emit('conductor-desconectado', usuario.id);
      setEnLinea(false);
      Alert.alert("Desconectado", "Ya no recibirás viajes.");
    } else {
      socket.emit('conductor-conectado', {
        idUsuario: usuario.id, nombre: usuario.nombre,
        telefono: usuario.telefono, ubicacion: ubicacion
      });
      setEnLinea(true);
      Alert.alert("¡En Línea!", "Esperando solicitudes de viajes... ⏳");
    }
  };

  const aceptarViaje = () => {
    if (!viajeActual || !socket) return; 
    socket.emit('viaje-aceptado', {
      clienteSocketId: viajeActual.socketIdCliente,
      clienteUsuarioId: viajeActual.usuarioId,
      infoConductor: {
        nombre: usuario.nombre,
        auto: usuario.vehiculoModelo || "Vehículo Registrado",
        placa: usuario.vehiculoPlaca || "En Trámite",
        ubicacion: ubicacion
      }
    });
    setViajeAceptado(true);
    intervaloGps.current = setInterval(async () => {
      let location = await Location.getCurrentPositionAsync({});
      socket.emit('actualizar-posicion', {
        clienteSocketId: viajeActual.socketIdCliente,
        ubicacion: location.coords
      });
    }, 5000); 
  };
  
  const finalizarViaje = () => {
      const datosParaEnviar = {
          viaje: viajeActual,
          clienteId: viajeActual?.usuarioId,
          conductorId: usuario.id,
          clienteSocketId: viajeActual?.socketIdCliente
      };
      if (!datosParaEnviar.viaje || !datosParaEnviar.clienteId) {
        Alert.alert("Error", "No se encontraron datos del viaje.");
        return;
      }
      Alert.alert(
          "Terminar Viaje",
          "¿Ya llegaste al destino y cobraste?",
          [
              { text: "No", style: "cancel" },
              { text: "Sí, Finalizar", onPress: () => { socket.emit('finalizar-viaje', datosParaEnviar); } }
          ]
      );
  };

  const rechazarViaje = () => { setViajeActual(null); setViajeAceptado(false); setTelefonoCliente(null); };

  const abrirWhatsApp = () => {
    if (!telefonoCliente) { Alert.alert("Error", "Teléfono no disponible."); return; }
    const numeroLimpio = telefonoCliente.replace(/[^0-9]/g, '');
    const numeroVzla = `58${numeroLimpio.substring(1)}`;
    Linking.openURL(`https://wa.me/${numeroVzla}?text=Hola, soy tu conductor de DIGU. ¡Estoy en camino!`);
  };
  
  if (!ubicacion) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colores.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>MODO CONDUCTOR</Text>
        <TouchableOpacity onPress={volver} style={styles.botonSalir}>
          <Ionicons name="close-outline" size={28} color={Colores.white} />
        </TouchableOpacity>
      </View>
      <MapView style={styles.mapa} initialRegion={{ latitude: ubicacion.latitude, longitude: ubicacion.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }} showsUserLocation={true} />

      {viajeAceptado && (
        <TouchableOpacity style={styles.botonWhatsApp} onPress={abrirWhatsApp}>
          <Ionicons name="logo-whatsapp" size={32} color="white" />
        </TouchableOpacity>
      )}

      {!viajeActual && (
        <View style={styles.panelControl}>
          <Text style={styles.estado}>Estado: {enLinea ? "🟢 EN LÍNEA" : "🔴 DESCONECTADO"}</Text>
          <TouchableOpacity 
            style={[styles.botonEstado, { backgroundColor: enLinea ? Colores.red : Colores.green }]} 
            onPress={toggleTrabajo}
          ><Text style={styles.textoBoton}>{enLinea ? "DESCONECTARSE" : "CONECTARSE"}</Text></TouchableOpacity>
        </View>
      )}

      {enLinea && viajeActual && !viajeAceptado && (
        <View style={styles.panelAlertaViaje}>
          <Text style={styles.tituloAlerta}>¡NUEVO VIAJE!</Text>
          <Text style={styles.detalleAlerta}>Destino: {viajeActual.destino}</Text>
          <Text style={styles.detalleAlerta}>Pago: {viajeActual.metodoPago}</Text>
          <Text style={styles.precioAlerta}>${viajeActual.precio.toFixed(2)}</Text>
          <View style={styles.botonesAlerta}>
            <TouchableOpacity style={styles.botonRechazar} onPress={rechazarViaje}><Text style={styles.textoBotonAlerta}>RECHAZAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.botonAceptar} onPress={aceptarViaje}><Text style={styles.textoBotonAlerta}>ACEPTAR</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- PANEL DE VIAJE EN CURSO CON PRECIO --- */}
      {viajeAceptado && (
          <View style={styles.panelEnCurso}>
              <Text style={styles.textoEnCurso}>Viaje en progreso...</Text>
              <Text style={styles.destinoEnCurso}>📍 {viajeActual.destino}</Text>
              
              {/* TARJETA DE COBRO */}
              <View style={styles.tarjetaCobro}>
                <Text style={styles.labelCobro}>Cobrar al finalizar:</Text>
                <View style={styles.filaCobro}>
                  <Text style={styles.montoCobro}>${viajeActual.precio.toFixed(2)}</Text>
                  <View style={styles.badgeMetodo}>
                     <Text style={styles.textoMetodo}>{viajeActual.metodoPago.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.botonFinalizar} onPress={finalizarViaje}>
                  <Text style={styles.textoFinalizar}>FINALIZAR VIAJE</Text>
              </TouchableOpacity>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colores.background },
  mapa: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, backgroundColor: Colores.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', },
  tituloHeader: { color: Colores.white, fontSize: 18, fontFamily: 'Inter-Bold' },
  botonSalir: { position: 'absolute', right: 15, top: Platform.OS === 'ios' ? 55 : 35 },
  panelControl: { padding: 25, backgroundColor: Colores.white, alignItems: 'center', position:'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20, shadowColor: '#000', shadowOpacity: 0.1, },
  estado: { fontSize: 18, marginBottom: 15, fontFamily: 'Inter-Medium', color: Colores.text },
  botonEstado: { width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  textoBoton: { color: Colores.white, fontSize: 16, fontFamily: 'Inter-Bold' },
  panelAlertaViaje: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colores.darkBlue, padding: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20 },
  tituloAlerta: { fontSize: 24, fontFamily: 'Inter-Bold', color: Colores.white, textAlign: 'center', marginBottom: 10 },
  detalleAlerta: { fontSize: 16, fontFamily: 'Inter-Regular', color: Colores.textLight, textAlign: 'center' },
  precioAlerta: { fontSize: 28, fontFamily: 'Inter-Bold', color: Colores.green, textAlign: 'center', marginVertical: 15 },
  botonesAlerta: { flexDirection: 'row', justifyContent: 'space-between' },
  botonRechazar: { backgroundColor: Colores.gray, padding: 18, borderRadius: 15, flex: 1, marginRight: 10, alignItems: 'center' },
  botonAceptar: { backgroundColor: Colores.green, padding: 18, borderRadius: 15, flex: 2, alignItems: 'center' },
  textoBotonAlerta: { color: Colores.white, fontFamily: 'Inter-Bold', fontSize: 16 },
  botonWhatsApp: { position: 'absolute', bottom: 280, right: 20, backgroundColor: Colores.whatsApp, padding: 18, borderRadius: 50, elevation: 10, zIndex: 1000 },

  // --- NUEVOS ESTILOS ---
  panelEnCurso: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: Colores.white, padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', elevation: 20 },
  textoEnCurso: { color: Colores.green, fontWeight: 'bold', marginBottom: 5 },
  destinoEnCurso: { fontSize: 18, color: Colores.text, marginBottom: 15, fontFamily: 'Inter-Bold' },
  
  tarjetaCobro: { width: '100%', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  labelCobro: { color: Colores.gray, fontSize: 12, marginBottom: 5 },
  filaCobro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  montoCobro: { fontSize: 24, fontFamily: 'Inter-Bold', color: Colores.darkBlue },
  badgeMetodo: { backgroundColor: Colores.orange, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  textoMetodo: { color: Colores.white, fontSize: 12, fontWeight: 'bold' },

  botonFinalizar: { backgroundColor: Colores.red, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  textoFinalizar: { color: Colores.white, fontSize: 18, fontFamily: 'Inter-Bold' }
});