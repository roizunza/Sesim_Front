/**
 * PENDIENTE — no está enganchado en App.jsx todavía.
 *
 * Se trae tal cual desde el proyecto anterior porque el diseño/UX vale la
 * pena conservarlo, pero SIGUE dependiendo de módulos que ya no existen en
 * este proyecto (`registrosSESIM`, `EsriBasemap`) y de datos simulados.
 * Solo el perfil de Capturista está probado contra el backend real por
 * ahora — este archivo se corrige y se "desbloquea" (se importa y se
 * enruta) cuando toque ese perfil.
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Download, Search, Map, FileText, Clock, 
  XCircle, CheckCircle, DownloadCloud, CloudUpload, 
  AlertTriangle, File, LayoutList, List as ListIcon 
} from 'lucide-react';
import '../perfiles/auditora/Auditor.css';

/* =========================================================================
   1. MOCK DATA - PERFIL AUDITORA / ADMINISTRADORA (Intacto)
========================================================================= */
const mockLogsAuditora = [
  { id: 'CAP-001', rol: 'Capturista', operacion: 'Nuevo registro', tipo: 'Cartografía', archivo: 'red_ciclovias_sector_norte', fecha: '28 Ago 2026', estatus: 'En Revisión', dictamen: false },
  { id: 'ADM-001', rol: 'Administrador', operacion: 'Rechazó', tipo: 'Cartografía', archivo: 'red_ciclovias_sector_norte', fecha: '28 Ago 2026', estatus: 'Rechazado', dictamen: true },
  { id: 'ADM-001', rol: 'Administrador', operacion: 'Aprobó', tipo: 'Normativa', archivo: 'PIMUS_Carmen_2025.pdf', fecha: '27 Ago 2026', estatus: 'Aprobado', dictamen: false },
  { id: 'ADM-002', rol: 'Administrador', operacion: 'Aprobó', tipo: 'Cartografía', archivo: 'zonas_riesgo_hidrometeorologico', fecha: '24 Ago 2026', estatus: 'Aprobado', dictamen: false },
  { id: 'ADM-001', rol: 'Administrador', operacion: 'Aprobó', tipo: 'Normativa', archivo: 'Ley_Movilidad_Campeche_2023.pdf', fecha: '22 Ago 2026', estatus: 'Aprobado', dictamen: false },
  { id: 'CAP-001', rol: 'Capturista', operacion: 'Actualización', tipo: 'Cartografía', archivo: 'red_vial_primaria_corredores', fecha: '20 Ago 2026', estatus: 'En Revisión', dictamen: false }
];

