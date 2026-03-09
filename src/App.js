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

const globalFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const InputMinimalista = (props) => (
  <input
    {...props}
    style={{
      padding: "12px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: theme.inputBg,
      fontSize: "14px",
      color: theme.text,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      ...props.style,
    }}
  />
);

const SelectMinimalista = (props) => (
  <select
    {...props}
    style={{
      padding: "12px 16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: theme.inputBg,
      fontSize: "14px",
      color: theme.text,
      outline: "none",
      width: "100%",
      boxSizing: "border-box",
      appearance: "none",
      ...props.style,
    }}
  >
    {props.children}
  </select>
);

const BotonAzul = (props) => (
  <button
    {...props}
    style={{
      backgroundColor: theme.blue,
      color: "white",
      padding: "12px 20px",
      border: "none",
      borderRadius: "20px",
      cursor: "pointer",
      fontWeight: "600",
      fontSize: "14px",
      transition: "0.2s",
      width: "100%",
      ...props.style,
    }}
  >
    {props.children}
  </button>
);

export default function App() {
  const [alumnos, setAlumnos] = useState([]);
  const [turnosFijos, setTurnosFijos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  // 👇 ACORDATE DE PONER EL MAIL DE LA PROFE ACÁ 👇
const CORREOS_ADMIN = [
    "tamisnm@gmail.com",
    "gonzaloivelasco2@gmail.com" 
  ];

  const [usuarioFirebase, setUsuarioFirebase] = useState(null);
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  const [isRegistrando, setIsRegistrando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [adminVistaAlumno, setAdminVistaAlumno] = useState(null);

  const [semanaOffset, setSemanaOffset] = useState(0);
  const [vistaCalendario, setVistaCalendario] = useState("semana");
  const [bloquesExpandidos, setBloquesExpandidos] = useState({});

  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState("");
  const [diaFijoSeleccionado, setDiaFijoSeleccionado] = useState("Lunes");
  const [horaSeleccionada, setHoraSeleccionada] = useState("18:00");
  const [tipoClase, setTipoClase] = useState("grupal");
  const [nuevoAlumnoNombre, setNuevoAlumnoNombre] = useState("");
  const [nuevoAlumnoEmail, setNuevoAlumnoEmail] = useState("");
  const [packSeleccionado, setPackSeleccionado] = useState(4);

  const diasSemanaNombres = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
  ];

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
      setEmailLogin("");
      setPasswordLogin("");
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
      setEmailLogin("");
      setPasswordLogin("");
    } catch (error) {
      // AQUÍ ESTÁ EL TRUCO: Traducimos el error real
      if (error.code === 'auth/email-already-in-use') {
        setMensaje("❌ Este correo ya tiene una cuenta. ¡Intentá iniciar sesión!");
      } else if (error.code === 'auth/weak-password') {
        setMensaje("❌ La contraseña debe tener al menos 6 caracteres.");
      } else {
        setMensaje("❌ Error: " + error.message);
      }
      setTimeout(() => setMensaje(""), 5000);
    }
  };

  const cerrarSesion = async () => {
    await signOut(auth);
    setSemanaOffset(0);
    setVistaCalendario("semana");
    setAdminVistaAlumno(null);
  };

  const getDiasVisualizacion = (offset, vista) => {
    const hoy = new Date();
    const dia = hoy.getDay();
    const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunesBase = new Date(hoy.setDate(diff));
    lunesBase.setDate(lunesBase.getDate() + offset * 7);

    const cantidadSemanas = vista === "mes" ? 4 : 1;
    const dias = [];
    const nombresDias = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ];

    for (let s = 0; s < cantidadSemanas; s++) {
      const lunesSemanaActual = new Date(lunesBase);
      lunesSemanaActual.setDate(lunesSemanaActual.getDate() + s * 7);
      for (let i = 0; i < 5; i++) {
        const fecha = new Date(lunesSemanaActual);
        fecha.setDate(lunesSemanaActual.getDate() + i);
        const diaStr = `${nombresDias[fecha.getDay()]} ${fecha.getDate()}/${
          fecha.getMonth() + 1
        }`;
        // Para que entre mejor en el celular, acortamos el nombre del día
        const diaCorto = nombresDias[fecha.getDay()].substring(0, 3);
        const diaStrCorto = `${diaCorto} ${fecha.getDate()}/${
          fecha.getMonth() + 1
        }`;
        dias.push({
          nombreBase: nombresDias[fecha.getDay()],
          fechaExacta: diaStrCorto,
        });
      }
    }
    return dias;
  };

  const diasAMostrar = getDiasVisualizacion(semanaOffset, vistaCalendario);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const alumnosSnap = await getDocs(collection(db, "alumnos"));
      const listaAlumnos = alumnosSnap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      setAlumnos(listaAlumnos);
      if (listaAlumnos.length > 0 && !alumnoSeleccionado)
        setAlumnoSeleccionado(listaAlumnos[0].id);

      const turnosSnap = await getDocs(collection(db, "turnos_fijos"));
      setTurnosFijos(
        turnosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      const registrosSnap = await getDocs(collection(db, "registro_clases"));
      setRegistros(
        registrosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      setMensaje("❌ Error al cargar los datos.");
    }
    setCargando(false);
  };

  useEffect(() => {
    if (usuarioFirebase) cargarDatos();
  }, [usuarioFirebase]);

  const crearAlumno = async () => {
    if (!nuevoAlumnoNombre.trim() || !nuevoAlumnoEmail.trim()) {
      setMensaje("⚠️ Por favor ingresá Nombre y Email.");
      setTimeout(() => setMensaje(""), 4000);
      return;
    }
    setMensaje("⏳ Creando alumno...");
    try {
      await addDoc(collection(db, "alumnos"), {
        nombre: nuevoAlumnoNombre,
        email: nuevoAlumnoEmail.toLowerCase(),
        creditos: { individual: 0, grupal: 0 },
        ultimoPago: "Sin pagos",
      });
      setNuevoAlumnoNombre("");
      setNuevoAlumnoEmail("");
      cargarDatos();
      setMensaje(`✅ ¡Alumno agregado con éxito!`);
    } catch (error) {
      setMensaje("❌ Error al crear alumno.");
    }
    setTimeout(() => setMensaje(""), 4000);
  };

  const registrarPago = async () => {
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    if (!alumno) return;
    setMensaje("⏳ Guardando pago...");
    try {
      const nuevosCreditos =
        alumno.creditos[tipoClase] + parseInt(packSeleccionado);
      const fechaHoy = new Date().toLocaleDateString();
      await updateDoc(doc(db, "alumnos", alumno.id), {
        ["creditos." + tipoClase]: nuevosCreditos,
        ultimoPago: fechaHoy,
      });
      setMensaje(`💰 ¡Pago registrado!`);
      cargarDatos();
    } catch (error) {
      setMensaje("❌ Error al guardar el pago.");
    }
    setTimeout(() => setMensaje(""), 4000);
  };

  const agendarTurnoFijo = async () => {
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    setMensaje("⏳ Asignando turno...");
    try {
      await addDoc(collection(db, "turnos_fijos"), {
        alumnoId: alumno.id,
        nombreAlumno: alumno.nombre,
        diaSemana: diaFijoSeleccionado,
        hora: horaSeleccionada,
        tipo: tipoClase,
      });
      setMensaje(`✅ ¡Lugar fijo reservado!`);
      cargarDatos();
    } catch (error) {
      setMensaje("❌ Error al asignar turno.");
    }
    setTimeout(() => setMensaje(""), 4000);
  };

  const borrarTurnoFijo = async (id) => {
    if (!window.confirm("¿Estás segura de eliminar este turno fijo?")) return;
    await deleteDoc(doc(db, "turnos_fijos", id));
    cargarDatos();
  };

  // NUEVA FUNCIÓN: BORRAR ALUMNO Y SUS TURNOS
  const borrarAlumno = async () => {
    const alumno = alumnos.find((a) => a.id === alumnoSeleccionado);
    if (!alumno) return;

    const confirmacion = window.confirm(
      `⚠️ ¿Estás segura de que querés borrar a ${alumno.nombre} definitivamente? Esto también liberará sus horarios fijos en la agenda.`
    );
    if (!confirmacion) return;

    setMensaje("⏳ Borrando alumno...");
    try {
      // 1. Borramos al alumno de la base de datos
      await deleteDoc(doc(db, "alumnos", alumno.id));

      // 2. Buscamos y borramos sus turnos fijos para evitar fantasmas
      const susTurnos = turnosFijos.filter((t) => t.alumnoId === alumno.id);
      for (let turno of susTurnos) {
        await deleteDoc(doc(db, "turnos_fijos", turno.id));
      }

      setMensaje(`🗑️ Alumno eliminado correctamente.`);
      cargarDatos(); // Recargamos todo
    } catch (error) {
      setMensaje("❌ Error al borrar el alumno.");
    }
    setTimeout(() => setMensaje(""), 4000);
  };

  const procesarClaseDelDia = async (turno, fechaExacta, accion) => {
    setMensaje("⏳ Procesando...");
    try {
      if (accion === "asistio") {
        const alumno = alumnos.find((a) => a.id === turno.alumnoId);
        await updateDoc(doc(db, "alumnos", alumno.id), {
          ["creditos." + turno.tipo]: alumno.creditos[turno.tipo] - 1,
        });
        await addDoc(collection(db, "registro_clases"), {
          turnoFijoId: turno.id,
          fechaExacta: fechaExacta,
          estado: "descontado",
        });
      } else if (accion === "aviso") {
        await addDoc(collection(db, "registro_clases"), {
          turnoFijoId: turno.id,
          fechaExacta: fechaExacta,
          estado: "ausente_aviso",
        });
      }
      cargarDatos();
    } catch (error) {
      setMensaje("❌ Error al procesar.");
    }
    setTimeout(() => setMensaje(""), 2000);
  };

  const saltarAdelante = () =>
    setSemanaOffset((prev) => prev + (vistaCalendario === "mes" ? 4 : 1));
  const saltarAtras = () =>
    setSemanaOffset((prev) => prev - (vistaCalendario === "mes" ? 4 : 1));
  const toggleBloque = (claveUnica) =>
    setBloquesExpandidos((prev) => ({
      ...prev,
      [claveUnica]: !prev[claveUnica],
    }));

