import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth } from "./firebase";
import "./styles.css";

// --- PALETA DE COLORES ESTILO APPLE ---
const theme = {
  bg: "#f5f5f7",
  card: "#ffffff",
  text: "#1d1d1f",
  textSec: "#86868b",
  blue: "#0071e3",
  border: "#d2d2d7",
  shadow: "0 4px 24px rgba(0,0,0,0.04)",
  radius: "16px",
  inputBg: "#f5f5f7",
};

const globalFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const CORREOS_ADMIN = ["tamisnm@gmail.com", "gonzaloivelasco2@gmail.com"];

// UTILIDAD PARA FECHAS LOCALES
const toLocalISO = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const InputMinimalista = (props) => (
  <input {...props} style={{ padding: "12px 16px", borderRadius: "10px", border: "none", backgroundColor: theme.inputBg, fontSize: "14px", color: theme.text, outline: "none", width: "100%", boxSizing: "border-box", ...props.style }} />
);

const SelectMinimalista = (props) => (
  <select {...props} style={{ padding: "12px 16px", borderRadius: "10px", border: "none", backgroundColor: theme.inputBg, fontSize: "14px", color: theme.text, outline: "none", width: "100%", boxSizing: "border-box", appearance: "none", ...props.style }}>
    {props.children}
  </select>
);

const BotonAzul = (props) => (
  <button {...props} style={{ backgroundColor: theme.blue, color: "white", padding: "12px 20px", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "0.2s", width: "100%", ...props.style }}>
    {props.children}
  </button>
);