/* =========================================================================
   2. MOCK DATA - PERFIL CAPTURISTA (7 simulaciones para el Feed)
========================================================================= */
const mockLogsCapturista = [
  {
    recurso: 'red_ciclovias_sector_norte', tipoBadge: 'Geometría', opBadge: 'Nuevo registro', monitor: 'Infraestructura', fuente: 'INEGI', fecha: '28 Ago 2026, 09:30', estatus: 'Borrador',
    metadata: { operacion: 'Nuevo Registro', responsable: 'Gobierno de Campeche', escala: 'Municipal', periodicidad: 'Quinquenal', instrumento: 'PIMUS', anio: '2025', horizonte: 'Mediano', eje: 'Resultado' },
    archivos: [{ nombre: 'red_ciclovias_sector_norte.geojson', tipo: 'geo' }, { nombre: 'estilo_ciclovias.sld', tipo: 'style' }, { nombre: 'expediente_ciclovias_2025.pdf', tipo: 'pdf' }]
  },
  {
    recurso: 'red_ciclovias_sector_norte', tipoBadge: 'Geometría', opBadge: 'rechazo', monitor: 'Infraestructura', fuente: 'INEGI', fecha: '28 Ago 2026, 10:15', estatus: 'Requiere Corrección',
    observacion: 'La tabla de atributos no coincide con el diccionario de datos. Falta la columna cve_ent y la tipología de ciclovía.',
    metadata: { operacion: 'Actualización', responsable: 'Gobierno de Campeche', escala: 'Municipal', periodicidad: 'Quinquenal', instrumento: 'PIMUS', anio: '2025', horizonte: 'Mediano', eje: 'Resultado' },
    archivos: [{ nombre: 'red_ciclovias_sector_norte.geojson', tipo: 'geo' }]
  },
  {
    recurso: 'PIMUS_Carmen_2025.pdf', tipoBadge: 'Instrumento', opBadge: 'aprobacion', monitor: 'Ordenamiento Territorial', fuente: 'CONAPO', fecha: '27 Ago 2026, 16:40', estatus: 'Aprobado',
    mensajeAprobacion: 'Subida o Actualización aprobada',
    metadata: { operacion: 'Nuevo Registro', responsable: 'Ayuntamiento de Carmen', escala: 'Municipal', periodicidad: 'Anual', instrumento: 'N/A', anio: '2025', horizonte: 'Corto', eje: 'Gestión' },
    archivos: [{ nombre: 'PIMUS_Carmen_2025.pdf', tipo: 'pdf' }]
  },
  {
    recurso: 'censo_paraderos_transporte_2026', tipoBadge: 'Geometría', opBadge: 'Nuevo registro', monitor: 'Social', fuente: 'CENAPRED', fecha: '26 Ago 2026, 11:30', estatus: 'En Revisión',
    metadata: { operacion: 'Nuevo Registro', responsable: 'IET', escala: 'Estatal', periodicidad: 'Anual', instrumento: 'Programa Sectorial', anio: '2026', horizonte: 'Corto', eje: 'Operativo' },
    archivos: [{ nombre: 'censo_paraderos_2026.gpkg', tipo: 'geo' }, { nombre: 'dictamen_tecnico.pdf', tipo: 'pdf' }]
  },
  {
    recurso: 'zonas_riesgo_hidrometeorologico', tipoBadge: 'Geometría', opBadge: 'Actualización', monitor: 'Ambiental', fuente: 'CENAPRED', fecha: '24 Ago 2026, 09:20', estatus: 'Aprobado',
    metadata: { operacion: 'Actualización', responsable: 'Protección Civil', escala: 'Estatal', periodicidad: 'Bianual', instrumento: 'Atlas de Riesgo', anio: '2024', horizonte: 'Largo', eje: 'Preventivo' },
    archivos: [{ nombre: 'zonas_riesgo_2024.zip', tipo: 'geo' }]
  },
  {
    recurso: 'Programa_Movilidad_Estatal_2024.pdf', tipoBadge: 'Instrumento', opBadge: 'Nuevo registro', monitor: 'Movilidad', fuente: 'Gobierno del Estado', fecha: '23 Ago 2026, 14:00', estatus: 'En Revisión',
    metadata: { operacion: 'Nuevo Registro', responsable: 'SEDUPI', escala: 'Estatal', periodicidad: 'Sexenal', instrumento: 'N/A', anio: '2024', horizonte: 'Largo', eje: 'Estratégico' },
    archivos: [{ nombre: 'Programa_Movilidad_Estatal_2024.pdf', tipo: 'pdf' }]
  },
  {
    recurso: 'red_vial_primaria_corredores', tipoBadge: 'Geometría', opBadge: 'Actualización', monitor: 'Infraestructura', fuente: 'INEGI', fecha: '20 Ago 2026, 12:05', estatus: 'Borrador',
    metadata: { operacion: 'Actualización', responsable: 'SOP', escala: 'Estatal', periodicidad: 'Anual', instrumento: 'N/A', anio: '2026', horizonte: 'Corto', eje: 'Operativo' },
    archivos: [{ nombre: 'red_vial_corredores.zip', tipo: 'geo' }]
  }
];

