import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps'; // <--- APAGADO PARA EVITAR CRASH EN APK
import { Inter_400Regular, Inter_500Medium, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import io from 'socket.io-client';

// Componentes
import PantallaConductor from '../../components/PantallaConductor';
import PantallaHistorial from '../../components/PantallaHistorial';
import PantallaLogin from '../../components/PantallaLogin';
import PantallaRegistro from '../../components/PantallaRegistro';
import PantallaSolicitudConductor from '../../components/PantallaSolicitudConductor';
import PantallaSoporte from '../../components/PantallaSoporte';

// ⚙️ CONFIGURACIÓN
const URL_SERVIDOR = 'https://digu-api.onrender.com'; 
const TASA_BCV = 236.50; 

// Configuración Notificaciones (Cliente)
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Paleta DIGU
const Colores = {
  primary: '#005A9C', green: '#27ae60', text: '#1E1E1E', textSecondary: '#7F8C8D',
  background: '#F5F7FA', white: '#FFFFFF', darkBlue: '#2c3e50', whatsApp: '#25D366',
  star: '#F1C40F', red: '#c0392b', orange: '#F39C12'
};

// ==============================================================
// 📍 COMPONENTE DEL MAPA (CLIENTE)
// ==============================================================
const MapaPrincipal = ({ usuarioLogueado, socket, cerrarSesion, irAHistorial, irASoporte }) => {
  const [modoConductor, setModoConductor] = useState(false);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [textoOrigen, setTextoOrigen] = useState("Mi Ubicación Actual");
  const [textoDestino, setTextoDestino] = useState("");
  const [editandoCampo, setEditandoCampo] = useState('destino');
  const [tipoVehiculo, setTipoVehiculo] = useState('carro');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [cargandoViaje, setCargandoViaje] = useState(false);
  
  const [miSocketId, setMiSocketId] = useState(socket ? socket.id : null);
  const [conductor, setConductor] = useState(null); 
  const [telefonoConductor, setTelefonoConductor] = useState(null);
  
  const [calificando, setCalificando] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [viajeIdActual, setViajeIdActual] = useState(null);
  const [comentario, setComentario] = useState('');
  const [estadoViajeTexto, setEstadoViajeTexto] = useState("Tu conductor está en camino!");

  // Simulación de precio (Ya que no hay mapa activo)
  const precioEstimado = tipoVehiculo === 'carro' ? 3.00 : 1.50;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setMiUbicacion(location.coords);
      await Notifications.requestPermissionsAsync(); // Pedir permisos
    })();

    if (socket) {
      if (!miSocketId) setMiSocketId(socket.id);
      socket.on('connect', () => { setMiSocketId(socket.id); });
      
      socket.on('viaje-confirmado', (info) => {
        Notifications.scheduleNotificationAsync({ content: { title: "🚖 ¡Viaje Aceptado!", body: `${info.nombre} viene en camino.` }, trigger: null });
        Alert.alert("¡Viaje Aceptado!", `${info.nombre} está en camino.`);
        setConductor(info);
        setTelefonoConductor(info.telefono);
        setEstadoViajeTexto("Tu conductor está en camino!");
      });

      socket.on('viaje-iniciado-cliente', () => {
         setEstadoViajeTexto("🚀 ¡Viaje Iniciado! Disfruta el camino.");
      });
      
      socket.on('viaje-terminado', (datos) => {
        setConductor(null);
        setViajeIdActual(datos.viajeId);
        setCalificando(true);
      });
    }
    return () => {
      if (socket) {
        socket.off('viaje-confirmado');
        socket.off('viaje-iniciado-cliente');
        socket.off('viaje-terminado');
      }
    }
  }, [socket, miSocketId]);

  const confirmarViaje = async () => {
    if (!miSocketId) { Alert.alert("Error", "No conectado."); return; }
    setCargandoViaje(true);
    try {
      await fetch(`${URL_SERVIDOR}/pedir-viaje`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origen: textoOrigen, destino: textoDestino || "Destino Seleccionado", 
          vehiculo: tipoVehiculo, precio: precioEstimado,
          metodoPago: metodoPago, usuarioId: usuarioLogueado.id, socketIdCliente: miSocketId, telefonoCliente: usuarioLogueado.telefono
        })
      });
    } catch (error) { Alert.alert("Error", "No hay conexión"); } 
    finally { setCargandoViaje(false); }
  };
  
  const abrirWhatsApp = () => {
    if (!telefonoConductor) return;
    const numeroVzla = `58${telefonoConductor.replace(/[^0-9]/g, '').substring(1)}`;
    Linking.openURL(`https://wa.me/${numeroVzla}?text=Hola, soy tu pasajero de DIGU.`);
  };

  const enviarCalificacion = async () => {
    if (estrellas === 0) { Alert.alert("Error", "Selecciona estrellas."); return; }
    if (!viajeIdActual) return;
    try {
      await fetch(`${URL_SERVIDOR}/viaje/calificar`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ viajeId: viajeIdActual, estrellas, comentario }) });
      Alert.alert("¡Gracias!", `Has calificado con ${estrellas} estrellas.`);
    } catch (error) { Alert.alert("Error", "No se pudo enviar."); }
    setCalificando(false); setTextoDestino(""); setEstrellas(0); setComentario(""); setViajeIdActual(null);
  };

  if (!miUbicacion) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={Colores.primary} /></View>;
  if (modoConductor) return <PantallaConductor usuario={usuarioLogueado} volver={() => setModoConductor(false)} socket={socket} />;

  return (
    <View style={styles.container}>
      {/* MAPA SEGURO (PLACEHOLDER) */}
      <View style={styles.mapaPlaceholder}>
        <Ionicons name="map" size={80} color={Colores.textSecondary} />
        <Text style={{color:Colores.textSecondary, marginTop:10}}>Mapa en Mantenimiento</Text>
        <Text style={{color:Colores.textSecondary, fontSize: 10}}>Configuración de API Key pendiente</Text>
      </View>

      {!calificando && (
        <>
          {/* Botón Modo Conductor (Visible para CONDUCTOR y ADMIN) */}
          {(usuarioLogueado.rol === 'CONDUCTOR' || usuarioLogueado.rol === 'ADMIN') && (
            <TouchableOpacity style={styles.botonFlotanteDerecha} onPress={() => setModoConductor(true)}>
              <Ionicons name="car-sport" size={24} color={Colores.darkBlue} />
            </TouchableOpacity>
          )}
          <View style={styles.saludoContainer}>
            <Text style={styles.saludoTexto}>Hola, {usuarioLogueado.nombre}</Text>
            <View style={{flexDirection: 'row'}}>
               <TouchableOpacity onPress={irAHistorial} style={{marginRight: 15, marginTop: 2}}><Ionicons name="time-outline" size={22} color={Colores.darkBlue} /></TouchableOpacity><TouchableOpacity onPress={irASoporte} style={{marginRight: 15, marginTop: 2}}><Ionicons name="headset-outline" size={22} color={Colores.primary} /></TouchableOpacity><TouchableOpacity onPress={cerrarSesion} style={styles.botonLogout}><Ionicons name="log-out-outline" size={22} color={Colores.red} /></TouchableOpacity>
            </View>
          </View>
        </>
      )}
      
      {conductor && (<TouchableOpacity style={styles.botonWhatsApp} onPress={abrirWhatsApp}><Ionicons name="logo-whatsapp" size={32} color="white" /></TouchableOpacity>)}

      {!conductor && !calificando && (
        <View style={styles.panelInputs}>
          <View style={[styles.inputRow, editandoCampo === 'origen' && styles.inputActivo]}><Ionicons name="radio-button-on" size={20} color={Colores.green} /><TouchableOpacity style={{flex: 1}} onPress={() => setEditandoCampo('origen')}><TextInput style={styles.inputText} value={textoOrigen} editable={false} /></TouchableOpacity></View>
          <View style={styles.conectorVisual} />
          <View style={[styles.inputRow, editandoCampo === 'destino' && styles.inputActivo]}><Ionicons name="location" size={20} color={Colores.primary} /><TouchableOpacity style={{flex: 1}} onPress={() => setEditandoCampo('destino')}><TextInput style={styles.inputText} value={textoDestino} onChangeText={setTextoDestino} placeholder="Escribe tu destino aquí..." /></TouchableOpacity></View>
        </View>
      )}
      
      {!conductor && !calificando && (
        <View style={styles.panelConfirmacion}>
          <Text style={styles.tituloDistancia}>Tarifa Estándar (Demo)</Text>
          <View style={styles.selectorVehiculo}>
            <TouchableOpacity style={[styles.opcionVehiculo, tipoVehiculo === 'moto' && styles.vehiculoActivo]} onPress={() => setTipoVehiculo('moto')}><Ionicons name="bicycle" size={30} color={tipoVehiculo === 'moto' ? 'white' : Colores.darkBlue} /><Text style={[styles.textoVehiculo, tipoVehiculo === 'moto' && {color:'white'}]}>Moto $1.50</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.opcionVehiculo, tipoVehiculo === 'carro' && styles.vehiculoActivo]} onPress={() => setTipoVehiculo('carro')}><Ionicons name="car-sport" size={30} color={tipoVehiculo === 'carro' ? 'white' : Colores.darkBlue} /><Text style={[styles.textoVehiculo, tipoVehiculo === 'carro' && {color:'white'}]}>Carro $3.00</Text></TouchableOpacity>
          </View>
          <View style={styles.separador} />
          <Text style={styles.labelTitulo}>Método de Pago:</Text>
          <View style={styles.selectorPago}>
            <TouchableOpacity style={[styles.opcionPago, metodoPago === 'efectivo' && styles.pagoActivo]} onPress={() => setMetodoPago('efectivo')}><Ionicons name="cash-outline" size={24} color={metodoPago === 'efectivo' ? 'white' : Colores.darkBlue} /><Text style={[styles.textoPago, metodoPago === 'efectivo' && {color: 'white'}]}>Efectivo ($)</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.opcionPago, metodoPago === 'pagomovil' && styles.pagoActivo]} onPress={() => setMetodoPago('pagomovil')}><Ionicons name="phone-portrait-outline" size={24} color={metodoPago === 'pagomovil' ? 'white' : Colores.darkBlue} /><Text style={[styles.textoPago, metodoPago === 'pagomovil' && {color: 'white'}]}>Pago Móvil (Bs)</Text></TouchableOpacity>
          </View>
          {metodoPago === 'pagomovil' && (<View style={styles.cajaPagoMovil}><Text style={styles.textoPagoMovilLabel}>Monto a transferir (Tasa {TASA_BCV}):</Text><Text style={styles.textoPagoMovilMonto}>Bs {(precioEstimado * TASA_BCV).toFixed(2)}</Text></View>)}
          <TouchableOpacity style={styles.botonConfirmar} onPress={confirmarViaje} disabled={cargandoViaje}>{cargandoViaje ? <ActivityIndicator color="white" /> : <Text style={styles.textoBoton}>CONFIRMAR {tipoVehiculo.toUpperCase()}</Text>}</TouchableOpacity>
        </View>
      )}

      {conductor && !calificando && (
        <View style={styles.panelEnCamino}>
          <Text style={styles.tituloEnCamino}>{estadoViajeTexto}</Text>
          <Ionicons name="car-sport" size={40} color={Colores.darkBlue} />
          <Text style={styles.nombreConductor}>{conductor.nombre}</Text>
          <Text style={styles.detalleAuto}>{conductor.auto} - {conductor.placa}</Text>
          <View style={styles.tarjetaCobroMini}><Text style={styles.labelCobro}>A pagar:</Text><Text style={styles.montoCobroMini}>${precioEstimado.toFixed(2)}</Text></View>
        </View>
      )}
      
      {calificando && (
        <View style={styles.panelCalificacion}>
          <Text style={styles.tituloCalificacion}>Viaje Finalizado</Text>
          <View style={styles.estrellasContainer}>
            {[1, 2, 3, 4, 5].map((star) => (<TouchableOpacity key={star} onPress={() => setEstrellas(star)}><Ionicons name={star <= estrellas ? "star" : "star-outline"} size={40} color={Colores.star} style={{ marginHorizontal: 5 }} /></TouchableOpacity>))}
          </View>
          <TextInput style={styles.inputComentario} placeholder="Añade un comentario..." onChangeText={setComentario} value={comentario} multiline={true} />
          <TouchableOpacity style={styles.botonEnviarCalificacion} onPress={enviarCalificacion} disabled={estrellas === 0}><Text style={styles.textoBoton}>ENVIAR</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

SplashScreen.preventAutoHideAsync();
export default function AppController() {
  const [pantallaActual, setPantallaActual] = useState('login');
  const [datosSesion, setDatosSesion] = useState(null);
  const [socket, setSocket] = useState(null);
  const [fontsLoaded, fontError] = useFonts({ 'Inter-Regular': Inter_400Regular, 'Inter-Medium': Inter_500Medium, 'Inter-Bold': Inter_700Bold });
  useEffect(() => { if (fontsLoaded || fontError) SplashScreen.hideAsync(); }, [fontsLoaded, fontError]);

  const handleLogout = () => { setDatosSesion(null); if (socket) socket.disconnect(); setSocket(null); setPantallaActual('login'); Alert.alert("Sesión Cerrada", "Has salido de DIGU."); };
  const alHacerLogin = (token, usuario) => {
    // ADMIN PERMITIDO
    if (usuario.rol !== 'CLIENTE' && usuario.rol !== 'CONDUCTOR' && usuario.rol !== 'ADMIN') { Alert.alert("Acceso Denegado", "Tu solicitud está siendo revisada."); return; }
    setDatosSesion({ token, usuario }); const newSocket = io(URL_SERVIDOR); setSocket(newSocket); setPantallaActual('mapa');
  };
  
  if (!fontsLoaded && !fontError) return null;
  if (pantallaActual === 'mapa') return <MapaPrincipal usuarioLogueado={datosSesion.usuario} socket={socket} cerrarSesion={handleLogout} irAHistorial={() => setPantallaActual('historial')} irASoporte={() => setPantallaActual('soporte')} />;
  if (pantallaActual === 'registro') return <PantallaRegistro volver={() => setPantallaActual('login')} />;
  if (pantallaActual === 'solicitud') return <PantallaSolicitudConductor volver={() => setPantallaActual('login')} />;
  if (pantallaActual === 'historial') return <PantallaHistorial usuario={datosSesion.usuario} volver={() => setPantallaActual('mapa')} />;
  if (pantallaActual === 'soporte') return <PantallaSoporte usuario={datosSesion.usuario} volver={() => setPantallaActual('mapa')} />;
  return ( <PantallaLogin onLoginExitoso={alHacerLogin} irARegistro={() => setPantallaActual('registro')} irASolicitud={() => setPantallaActual('solicitud')} /> );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapaPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  textoPlaceholder: { fontSize: 20, fontFamily: 'Inter-Bold', color: Colores.textSecondary, marginTop: 10 },
  botonFlotanteDerecha: { position: 'absolute', top: 50, right: 20, backgroundColor: Colores.white, padding: 12, borderRadius: 30, elevation: 8 },
  botonLogout: { paddingLeft: 10, marginTop: 2 },
  saludoContainer: { position: 'absolute', top: 50, left: 20, backgroundColor: Colores.white, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 30, elevation: 8, zIndex: 999 },
  saludoTexto: { fontFamily: 'Inter-Bold', color: Colores.darkBlue },
  panelInputs: { position: 'absolute', top: 110, left: 20, right: 20, backgroundColor: Colores.white, borderRadius: 20, padding: 15, elevation: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, backgroundColor: Colores.background },
  inputActivo: { backgroundColor: '#E6F0F6', borderWidth: 1, borderColor: Colores.primary },
  inputText: { marginLeft: 10, fontSize: 16, fontFamily: 'Inter-Medium', color: Colores.text, flex: 1 },
  conectorVisual: { position: 'absolute', left: 34, top: 48, width: 2, height: 25, backgroundColor: '#ddd', zIndex: 0 },
  panelConfirmacion: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: Colores.white, padding: 20, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20 },
  tituloDistancia: { textAlign: 'center', color: Colores.textSecondary, marginBottom: 10, fontFamily: 'Inter-Medium' },
  selectorVehiculo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  opcionVehiculo: { flex: 1, alignItems: 'center', padding: 10, marginHorizontal: 5, borderRadius: 15, backgroundColor: Colores.background, borderWidth: 1, borderColor: '#eee' },
  vehiculoActivo: { backgroundColor: Colores.darkBlue, borderColor: Colores.darkBlue },
  textoVehiculo: { marginTop: 5, fontFamily: 'Inter-Bold', fontSize: 12 },
  precioMini: { fontSize: 12, marginTop: 2, fontFamily: 'Inter-Regular' },
  separador: { height: 1, backgroundColor: '#eee', marginBottom: 15 },
  labelTitulo: { fontSize: 14, color: Colores.textSecondary, fontFamily: 'Inter-Medium', marginBottom: 10, textAlign: 'center' },
  selectorPago: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  opcionPago: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginHorizontal: 5, borderRadius: 15, backgroundColor: Colores.background, borderWidth: 1, borderColor: '#eee' },
  pagoActivo: { backgroundColor: Colores.darkBlue, borderColor: Colores.darkBlue },
  textoPago: { marginLeft: 10, fontFamily: 'Inter-Bold', fontSize: 14 },
  cajaPagoMovil: { backgroundColor: '#EAF6EF', borderColor: Colores.green, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 15 },
  textoPagoMovilLabel: { color: Colores.green, fontSize: 12, fontFamily: 'Inter-Regular' },
  textoPagoMovilMonto: { color: Colores.green, fontSize: 20, fontFamily: 'Inter-Bold' },
  botonConfirmar: { backgroundColor: Colores.green, paddingVertical: 18, borderRadius: 15, alignItems: 'center', elevation: 3 },
  textoBoton: { color: Colores.white, fontSize: 18, fontFamily: 'Inter-Bold' },
  panelEnCamino: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: Colores.white, padding: 25, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20, alignItems: 'center' },
  tituloEnCamino: { fontSize: 16, color: Colores.textSecondary, marginBottom: 10, fontFamily: 'Inter-Regular' },
  nombreConductor: { fontSize: 22, fontFamily: 'Inter-Bold', color: Colores.darkBlue, marginTop: 10 },
  detalleAuto: { fontSize: 16, color: Colores.text, marginTop: 5, fontFamily: 'Inter-Regular' },
  botonWhatsApp: { position: 'absolute', bottom: 30, right: 20, backgroundColor: Colores.whatsApp, padding: 18, borderRadius: 50, elevation: 10, zIndex: 1000 },
  panelCalificacion: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', padding: 30, zIndex: 2000 },
  tituloCalificacion: { fontSize: 28, fontFamily: 'Inter-Bold', color: Colores.darkBlue, marginTop: 20 },
  subtituloCalificacion: { fontSize: 18, fontFamily: 'Inter-Regular', color: Colores.textSecondary, marginVertical: 20 },
  estrellasContainer: { flexDirection: 'row', marginBottom: 20 },
  botonEnviarCalificacion: { backgroundColor: Colores.primary, paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30, elevation: 5 },
  inputComentario: { width: '90%', minHeight: 100, backgroundColor: Colores.white, borderColor: Colores.textSecondary, borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 20, fontFamily: 'Inter-Regular', textAlignVertical: 'top' },
  tarjetaCobroMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 10, borderRadius: 10, marginTop: 10 },
  labelCobro: { color: Colores.textSecondary, marginRight: 5 },
  montoCobroMini: { fontSize: 16, fontFamily: 'Inter-Bold', color: Colores.green },
  metodoMini: { fontSize: 12, color: Colores.textSecondary, marginLeft: 5 }
});