const esAdmin = CORREOS_ADMIN.includes(usuarioFirebase?.email);

  // ==========================================
  // PANTALLA 1: LOGIN
  // ==========================================
  if (!usuarioFirebase) {
    return (
      <div
        style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: globalFont,
        }}
      >
        <div
          style={{
            padding: "40px",
            width: "100%",
            maxWidth: "360px",
            backgroundColor: theme.card,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              color: theme.text,
              marginBottom: "8px",
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            TAP ESTUDIO
          </h1>
          <p
            style={{
              color: theme.textSec,
              marginBottom: "30px",
              fontSize: "14px",
            }}
          >
            Ingresá para ver tu agenda
          </p>

          {mensaje !== "" && (
            <div
              style={{
                color: mensaje.includes("❌") ? "#ff3b30" : "#34c759",
                fontSize: "14px",
                marginBottom: "20px",
                fontWeight: "500",
              }}
            >
              {mensaje}
            </div>
          )}

          <form
            onSubmit={isRegistrando ? registrarse : iniciarSesion}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <InputMinimalista
              type="email"
              placeholder="Correo electrónico"
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              required
            />
            <div style={{ position: "relative" }}>
              <InputMinimalista
                type={mostrarPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                  color: theme.textSec,
                  padding: 0,
                }}
                title={
                  mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
              >
                {mostrarPassword ? "🙈" : "👁️"}
              </button>
            </div>
            <BotonAzul type="submit" style={{ marginTop: "10px" }}>
              {isRegistrando ? "Crear cuenta" : "Continuar"}
            </BotonAzul>
          </form>

          <div style={{ marginTop: "30px" }}>
            <button
              onClick={() => setIsRegistrando(!isRegistrando)}
              style={{
                background: "none",
                border: "none",
                color: theme.blue,
                fontWeight: "500",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {isRegistrando
                ? "¿Ya tenés cuenta? Iniciá sesión"
                : "Crear una cuenta nueva"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cargando)
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: globalFont,
          color: theme.textSec,
        }}
      >
        <h2>Cargando...</h2>
      </div>
    );

  // ==========================================
  // PANTALLA 2: PANEL DE LA PROFESORA (ADMIN)
  // ==========================================
  if (esAdmin && !adminVistaAlumno) {
    return (
      <div
        style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          fontFamily: globalFont,
          padding: "20px 10px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
              flexWrap: "wrap",
              gap: "15px",
            }}
          >
            <div>
              <h2
                style={{
                  color: theme.text,
                  margin: 0,
                  fontSize: "24px",
                  fontWeight: "700",
                }}
              >
                Panel de Control
              </h2>
              <p
                style={{
                  color: theme.textSec,
                  margin: "5px 0 0 0",
                  fontSize: "13px",
                }}
              >
                Administración del Estudio
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  backgroundColor: theme.card,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: `1px solid ${theme.border}`,
                  boxShadow: theme.shadow,
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: theme.textSec,
                    fontWeight: "500",
                  }}
                >
                  Ver como:
                </span>
                <select
                  value={alumnoSeleccionado}
                  onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: "12px",
                    color: theme.text,
                    fontWeight: "600",
                    backgroundColor: "transparent",
                    maxWidth: "100px",
                  }}
                >
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() =>
                    setAdminVistaAlumno(
                      alumnos.find((a) => a.id === alumnoSeleccionado)
                    )
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    marginLeft: "2px",
                  }}
                  title="Ver panel del alumno"
                >
                  👀
                </button>
              </div>
              <button
                onClick={cerrarSesion}
                style={{
                  padding: "6px 14px",
                  backgroundColor: theme.card,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Salir
              </button>
            </div>
          </div>

          {mensaje !== "" && (
            <div
              style={{
                backgroundColor: mensaje.includes("❌") ? "#ffebee" : "#e8f5e9",
                color: mensaje.includes("❌") ? "#d32f2f" : "#2e7d32",
                padding: "10px 15px",
                borderRadius: "10px",
                marginBottom: "20px",
                fontSize: "13px",
                fontWeight: "500",
                textAlign: "center",
                boxShadow: theme.shadow,
              }}
            >
              {mensaje}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "15px",
              marginBottom: "30px",
            }}
          >
            {/* CAJA 1: NUEVO ALUMNO */}
            <div
              style={{
                backgroundColor: theme.card,
                padding: "15px",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: theme.text,
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Nuevo Alumno
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <InputMinimalista
                  type="text"
                  placeholder="Nombre completo"
                  value={nuevoAlumnoNombre}
                  onChange={(e) => setNuevoAlumnoNombre(e.target.value)}
                />
                <InputMinimalista
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevoAlumnoEmail}
                  onChange={(e) => setNuevoAlumnoEmail(e.target.value)}
                />
                <BotonAzul
                  onClick={crearAlumno}
                  style={{ backgroundColor: theme.text }}
                >
                  Guardar alumno
                </BotonAzul>
              </div>
            </div>

            {/* CAJA 2: ACREDITAR PAGO */}
            <div
              style={{
                backgroundColor: theme.card,
                padding: "15px",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: theme.text,
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Acreditar Pago
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <SelectMinimalista
                  value={alumnoSeleccionado}
                  onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                >
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </SelectMinimalista>
                <div style={{ display: "flex", gap: "10px" }}>
                  <SelectMinimalista
                    value={tipoClase}
                    onChange={(e) => setTipoClase(e.target.value)}
                  >
                    <option value="grupal">Grupal</option>
                    <option value="individual">Individual</option>
                  </SelectMinimalista>
                  <SelectMinimalista
                    value={packSeleccionado}
                    onChange={(e) => setPackSeleccionado(e.target.value)}
                  >
                    <option value={1}>1 Clase</option>
                    <option value={4}>4 Clases</option>
                  </SelectMinimalista>
                </div>
                <BotonAzul onClick={registrarPago}>Acreditar saldo</BotonAzul>
              </div>
            </div>

            {/* CAJA 3: ASIGNAR HORARIO */}
            <div
              style={{
                backgroundColor: theme.card,
                padding: "15px",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: theme.text,
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Asignar Horario
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <SelectMinimalista
                  value={alumnoSeleccionado}
                  onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                >
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </SelectMinimalista>
                <div style={{ display: "flex", gap: "10px" }}>
                  <SelectMinimalista
                    value={tipoClase}
                    onChange={(e) => setTipoClase(e.target.value)}
                  >
                    <option value="grupal">Grupal</option>
                    <option value="individual">Individual</option>
                  </SelectMinimalista>
                  <SelectMinimalista
                    value={diaFijoSeleccionado}
                    onChange={(e) => setDiaFijoSeleccionado(e.target.value)}
                  >
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(
                      (d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      )
                    )}
                  </SelectMinimalista>
                </div>
                <InputMinimalista
                  type="time"
                  value={horaSeleccionada}
                  onChange={(e) => setHoraSeleccionada(e.target.value)}
                />
                <BotonAzul onClick={agendarTurnoFijo}>
                  Fijar en agenda
                </BotonAzul>
              </div>
            </div>

            {/* NUEVA CAJA 4: ELIMINAR ALUMNO */}
            <div
              style={{
                backgroundColor: theme.card,
                padding: "15px",
                borderRadius: theme.radius,
                boxShadow: theme.shadow,
                border: "1px solid #ffebee"
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  color: "#d32f2f", 
                  fontSize: "16px",
                  fontWeight: "600",
                }}
              >
                Eliminar Alumno
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <SelectMinimalista
                  value={alumnoSeleccionado}
                  onChange={(e) => setAlumnoSeleccionado(e.target.value)}
                >
                  {alumnos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </SelectMinimalista>
                <BotonAzul 
                  onClick={borrarAlumno}
                  style={{ backgroundColor: "#ff3b30" }} // Rojo alerta
                >
                  🗑️ Borrar definitivamente
                </BotonAzul>
              </div>
            </div>
            
          </div>

          {/* CONTROLES DE AGENDA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: theme.text,
                fontSize: "18px",
                fontWeight: "600",
              }}
            >
              {vistaCalendario === "semana"
                ? semanaOffset === 0
                  ? "Esta semana"
                  : `Semana ${semanaOffset > 0 ? "+" : ""}${semanaOffset}`
                : semanaOffset === 0
                ? "Este mes"
                : `Mes ${semanaOffset > 0 ? "+" : ""}${semanaOffset / 4}`}
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  backgroundColor: "#e5e5ea",
                  borderRadius: "8px",
                  padding: "2px",
                }}
              >
                <button
                  onClick={() => setVistaCalendario("semana")}
                  style={{
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    color:
                      vistaCalendario === "semana" ? theme.text : theme.textSec,
                    backgroundColor:
                      vistaCalendario === "semana" ? theme.card : "transparent",
                    boxShadow:
                      vistaCalendario === "semana"
                        ? "0 2px 4px rgba(0,0,0,0.05)"
                        : "none",
                  }}
                >
                  Semana
                </button>
                <button
                  onClick={() => setVistaCalendario("mes")}
                  style={{
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    color:
                      vistaCalendario === "mes" ? theme.text : theme.textSec,
                    backgroundColor:
                      vistaCalendario === "mes" ? theme.card : "transparent",
                    boxShadow:
                      vistaCalendario === "mes"
                        ? "0 2px 4px rgba(0,0,0,0.05)"
                        : "none",
                  }}
                >
                  Mes
                </button>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={saltarAtras}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: theme.card,
                    cursor: "pointer",
                    color: theme.textSec,
                  }}
                >
                  ◀
                </button>
                <button
                  onClick={() => setSemanaOffset(0)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor:
                      semanaOffset === 0 ? theme.blue : theme.card,
                    color: semanaOffset === 0 ? "white" : theme.text,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Hoy
                </button>
                <button
                  onClick={saltarAdelante}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: theme.card,
                    cursor: "pointer",
                    color: theme.textSec,
                  }}
                >
                  ▶
                </button>
              </div>
            </div>
          </div>

          {/* CONTENEDOR CON SCROLL HORIZONTAL POR SI EL CELULAR ES MUY CHICO */}
          <div
            style={{ width: "100%", overflowX: "auto", paddingBottom: "10px" }}
          >
            {/* MAGIA DE COLUMNAS FIJAS: repeat(5, minmax(68px, 1fr)) fuerza las 5 columnas, mínimo de 68px por columna */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(68px, 1fr))",
                gap: "6px",
                minWidth: "340px",
              }}
            >
              {diasAMostrar.map((diaObj, index) => {
                const turnosDelDia = turnosFijos
                  .filter((t) => t.diaSemana === diaObj.nombreBase)
                  .sort((a, b) => a.hora.localeCompare(b.hora));
                const clasesAgrupadas = {};
                turnosDelDia.forEach((turno) => {
                  const claveGrupo = `${turno.hora}-${turno.tipo}`;
                  if (!clasesAgrupadas[claveGrupo])
                    clasesAgrupadas[claveGrupo] = {
                      hora: turno.hora,
                      tipo: turno.tipo,
                      alumnos: [],
                    };
                  clasesAgrupadas[claveGrupo].alumnos.push(turno);
                });
                const bloquesDeClase = Object.values(clasesAgrupadas).sort(
                  (a, b) => a.hora.localeCompare(b.hora)
                );

                return (
                  <div
                    key={diaObj.fechaExacta + index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "4px 0",
                        color: theme.textSec,
                        fontSize: "11px",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        borderBottom: `1px solid ${theme.border}`,
                      }}
                    >
                      {diaObj.fechaExacta}
                    </div>

                    {bloquesDeClase.length === 0 &&
                      vistaCalendario === "semana" && (
                        <div
                          style={{
                            textAlign: "center",
                            color: "#c7c7cc",
                            fontSize: "11px",
                            marginTop: "10px",
                          }}
                        >
                          -
                        </div>
                      )}

                    {bloquesDeClase.map((bloque) => {
                      const claveUnicaBloque = `${diaObj.fechaExacta}-${bloque.hora}-${bloque.tipo}`;
                      const estaExpandido =
                        bloquesExpandidos[claveUnicaBloque] || false;
                      let alguienDebe = false;
                      bloque.alumnos.forEach((turno) => {
                        const alumno = alumnos.find(
                          (a) => a.id === turno.alumnoId
                        );
                        if (alumno && alumno.creditos[turno.tipo] <= 0)
                          alguienDebe = true;
                      });

                      return (
                        <div
                          key={claveUnicaBloque}
                          style={{
                            backgroundColor: theme.card,
                            borderRadius: "8px",
                            boxShadow: theme.shadow,
                            overflow: "hidden",
                            border:
                              alguienDebe && !estaExpandido
                                ? "1px solid #ff3b30"
                                : "none",
                          }}
                        >
                          {/* CABECERA DE CLASE: ULTRA COMPACTA */}
                          <div
                            onClick={() => toggleBloque(claveUnicaBloque)}
                            style={{
                              padding: "6px 4px",
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              textAlign: "center",
                              gap: "2px",
                              borderBottom: estaExpandido
                                ? `1px solid ${theme.bg}`
                                : "none",
                              backgroundColor:
                                bloque.tipo === "grupal"
                                  ? "#fffdf5"
                                  : "transparent",
                            }}
                          >
                            <strong
                              style={{ fontSize: "12px", color: theme.text }}
                            >
                              {bloque.hora}
                            </strong>
                            <span
                              style={{
                                fontSize: "10px",
                                color: theme.textSec,
                                fontWeight: "500",
                                letterSpacing: "-0.3px",
                              }}
                            >
                              {bloque.tipo === "grupal" ? "Grup" : "Indiv"}
                            </span>
                            {!estaExpandido && (
                              <div
                                style={{
                                  marginTop: "2px",
                                  fontSize: "11px",
                                  backgroundColor: theme.bg,
                                  borderRadius: "10px",
                                  padding: "2px 6px",
                                  display: "inline-block",
                                }}
                              >
                                👥 {bloque.alumnos.length}
                              </div>
                            )}
                          </div>

                          {/* ALUMNOS ADENTRO (EXPANDIDO): APILADOS */}
                          {estaExpandido && (
                            <div style={{ padding: "4px" }}>
                              {bloque.alumnos.map((turno) => {
                                const alumno = alumnos.find(
                                  (a) => a.id === turno.alumnoId
                                );
                                const creditosTotales = alumno
                                  ? alumno.creditos[turno.tipo]
                                  : 0;
                                const sinSaldo = creditosTotales <= 0;
                                const registroHoy = registros.find(
                                  (r) =>
                                    r.turnoFijoId === turno.id &&
                                    r.fechaExacta === diaObj.fechaExacta
                                );

                                return (
                                  <div
                                    key={turno.id}
                                    style={{
                                      paddingTop: "6px",
                                      borderTop: "1px solid #f5f5f7",
                                      marginTop: "4px",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                      alignItems: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        textAlign: "center",
                                        width: "100%",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: "600",
                                          fontSize: "11px",
                                          color: theme.text,
                                          display: "block",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {turno.nombreAlumno}
                                      </span>
                                      {!registroHoy && (
                                        <span
                                          style={{
                                            color: sinSaldo
                                              ? "#ff3b30"
                                              : theme.textSec,
                                            fontSize: "9px",
                                            fontWeight: "600",
                                          }}
                                        >
                                          {sinSaldo
                                            ? "DEBE"
                                            : `${creditosTotales} disp.`}
                                        </span>
                                      )}
                                    </div>

                                    {registroHoy?.estado === "descontado" && (
                                      <div
                                        style={{
                                          width: "100%",
                                          color: "#34c759",
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          textAlign: "center",
                                          backgroundColor: "#e8f5e9",
                                          padding: "4px",
                                          borderRadius: "4px",
                                        }}
                                      >
                                        Listo
                                      </div>
                                    )}
                                    {registroHoy?.estado ===
                                      "ausente_aviso" && (
                                      <div
                                        style={{
                                          width: "100%",
                                          color: theme.textSec,
                                          fontSize: "10px",
                                          fontWeight: "600",
                                          textAlign: "center",
                                          backgroundColor: theme.bg,
                                          padding: "4px",
                                          borderRadius: "4px",
                                        }}
                                      >
                                        Cancel.
                                      </div>
                                    )}

                                    {!registroHoy && (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                          width: "100%",
                                        }}
                                      >
                                        <button
                                          onClick={() =>
                                            procesarClaseDelDia(
                                              turno,
                                              diaObj.fechaExacta,
                                              "asistio"
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            backgroundColor: theme.blue,
                                            border: "none",
                                            color: "white",
                                            borderRadius: "4px",
                                            padding: "6px",
                                            cursor: "pointer",
                                            fontSize: "10px",
                                            fontWeight: "600",
                                          }}
                                        >
                                          Asistió
                                        </button>
                                        <button
                                          onClick={() =>
                                            procesarClaseDelDia(
                                              turno,
                                              diaObj.fechaExacta,
                                              "aviso"
                                            )
                                          }
                                          style={{
                                            width: "100%",
                                            backgroundColor: theme.bg,
                                            border: "none",
                                            color: theme.text,
                                            borderRadius: "4px",
                                            padding: "6px",
                                            cursor: "pointer",
                                            fontSize: "10px",
                                            fontWeight: "500",
                                          }}
                                        >
                                          Aviso
                                        </button>
                                        <button
                                          onClick={() =>
                                            borrarTurnoFijo(turno.id)
                                          }
                                          style={{
                                            background: "none",
                                            border: "none",
                                            color: "#ff3b30",
                                            cursor: "pointer",
                                            fontSize: "10px",
                                            marginTop: "2px",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          Borrar
                                        </button>
                                      </div>
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

  // ==========================================
  // PANTALLA 3: PANEL DEL ALUMNO (Ultra Compacto también)
  // ==========================================
  const miPerfil =
    esAdmin && adminVistaAlumno
      ? adminVistaAlumno
      : alumnos.find((a) => a.email === usuarioFirebase.email);

  if (!miPerfil) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: theme.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: globalFont,
        }}
      >
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: theme.card,
            borderRadius: theme.radius,
            boxShadow: theme.shadow,
          }}
        >
          <h2 style={{ color: theme.text, marginBottom: "10px" }}>
            Cuenta no vinculada
          </h2>
          <p style={{ color: theme.textSec }}>
            El estudio aún no registró este correo.
          </p>
          <BotonAzul onClick={cerrarSesion} style={{ marginTop: "20px" }}>
            Volver al inicio
          </BotonAzul>
        </div>
      </div>
    );
  }

  const clasesUsadasGrupales = registros.filter(
    (r) =>
      r.estado === "descontado" &&
      turnosFijos.find(
        (t) =>
          t.id === r.turnoFijoId &&
          t.alumnoId === miPerfil.id &&
          t.tipo === "grupal"
      )
  ).length;

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        fontFamily: globalFont,
        padding: "20px 10px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h2
              style={{
                color: theme.text,
                margin: 0,
                fontSize: "22px",
                fontWeight: "700",
              }}
            >
              {esAdmin && adminVistaAlumno
                ? `👀 Vista: ${miPerfil.nombre}`
                : `Hola, ${miPerfil.nombre}`}
            </h2>
          </div>

          {esAdmin && adminVistaAlumno ? (
            <button
              onClick={() => setAdminVistaAlumno(null)}
              style={{
                padding: "8px 12px",
                backgroundColor: theme.blue,
                color: "white",
                border: "none",
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Volver
            </button>
          ) : (
            <button
              onClick={cerrarSesion}
              style={{
                padding: "6px 12px",
                backgroundColor: theme.card,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              Salir
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              backgroundColor: theme.card,
              padding: "15px",
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: theme.textSec,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Disponibles
            </span>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: theme.text,
                marginTop: "4px",
              }}
            >
              {miPerfil.creditos?.grupal || 0}
            </div>
          </div>
          <div
            style={{
              backgroundColor: theme.card,
              padding: "15px",
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: theme.textSec,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Asistidas
            </span>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: theme.text,
                marginTop: "4px",
              }}
            >
              {clasesUsadasGrupales}
            </div>
          </div>
          <div
            style={{
              backgroundColor: theme.card,
              padding: "15px",
              borderRadius: theme.radius,
              boxShadow: theme.shadow,
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: theme.textSec,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              Últ. Pago
            </span>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text,
                marginTop: "10px",
              }}
            >
              {miPerfil.ultimoPago || "Nada"}
            </div>
          </div>
        </div>

        {mensaje !== "" && (
          <div
            style={{
              backgroundColor: "#e8f5e9",
              color: "#2e7d32",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              fontSize: "13px",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            {mensaje}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: theme.text,
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Mi agenda
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#e5e5ea",
                borderRadius: "8px",
                padding: "2px",
              }}
            >
              <button
                onClick={() => setVistaCalendario("semana")}
                style={{
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "600",
                  color:
                    vistaCalendario === "semana" ? theme.text : theme.textSec,
                  backgroundColor:
                    vistaCalendario === "semana" ? theme.card : "transparent",
                  boxShadow:
                    vistaCalendario === "semana"
                      ? "0 2px 4px rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                Semana
              </button>
              <button
                onClick={() => setVistaCalendario("mes")}
                style={{
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: vistaCalendario === "mes" ? theme.text : theme.textSec,
                  backgroundColor:
                    vistaCalendario === "mes" ? theme.card : "transparent",
                  boxShadow:
                    vistaCalendario === "mes"
                      ? "0 2px 4px rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                Mes
              </button>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={saltarAtras}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: theme.card,
                  cursor: "pointer",
                  color: theme.textSec,
                }}
              >
                ◀
              </button>
              <button
                onClick={() => setSemanaOffset(0)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: semanaOffset === 0 ? theme.blue : theme.card,
                  color: semanaOffset === 0 ? "white" : theme.text,
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "500",
                }}
              >
                Hoy
              </button>
              <button
                onClick={saltarAdelante}
                style={{
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: theme.card,
                  cursor: "pointer",
                  color: theme.textSec,
                }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* GRILLA DE 5 COLUMNAS TAMBIÉN PARA EL ALUMNO */}
        <div
          style={{ width: "100%", overflowX: "auto", paddingBottom: "10px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(68px, 1fr))",
              gap: "6px",
              minWidth: "340px",
            }}
          >
            {diasAMostrar.map((diaObj, index) => {
              const misTurnosHoy = turnosFijos
                .filter(
                  (t) =>
                    t.diaSemana === diaObj.nombreBase &&
                    t.alumnoId === miPerfil.id
                )
                .sort((a, b) => a.hora.localeCompare(b.hora));
              return (
                <div
                  key={diaObj.fechaExacta + index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: "4px 0",
                      color: theme.textSec,
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${theme.border}`,
                    }}
                  >
                    {diaObj.fechaExacta}
                  </div>

                  {misTurnosHoy.length === 0 &&
                    vistaCalendario === "semana" && (
                      <div
                        style={{
                          textAlign: "center",
                          color: "#c7c7cc",
                          fontSize: "11px",
                          marginTop: "10px",
                        }}
                      >
                        -
                      </div>
                    )}

                  {misTurnosHoy.map((turno) => {
                    const registroHoy = registros.find(
                      (r) =>
                        r.turnoFijoId === turno.id &&
                        r.fechaExacta === diaObj.fechaExacta
                    );
                    return (
                      <div
                        key={turno.id}
                        style={{
                          backgroundColor: theme.card,
                          padding: "8px 4px",
                          borderRadius: "8px",
                          boxShadow: theme.shadow,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            marginBottom: "2px",
                            color: theme.text,
                            fontSize: "12px",
                          }}
                        >
                          {turno.hora}
                        </strong>
                        <span
                          style={{ color: theme.textSec, fontSize: "10px" }}
                        >
                          {turno.tipo.substring(0, 4)}
                        </span>

                        {registroHoy?.estado === "descontado" && (
                          <div
                            style={{
                              marginTop: "6px",
                              width: "100%",
                              color: "#34c759",
                              fontWeight: "600",
                              backgroundColor: "#e8f5e9",
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            Listo
                          </div>
                        )}
                        {registroHoy?.estado === "ausente_aviso" && (
                          <div
                            style={{
                              marginTop: "6px",
                              width: "100%",
                              color: theme.textSec,
                              fontWeight: "600",
                              backgroundColor: theme.bg,
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            Cancel.
                          </div>
                        )}

                        {!registroHoy && (
                          <button
                            onClick={() =>
                              procesarClaseDelDia(
                                turno,
                                diaObj.fechaExacta,
                                "aviso"
                              )
                            }
                            style={{
                              marginTop: "6px",
                              width: "100%",
                              backgroundColor: "transparent",
                              border: `1px solid ${theme.border}`,
                              color: theme.text,
                              borderRadius: "6px",
                              padding: "6px 2px",
                              cursor: "pointer",
                              fontSize: "10px",
                              fontWeight: "600",
                            }}
                          >
                            Avisar
                          </button>
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
