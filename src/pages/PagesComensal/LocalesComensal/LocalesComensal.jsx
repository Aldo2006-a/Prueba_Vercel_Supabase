// src\pages\PagesComensal\LocalesComensal\LocalesComensal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResenasLocal from './ResenasLocal';
import {
  obtenerLocales,
  obtenerCartaLocal,
  localALista,
  productoAComensal,
  categoriasDeCarta,
} from '../../../api/locales';
import { mensajeDeError } from '../../../api/carta';
import './LocalesComensal.css';

// Los locales y sus cartas vienen de la API (ver src/api/locales.js)

export default function LocalesComensal({ itemsCarrito = [], setItemsCarrito }) {
  const navigate = useNavigate();

  // Estados de Filtros y Navegación
  const [esTodosCerrados, setEsTodosCerrados] = useState(false);
  const [localSeleccionado, setLocalSeleccionado] = useState(null);
  const [busquedaCarta, setBusquedaCarta] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [localResenas, setLocalResenas] = useState(null);

  // Datos reales (API)
  const [locales, setLocales] = useState([]);
  const [cargandoLocales, setCargandoLocales] = useState(true);
  const [productos, setProductos] = useState([]);
  const [cargandoCarta, setCargandoCarta] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  useEffect(() => {
    obtenerLocales()
      .then((lista) => setLocales(lista.map(localALista)))
      .catch((e) => setErrorApi(mensajeDeError(e, "No se pudieron cargar los locales.")))
      .finally(() => setCargandoLocales(false));
  }, []);

  // Estados Modal Detalle de Producto
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [panElegido, setPanElegido] = useState("");
  const [paraLlevarElegido, setParaLlevarElegido] = useState("local");
  const [agregadosElegidos, setAgregadosElegidos] = useState([]);
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");
  const [errorObligatorio, setErrorObligatorio] = useState(false);

  // Filtrado de Locales
  const localesVisibles = soloAbiertos ? locales.filter((l) => l.estado === "Abierto") : locales;
  const abiertos = locales.filter((l) => l.estado === "Abierto").length;
  const cerrados = locales.length - abiertos;

  // Categorías de la carta (en el orden del local) y filtrado de productos:
  // con texto en el buscador se busca en toda la carta; sin texto, solo en la categoría activa
  const categoriasCarta = categoriasDeCarta(productos);
  const textoBusqueda = busquedaCarta.trim().toLowerCase();
  const productosFiltrados = productos.filter((p) =>
    textoBusqueda
      ? p.nombre.toLowerCase().includes(textoBusqueda) ||
        p.descripcion.toLowerCase().includes(textoBusqueda)
      : p.categoria === categoriaActiva
  );

  // Abre la carta de un local: pide sus productos a la API
  const handleVerCarta = async (local) => {
    setLocalSeleccionado(local);
    setBusquedaCarta("");
    setProductos([]);
    setCategoriaActiva("");
    setErrorApi("");
    setCargandoCarta(true);

    try {
      const lista = (await obtenerCartaLocal(local.id)).map(productoAComensal);
      setProductos(lista);
      setCategoriaActiva(categoriasDeCarta(lista)[0] || "");
    } catch (e) {
      setErrorApi(mensajeDeError(e, "No se pudo cargar la carta del local."));
    } finally {
      setCargandoCarta(false);
    }
  };

  const handleAbrirDetalle = (prod) => {
    setProductoDetalle(prod);
    setPanElegido("");
    setParaLlevarElegido("local");
    setAgregadosElegidos([]);
    setCantidad(1);
    setNota("");
    setErrorObligatorio(false);
  };

  const handleToggleAgregado = (id) => {
    if (agregadosElegidos.includes(id)) {
      setAgregadosElegidos(agregadosElegidos.filter((item) => item !== id));
    } else {
      setAgregadosElegidos([...agregadosElegidos, id]);
    }
  };

  const calcularTotalProducto = () => {
    if (!productoDetalle) return "0.00";
    let base = productoDetalle.precio;

    if (productoDetalle.opciones) {
      const panObj = productoDetalle.opciones.tipoPan?.find((p) => p.id === panElegido);
      if (panObj) base += panObj.precio;

      const llevarObj = productoDetalle.opciones.paraLlevar?.find((p) => p.id === paraLlevarElegido);
      if (llevarObj) base += llevarObj.precio;

      agregadosElegidos.forEach((agrId) => {
        const agrObj = productoDetalle.opciones.agregados?.find((a) => a.id === agrId);
        if (agrObj) base += agrObj.precio;
      });
    }
    return (base * cantidad).toFixed(2);
  };

  const handleAgregarAlCarrito = () => {
    if (productoDetalle?.opciones?.tipoPan && !panElegido) {
      setErrorObligatorio(true);
      return;
    }

    if (setItemsCarrito) {
      const precioBase = parseFloat(calcularTotalProducto());
      const nuevoItem = {
        id: Date.now(),
        nombre: productoDetalle.nombre,
        detalles: `${panElegido ? "Pan " + panElegido + " · " : ""}${paraLlevarElegido === "llevar" ? "Para llevar" : "En el local"}`,
        nota: nota,
        cantidad: cantidad,
        precioUnitario: precioBase / cantidad,
        subtotal: precioBase
      };
      setItemsCarrito([...itemsCarrito, nuevoItem]);
    }

    setProductoDetalle(null);
    navigate("/comensales/carrito");
  };

  // VISTA RESEÑAS DEL LOCAL
  if (localResenas) {
    return (
      <main className="comensal-main-layout">
        <ResenasLocal
          local={localResenas}
          onVolverLocales={() => {
            setLocalResenas(null);
            setLocalSeleccionado(null);
          }}
          onVerCarta={() => {
            handleVerCarta(localResenas);
            setLocalResenas(null);
          }}
        />
      </main>
    );
  }

  return (
    <main className="comensal-main-layout">
      {/* CASO: NINGÚN LOCAL ABIERTO */}
      {esTodosCerrados ? (
        <div>
          <h1 className="locales-title">Locales del campus</h1>
          <p className="locales-subtitle">Ningún local recibe pedidos en este momento · 22:40</p>

          <div className="empty-state-box">
            <div className="clock-icon-circle">⏰</div>
            <h2 className="section-title" style={{ margin: "0 0 8px 0" }}>Ningún local está abierto ahora</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
              Los locales del campus reciben pedidos desde las 07:00. Puedes revisar las cartas mientras tanto y pedir en cuanto abran.
            </p>
            <div className="empty-actions">
              <button className="btn-primary-action" onClick={() => setEsTodosCerrados(false)}>
                Ver cartas de todos los locales
              </button>
              <button className="btn-secondary-action">
                Avísame cuando abran
              </button>
            </div>
          </div>

          <div className="proximas-aperturas">
            <h3 className="section-title">Próximas aperturas (mañana)</h3>
            <div className="proximas-grid">
              {locales.map((loc) => (
                <div key={loc.id} className="proxima-card">
                  <div className="proxima-thumb"></div>
                  <div>
                    <h4 className="product-title" style={{ margin: 0 }}>{loc.nombre}</h4>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Abre a las {loc.aperturaProx}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !localSeleccionado ? (
        /* CASO DEFAULT: LOCALES DEL CAMPUS */
        <div>
          <div className="locales-header-bar">
            <div>
              <h1 className="locales-title">Locales del campus</h1>
              <p className="locales-subtitle">
                {abiertos} {abiertos === 1 ? "local abierto" : "locales abiertos"} ahora
                {cerrados > 0 ? ` · ${cerrados} ${cerrados === 1 ? "cerrado" : "cerrados"}` : ""} · sede Monterrico
              </p>
            </div>
            <div className="locales-filter-controls">
              <select className="filter-dropdown" defaultValue="Monterrico">
                <option value="Monterrico">Sede: Monterrico</option>
                <option value="SanIsidro">Sede: San Isidro</option>
              </select>
              <button
                className={`filter-btn-toggle ${soloAbiertos ? "active" : ""}`}
                onClick={() => setSoloAbiertos(!soloAbiertos)}
              >
                {soloAbiertos ? "Solo abiertos ✕" : "Solo abiertos"}
              </button>
              <select className="filter-dropdown" defaultValue="espera">
                <option value="espera">Ordenar: menor espera</option>
                <option value="calificacion">Ordenar: mejor calificados</option>
              </select>
            </div>
          </div>

          {errorApi && <div className="alert-obligatorio">{errorApi}</div>}
          {cargandoLocales && <p className="locales-subtitle">Cargando locales…</p>}
          {!cargandoLocales && !errorApi && locales.length === 0 && (
            <p className="locales-subtitle">Todavía no hay locales disponibles.</p>
          )}

          <div className="locales-grid">
            {localesVisibles.map((local) => {
              const esCerrado = local.estado === "Cerrado";
              return (
                <article key={local.id} className={`local-card ${esCerrado ? "local-card--cerrado" : ""}`}>
                  <div className="local-card-image-placeholder">foto local</div>
                  <div className="local-card-body">
                    <div className="local-title-row">
                      <h3>{local.nombre}</h3>
                      <span className={esCerrado ? "status-pill pill-closed" : "status-pill pill-open"}>
                        {local.estado}
                      </span>
                    </div>
                    <p className="local-location-info">{local.ubicacion}</p>
                    <p className="local-time-rating">
                      {local.tiempoPrep ? `${local.tiempoPrep} · ` : ""}
                      <button className="btn-link-resenas" onClick={() => setLocalResenas(local)}>
                        Ver reseñas
                      </button>
                    </p>
                    <button
                      className={esCerrado ? "btn-ver-carta btn-ver-carta--disabled" : "btn-ver-carta"}
                      disabled={esCerrado}
                      onClick={() => handleVerCarta(local)}
                    >
                      Ver carta
                    </button>
                  </div>
                </article>
              );
            })}

            <div className="local-card-info-box">
              Los locales cerrados se muestran atenuados al final de la lista, nunca ocultos.
            </div>
          </div>
        </div>
      ) : (
        /* CASO CARTA DEL LOCAL SELECCIONADO */
        <div>
          <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setLocalSeleccionado(null)}>
              Locales
            </span>
            {" > "}
            <strong style={{ color: "var(--text)" }}>{localSeleccionado.nombre}</strong>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", boxShadow: "var(--shadow-warm)" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "56px", height: "56px", background: "repeating-linear-gradient(-45deg, #FCEAE7, #FCEAE7 5px, #EFE2DC 5px, #EFE2DC 10px)", borderRadius: "var(--radius-container)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                foto
              </div>
              <div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <h2 className="section-title" style={{ margin: 0 }}>{localSeleccionado.nombre}</h2>
                  <span className="status-pill pill-open">Abierto</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "4px 0 0" }}>
                  {localSeleccionado.ubicacion || "Campus"}
                </p>
              </div>
            </div>
            <button className="btn-secondary-action" onClick={() => setLocalResenas(localSeleccionado)}>
              Ver reseñas
            </button>
          </div>

          {/* Categorías */}
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", marginBottom: "16px" }}>
            {categoriasCarta.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  background: categoriaActiva === cat ? "var(--primary)" : "var(--surface)",
                  color: categoriaActiva === cat ? "var(--surface)" : "var(--text)",
                  border: `1px solid ${categoriaActiva === cat ? "var(--primary)" : "var(--border)"}`,
                  padding: "6px 16px",
                  borderRadius: "var(--radius-chip)",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <input
              type="text"
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-container)", padding: "10px 16px", fontSize: "14px", outline: "none", fontFamily: "var(--font-body)" }}
              placeholder="Buscar producto o plato..."
              value={busquedaCarta}
              onChange={(e) => setBusquedaCarta(e.target.value)}
            />
          </div>

          {/* CARGANDO / ERROR / LOCAL SIN PRODUCTOS */}
          {cargandoCarta ? (
            <p className="locales-subtitle">Cargando carta…</p>
          ) : errorApi ? (
            <div className="alert-obligatorio">{errorApi}</div>
          ) : productos.length === 0 ? (
            <div className="sin-resultados-card">
              <div className="question-circle">?</div>
              <h3 className="section-title" style={{ margin: "0 0 8px 0" }}>
                Este local aún no tiene productos
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                Vuelve más tarde para ver su carta.
              </p>
            </div>
          ) : productosFiltrados.length === 0 ? (
            <div className="sin-resultados-card">
              <div className="question-circle">?</div>
              <h3 className="section-title" style={{ margin: "0 0 8px 0" }}>
                Sin resultados para "{busquedaCarta}"
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 16px 0" }}>
                No encontramos productos que coincidan con tu búsqueda en {localSeleccionado.nombre}.
              </p>
              <div className="filter-active-tags">
                <span className="tag-pill">Búsqueda: {busquedaCarta}</span>
                <button
                  style={{ background: "transparent", border: "none", color: "var(--primary)", fontWeight: "bold", cursor: "pointer", fontSize: "13px" }}
                  onClick={() => setBusquedaCarta("")}
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>
          ) : (
            /* GRILLA DE PRODUCTOS CARTA */
            <div className="productos-grid">
              {productosFiltrados.map((prod) => (
                <div key={prod.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-warm)", opacity: prod.agotado ? 0.5 : 1 }}>
                  <div style={{ height: "140px", background: "repeating-linear-gradient(-45deg, #FCEAE7, #FCEAE7 5px, #EFE2DC 5px, #EFE2DC 10px)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    foto 1:1
                  </div>
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h4 className="product-title" style={{ margin: 0 }}>{prod.nombre}</h4>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "18px", margin: "6px 0 12px" }}>{prod.descripcion}</p>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="price-text">S/ {prod.precio.toFixed(2)}</span>
                      
                      <button
                        style={{
                          background: prod.agotado ? "var(--bg)" : "var(--primary)",
                          color: prod.agotado ? "var(--text-muted)" : "var(--surface)",
                          border: prod.agotado ? "1px solid var(--border)" : "none",
                          padding: "8px 16px",
                          borderRadius: "var(--radius-container)",
                          fontWeight: "600",
                          fontSize: "13px",
                          cursor: "pointer"
                        }}
                        onClick={() => handleAbrirDetalle(prod)}
                      >
                        {prod.agotado ? "Agotado" : "Agregar"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE PRODUCTO */}
      {productoDetalle && (
        <div className="modal-overlay">
          <div className="modal-detalle-card">
            <button className="btn-close-modal" onClick={() => setProductoDetalle(null)}>✕</button>

            {/* PRODUCTO AGOTADO */}
            {productoDetalle.agotado ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ height: "160px", width: "160px", background: "repeating-linear-gradient(-45deg, #FCEAE7, #FCEAE7 5px, #EFE2DC 5px, #EFE2DC 10px)", borderRadius: "var(--radius-card)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                  foto 1:1
                </div>
                <h2 className="section-title" style={{ margin: 0 }}>
                  {productoDetalle.nombre} <span className="status-pill pill-closed" style={{ marginLeft: "8px" }}>Agotado</span>
                </h2>
                <p style={{ color: "var(--text-muted)", margin: "8px 0 16px", fontSize: "14px" }}>{productoDetalle.descripcion}</p>
                <span className="price-text" style={{ fontSize: "20px", display: "block", marginBottom: "20px" }}>S/ {productoDetalle.precio.toFixed(2)}</span>
                
                <button className="btn-disabled-wide" disabled>Agotado por hoy</button>
                <button className="btn-outline-wide" onClick={() => setProductoDetalle(null)}>Volver a la carta</button>
              </div>
            ) : (
              /* PRODUCTO DISPONIBLE / OPCIONES */
              <div className="detalle-layout">
                <div>
                  <div style={{ height: "200px", background: "repeating-linear-gradient(-45deg, #FCEAE7, #FCEAE7 5px, #EFE2DC 5px, #EFE2DC 10px)", borderRadius: "var(--radius-card)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                    foto 1:1
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                    {localSeleccionado?.nombre}
                    {productoDetalle.tiempoPrep ? ` · ${productoDetalle.tiempoPrep} min de preparación` : ""}
                  </p>
                </div>

                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>{productoDetalle.nombre}</h2>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "6px 0 16px" }}>{productoDetalle.descripcion}</p>

                  {/* ALERTA OPCIÓN OBLIGATORIA */}
                  {errorObligatorio && (
                    <div className="alert-obligatorio">
                      Elige un tipo de pan para continuar.
                    </div>
                  )}

                  {productoDetalle.opciones && (
                    <div>
                      {/* OBLIGATORIO */}
                      <div className={`group-box ${errorObligatorio ? "group-box-error" : ""}`}>
                        <label className="field-label" style={{ color: errorObligatorio ? "var(--primary)" : "var(--text-muted)", display: "block", marginBottom: "8px" }}>
                          TIPO DE PAN · OBLIGATORIO
                        </label>
                        {productoDetalle.opciones.tipoPan.map((pan) => (
                          <label key={pan.id} className="radio-option">
                            <span>
                              <input
                                type="radio"
                                name="pan"
                                checked={panElegido === pan.id}
                                onChange={() => {
                                  setPanElegido(pan.id);
                                  setErrorObligatorio(false);
                                }}
                                style={{ marginRight: "8px" }}
                              />
                              {pan.nombre}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              {pan.precio === 0 ? "Sin costo" : `+ S/ ${pan.precio.toFixed(2)}`}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* OPCIONAL: LLEVAR */}
                      <div className="group-box">
                        <label className="field-label" style={{ display: "block", marginBottom: "8px" }}>PARA LLEVAR · OPCIONAL</label>
                        {productoDetalle.opciones.paraLlevar.map((op) => (
                          <label key={op.id} className="radio-option">
                            <span>
                              <input
                                type="radio"
                                name="llevar"
                                checked={paraLlevarElegido === op.id}
                                onChange={() => setParaLlevarElegido(op.id)}
                                style={{ marginRight: "8px" }}
                              />
                              {op.nombre}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              {op.precio === 0 ? "Sin costo" : `+ S/ ${op.precio.toFixed(2)}`}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* OPCIONAL: AGREGADOS */}
                      <div className="group-box">
                        <label className="field-label" style={{ display: "block", marginBottom: "8px" }}>AGREGADOS · OPCIONAL</label>
                        {productoDetalle.opciones.agregados.map((agr) => (
                          <label key={agr.id} className="checkbox-option">
                            <span>
                              <input
                                type="checkbox"
                                checked={agregadosElegidos.includes(agr.id)}
                                onChange={() => handleToggleAgregado(agr.id)}
                                style={{ marginRight: "8px" }}
                              />
                              {agr.nombre}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>+ S/ {agr.precio.toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* NOTA PARA EL LOCAL */}
                  <div className="group-box">
                    <label className="field-label" style={{ display: "block", marginBottom: "8px" }}>NOTA PARA EL LOCAL</label>
                    <textarea
                      className="nota-textarea"
                      placeholder="Sin cebolla, por favor."
                      maxLength={120}
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                    />
                  </div>

                  {/* BOTTOM BAR DE ACCIÓN */}
                  <div className="modal-bottom-bar">
                    <div className="counter-box">
                      <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}>-</button>
                      <span>{cantidad}</span>
                      <button onClick={() => setCantidad(cantidad + 1)}>+</button>
                    </div>

                    <button className="btn-primary-action" style={{ flex: 1 }} onClick={handleAgregarAlCarrito}>
                      Agregar al carrito · S/ {calcularTotalProducto()}
                    </button>

                    <button className="btn-secondary-action" onClick={() => setProductoDetalle(null)}>
                      Volver
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}