export default function BitacoraLogs() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el perfil de Capturista
  const [selectedLog, setSelectedLog] = useState(mockLogsCapturista[0]);
  const [viewMode, setViewMode] = useState('feed'); // 'tabla' o 'feed'

  // El escudo protector: revisamos la URL para saber qué vista mostrar
  const isCapturistaView = location.pathname.includes('/capturista') || location.pathname.includes('/administradora');

  /* =========================================================================
     HELPERS VISUALES (Ambas vistas)
  ========================================================================= */
  const getEstatusBadge = (estatus) => {
    switch (estatus) {
      case 'Rechazado':
      case 'Requiere Corrección':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEE2E2', color: '#B91C1C', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><XCircle size={14} /> {estatus}</span>;
      case 'Aprobado':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#E6F4EA', color: '#047857', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><CheckCircle size={14} /> Aprobado</span>;
      case 'En Revisión':
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><Clock size={14} /> En Revisión</span>;
      default: // Borrador
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}><Clock size={14} /> Borrador</span>;
    }
  };

  /* =========================================================================
     VISTA A: CAPTURISTA (Diseño de la imagen con Feed y Tabla integrados)
  ========================================================================= */
  if (isCapturistaView) {
    return (
      <div style={{ height: '100vh', width: '100%', flex: 1, overflowY: 'auto', background: '#F4F5F7', fontFamily: 'var(--font-body)' }}>
        <div style={{ padding: '32px 40px', width: '100%', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          
          {/* HEADER CAPTURISTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#9F2241', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                <ArrowLeft size={16} /> Regresar
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h1 style={{ margin: 0, fontSize: '24px', color: '#691C32', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>Historial de Actividades</h1>
                  <span style={{ border: '1px solid #D1D5DB', padding: '2px 10px', borderRadius: '16px', fontSize: '12px', color: '#6B7280', background: '#fff' }}>
                    Capturista ID: {userId}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '13px' }}>
                  Registro y estatus de cartografías e instrumentos normativos procesados por el usuario.
                </p>
              </div>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#9F2241', border: '1px solid #9F2241', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              <Download size={16} /> Exportar CSV
            </button>
          </div>

          {/* FILTROS Y TOGGLE (Tabla/Feed) CAPTURISTA */}
          <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 12px', flex: 1, minWidth: '250px' }}>
              <Search size={16} color="#9CA3AF" style={{ marginRight: '8px' }} />
              <input type="text" placeholder="Buscar por capa, archivo o instrumento de origen..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Día</option></select>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Mes</option></select>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Año</option></select>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Todos los Tipos</option></select>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Todos los Estatus</option></select>
            <select className="filter-select" style={{ padding: '6px 8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Todos los Monitores</option></select>
            
            {/* Toggle Switch */}
            <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '6px', padding: '2px' }}>
              <button 
                onClick={() => setViewMode('tabla')}
                style={{ 
                  background: viewMode === 'tabla' ? '#fff' : 'transparent', 
                  border: viewMode === 'tabla' ? '1px solid #E5E7EB' : 'none', 
                  borderRadius: '4px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', 
                  color: viewMode === 'tabla' ? '#9F2241' : '#6B7280', 
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', 
                  boxShadow: viewMode === 'tabla' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' 
                }}>
                <LayoutList size={14}/> Tabla
              </button>
              <button 
                onClick={() => setViewMode('feed')}
                style={{ 
                  background: viewMode === 'feed' ? '#fff' : 'transparent', 
                  border: viewMode === 'feed' ? '1px solid #E5E7EB' : 'none', 
                  borderRadius: '4px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', 
                  color: viewMode === 'feed' ? '#9F2241' : '#6B7280', 
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', 
                  boxShadow: viewMode === 'feed' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' 
                }}>
                <ListIcon size={14}/> Feed
              </button>
            </div>
          </div>

          {/* TARJETAS KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: '#F9FAFB', border: '1px solid #374151', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CloudUpload size={20} color="#374151" /> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>7</span> <span style={{ fontSize: '13px', color: '#4B5563' }}>Total de Cargas</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} color="#D97706" /> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>1</span> <span style={{ fontSize: '13px', color: '#4B5563' }}>En Revisión Administrativa</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={20} color="#059669" /> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>3</span> <span style={{ fontSize: '13px', color: '#4B5563' }}>Aprobados y Publicados</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} color="#DC2626" /> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>1</span> <span style={{ fontSize: '13px', color: '#4B5563' }}>Requieren Corrección</span>
            </div>
          </div>

          {/* ESTRUCTURA PRINCIPAL 2 COLUMNAS */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* COLUMNA IZQUIERDA: CONTENIDO DINÁMICO (TABLA O FEED) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {viewMode === 'tabla' ? (
                /* VISTA TABLA */
                <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      <tr>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>RECURSO</th>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>TIPO</th>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>MONITOR</th>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>FUENTE</th>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>FECHA DE CAPTURA</th>
                        <th style={{ padding: '16px', fontSize: '11px', fontWeight: '700', color: '#4B5563', whiteSpace: 'nowrap' }}>ESTATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockLogsCapturista.map((log, index) => {
                        const isSelected = selectedLog.recurso === log.recurso && selectedLog.fecha === log.fecha;
                        return (
                          <tr 
                            key={index} 
                            onClick={() => setSelectedLog(log)}
                            style={{ borderBottom: '1px solid #E5E7EB', background: isSelected ? '#F9FAFB' : '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                          >
                            <td style={{ padding: '16px', fontSize: '13px', color: '#1F2937', fontWeight: isSelected ? '600' : '400' }}>{log.recurso}</td>
                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                              <span style={{ 
                                background: log.tipoBadge === 'Geometría' ? '#EEF2FF' : '#FCE7F3', 
                                color: log.tipoBadge === 'Geometría' ? '#4F46E5' : '#BE185D', 
                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' 
                              }}>
                                {log.tipoBadge === 'Geometría' ? <Map size={12} /> : <FileText size={12} />} {log.tipoBadge}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563' }}>{log.monitor}</td>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#4B5563' }}>{log.fuente}</td>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>{log.fecha}</td>
                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{getEstatusBadge(log.estatus)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* VISTA FEED (Tarjetas) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {mockLogsCapturista.map((log, index) => {
                    const isSelected = selectedLog.recurso === log.recurso && selectedLog.fecha === log.fecha;
                    return (
                      <div 
                        key={index} 
                        onClick={() => setSelectedLog(log)}
                        style={{
                          background: '#fff',
                          border: isSelected ? '1px solid #D97706' : '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '20px',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 0 0 1px #D97706' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Feed Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ background: log.tipoBadge === 'Geometría' ? '#EEF2FF' : '#FCE7F3', color: log.tipoBadge === 'Geometría' ? '#4F46E5' : '#BE185D', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {log.tipoBadge === 'Geometría' ? <Map size={12} /> : <FileText size={12} />} {log.tipoBadge}
                            </span>
                            <span style={{ background: '#F3F4F6', color: '#4B5563', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize' }}>
                              {log.opBadge}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '11px', fontWeight: '500' }}>
                            <Clock size={12} /> Fecha de Captura: {log.fecha}
                          </div>
                        </div>

                        {/* Titulo */}
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '700', color: '#111827' }}>{log.recurso}</h3>

                        {/* Metadatos en linea */}
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280', marginBottom: '16px', flexWrap: 'wrap' }}>
                          <span>Fuente: <strong style={{ color: '#374151' }}>{log.fuente}</strong></span>
                          <span>Monitor: <strong style={{ color: '#374151' }}>{log.monitor}</strong></span>
                          <span>Escala: <strong style={{ color: '#374151' }}>{log.metadata.escala}</strong></span>
                          <span>Instrumento Normativo: <strong style={{ color: '#374151' }}>{log.metadata.instrumento}</strong></span>
                        </div>

                        {/* Alertas condicionales (Rechazo / Aprobación) */}
                        {log.estatus === 'Requiere Corrección' && log.observacion && (
                          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', padding: '16px', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B91C1C', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                              <AlertTriangle size={16} /> Observación de la Administradora:
                            </div>
                            <p style={{ margin: '0 0 12px 22px', fontSize: '12px', color: '#B91C1C' }}>{log.observacion}</p>
                            <button style={{ marginLeft: '22px', background: '#fff', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <DownloadCloud size={14} /> Descargar Dictamen de Rechazo (.PDF)
                            </button>
                          </div>
                        )}

                        {log.estatus === 'Aprobado' && log.mensajeAprobacion && (
                          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '12px', fontWeight: '600' }}>
                            <CheckCircle size={16} /> {log.mensajeAprobacion}
                          </div>
                        )}

                        {/* Footer (Badge inferior) */}
                        <div>
                          {getEstatusBadge(log.estatus)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: FICHA TECNICA INSTITUCIONAL (Fija) */}
            <div style={{ width: '380px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', flexShrink: 0, position: 'sticky', top: '24px' }}>
              <h4 style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', margin: '0 0 8px', textTransform: 'uppercase' }}>Ficha Técnica Institucional</h4>
              <h3 style={{ fontSize: '16px', color: '#9F2241', margin: '0 0 12px', fontWeight: '700', wordBreak: 'break-all' }}>{selectedLog.recurso}</h3>
              <div style={{ marginBottom: '24px' }}>{getEstatusBadge(selectedLog.estatus)}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed #E5E7EB', paddingTop: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Tipo de Recurso:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.tipoBadge}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Fecha de Captura:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.fecha}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Operación:</span> <span style={{ fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>{selectedLog.metadata.operacion}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Institución Fuente:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.fuente}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Responsable:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.responsable}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Escala Territorial:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.escala}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Periodicidad:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.periodicidad}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Monitor Asignado:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.monitor}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Instrumento Normativo:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.instrumento}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Año / Fecha:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.anio}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Horizonte:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.horizonte}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#6B7280' }}>Eje de Evaluación:</span> <span style={{ fontWeight: '500', color: '#111827' }}>{selectedLog.metadata.eje}</span></div>
              </div>

              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '16px' }}>
                <h5 style={{ margin: '0 0 12px', fontSize: '11px', color: '#111827', fontWeight: '700' }}>ARCHIVOS ENVIADOS</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedLog.archivos.map((file, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#4B5563' }}>
                      {file.tipo === 'geo' && <Map size={14} color="#4F46E5" />}
                      {file.tipo === 'style' && <File size={14} color="#10B981" />}
                      {file.tipo === 'pdf' && <FileText size={14} color="#E11D48" />}
                      {file.nombre}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     VISTA B: AUDITORA / ADMINISTRADORA (La tabla global intacta)
  ========================================================================= */
  const getRolStyle = (rol) => {
    if (rol === 'Capturista') return { bg: '#E6F4EA', color: '#047857' };
    return { bg: '#FEE2E2', color: '#B91C1C' }; 
  };

  const getOperacionStyle = (op) => {
    if (op === 'Rechazó') return { bg: '#FEE2E2', color: '#B91C1C' };
    if (op === 'Aprobó') return { bg: '#E6F4EA', color: '#047857' };
    return { bg: '#F3F4F6', color: '#4B5563' }; 
  };

  const getTipoStyle = (tipo) => {
    if (tipo === 'Cartografía') return { bg: '#EDE9FE', color: '#6D28D9' };
    return { bg: '#FCE7F3', color: '#BE185D' }; 
  };

  return (
    <div style={{ height: '100vh', width: '100%', flex: 1, overflowY: 'auto', background: '#F4F5F7', fontFamily: 'var(--font-body)' }}>
      <div style={{ padding: '32px 40px', width: '100%', maxWidth: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => navigate(-1)} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#9F2241', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Regresar
            </button>
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', color: '#691C32', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }}>Bitácora de Loggs</h1>
                <span style={{ border: '1px solid #D1D5DB', padding: '2px 10px', borderRadius: '16px', fontSize: '12px', color: '#6B7280', background: '#fff' }}>
                  Auditoría Institucional - Usuario: {userId}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '13px' }}>
                Registro histórico de acciones dentro del sistema de los diferentes tipos de usuarios institucionales.
              </p>
            </div>
          </div>

          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', color: '#9F2241', border: '1px solid #9F2241', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>

        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '8px 12px', flex: 1, minWidth: '250px' }}>
            <Search size={16} color="#9CA3AF" style={{ marginRight: '8px' }} />
            <input 
              type="text" 
              placeholder="Buscar ID, Rol, Cartografía o instrumento" 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select className="filter-select" style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Día</option></select>
          <select className="filter-select" style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Mes</option></select>
          <select className="filter-select" style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option>Año</option></select>
          <select className="filter-select" style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option value="todos">Todos los roles</option></select>
          <select className="filter-select" style={{ padding: '8px', border: '1px solid #9F2241', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none', color: '#9F2241', fontWeight: '600' }}><option value="todos">Todos los Tipos</option></select>
          <select className="filter-select" style={{ padding: '8px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', background: '#fff', outline: 'none' }}><option value="todos">Todos los Estatus</option></select>
        </div>

        <div className="table-responsive" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>ID</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>ROL</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>OPERACIÓN</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>TIPO</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>RECURSO / ARCHIVO</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>FECHA</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', whiteSpace: 'nowrap' }}>ESTATUS</th>
                <th style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: '#4B5563', textAlign: 'center', whiteSpace: 'nowrap' }}>DICTAMEN</th>
              </tr>
            </thead>
            <tbody>
              {mockLogsAuditora.map((log, index) => {
                const rolStyle = getRolStyle(log.rol);
                const opStyle = getOperacionStyle(log.operacion);
                const tipoStyle = getTipoStyle(log.tipo);

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #E5E7EB', background: '#fff' }}>
                    <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#B91C1C', whiteSpace: 'nowrap' }}><span style={{ background: '#FEE2E2', padding: '4px 8px', borderRadius: '4px' }}>{log.id}</span></td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}><span style={{ background: rolStyle.bg, color: rolStyle.color, padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>{log.rol}</span></td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}><span style={{ background: opStyle.bg, color: opStyle.color, padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{log.operacion}</span></td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}><span style={{ background: tipoStyle.bg, color: tipoStyle.color, padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>{log.tipo}</span></td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      {log.tipo === 'Cartografía' ? <Map size={16} color="#4F46E5" /> : <FileText size={16} color="#E11D48" />}
                      {log.archivo}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#6B7280', whiteSpace: 'nowrap' }}>{log.fecha}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>{getEstatusBadge(log.estatus)}</td>
                    <td style={{ padding: '16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {log.dictamen ? (
                        <button style={{ background: '#fff', border: '1px solid #F87171', color: '#E11D48', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><DownloadCloud size={14} /> Dictamen</button>
                      ) : <span style={{ color: '#9CA3AF' }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}