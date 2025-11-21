import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import MapView from 'react-native-maps'; // <--- APAGADO MODO SEGURO
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

const Colores = { primary: '#005A9C', text: '#1E1E1E', textLight: '#F5F7FA', white: '#FFFFFF', green: '#27ae60', red: '#c0392b', gray: '#7f8c8d', darkBlue: '#2c3e50', whatsApp: '#25D366', orange: '#F39C12', purple: '#8e44ad' };

// --- CONFIGURACIÓN AVANZADA DE NOTIFICACIONES ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function PantallaConductor({ usuario, volver, socket }) {
  if (usuario.rol !== 'CONDUCTOR') {
      Alert.alert("Acceso Denegado", "Solo conductores."); volver(); return null;
  }

  const [ubicacion, setUbicacion] = useState(null);
  const [enLinea, setEnLinea] = useState(false);
  const [viajeActual, setViajeActual] = useState(null);
  
  // ESTADOS DEL FLUJO
  const [viajeAceptado, setViajeAceptado] = useState(false); // Ya acepté, voy a buscarlo
  const [viajeIniciado, setViajeIniciado] = useState(false); // Ya se subió, vamos al destino
  
  const intervaloGps = useRef(null);
  const [telefonoCliente, setTelefonoCliente] = useState(null);

  // 1. Configurar Canal de Notificaciones (Obligatorio para Android APK)
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('viajes-digu', {
        name: 'Solicitudes de Viaje',
        importance: Notifications.AndroidImportance.MAX, // ¡IMPORTANCIA MÁXIMA!
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  // 2. Función para disparar la alerta
  const dispararAlerta = async (datos) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 ¡NUEVO VIAJE DIGU!",
        body: `Destino: ${datos.destino} - $${datos.precio.toFixed(2)}`,
        data: { datos },
        sound: true, // Usa el sonido del sistema
      },
      trigger: null, // Inmediato
    });
  };

  // 3. Obtener GPS
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setUbicacion(location.coords);
    })();
  }, []);

  // 4. Listeners del Socket
  useEffect(() => {
    if (!socket) return; 
    
    const handleNuevoViaje = (datos) => { 
      setEnLinea(curr => { 
        if (curr) { // Solo si estoy en línea
           setViajeActual(v => {
             if (!v) { // Solo si no tengo viaje
               dispararAlerta(datos); // <--- SONIDO Y VIBRACIÓN
               return datos;
             }
             return v;
           });
        }
        return curr; 
      }); 
    };
    
    const handleApreton = (datos) => { setTelefonoCliente(datos.telefonoCliente); };
    
    const handleFin = () => {
        Alert.alert("¡Viaje Completado!", "Listo para el siguiente.");
        limpiarEstado();
    };

    socket.on('nuevo-viaje', handleNuevoViaje);
    socket.on('apreton-de-manos-exitoso', handleApreton);
    socket.on('viaje-terminado-confirmacion', handleFin);
    
    return () => {
      socket.off('nuevo-viaje'); socket.off('apreton-de-manos-exitoso'); socket.off('viaje-terminado-confirmacion');
      if (enLinea) socket.emit('conductor-desconectado', usuario.id);
    };
  }, [enLinea, usuario.id, socket]);

  const limpiarEstado = () => {
    setViajeActual(null);
    setViajeAceptado(false);
    setViajeIniciado(false);
    setTelefonoCliente(null);
    if (intervaloGps.current) clearInterval(intervaloGps.current);
  };

  const toggleTrabajo = () => {
    if (!socket) return Alert.alert("Error", "No conectado");
    if (enLinea) { socket.emit('conductor-desconectado', usuario.id); setEnLinea(false); }
    else { socket.emit('conductor-conectado', { idUsuario: usuario.id, nombre: usuario.nombre, telefono: usuario.telefono, ubicacion: ubicacion }); setEnLinea(true); Alert.alert("¡En Línea!", "Esperando viajes..."); }
  };

  // --- FLUJO DE VIAJE ---

  // PASO 1: ACEPTAR (Voy a buscarlo)
  const aceptarViaje = () => {
    if (!viajeActual || !socket) return; 
    socket.emit('viaje-aceptado', {
      clienteSocketId: viajeActual.socketIdCliente, clienteUsuarioId: viajeActual.usuarioId,
      infoConductor: { nombre: usuario.nombre, auto: usuario.vehiculoModelo || "Registrado", placa: usuario.vehiculoPlaca || "En Trámite", ubicacion: ubicacion }
    });
    setViajeAceptado(true);
    
    // GPS
    intervaloGps.current = setInterval(async () => {
      let location = await Location.getCurrentPositionAsync({});
      socket.emit('actualizar-posicion', { clienteSocketId: viajeActual.socketIdCliente, ubicacion: location.coords });
    }, 5000); 
  };

  // PASO 2: INICIAR (El cliente se subió)
  const iniciarCarrera = () => {
    setViajeIniciado(true);
    // Avisamos al servidor (y al cliente) que empezó el viaje
    socket.emit('iniciar-viaje', { clienteSocketId: viajeActual.socketIdCliente });
  };
  
  // PASO 3: FINALIZAR (Llegamos)
  const finalizarViaje = () => {
      const datos = { viaje: viajeActual, clienteId: viajeActual?.usuarioId, conductorId: usuario.id, clienteSocketId: viajeActual?.socketIdCliente };
      Alert.alert("Terminar Viaje", `Cobrar: $${viajeActual.precio.toFixed(2)} (${viajeActual.metodoPago})`, [ { text: "Cancelar", style: "cancel" }, { text: "Finalizar y Cobrar", onPress: () => socket.emit('finalizar-viaje', datos) } ]);
  };

  const rechazarViaje = () => { setViajeActual(null); };
  const abrirWhatsApp = () => { if (telefonoCliente) { const n = `58${telefonoCliente.replace(/[^0-9]/g, '').substring(1)}`; Linking.openURL(`https://wa.me/${n}`); }};
  
  if (!ubicacion) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colores.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.tituloHeader}>MODO CONDUCTOR</Text><TouchableOpacity onPress={volver} style={styles.botonSalir}><Ionicons name="close-outline" size={28} color={Colores.white} /></TouchableOpacity></View>
      
      {/* MAPA MODO SEGURO */}
      <View style={styles.mapaPlaceholder}><Ionicons name="map" size={60} color={Colores.gray} /><Text style={{color:Colores.gray}}>Mapa en Mantenimiento</Text></View>

      {viajeAceptado && (<TouchableOpacity style={styles.botonWhatsApp} onPress={abrirWhatsApp}><Ionicons name="logo-whatsapp" size={32} color="white" /></TouchableOpacity>)}

      {!viajeActual && (
        <View style={styles.panelControl}>
          <Text style={styles.estado}>Estado: {enLinea ? "🟢 EN LÍNEA" : "🔴 DESCONECTADO"}</Text>
          <TouchableOpacity style={[styles.botonEstado, { backgroundColor: enLinea ? Colores.red : Colores.green }]} onPress={toggleTrabajo}><Text style={styles.textoBoton}>{enLinea ? "DESCONECTARSE" : "CONECTARSE"}</Text></TouchableOpacity>
        </View>
      )}

      {/* ALERTA DE NUEVO VIAJE */}
      {enLinea && viajeActual && !viajeAceptado && (
        <View style={styles.panelAlertaViaje}>
          <Text style={styles.tituloAlerta}>¡NUEVO VIAJE!</Text>
          <Text style={styles.detalleAlerta}>📍 Destino: {viajeActual.destino}</Text>
          <Text style={styles.detalleAlerta}>💳 Pago: {viajeActual.metodoPago.toUpperCase()}</Text>
          <Text style={styles.precioAlerta}>${viajeActual.precio.toFixed(2)}</Text>
          <View style={styles.botonesAlerta}>
            <TouchableOpacity style={styles.botonRechazar} onPress={rechazarViaje}><Text style={styles.textoBotonAlerta}>RECHAZAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.botonAceptar} onPress={aceptarViaje}><Text style={styles.textoBotonAlerta}>ACEPTAR</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* PANEL DE VIAJE EN CURSO (CON 2 FASES) */}
      {viajeAceptado && (
          <View style={styles.panelEnCurso}>
              <Text style={styles.textoEnCurso}>
                  {viajeIniciado ? "🚀 En camino al destino" : "🚖 Buscando al cliente"}
              </Text>
              <Text style={styles.destinoEnCurso}>📍 {viajeActual.destino}</Text>
              
              <View style={styles.tarjetaCobro}>
                  <Text style={styles.labelCobro}>Cobrar:</Text>
                  <Text style={styles.montoCobro}>${viajeActual.precio.toFixed(2)}</Text>
              </View>

              {/* BOTÓN CAMBIANTE */}
              {!viajeIniciado ? (
                  <TouchableOpacity style={styles.botonIniciar} onPress={iniciarCarrera}>
                      <Text style={styles.textoFinalizar}>YA RECOGÍ AL CLIENTE</Text>
                  </TouchableOpacity>
              ) : (
                  <TouchableOpacity style={styles.botonFinalizar} onPress={finalizarViaje}>
                      <Text style={styles.textoFinalizar}>FINALIZAR VIAJE</Text>
                  </TouchableOpacity>
              )}
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colores.background },
  mapaPlaceholder: { flex: 1, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 15, backgroundColor: Colores.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  tituloHeader: { color: Colores.white, fontSize: 18, fontFamily: 'Inter-Bold' },
  botonSalir: { position: 'absolute', right: 15, top: Platform.OS === 'ios' ? 55 : 35 },
  panelControl: { padding: 25, backgroundColor: Colores.white, alignItems: 'center', position:'absolute', bottom: 0, width: '100%', borderTopLeftRadius: 20, borderTopRightRadius: 20, elevation: 20 },
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
  botonWhatsApp: { position: 'absolute', bottom: 300, right: 20, backgroundColor: Colores.whatsApp, padding: 18, borderRadius: 50, elevation: 10, zIndex: 1000 },
  
  // ESTILOS DEL FLUJO DE VIAJE
  panelEnCurso: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: Colores.white, padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20, alignItems: 'center', elevation: 20 },
  textoEnCurso: { color: Colores.gray, fontSize: 14, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 1 },
  destinoEnCurso: { fontSize: 20, color: Colores.text, marginBottom: 15, fontFamily: 'Inter-Bold' },
  tarjetaCobro: { flexDirection:'row', justifyContent:'space-between', width: '100%', backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
  labelCobro: { color: Colores.gray, fontSize: 14 },
  montoCobro: { fontSize: 18, fontFamily: 'Inter-Bold', color: Colores.darkBlue },
  
  // Botones de Fases
  botonIniciar: { backgroundColor: Colores.purple, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' }, // Morado para iniciar
  botonFinalizar: { backgroundColor: Colores.red, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' }, // Rojo para finalizar
  textoFinalizar: { color: Colores.white, fontSize: 18, fontFamily: 'Inter-Bold' }
});