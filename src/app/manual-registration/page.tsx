"use client";
// src/App.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import supabase from "../../../lib/supabase"
import styles from './App.module.css';



// Definición de tipos
interface Attendant {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  organization: string | null;
}

interface Session {
  id: string;
  name: string;
}

interface EventRegistration {
  session_id: string;
  attendant_id: string;
  checked_at: string;
}

interface Registration {
  attendant_id: string;
  date: string;
}

function App() {
  // Estados
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedAttendant, setSelectedAttendant] = useState<Attendant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: '' });
  const [eventName] = useState<string>('PEPQA 2025');

  // Obtener sesiones y asistentes al cargar el componente
  useEffect(() => {
    fetchSessions();
    fetchAttendants();
  }, []);

  // Consulta a Supabase para obtener sesiones
  const fetchSessions = async (): Promise<void> => {
    try {
      setSessionsLoading(true);
      const { data, error } = await supabase
        .from('sessions')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setSessions(data as Session[]);
      // Seleccionar la primera sesión por defecto si existe
      if (data && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error al obtener sesiones:', error.message);
      showMessage('Error al cargar sesiones: ' + error.message, 'error');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Consulta a Supabase para obtener asistentes
  const fetchAttendants = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendants')
        .select('id, name, email, phone_number, organization')
        .order('name', { ascending: true });

      if (error) throw error;
      setAttendants(data as Attendant[]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      showMessage('Error al cargar asistentes: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Mostrar mensajes
  const showMessage = (text: string, type: string = 'success'): void => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Manejar búsqueda
  const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  // Manejar cambio de sesión
  const handleSessionChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedSessionId((e.target.value) || null);
  };

  // Filtrar asistentes
  const filteredAttendants = attendants.filter(attendant => 
    attendant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attendant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendant.phone_number && attendant.phone_number.includes(searchTerm)) ||
    (attendant.organization && attendant.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener nombre de la sesión seleccionada
  const getSelectedSessionName = (): string => {
    if (!selectedSessionId) return 'Selecciona una sesión';
    if (selectedSessionId === "1") return "Registro";
    const session = sessions.find(s => s.id === selectedSessionId);
    return session ? session.name : 'Sesión no encontrada';
  };

  // Registrar asistente en sesión
  const registerAttendant = async (): Promise<void> => {
    if (!selectedAttendant) {
      showMessage('Por favor selecciona un asistente', 'error');
      return;
    }

    if (!selectedSessionId) {
      showMessage('Por favor selecciona una sesión', 'error');
      return;
    }
    if (selectedSessionId === "1"){
      try {
        const registrationData: Registration = {
          attendant_id: selectedAttendant.id,
          date: new Date().toISOString().split('T')[0]
        };

        const { error } = await supabase
          .from('registrations')
          .insert([registrationData]);

        if (error) throw error;
        showMessage(`¡${selectedAttendant.name} registrado exitosamente!`);
        setSelectedAttendant(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error registrando asistente:', error.message);
        showMessage('Error al registrar asistente: ' + error.message, 'error');
      }
    } else {
      try {
        const registrationData: EventRegistration = {
          session_id: selectedSessionId,
          attendant_id: selectedAttendant.id,
          checked_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('attendance')
          .insert([registrationData]);

        if (error) throw error;
        showMessage(`¡${selectedAttendant.name} registrado en ${getSelectedSessionName()} exitosamente!`);
        setSelectedAttendant(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error('Error registrando asistente:', error.message);
        showMessage('Error al registrar asistente: ' + error.message, 'error');
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Registro de Evento</h1>
        <div className={styles.eventInfo}>
          <h2>{eventName}</h2>
        </div>
      </header>

      <div className={styles.content}>
        {/* Selector de sesión */}
        <div className={styles.sessionSelector}>
          <div className={styles.sessionHeader}>
            <h3>Sesión actual:</h3>
            <div className={styles.currentSession}>
              {getSelectedSessionName()}
            </div>
          </div>
          
          <div className={styles.sessionDropdown}>
            <label htmlFor="session-select">Cambiar sesión:</label>
            <select 
              id="session-select"
              value={selectedSessionId || ''}
              onChange={handleSessionChange}
              disabled={sessionsLoading}
              className={styles.sessionSelect}
            >
              {sessionsLoading ? (
                <option value="">Cargando sesiones...</option>
              ) : sessions.length === 0 ? (
                <option value="">No hay sesiones disponibles</option>
              ) : (
                <>
                <option key="1" value="1">Registro</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
                </>
              )}
            </select>
          </div>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, email, teléfono o empresa..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.selectedInfo}>
            {selectedAttendant ? (
              <div className={styles.selectedCard}>
                <div className={styles.selectedHeader}>Asistente seleccionado:</div>
                <div className={styles.selectedDetails}>
                  <strong>{selectedAttendant.name}</strong>
                  <div>{selectedAttendant.email}</div>
                  <div>{selectedAttendant.phone_number}</div>
                </div>
              </div>
            ) : (
              <div className={styles.noSelection}>Selecciona un asistente para registrarlo</div>
            )}
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loaderContainer}>
              <div className={styles.loader}></div>
              <p>Cargando asistentes...</p>
            </div>
          ) : filteredAttendants.length === 0 ? (
            <div className={styles.noResults}>
              <p>No se encontraron asistentes que coincidan con la búsqueda</p>
            </div>
          ) : (
            <table className={styles.attendantsTable}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Empresa</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendants.map((attendant) => (
                  <tr 
                    key={attendant.id}
                    className={`${styles.tableRow} ${selectedAttendant?.id === attendant.id ? styles.selectedRow : ''}`}
                    onClick={() => setSelectedAttendant(attendant)}
                  >
                    <td>
                      <div className={styles.avatar}>
                        {attendant.name.charAt(0)}
                      </div>
                      {attendant.name}
                    </td>
                    <td>{attendant.email}</td>
                    <td>{attendant.phone_number}</td>
                    <td>{attendant.organization || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.actionSection}>
          <button 
            onClick={registerAttendant}
            disabled={!selectedAttendant || !selectedSessionId}
            className={styles.registerButton}
          >
            Registrar en Sesión
          </button>
          
          {message.text && (
            <div className={`${styles.message} ${message.type === 'error' ? styles.error : styles.success}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
      
      <footer className={styles.footer}>
        <p>Sistema de Registro de Eventos • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;