const Acordeon = ({ titulo, activo, onClick, children }) => (
  <div style={{ backgroundColor: theme.card, borderRadius: theme.radius, overflow: "hidden", marginBottom: "10px", boxShadow: theme.shadow }}>
    <button onClick={onClick} style={{ width: "100%", padding: "15px", border: "none", backgroundColor: "transparent", textAlign: "left", fontSize: "16px", fontWeight: "600", color: theme.text, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      {titulo} <span style={{ fontSize: "12px", color: theme.textSec }}>{activo ? "▲" : "▼"}</span>
    </button>
    {activo && <div style={{ padding: "0 15px 15px 15px", borderTop: `1px solid ${theme.inputBg}` }}>{children}</div>}
  </div>
);

export default function App() {
  const [alumnos, setAlumnos] = useState([]);
  const [turnosFijos, setTurnosFijos] = useState([]);
  const [turnosSueltos, setTurnosSueltos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [registros, setRegistros] = useState([]);
  
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [usuarioFirebase, setUsuarioFirebase] = useState(null);
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  const [isRegistrando, setIsRegistrando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [adminVistaAlumno, setAdminVistaAlumno] = useState(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [vistaCalendario, setVistaCalendario] = useState("semana");
  const [bloquesExpandidos, setBloquesExpandidos] = useState({});

  const [acordeonAbierto, setAcordeonAbierto] = useState(""); 
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(""); 
  const [diaFijoSeleccionado, setDiaFijoSeleccionado] = useState("Lunes");
  const [horaSeleccionada, setHoraSeleccionada] = useState("18:00");
  const [tipoClase, setTipoClase] = useState("grupal");
  const [nuevoAlumnoNombre, setNuevoAlumnoNombre] = useState("");
  const [nuevoAlumnoEmail, setNuevoAlumnoEmail] = useState("");
  const [packSeleccionado, setPackSeleccionado] = useState(4);
  const [alumnoAEditarId, setAlumnoAEditarId] = useState(""); 
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // ESTADOS NUEVOS: FASE 2
  const [fechaSuelta, setFechaSuelta] = useState(toLocalISO(new Date()));
  const [tipoBloqueo, setTipoBloqueo] = useState("dia_completo");
  const [bloqueoFecha1, setBloqueoFecha1] = useState(toLocalISO(new Date()));
  const [bloqueoFecha2, setBloqueoFecha2] = useState(toLocalISO(new Date()));
  const [bloqueoHora1, setBloqueoHora1] = useState("09:00");
  const [bloqueoHora2, setBloqueoHora2] = useState("12:00");
  
  // MODAL REPROGRAMAR
  const [modalReprogramar, setModalReprogramar] = useState(null);
  const [reprogramarFecha, setReprogramarFecha] = useState(toLocalISO(new Date()));
  const [reprogramarHora, setReprogramarHora] = useState("18:00");

  useEffect(() => {
    const unsuscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioFirebase(user);
    });
    return () => unsuscribe();
  }, []);

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setMensaje("⏳ Verificando...");
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setMensaje("");
    } catch (error) {
      setMensaje("❌ Correo o contraseña incorrectos.");
      setTimeout(() => setMensaje(""), 4000);
    }
  };

  const registrarse = async (e) => {
    e.preventDefault();
    setMensaje("⏳ Creando cuenta...");
    try {
      await createUserWithEmailAndPassword(auth, emailLogin, passwordLogin);
      setMensaje("✅ ¡Cuenta creada!");
    } catch (error) {
      setMensaje("❌ Error al crear cuenta.");
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  const recuperarPassword = async () => {
    if (!emailLogin.trim()) {
      setMensaje("⚠️ Escribí tu correo arriba y luego tocá este botón.");
      setTimeout(() => setMensaje(""), 5000);
      return;
    }
    setMensaje("⏳ Enviando correo...");
    try {
      await sendPasswordResetEmail(auth, emailLogin);
      setMensaje("✅ Correo de recuperación enviado.");
    } catch (error) {
      setMensaje("❌ Error al enviar correo.");
    }
    setTimeout(() => setMensaje(""), 6000);
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    setSemanaOffset(0);
    setVistaCalendario("semana");
    setAdminVistaAlumno(null);
    setAcordeonAbierto("");
  };

  const getDiasVisualizacion = (offset, vista) => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunesBase = new Date(hoy.setDate(diff));
    lunesBase.setDate(lunesBase.getDate() + offset * 7);

    const cantidadSemanas = vista === "mes" ? 4 : 1;
    const dias = [];
    const nombresDias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    for (let s = 0; s < cantidadSemanas; s++) {
      const lunesSemanaActual = new Date(lunesBase);
      lunesSemanaActual.setDate(lunesSemanaActual.getDate() + s * 7);
      for (let i = 0; i < 6; i++) {
        const fecha = new Date(lunesSemanaActual);
        fecha.setDate(lunesSemanaActual.getDate() + i);
        const diaCorto = nombresDias[fecha.getDay()].substring(0, 3);
        const diaStrCorto = `${diaCorto} ${fecha.getDate()}/${fecha.getMonth() + 1}`;
        dias.push({
          nombreBase: nombresDias[fecha.getDay()],
          fechaExacta: diaStrCorto,
          fechaISO: toLocalISO(fecha)
        });
      }
    }
    return dias;
  };

  const diasAMostrarCrudos = getDiasVisualizacion(semanaOffset, vistaCalendario);
  
  const hayClasesElSabado = turnosFijos.some(t => t.diaSemana === "Sábado") || turnosSueltos.some(t => {
    const d = new Date(t.fechaISO + "T12:00:00");
    return d.getDay() === 6;
  });
  const diasAMostrar = diasAMostrarCrudos.filter(dia => dia.nombreBase !== "Sábado" || hayClasesElSabado);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [alumnosSnap, fijosSnap, sueltosSnap, bloqueosSnap, regSnap] = await Promise.all([
        getDocs(collection(db, "alumnos")),
        getDocs(collection(db, "turnos_fijos")),
        getDocs(collection(db, "turnos_sueltos")),
        getDocs(collection(db, "bloqueos")),
        getDocs(collection(db, "registro_clases"))
      ]);

      setAlumnos(alumnosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setTurnosFijos(fijosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setTurnosSueltos(sueltosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setBloqueos(bloqueosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setRegistros(regSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      setMensaje("❌ Error al cargar los datos.");
    }
    setCargando(false);
  };

  useEffect(() => { if (usuarioFirebase) cargarDatos(); }, [usuarioFirebase]);

  const toggleAcordeon = (nombre) => setAcordeonAbierto(acordeonAbierto === nombre ? "" : nombre);

  const seleccionarAlumnoAEditar = (id) => {
    setAlumnoAEditarId(id);
    const al = alumnos.find(a => a.id === id);
    if(al) { setEditNombre(al.nombre); setEditEmail(al.email); }
  };

  const crearAlumno = async () => {
    if (!nuevoAlumnoNombre.trim() || !nuevoAlumnoEmail.trim()) { setMensaje("⚠️ Ingresá Nombre y Email."); setTimeout(() => setMensaje(""), 4000); return; }
    setMensaje("⏳ Creando...");
    try {
      await addDoc(collection(db, "alumnos"), { nombre: nuevoAlumnoNombre, email: nuevoAlumnoEmail.toLowerCase(), creditos: { individual: 0, grupal: 0 }, ultimoPago: "Sin pagos", historialPagos: [] });
      setNuevoAlumnoNombre(""); setNuevoAlumnoEmail(""); cargarDatos(); setMensaje(`✅ Alumno agregado.`);
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  const guardarEdicionAlumno = async () => {
    if (!alumnoAEditarId) { setMensaje("⚠️ Seleccioná alumno."); setTimeout(() => setMensaje(""), 4000); return; }
    setMensaje("⏳ Actualizando...");
    try {
      await updateDoc(doc(db, "alumnos", alumnoAEditarId), { nombre: editNombre, email: editEmail.toLowerCase() });
      cargarDatos(); setMensaje(`✅ Actualizado.`);
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  const borrarAlumno = async () => {
    if (!alumnoSeleccionado) { setMensaje("⚠️ Seleccioná alumno."); setTimeout(() => setMensaje(""), 4000); return; }
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    if (!window.confirm(`⚠️ ¿Borrar a ${alumno.nombre} definitivamente?`)) return;
    setMensaje("⏳ Borrando...");
    try {
      await deleteDoc(doc(db, "alumnos", alumno.id));
      const susTurnos = turnosFijos.filter((t) => t.alumnoId === alumno.id);
      for (let turno of susTurnos) await deleteDoc(doc(db, "turnos_fijos", turno.id));
      setMensaje(`🗑️ Borrado.`); cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  const registrarPago = async () => {
    if (!alumnoSeleccionado) { setMensaje("⚠️ Seleccioná alumno."); setTimeout(() => setMensaje(""), 4000); return; }
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    setMensaje("⏳ Guardando pago...");
    try {
      const nuevosCreditos = alumno.creditos[tipoClase] + parseInt(packSeleccionado);
      const fechaHoy = new Date().toLocaleDateString();
      const nuevoPago = { fecha: fechaHoy, tipo: tipoClase, cantidad: parseInt(packSeleccionado) };
      const historialActualizado = [...(alumno.historialPagos || []), nuevoPago];
      await updateDoc(doc(db, "alumnos", alumno.id), { ["creditos." + tipoClase]: nuevosCreditos, ultimoPago: fechaHoy, historialPagos: historialActualizado });
      setMensaje(`💰 Pago registrado!`); cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  const agendarTurnoFijo = async () => {
    if (!alumnoSeleccionado) { setMensaje("⚠️ Seleccioná alumno."); setTimeout(() => setMensaje(""), 4000); return; }
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    setMensaje("⏳ Asignando...");
    try {
      await addDoc(collection(db, "turnos_fijos"), { alumnoId: alumno.id, nombreAlumno: alumno.nombre, diaSemana: diaFijoSeleccionado, hora: horaSeleccionada, tipo: tipoClase });
      setMensaje(`✅ Fijado!`); cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  // NUEVO: AGENDAR TURNO SUELTO
  const agendarTurnoSuelto = async () => {
    if (!alumnoSeleccionado) { setMensaje("⚠️ Seleccioná alumno."); setTimeout(() => setMensaje(""), 4000); return; }
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    setMensaje("⏳ Asignando...");
    try {
      await addDoc(collection(db, "turnos_sueltos"), { alumnoId: alumno.id, nombreAlumno: alumno.nombre, fechaISO: fechaSuelta, hora: horaSeleccionada, tipo: tipoClase });
      setMensaje(`📌 Clase suelta agendada!`); cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  // NUEVO: CREAR BLOQUEO
  const crearBloqueo = async () => {
    setMensaje("⏳ Bloqueando...");
    try {
      const nuevoBloqueo = { tipo: tipoBloqueo };
      if (tipoBloqueo === "dia_completo") nuevoBloqueo.fechaISO = bloqueoFecha1;
      if (tipoBloqueo === "rango_dias") { nuevoBloqueo.fechaInicio = bloqueoFecha1; nuevoBloqueo.fechaFin = bloqueoFecha2; }
      if (tipoBloqueo === "rango_horas") { nuevoBloqueo.fechaISO = bloqueoFecha1; nuevoBloqueo.horaInicio = bloqueoHora1; nuevoBloqueo.horaFin = bloqueoHora2; }
      await addDoc(collection(db, "bloqueos"), nuevoBloqueo);
      setMensaje(`⛔ Agenda bloqueada.`); cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 4000);
  };

  const borrarBloqueo = async (id) => {
    await deleteDoc(doc(db, "bloqueos", id));
    cargarDatos();
  };

  const borrarTurno = async (id, esFijo) => {
    if (!window.confirm("¿Eliminar clase de la agenda?")) return;
    await deleteDoc(doc(db, esFijo ? "turnos_fijos" : "turnos_sueltos", id));
    cargarDatos();
  };

  const procesarClaseDelDia = async (turno, fechaISO, fechaExacta, accion) => {
    setMensaje("⏳ Procesando...");
    try {
      if (accion === "asistio") {
        const alumno = alumnos.find((a) => a.id === turno.alumnoId);
        await updateDoc(doc(db, "alumnos", alumno.id), { ["creditos." + turno.tipo]: alumno.creditos[turno.tipo] - 1 });
        await addDoc(collection(db, "registro_clases"), { turnoFijoId: turno.id, fechaISO: fechaISO, fechaExacta: fechaExacta, estado: "descontado" });
      } else if (accion === "aviso") {
        await addDoc(collection(db, "registro_clases"), { turnoFijoId: turno.id, fechaISO: fechaISO, fechaExacta: fechaExacta, estado: "ausente_aviso" });
      }
      cargarDatos();
    } catch (error) { setMensaje("❌ Error."); }
    setTimeout(() => setMensaje(""), 2000);
  };

  // NUEVO: CONFIRMAR REPROGRAMACION
  const confirmarReprogramacion = async () => {
    setMensaje("⏳ Reprogramando...");
    try {
      if (modalReprogramar.clase.esFijo) {
        // Marcamos la original como reprogramada en ese día
        await addDoc(collection(db, "registro_clases"), { turnoFijoId: modalReprogramar.clase.id, fechaISO: modalReprogramar.fechaOriginalISO, estado: "reprogramado" });
      } else {
        // Si ya era suelta, la borramos y creamos una nueva
        await deleteDoc(doc(db, "turnos_sueltos", modalReprogramar.clase.id));
      }
      // Creamos la nueva clase suelta en destino
      await addDoc(collection(db, "turnos_sueltos"), { alumnoId: modalReprogramar.clase.alumnoId, nombreAlumno: modalReprogramar.clase.nombreAlumno, fechaISO: reprogramarFecha, hora: reprogramarHora, tipo: modalReprogramar.clase.tipo });
      
      setMensaje("✅ Clase movida con éxito.");
      setModalReprogramar(null);
      cargarDatos();
    } catch(e) { setMensaje("❌ Error al mover clase."); }
    setTimeout(() => setMensaje(""), 3000);
  };

  const saltarAdelante = () => setSemanaOffset((prev) => prev + (vistaCalendario === "mes" ? 4 : 1));
  const saltarAtras = () => setSemanaOffset((prev) => prev - (vistaCalendario === "mes" ? 4 : 1));
  const toggleBloque = (claveUnica) => setBloquesExpandidos((prev) => ({ ...prev, [claveUnica]: !prev[claveUnica] }));

  const esAdmin = CORREOS_ADMIN.includes(usuarioFirebase?.email);

  // EVALUADOR DE BLOQUEOS
  const isClassBlocked = (claseHora, diaISO) => {
    return bloqueos.some(b => {
      if (b.tipo === "dia_completo" && b.fechaISO === diaISO) return true;
      if (b.tipo === "rango_dias" && diaISO >= b.fechaInicio && diaISO <= b.fechaFin) return true;
      if (b.tipo === "rango_horas" && b.fechaISO === diaISO && claseHora >= b.horaInicio && claseHora <= b.horaFin) return true;
      return false;
    });
  };

  // ==========================================
  // PANTALLA 1: LOGIN (Simplificado en lógica, igual visual)
  // ==========================================
  if (!usuarioFirebase) {
    return (
      <div style={{ backgroundColor: theme.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: globalFont }}>
        <div style={{ padding: "40px", width: "100%", maxWidth: "360px", backgroundColor: theme.card, borderRadius: theme.radius, boxShadow: theme.shadow, textAlign: "center" }}>
          <h1 style={{ color: theme.text, marginBottom: "8px", fontSize: "24px", fontWeight: "700" }}>Estudio Musical TAP</h1>
          <p style={{ color: theme.textSec, marginBottom: "30px", fontSize: "14px" }}>Ingresá para ver tu agenda</p>
          {mensaje !== "" && <div style={{ color: mensaje.includes("❌") ? "#ff3b30" : "#34c759", fontSize: "14px", marginBottom: "20px", fontWeight: "500" }}>{mensaje}</div>}
          <form onSubmit={isRegistrando ? registrarse : iniciarSesion} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InputMinimalista type="email" placeholder="Correo electrónico" value={emailLogin} onChange={(e) => setEmailLogin(e.target.value)} required />
            <div style={{ position: "relative" }}>
              <InputMinimalista type={mostrarPassword ? "text" : "password"} placeholder="Contraseña" value={passwordLogin} onChange={(e) => setPasswordLogin(e.target.value)} required style={{ paddingRight: "40px" }} />
              <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: theme.textSec, padding: 0 }} title={mostrarPassword ? "Ocultar" : "Ver"}>{mostrarPassword ? "🙈" : "👁️"}</button>
            </div>
            <BotonAzul type="submit" style={{ marginTop: "10px" }}>{isRegistrando ? "Crear cuenta" : "Ingresar"}</BotonAzul>
          </form>
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
            <button onClick={() => setIsRegistrando(!isRegistrando)} style={{ background: "none", border: "none", color: theme.blue, fontWeight: "500", cursor: "pointer", fontSize: "14px" }}>{isRegistrando ? "¿Ya tenés cuenta? Iniciá sesión" : "Crear una cuenta nueva"}</button>
            <button onClick={recuperarPassword} style={{ background: "none", border: "none", color: theme.textSec, cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}>Olvidé mi contraseña</button>
          </div>
        </div>
      </div>
    );
  }

  if (cargando) return <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: globalFont, color: theme.textSec }}><h2>Cargando...</h2></div>;

  const miPerfil = esAdmin && adminVistaAlumno ? adminVistaAlumno : alumnos.find((a) => a.email === usuarioFirebase.email);

  if (!esAdmin && !miPerfil) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: globalFont }}>
        <div style={{ padding: "40px", textAlign: "center", backgroundColor: theme.card, borderRadius: theme.radius, boxShadow: theme.shadow }}>
          <h2 style={{ color: theme.text, marginBottom: "10px" }}>Cuenta no vinculada</h2>
          <p style={{ color: theme.textSec }}>El estudio aún no registró este correo.</p>
          <BotonAzul onClick={cerrarSesion} style={{ marginTop: "20px" }}>Volver al inicio</BotonAzul>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER PRINCIPAL (ADMIN Y ALUMNO)
  // ==========================================
  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh", fontFamily: globalFont, padding: "20px 10px", position: "relative" }}>
      
      {/* MODAL DE REPROGRAMACIÓN FLOTANTE */}
      {modalReprogramar && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: theme.card, padding: "25px", borderRadius: theme.radius, width: "90%", maxWidth: "340px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 15px 0", color: theme.text }}>Mover Clase</h3>
            <p style={{ fontSize: "13px", color: theme.textSec, margin: "0 0 20px 0" }}>Reprogramando a <strong>{modalReprogramar.clase.nombreAlumno}</strong>. La clase original quedará marcada como movida.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: theme.textSec }}>Nueva Fecha:</label>
              <InputMinimalista type="date" value={reprogramarFecha} onChange={(e) => setReprogramarFecha(e.target.value)} />
              <label style={{ fontSize: "12px", fontWeight: "600", color: theme.textSec, marginTop: "5px" }}>Nueva Hora:</label>
              <InputMinimalista type="time" value={reprogramarHora} onChange={(e) => setReprogramarHora(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "25px" }}>
              <button onClick={() => setModalReprogramar(null)} style={{ flex: 1, padding: "12px", borderRadius: "20px", border: "none", backgroundColor: theme.inputBg, color: theme.text, fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
              <BotonAzul onClick={confirmarReprogramacion} style={{ flex: 1 }}>Confirmar</BotonAzul>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: esAdmin && !adminVistaAlumno ? "1100px" : "900px", margin: "0 auto" }}>
        
        {/* CABECERA */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h2 style={{ color: theme.text, margin: 0, fontSize: "24px", fontWeight: "700" }}>{esAdmin && !adminVistaAlumno ? "Estudio Musical TAP" : (esAdmin ? `👀 Vista: ${miPerfil.nombre}` : `Hola, ${miPerfil.nombre}`)}</h2>
            {esAdmin && !adminVistaAlumno && <p style={{ color: theme.textSec, margin: "5px 0 0 0", fontSize: "13px" }}>Panel de Administración</p>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {esAdmin && !adminVistaAlumno && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", backgroundColor: theme.card, padding: "6px 12px", borderRadius: "20px", border: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: "12px", color: theme.textSec, fontWeight: "500" }}>Ver alumno:</span>
                <select value={alumnoSeleccionado} onChange={(e) => setAlumnoSeleccionado(e.target.value)} style={{ border: "none", outline: "none", fontSize: "12px", color: theme.text, fontWeight: "600", backgroundColor: "transparent", maxWidth: "120px" }}>
                  <option value="" disabled>Designar alumno</option>
                  {alumnos.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                </select>
                <button onClick={() => { if(!alumnoSeleccionado) return; setAdminVistaAlumno(alumnos.find((a) => a.id === alumnoSeleccionado)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", marginLeft: "2px" }} title="Ver panel">👀</button>
              </div>
            )}
            {esAdmin && adminVistaAlumno ? (
              <button onClick={() => setAdminVistaAlumno(null)} style={{ padding: "8px 12px", backgroundColor: theme.blue, color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Volver</button>
            ) : (
              <button onClick={cerrarSesion} style={{ padding: "6px 14px", backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: "20px", cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Salir</button>
            )}
          </div>
        </div>

        {mensaje !== "" && (
          <div style={{ backgroundColor: mensaje.includes("❌") || mensaje.includes("⚠️") ? "#ffebee" : "#e8f5e9", color: mensaje.includes("❌") || mensaje.includes("⚠️") ? "#d32f2f" : "#2e7d32", padding: "10px 15px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", fontWeight: "500", textAlign: "center" }}>
            {mensaje}
          </div>
        )}

        {/* VISTA ALUMNO: ESTADÍSTICAS */}
        {(!esAdmin || adminVistaAlumno) && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "15px" }}>
              <div style={{ backgroundColor: theme.card, padding: "15px", borderRadius: theme.radius, boxShadow: theme.shadow, textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: theme.textSec, fontWeight: "600", textTransform: "uppercase" }}>Disponibles</span>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
                  <div><div style={{ fontSize: "22px", fontWeight: "700", color: theme.text }}>{miPerfil.creditos?.grupal || 0}</div><div style={{ fontSize: "10px", color: theme.textSec }}>Grupales</div></div>
                  <div><div style={{ fontSize: "22px", fontWeight: "700", color: theme.text }}>{miPerfil.creditos?.individual || 0}</div><div style={{ fontSize: "10px", color: theme.textSec }}>Indiv.</div></div>
                </div>
              </div>
              <div style={{ backgroundColor: theme.card, padding: "15px", borderRadius: theme.radius, boxShadow: theme.shadow, textAlign: "center" }}>
                <span style={{ fontSize: "11px", color: theme.textSec, fontWeight: "600", textTransform: "uppercase" }}>Asistidas</span>
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: "10px" }}>
                  <div><div style={{ fontSize: "22px", fontWeight: "700", color: theme.text }}>{registros.filter((r) => r.estado === "descontado" && turnosFijos.concat(turnosSueltos).find(t=> t.id === r.turnoFijoId && t.alumnoId === miPerfil.id && t.tipo === "grupal")).length}</div><div style={{ fontSize: "10px", color: theme.textSec }}>Grupales</div></div>
                  <div><div style={{ fontSize: "22px", fontWeight: "700", color: theme.text }}>{registros.filter((r) => r.estado === "descontado" && turnosFijos.concat(turnosSueltos).find(t=> t.id === r.turnoFijoId && t.alumnoId === miPerfil.id && t.tipo === "individual")).length}</div><div style={{ fontSize: "10px", color: theme.textSec }}>Indiv.</div></div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: "30px" }}>
              <Acordeon titulo="💳 Historial de Pagos" activo={acordeonAbierto === "historial"} onClick={() => toggleAcordeon("historial")}>
                {miPerfil.historialPagos && miPerfil.historialPagos.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {miPerfil.historialPagos.slice().reverse().map((pago, idx) => (
                      <li key={idx} style={{ padding: "8px 0", borderBottom: `1px solid ${theme.inputBg}`, fontSize: "13px", color: theme.text, display: "flex", justifyContent: "space-between" }}>
                        <strong>{pago.fecha}</strong><span>+{pago.cantidad} {pago.tipo.substring(0,4)}.</span>
                      </li>
                    ))}
                  </ul>
                ) : (<p style={{ fontSize: "13px", color: theme.textSec, margin: 0 }}>No hay pagos registrados.</p>)}
              </Acordeon>
            </div>
          </>
        )}

        {/* VISTA ADMIN: ACORDEONES */}
        {esAdmin && !adminVistaAlumno && (
          <div style={{ marginBottom: "30px" }}>
            <Acordeon titulo="💰 Acreditar Pago" activo={acordeonAbierto === "pagos"} onClick={() => toggleAcordeon("pagos")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", paddingTop: "10px" }}>
                <SelectMinimalista value={alumnoSeleccionado} onChange={(e) => setAlumnoSeleccionado(e.target.value)}>
                  <option value="" disabled>Designar alumno</option>
                  {alumnos.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                </SelectMinimalista>
                <div style={{ display: "flex", gap: "10px" }}>
                  <SelectMinimalista value={tipoClase} onChange={(e) => setTipoClase(e.target.value)}><option value="grupal">Grupal</option><option value="individual">Individual</option></SelectMinimalista>
                  <SelectMinimalista value={packSeleccionado} onChange={(e) => setPackSeleccionado(e.target.value)}><option value={1}>1 Clase</option><option value={2}>2 Clases</option><option value={4}>4 Clases</option></SelectMinimalista>
                </div>
                <BotonAzul onClick={registrarPago}>Acreditar saldo</BotonAzul>
              </div>
            </Acordeon>

            <Acordeon titulo="📅 Asignar Horario Fijo" activo={acordeonAbierto === "horarios"} onClick={() => toggleAcordeon("horarios")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", paddingTop: "10px" }}>
                <SelectMinimalista value={alumnoSeleccionado} onChange={(e) => setAlumnoSeleccionado(e.target.value)}>
                  <option value="" disabled>Designar alumno</option>
                  {alumnos.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                </SelectMinimalista>
                <div style={{ display: "flex", gap: "10px" }}>
                  <SelectMinimalista value={tipoClase} onChange={(e) => setTipoClase(e.target.value)}><option value="grupal">Grupal</option><option value="individual">Individual</option></SelectMinimalista>
                  <SelectMinimalista value={diaFijoSeleccionado} onChange={(e) => setDiaFijoSeleccionado(e.target.value)}>
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map((d) => (<option key={d} value={d}>{d}</option>))}
                  </SelectMinimalista>
                </div>
                <InputMinimalista type="time" value={horaSeleccionada} onChange={(e) => setHoraSeleccionada(e.target.value)} />
                <BotonAzul onClick={agendarTurnoFijo}>Fijar rutina</BotonAzul>
              </div>
            </Acordeon>

            <Acordeon titulo="📌 Agendar Clase Suelta" activo={acordeonAbierto === "sueltos"} onClick={() => toggleAcordeon("sueltos")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px", paddingTop: "10px" }}>
                <SelectMinimalista value={alumnoSeleccionado} onChange={(e) => setAlumnoSeleccionado(e.target.value)}>
                  <option value="" disabled>Designar alumno</option>
                  {alumnos.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                </SelectMinimalista>
                <div style={{ display: "flex", gap: "10px" }}>
                  <SelectMinimalista value={tipoClase} onChange={(e) => setTipoClase(e.target.value)}><option value="grupal">Grupal</option><option value="individual">Individual</option></SelectMinimalista>
                  <InputMinimalista type="date" value={fechaSuelta} onChange={(e) => setFechaSuelta(e.target.value)} />
                </div>
                <InputMinimalista type="time" value={horaSeleccionada} onChange={(e) => setHoraSeleccionada(e.target.value)} />
                <BotonAzul onClick={agendarTurnoSuelto} style={{ backgroundColor: "#34c759" }}>Fijar clase única</BotonAzul>
              </div>
            </Acordeon>

            <Acordeon titulo="⛔ Bloquear Agenda (Feriados/Viajes)" activo={acordeonAbierto === "bloqueos"} onClick={() => toggleAcordeon("bloqueos")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", paddingTop: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <SelectMinimalista value={tipoBloqueo} onChange={(e) => setTipoBloqueo(e.target.value)}>
                    <option value="dia_completo">Día completo (Ej: Feriado)</option>
                    <option value="rango_dias">Varios días (Ej: Viaje)</option>
                    <option value="rango_horas">Rango horario específico</option>
                  </SelectMinimalista>
                  
                  {tipoBloqueo === "dia_completo" && <InputMinimalista type="date" value={bloqueoFecha1} onChange={(e) => setBloqueoFecha1(e.target.value)} />}
                  
                  {tipoBloqueo === "rango_dias" && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{flex: 1}}><label style={{fontSize:"10px", color:theme.textSec}}>Desde:</label><InputMinimalista type="date" value={bloqueoFecha1} onChange={(e) => setBloqueoFecha1(e.target.value)} /></div>
                      <div style={{flex: 1}}><label style={{fontSize:"10px", color:theme.textSec}}>Hasta:</label><InputMinimalista type="date" value={bloqueoFecha2} onChange={(e) => setBloqueoFecha2(e.target.value)} /></div>
                    </div>
                  )}

                  {tipoBloqueo === "rango_horas" && (
                    <>
                      <InputMinimalista type="date" value={bloqueoFecha1} onChange={(e) => setBloqueoFecha1(e.target.value)} />
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{flex: 1}}><label style={{fontSize:"10px", color:theme.textSec}}>Hora inicio:</label><InputMinimalista type="time" value={bloqueoHora1} onChange={(e) => setBloqueoHora1(e.target.value)} /></div>
                        <div style={{flex: 1}}><label style={{fontSize:"10px", color:theme.textSec}}>Hora fin:</label><InputMinimalista type="time" value={bloqueoHora2} onChange={(e) => setBloqueoHora2(e.target.value)} /></div>
                      </div>
                    </>
                  )}
                  <BotonAzul onClick={crearBloqueo} style={{ backgroundColor: "#1d1d1f" }}>Activar Bloqueo</BotonAzul>
                </div>
                
                <div style={{ borderLeft: `1px solid ${theme.inputBg}`, paddingLeft: "15px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: theme.textSec, fontSize: "12px" }}>Bloqueos Activos:</h4>
                  {bloqueos.length === 0 && <span style={{fontSize: "12px", color: "#c7c7cc"}}>No hay bloqueos</span>}
                  {bloqueos.map(b => (
                    <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: theme.inputBg, padding: "6px 10px", borderRadius: "6px", marginBottom: "6px", fontSize: "11px", fontWeight: "500", color: theme.text }}>
                      <span>
                        {b.tipo === "dia_completo" && `⛔ Día: ${b.fechaISO}`}
                        {b.tipo === "rango_dias" && `✈️ Del ${b.fechaInicio} al ${b.fechaFin}`}
                        {b.tipo === "rango_horas" && `⏱️ ${b.fechaISO} (${b.horaInicio} a ${b.horaFin})`}
                      </span>
                      <button onClick={() => borrarBloqueo(b.id)} style={{ background: "none", border: "none", color: "#ff3b30", cursor: "pointer" }}>✖</button>
                    </div>
                  ))}
                </div>
              </div>
            </Acordeon>

            <Acordeon titulo="📊 Ver Saldos y Gestión" activo={acordeonAbierto === "saldos"} onClick={() => toggleAcordeon("saldos")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", paddingTop: "10px" }}>
                <div style={{ border: `1px solid ${theme.border}`, padding: "15px", borderRadius: "10px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: theme.text }}>Saldos</h4>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", textAlign: "left", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead><tr style={{ borderBottom: `2px solid ${theme.border}`, color: theme.textSec }}><th>Alumno</th><th>Grup.</th><th>Ind.</th></tr></thead>
                      <tbody>
                        {alumnos.map(a => (
                          <tr key={a.id} style={{ borderBottom: `1px solid ${theme.inputBg}` }}>
                            <td style={{ padding: "6px 0", fontWeight: "500" }}>{a.nombre}</td>
                            <td style={{ color: a.creditos.grupal <= 0 ? "#ff3b30" : theme.text }}>{a.creditos.grupal}</td>
                            <td style={{ color: a.creditos.individual <= 0 ? "#ff3b30" : theme.text }}>{a.creditos.individual}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div style={{ border: `1px solid ${theme.border}`, padding: "15px", borderRadius: "10px" }}>
                  <h4 style={{ margin: "0 0 10px 0", color: theme.text }}>Crear/Editar Alumno</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <InputMinimalista type="text" placeholder="Nombre completo (Nuevo)" value={nuevoAlumnoNombre} onChange={(e) => setNuevoAlumnoNombre(e.target.value)} />
                    <InputMinimalista type="email" placeholder="Correo (Nuevo)" value={nuevoAlumnoEmail} onChange={(e) => setNuevoAlumnoEmail(e.target.value)} />
                    <BotonAzul onClick={crearAlumno} style={{ backgroundColor: theme.text, marginBottom: "15px" }}>Crear alumno</BotonAzul>
                    
                    <SelectMinimalista value={alumnoAEditarId} onChange={(e) => seleccionarAlumnoAEditar(e.target.value)}>
                      <option value="" disabled>Seleccionar para editar/borrar</option>
                      {alumnos.map((a) => (<option key={a.id} value={a.id}>{a.nombre}</option>))}
                    </SelectMinimalista>
                    <InputMinimalista type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                    <InputMinimalista type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    <div style={{display: "flex", gap: "5px"}}>
                      <button onClick={guardarEdicionAlumno} style={{ flex: 1, padding: "10px", backgroundColor: theme.inputBg, border: "none", borderRadius: "8px", cursor: "pointer", fontSize:"12px", fontWeight:"600" }}>Guardar Edición</button>
                      <button onClick={() => {setAlumnoSeleccionado(alumnoAEditarId); borrarAlumno()}} style={{ padding: "10px", backgroundColor: "#ffebee", color: "#ff3b30", border: "none", borderRadius: "8px", cursor: "pointer", fontSize:"12px", fontWeight:"600" }}>Borrar</button>
                    </div>
                  </div>
                </div>
              </div>
            </Acordeon>
          </div>
        )}

        {/* CALENDARIO */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: "18px", fontWeight: "600" }}>
            {vistaCalendario === "semana" ? (semanaOffset === 0 ? "Esta semana" : `Semana ${semanaOffset > 0 ? "+" : ""}${semanaOffset}`) : (semanaOffset === 0 ? "Este mes" : `Mes ${semanaOffset > 0 ? "+" : ""}${semanaOffset / 4}`)}
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ display: "flex", backgroundColor: "#e5e5ea", borderRadius: "8px", padding: "2px" }}>
              <button onClick={() => setVistaCalendario("semana")} style={{ border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: vistaCalendario === "semana" ? theme.text : theme.textSec, backgroundColor: vistaCalendario === "semana" ? theme.card : "transparent", boxShadow: vistaCalendario === "semana" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Semana</button>
              <button onClick={() => setVistaCalendario("mes")} style={{ border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "500", color: vistaCalendario === "mes" ? theme.text : theme.textSec, backgroundColor: vistaCalendario === "mes" ? theme.card : "transparent", boxShadow: vistaCalendario === "mes" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}>Mes</button>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button onClick={saltarAtras} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", backgroundColor: theme.card, cursor: "pointer", color: theme.textSec }}>◀</button>
              <button onClick={() => setSemanaOffset(0)} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", backgroundColor: semanaOffset === 0 ? theme.blue : theme.card, color: semanaOffset === 0 ? "white" : theme.text, cursor: "pointer", fontSize: "12px", fontWeight: "500" }}>Hoy</button>
              <button onClick={saltarAdelante} style={{ padding: "6px 10px", borderRadius: "8px", border: "none", backgroundColor: theme.card, cursor: "pointer", color: theme.textSec }}>▶</button>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", overflowX: "auto", paddingBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${hayClasesElSabado ? 6 : 5}, minmax(68px, 1fr))`, gap: "6px", minWidth: "340px" }}>
            {diasAMostrar.map((diaObj, index) => {
              
              // RECOPILAR CLASES DEL DÍA (FIJAS + SUELTAS)
              const clasesHoy = [];
              turnosFijos.forEach(t => { if(t.diaSemana === diaObj.nombreBase) clasesHoy.push({...t, esFijo: true}); });
              turnosSueltos.forEach(t => { if(t.fechaISO === diaObj.fechaISO) clasesHoy.push({...t, esFijo: false}); });
              
              // FILTRAR SI ES VISTA DE ALUMNO
              const clasesMostrar = (!esAdmin || adminVistaAlumno) ? clasesHoy.filter(t => t.alumnoId === miPerfil.id) : clasesHoy;

              // AGRUPAR POR HORA (Solo si es admin)
              const clasesAgrupadas = {};
              clasesMostrar.forEach((turno) => {
                const claveGrupo = `${turno.hora}-${turno.tipo}`;
                if (!clasesAgrupadas[claveGrupo]) clasesAgrupadas[claveGrupo] = { hora: turno.hora, tipo: turno.tipo, alumnos: [] };
                clasesAgrupadas[claveGrupo].alumnos.push(turno);
              });
              const bloquesDeClase = Object.values(clasesAgrupadas).sort((a, b) => a.hora.localeCompare(b.hora));

              return (
                <div key={diaObj.fechaExacta + index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ textAlign: "center", padding: "4px 0", color: theme.textSec, fontSize: "11px", fontWeight: "700", textTransform: "uppercase", borderBottom: `1px solid ${theme.border}` }}>
                    {diaObj.fechaExacta}
                  </div>
                  {bloquesDeClase.length === 0 && vistaCalendario === "semana" && (
                    <div style={{ textAlign: "center", color: "#c7c7cc", fontSize: "11px", marginTop: "10px" }}>-</div>
                  )}
                  {bloquesDeClase.map((bloque) => {
                    const claveUnicaBloque = `${diaObj.fechaISO}-${bloque.hora}-${bloque.tipo}`;
                    const estaExpandido = bloquesExpandidos[claveUnicaBloque] || false;
                    
                    return (
                      <div key={claveUnicaBloque} style={{ backgroundColor: theme.card, borderRadius: "8px", boxShadow: theme.shadow, overflow: "hidden" }}>
                        
                        {/* CABECERA BLOQUE (ADMIN) O ÚNICA (ALUMNO) */}
                        {esAdmin && !adminVistaAlumno ? (
                          <div onClick={() => toggleBloque(claveUnicaBloque)} style={{ padding: "6px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2px", borderBottom: estaExpandido ? `1px solid ${theme.bg}` : "none", backgroundColor: bloque.tipo === "grupal" ? "#fffdf5" : "transparent" }}>
                            <strong style={{ fontSize: "12px", color: theme.text }}>{bloque.hora}</strong>
                            <span style={{ fontSize: "10px", color: theme.textSec, fontWeight: "500", letterSpacing: "-0.3px" }}>{bloque.tipo === "grupal" ? "Grup" : "Indiv"}</span>
                            {!estaExpandido && (<div style={{ marginTop: "2px", fontSize: "11px", backgroundColor: theme.bg, borderRadius: "10px", padding: "2px 6px", display: "inline-block" }}>👥 {bloque.alumnos.length}</div>)}
                          </div>
                        ) : (
                          <div style={{ padding: "6px 4px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2px", backgroundColor: bloque.tipo === "grupal" ? "#fffdf5" : "transparent" }}>
                            <strong style={{ fontSize: "12px", color: theme.text }}>{bloque.hora}</strong>
                            <span style={{ fontSize: "10px", color: theme.textSec, fontWeight: "500", letterSpacing: "-0.3px" }}>{bloque.tipo.substring(0, 4)}</span>
                          </div>
                        )}

                        {/* LISTA DE ALUMNOS DENTRO DEL BLOQUE */}
                        {(estaExpandido || (!esAdmin || adminVistaAlumno)) && (
                          <div style={{ padding: "4px" }}>
                            {bloque.alumnos.map((turno) => {
                              const alumno = alumnos.find((a) => a.id === turno.alumnoId);
                              const creditosTotales = alumno ? alumno.creditos[turno.tipo] : 0;
                              
                              // VERIFICAR ESTADOS (Bloqueado, Reprogramado, Asistio, etc)
                              const bloqueado = isClassBlocked(turno.hora, diaObj.fechaISO);
                              const registroHistorico = registros.find((r) => r.turnoFijoId === turno.id && (r.fechaISO === diaObj.fechaISO || r.fechaExacta === diaObj.fechaExacta));
                              const fueReprogramado = registroHistorico?.estado === "reprogramado";
                              const fueDescontado = registroHistorico?.estado === "descontado";
                              const fueCancelado = registroHistorico?.estado === "ausente_aviso";

                              return (
                                <div key={turno.id} style={{ paddingTop: (!esAdmin || adminVistaAlumno) ? "0" : "6px", borderTop: (!esAdmin || adminVistaAlumno) ? "none" : "1px solid #f5f5f7", marginTop: (!esAdmin || adminVistaAlumno) ? "0" : "4px", display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                                  
                                  {esAdmin && !adminVistaAlumno && (
                                    <div style={{ textAlign: "center", width: "100%" }}>
                                      <span style={{ fontWeight: "600", fontSize: "11px", color: theme.text, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {!turno.esFijo && "📌 "}{turno.nombreAlumno}
                                      </span>
                                      {!bloqueado && !fueReprogramado && !registroHistorico && <span style={{ color: creditosTotales <= 0 ? "#ff3b30" : theme.textSec, fontSize: "9px", fontWeight: "600" }}>{creditosTotales <= 0 ? "DEBE" : `${creditosTotales} disp.`}</span>}
                                    </div>
                                  )}

                                  {/* LABELS DE ESTADO */}
                                  {bloqueado && !fueReprogramado && <div style={{ width: "100%", color: "#d32f2f", fontSize: "10px", fontWeight: "600", textAlign: "center", backgroundColor: "#ffebee", padding: "4px", borderRadius: "4px" }}>⛔ Bloqueada</div>}
                                  {fueReprogramado && <div style={{ width: "100%", color: "#0071e3", fontSize: "10px", fontWeight: "600", textAlign: "center", backgroundColor: "#e6f2ff", padding: "4px", borderRadius: "4px" }}>➡️ Movida</div>}
                                  {fueDescontado && <div style={{ width: "100%", color: "#34c759", fontSize: "10px", fontWeight: "600", textAlign: "center", backgroundColor: "#e8f5e9", padding: "4px", borderRadius: "4px" }}>Listo</div>}
                                  {fueCancelado && <div style={{ width: "100%", color: theme.textSec, fontSize: "10px", fontWeight: "600", textAlign: "center", backgroundColor: theme.bg, padding: "4px", borderRadius: "4px" }}>Cancel.</div>}

                                  {/* BOTONES DE ACCIÓN (Solo Admin, y si la clase está "activa") */}
                                  {esAdmin && !adminVistaAlumno && !bloqueado && !registroHistorico && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                                      <div style={{ display: "flex", gap: "2px" }}>
                                        <button onClick={() => procesarClaseDelDia(turno, diaObj.fechaISO, diaObj.fechaExacta, "asistio")} style={{ flex: 1, backgroundColor: theme.blue, border: "none", color: "white", borderRadius: "4px", padding: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }}>Asistió</button>
                                        <button onClick={() => setModalReprogramar({clase: turno, fechaOriginalISO: diaObj.fechaISO})} style={{ flex: 1, backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: "4px", padding: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }} title="Reprogramar">🔄</button>
                                      </div>
                                      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                                        <button onClick={() => procesarClaseDelDia(turno, diaObj.fechaISO, diaObj.fechaExacta, "aviso")} style={{ background: "none", border: "none", color: theme.textSec, cursor: "pointer", fontSize: "10px", textDecoration: "underline" }}>Aviso</button>
                                        <button onClick={() => borrarTurno(turno.id, turno.esFijo)} style={{ background: "none", border: "none", color: "#ff3b30", cursor: "pointer", fontSize: "10px", textDecoration: "underline" }}>Borrar</button>
                                      </div>
                                    </div>
                                  )}

                                  {/* BOTONES ACCIÓN (ALUMNO) - Solo avisar */}
                                  {(!esAdmin || adminVistaAlumno) && !bloqueado && !registroHistorico && (
                                    <button onClick={() => procesarClaseDelDia(turno, diaObj.fechaISO, diaObj.fechaExacta, "aviso")} style={{ marginTop: "6px", width: "100%", backgroundColor: "transparent", border: `1px solid ${theme.border}`, color: theme.text, borderRadius: "6px", padding: "6px 2px", cursor: "pointer", fontSize: "10px", fontWeight: "600" }}>Avisar inasistencia</button>
                                  )}
                                  
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
