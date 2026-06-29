import React, { useState, useEffect } from "react";
import { 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  RotateCw, 
  Sliders, 
  Sparkles, 
  History, 
  CheckCircle, 
  HelpCircle,
  X,
  UserCheck,
  Check,
  CalendarCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Match, Player, SoccerAppState } from "./types";

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SoccerAppState>({
    currentMatch: null,
    history: []
  });
  
  // User local profile config
  const [savedName, setSavedName] = useState<string>(() => {
    return localStorage.getItem("football_player_name") || "";
  });

  // Admin / Organizer Access State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("football_is_admin") === "true";
  });

  const ensureAdmin = (): boolean => {
    if (isAdmin) return true;
    const pass = prompt("Introduzca la contraseña de Organizador para realizar esta acción:");
    if (pass === "Barceloneta") {
      setIsAdmin(true);
      localStorage.setItem("football_is_admin", "true");
      alert("¡Acceso de Organizador concedido!");
      return true;
    } else {
      if (pass !== null) {
        alert("Contraseña incorrecta. Acceso denegado.");
      }
      return false;
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("football_is_admin");
    alert("Sesión de Organizador cerrada.");
  };
  
  // Inputs
  const [signupName, setSignupName] = useState<string>("");
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  
  // New Match Form Inputs
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("18:00");
  const [newLocation, setNewLocation] = useState<string>("Pg. de Salvat Papasseit, 11, Ciutat Vella, 08003 Barcelona");
  const [newMaxPlayers, setNewMaxPlayers] = useState<number>(10);
  const [newTitle, setNewTitle] = useState<string>("");
  const [newSubtitle, setNewSubtitle] = useState<string>("");
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>("");
  const [adminTab, setAdminTab] = useState<'edit' | 'new' | 'cancel'>('edit');
  const [cancelReason, setCancelReason] = useState<string>("Lluvia / Clima adverso");

  // Handle avatar upload as Base64 data URL
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo es demasiado grande. El límite es de 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Whenever the configuration modal opens, pre-fill inputs with current match details if we want to edit
  useEffect(() => {
    if (showConfigModal) {
      if (state.currentMatch) {
        setNewDate(state.currentMatch.date);
        setNewTime(state.currentMatch.time);
        setNewLocation(state.currentMatch.location);
        setNewMaxPlayers(state.currentMatch.maxPlayers);
        setNewTitle(state.currentMatch.title || "");
        setNewSubtitle(state.currentMatch.subtitle || "");
        setNewAvatarUrl(state.currentMatch.avatarUrl || "");
        setAdminTab(state.currentMatch.isCanceled ? 'cancel' : 'edit');
      } else {
        setNewDate("");
        setNewTime("18:00");
        setNewLocation("Pg. de Salvat Papasseit, 11, Ciutat Vella, 08003 Barcelona");
        setNewMaxPlayers(10);
        setNewTitle("");
        setNewSubtitle("");
        setNewAvatarUrl("");
        setAdminTab('new');
      }
    }
  }, [showConfigModal]);
  
  // Confetti / Celebration Trigger
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Drag and Drop State for manual teams
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  // Helper for making robust API requests with clean content-type checks and helpful error messages
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error del servidor (${res.status})`);
        } else {
          throw new Error(`El servidor respondió con un error (${res.status}). Es posible que se esté iniciando o reiniciando.`);
        }
      }
      
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La respuesta del servidor no es un JSON válido. Reintente en unos instantes.");
      }
      
      return await res.json();
    } catch (err: any) {
      if (err.message && err.message.includes("Failed to fetch")) {
        throw new Error("No se pudo conectar con el servidor. Verifique su conexión o espere a que el servidor termine de iniciarse.");
      }
      throw err;
    }
  };

  // Fetch match details
  const fetchMatchState = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await safeFetchJson("/api/football/match");
      setState(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Nepodařilo se připojit k serveru.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Poll state every 5 seconds for real-time multiplayer feel
  useEffect(() => {
    fetchMatchState();
    const interval = setInterval(() => {
      fetchMatchState(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Check if lineup just became full of exact limit
  useEffect(() => {
    if (state.currentMatch) {
      const totalPlayersCount = state.currentMatch.players.length;
      const limit = state.currentMatch.maxPlayers;
      if (totalPlayersCount === limit && totalPlayersCount > 0) {
        // Just reached the exact limit! Let's celebrate.
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.currentMatch?.players.length, state.currentMatch?.maxPlayers]);

  // Handle Player Signup
  const handleSignUp = async (nameToRegister: string) => {
    const trimmed = nameToRegister.trim();
    if (!trimmed) return;
    
    // Save name to local storage for quick access next time
    localStorage.setItem("football_player_name", trimmed);
    setSavedName(trimmed);

    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
      setSignupName("");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // satisfying haptic vibrate if supported
    } catch (err: any) {
      alert(err.message || "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Player Signout
  const handleSignOut = async (playerId: string) => {
    const playerToRemove = state.currentMatch?.players.find(p => p.id === playerId);
    if (!playerToRemove) return;

    // Only allow self sign-out or admin sign-out of others
    const isSelf = savedName && playerToRemove.name.trim().toLowerCase() === savedName.trim().toLowerCase();
    if (!isSelf && !isAdmin) {
      const pass = prompt("Introduzca la contraseña de Organizador para dar de baja a otro jugador:");
      if (pass !== "Barceloneta") {
        alert("Contraseña incorrecta. Solo el propio jugador o un Organizador puede dar de baja a este participante.");
        return;
      }
      setIsAdmin(true);
      localStorage.setItem("football_is_admin", "true");
    }

    if (!confirm(`¿De verdad quieres dar de baja a ${playerToRemove.name}?`)) return;
    
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
    } catch (err: any) {
      alert(err.message || "Error al darse de baja.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Player Confirmation Toggle
  const handleToggleConfirmet = async (playerId: string, currentStatus: boolean) => {
    const playerToToggle = state.currentMatch?.players.find(p => p.id === playerId);
    if (!playerToToggle) return;

    // Only allow self confirmation or admin confirmation of others
    const isSelf = savedName && playerToToggle.name.trim().toLowerCase() === savedName.trim().toLowerCase();
    if (!isSelf && !isAdmin) {
      const pass = prompt("Introduzca la contraseña de Organizador para modificar la asistencia de otro jugador:");
      if (pass !== "Barceloneta") {
        alert("Contraseña incorrecta. Solo el propio jugador o un Organizador puede confirmar esta asistencia.");
        return;
      }
      setIsAdmin(true);
      localStorage.setItem("football_is_admin", "true");
    }

    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, isConfirmed: !currentStatus })
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
      if (navigator.vibrate) navigator.vibrate([80]);
    } catch (err: any) {
      alert(err.message || "Error al modificar la confirmación.");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual team assignment (A/B or null)
  const handleAssignPlayerTeam = async (playerId: string, team: "A" | "B" | null) => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, team })
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
      if (navigator.vibrate) navigator.vibrate([60]);
    } catch (err: any) {
      alert(err.message || "Error al asignar el equipo.");
    } finally {
      setLoading(false);
    }
  };

  // Handle shuffling teams randomly
  const handleRandomizeTeams = async () => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/teams/randomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (err: any) {
      alert(err.message || "Error al sortear los equipos.");
    } finally {
      setLoading(false);
    }
  };

  // Handle resetting manual teams back to alternating default
  const handleResetTeams = async () => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/teams/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
      if (navigator.vibrate) navigator.vibrate([60]);
    } catch (err: any) {
      alert(err.message || "Error al restaurar los equipos.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle match configuration directly (5v5 vs 6v6)
  const handleToggleConfig = async (limit: number) => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPlayers: limit })
      });
      setState(prev => ({ ...prev, currentMatch: data.match }));
    } catch (err: any) {
      alert(err.message || "Error al modificar el límite.");
    } finally {
      setLoading(false);
    }
  };

  // Create a brand new match manually
  const handleCreateNewMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAdmin()) return;
    if (!newDate || !newTime || !newLocation) {
      alert("Por favor, rellene todos los campos.");
      return;
    }

    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          location: newLocation,
          maxPlayers: newMaxPlayers,
          title: newTitle,
          subtitle: newSubtitle,
          avatarUrl: newAvatarUrl
        })
      });

      setState(prev => {
        const updatedHistory = prev.currentMatch && prev.currentMatch.players.length > 0
          ? [ { ...prev.currentMatch, isCompleted: true }, ...prev.history ]
          : prev.history;
        
        return {
          currentMatch: data.match,
          history: updatedHistory.slice(0, 25)
        };
      });

      setShowConfigModal(false);
    } catch (err: any) {
      alert(err.message || "Error al crear el nuevo partido.");
    } finally {
      setLoading(false);
    }
  };

  // Edit the current active match
  const handleEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAdmin()) return;
    if (!newDate || !newTime || !newLocation) {
      alert("Por favor, rellene todos los campos.");
      return;
    }

    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          location: newLocation,
          maxPlayers: newMaxPlayers,
          title: newTitle,
          subtitle: newSubtitle,
          avatarUrl: newAvatarUrl
        })
      });

      setState(prev => ({ ...prev, currentMatch: data.match }));
      setShowConfigModal(false);
      alert("¡Partido actualizado con éxito!");
    } catch (err: any) {
      alert(err.message || "Error al editar el partido.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel the current active match
  const handleCancelMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason })
      });

      setState(prev => ({ ...prev, currentMatch: data.match }));
      setShowConfigModal(false);
      alert("¡Partido suspendido con éxito!");
    } catch (err: any) {
      alert(err.message || "Error al suspender el partido.");
    } finally {
      setLoading(false);
    }
  };

  // Restore/uncancel the match
  const handleRestoreMatch = async () => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      setState(prev => ({ ...prev, currentMatch: data.match }));
      setShowConfigModal(false);
      alert("¡Partido restaurado con éxito!");
    } catch (err: any) {
      alert(err.message || "Error al restaurar el partido.");
    } finally {
      setLoading(false);
    }
  };

  // Complete match manually, archiving it and opening the next match +7 days
  const handleCompleteMatch = async () => {
    if (!ensureAdmin()) return;
    if (!confirm("¿Estás seguro de que deseas marcar el partido actual como JUGADO? Esto lo moverá al historial y creará automáticamente una nueva convocatoria para la próxima semana (+7 días) con el mismo horario y lugar.")) {
      return;
    }

    try {
      setLoading(true);
      const data = await safeFetchJson("/api/football/match/complete", {
        method: "POST"
      });

      setState(prev => ({
        currentMatch: data.match,
        history: data.history
      }));

      // Update configuration input values to match the new schedule
      if (data.match) {
        setNewDate(data.match.date);
        setNewTime(data.match.time);
        setNewLocation(data.match.location);
        setNewMaxPlayers(data.match.maxPlayers);
        setNewTitle(data.match.title || "");
        setNewSubtitle(data.match.subtitle || "");
        setNewAvatarUrl(data.match.avatarUrl || "");
      }

      setShowConfigModal(false);
      alert("🏆 ¡Partido completado! Se ha creado la convocatoria idéntica para la próxima semana.");
    } catch (err: any) {
      alert(err.message || "Error al completar el partido.");
    } finally {
      setLoading(false);
    }
  };

  // Helper date/time checker to see if we're within 48 hours (2 days) of kickoff
  const isWithin48HoursOfMatch = (dateStr: string, timeStr: string): boolean => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      const matchTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      const diffMs = matchTime.getTime() - now.getTime();
      
      // Eligibility opens 48 hours prior to starting, and stays open until the match is finished (e.g. 2 hours after kick-off)
      const limits = 48 * 60 * 60 * 1000;
      return diffMs <= limits && diffMs > -2 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  // Helper formats for nice Spanish dates
  const formatSpanishDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-").map(Number);
      if (parts.length !== 3) return dateStr;
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      
      const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const months = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
      ];
      
      const dayName = weekdays[dateObj.getDay()];
      const dayNum = dateObj.getDate();
      const monthName = months[dateObj.getMonth()];
      
      return `${dayName}, ${dayNum} de ${monthName}`;
    } catch (e) {
      return dateStr;
    }
  };

  const currentMatch = state.currentMatch;
  const maxPlayers = currentMatch?.maxPlayers || 10;
  const is6v6 = maxPlayers === 12;

  // Split players into main lineup and reserves
  const allRegistered = currentMatch?.players || [];
  const mainPlayersLimit = maxPlayers;
  
  const mainPlayers = allRegistered.slice(0, mainPlayersLimit);
  const reserves = allRegistered.slice(mainPlayersLimit);

  // Split main players into two local teams for balance representation:
  const assignedTeamA = mainPlayers.filter(p => p.team === "A");
  const assignedTeamB = mainPlayers.filter(p => p.team === "B");
  const unassigned = mainPlayers.filter(p => !p.team);

  const teamAPlayers: Player[] = [...assignedTeamA];
  const teamBPlayers: Player[] = [...assignedTeamB];

  const maxTeamSize = Math.floor(maxPlayers / 2);
  unassigned.forEach((p, idx) => {
    if (teamAPlayers.length < maxTeamSize && teamBPlayers.length < maxTeamSize) {
      // Alternate defaults if not assigned
      if (idx % 2 === 0) {
        teamAPlayers.push(p);
      } else {
        teamBPlayers.push(p);
      }
    } else if (teamAPlayers.length < maxTeamSize) {
      teamAPlayers.push(p);
    } else {
      teamBPlayers.push(p);
    }
  });

  const teamBlue: (Player | null)[] = Array(maxTeamSize).fill(null);
  const teamRed: (Player | null)[] = Array(maxTeamSize).fill(null);

  teamBPlayers.forEach((p, idx) => {
    if (idx < teamBlue.length) teamBlue[idx] = p;
  });
  teamAPlayers.forEach((p, idx) => {
    if (idx < teamRed.length) teamRed[idx] = p;
  });

  // Calculate percentage filled
  const spotsLeft = Math.max(0, maxPlayers - mainPlayers.length);
  const percentage = Math.min(100, Math.floor((mainPlayers.length / maxPlayers) * 100));

  // Determine if confirmation window is open
  const canConfirmNow = currentMatch ? isWithin48HoursOfMatch(currentMatch.date, currentMatch.time) : false;

  // Check if lineup is full and everyone is confirmed (i.e. green)
  const isEveryoneConfirmed = mainPlayers.length === maxPlayers && mainPlayers.length > 0 && mainPlayers.every(p => p.isConfirmed);

  // Auto set initial date state when opening config to upcoming Wednesday
  useEffect(() => {
    if (!newDate) {
      const wed = new Date();
      wed.setDate(wed.getDate() + (3 + 7 - wed.getDay()) % 7);
      const y = wed.getFullYear();
      const m = String(wed.getMonth() + 1).padStart(2, "0");
      const d = String(wed.getDate()).padStart(2, "0");
      setNewDate(`${y}-${m}-${d}`);
    }
  }, []);

  return (
    <div id="full-app-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center pb-12 font-sans overflow-x-hidden antialiased">
      
      {/* Visual background soccer fields ambiance */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-emerald-950/40 to-slate-900 pointer-events-none z-0" />

      {/* Main Container Layer */}
      <div className="w-full max-w-md px-4 pt-4 z-10 flex flex-col gap-4">
        
        {/* Sleek App Brand Header */}
        <header className="flex justify-between items-center py-2" id="header-brand">
          <div className="flex items-center gap-2">
            <div className="bg-slate-950 text-emerald-400 p-0 rounded-xl shadow-lg ring-4 ring-emerald-500/10 w-10 h-10 flex items-center justify-center overflow-hidden border border-slate-800">
              {currentMatch?.avatarUrl ? (
                <img src={currentMatch.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="font-extrabold text-base select-none">⚽</span>
              )}
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-tight">
                {currentMatch?.title || (is6v6 ? "Fútbol 6 vs 6" : "Fútbol 5 vs 5")}
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                {currentMatch?.subtitle || "Inscripción y alineaciones semanales"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="btn-history-trigger"
              onClick={() => {
                fetchMatchState();
                setShowHistoryModal(true);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
              title="Historial de partidos"
            >
              <History size={18} />
            </button>
            
            <button
              id="btn-settings-trigger"
              onClick={() => setShowConfigModal(true)}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
              title="Configurar partido"
            >
              <Sliders size={18} />
            </button>
          </div>
        </header>

        {/* Organizer Status / Admin Session Bar */}
        <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800 text-xs gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAdmin ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-slate-300 font-medium truncate">
              {isAdmin ? "Modo Organizador Activo 🔓" : "Vista de Jugador Estándar 🔒"}
            </span>
          </div>
          {isAdmin ? (
            <button
              onClick={handleAdminLogout}
              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold rounded-xl transition-all border border-rose-500/20 cursor-pointer active:scale-95 text-[10px]"
            >
              Salir
            </button>
          ) : (
            <button
              onClick={() => {
                const pass = prompt("Introduzca la contraseña de Organizador:");
                if (pass === "Barceloneta") {
                  setIsAdmin(true);
                  localStorage.setItem("football_is_admin", "true");
                  alert("¡Acceso de Organizador concedido!");
                } else if (pass !== null) {
                  alert("Contraseña incorrecta.");
                }
              }}
              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-extrabold rounded-xl transition-all border border-emerald-500/20 cursor-pointer active:scale-95 flex items-center gap-1 text-[10px]"
            >
              🔑 Acceso Org.
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex gap-3 text-sm text-rose-300 animate-pulse" id="error-banner">
            <div className="font-bold">⚠️</div>
            <div>{error}</div>
          </div>
        )}

        {/* Celebration Banner when Full */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 rounded-2xl p-4 text-center font-bold shadow-xl flex flex-col items-center gap-1.5 relative overflow-hidden"
              id="banner-celebrate-full"
            >
              <div className="absolute inset-0 bg-white/10 opacity-20 animate-wiggle pointer-events-none" />
              <div className="flex items-center gap-2 text-lg">
                <Sparkles size={20} className="animate-spin text-amber-100" />
                <span>¡Convocatoria Completa! ⚽</span>
                <Sparkles size={20} className="animate-spin text-amber-100" />
              </div>
              <p className="text-xs font-normal text-slate-900 opacity-90">
                ¡Tenemos los jugadores necesarios! Los siguientes inscritos pasan directamente a la lista de reservas.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Match Card */}
        {loading && !currentMatch ? (
          <div className="bg-slate-800/40 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-3">
            <RotateCw size={32} className="animate-spin text-emerald-400" />
            <p className="text-sm text-slate-400">Cargando partido...</p>
          </div>
        ) : !currentMatch ? (
          <div className="bg-slate-800/50 border border-dashed border-slate-700 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-slate-800 rounded-full text-slate-400">
              <Calendar size={36} />
            </div>
            <div>
              <h3 className="font-bold text-lg">No hay partidos activos</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-[280px] mx-auto">
                No se ha programado ningún partido semanal todavía. ¡Crea el primero ahora!
              </p>
            </div>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Crear nuevo partido
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* MATCH SPECIFICS HEADER INFO */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden" id="match-info-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl" />
              
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  currentMatch.isCanceled 
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20" 
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentMatch.isCanceled ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                  {currentMatch.isCanceled ? "PARTIDO SUSPENDIDO" : "Próximo Encuentro"}
                </span>
                
                {/* 5v5 vs 6v6 Segmented Control */}
                <div className="flex items-center bg-slate-900 border border-slate-700/60 p-0.5 rounded-xl text-xs font-semibold" id="toggle-slots-container">
                  <button
                    disabled={currentMatch.isCanceled}
                    onClick={() => handleToggleConfig(10)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      !is6v6 ? "bg-emerald-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    5 vs 5
                  </button>
                  <button
                    disabled={currentMatch.isCanceled}
                    onClick={() => handleToggleConfig(12)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      is6v6 ? "bg-emerald-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    6 vs 6
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {currentMatch.isCanceled && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 animate-pulse">
                    <span className="text-xl">🌧️</span>
                    <div>
                      <h4 className="font-extrabold text-sm text-white uppercase tracking-wider">¡Aviso de Suspensión!</h4>
                      <p className="text-xs text-rose-400 mt-1 leading-relaxed">
                        Este encuentro ha sido suspendido: <span className="font-bold text-rose-200">{currentMatch.cancellationReason || "Motivo no especificado"}</span>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700/80">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">{formatSpanishDate(currentMatch.date)}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                      <Clock size={12} />
                      <span>Hora de inicio: <b>{currentMatch.time}</b></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-700/50 pt-3">
                  <div className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl border border-slate-700/80 flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-400">Lugar del encuentro</p>
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentMatch.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-wrap items-center gap-1.5 font-medium text-sm text-emerald-400 hover:text-emerald-300 hover:underline mt-0.5 transition-colors group"
                      title="Ver dirección en Google Maps"
                    >
                      <span className="break-words">{currentMatch.location}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20 opacity-80 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                        Mapa ↗
                      </span>
                    </a>
                  </div>
                </div>

                {currentMatch.subtitle && (
                  <div className="flex items-start gap-3 border-t border-slate-700/50 pt-3">
                    <div className="p-2.5 bg-slate-900 text-amber-400 rounded-xl border border-slate-700/80 flex-shrink-0">
                      <span className="text-base select-none">💬</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">Nota / Pago del encuentro</p>
                      <p className="text-sm text-amber-300 font-semibold mt-0.5 whitespace-pre-wrap break-words">
                        {currentMatch.subtitle}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer Controls bar directly on the card */}
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🛠️ Panel de Organizador:</span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setAdminTab('edit');
                      setShowConfigModal(true);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-850 hover:bg-slate-750 text-emerald-400 hover:text-white rounded-xl border border-slate-700/80 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="Editar fecha, hora o lugar"
                  >
                    ✏️ Editar detalles
                  </button>
                  <button
                    onClick={() => {
                      setAdminTab('cancel');
                      setShowConfigModal(true);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-850 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl border border-rose-900/40 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    title="Suspender o restaurar el partido"
                  >
                    🚫 {currentMatch.isCanceled ? "Restaurar" : "Suspender"}
                  </button>
                </div>
              </div>

              {/* Progress Bar of full slotting */}
              <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400">Aforo registrado:</span>
                  <span className="font-mono text-white font-bold">
                    {mainPlayers.length} / {maxPlayers}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                  <span>{spotsLeft > 0 ? `Cupos disponibles: ${spotsLeft}` : "❗ Plazas principales agotadas"}</span>
                </div>
              </div>
            </div>

            {/* ATTENDANCE CONFIRMATION ALERT BAR SYSTEM */}
            <div className="bg-slate-800/90 border border-slate-700/85 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck size={18} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Confirmación de Asistencia</h4>
              </div>
              
              {canConfirmNow ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl">
                  <p className="text-xs text-emerald-300 leading-relaxed font-semibold">
                    ✅ ¡La confirmación está ABIERTA! (Faltan menos de 48 horas para el partido).
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Por favor, busca tu nombre abajo en la lista y marca la casilla para que tu nombre cambie a <span className="text-emerald-400 font-bold">Verde</span> y asegures tu lugar en la cancha. Los jugadores sin confirmar se muestran en color <span className="text-sky-400 font-bold">Azul</span>.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <p className="text-xs text-amber-400 leading-relaxed">
                    ⏳ Confirmación cerrada. Se habilitará automáticamente 48 horas (2 días) antes del pitido inicial.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Esto evita que los jugadores confirmen con días de antelación y luego no asistan. Una vez inscritos, vuestro nombre estará en <span className="text-sky-400 font-bold">Azul</span>. Al abrirse, podréis validarlo para pasar a <span className="text-emerald-400 font-bold">Verde</span>.
                  </p>
                </div>
              )}
            </div>

            {/* QUICK REGISTER PANEL */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col gap-3" id="signup-panel">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Users size={16} className="text-emerald-400" />
                Inscribirse al partido
              </h4>
              
              {currentMatch.isCanceled ? (
                <div className="bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-2xl text-xs font-semibold text-rose-300 leading-relaxed">
                  🚫 No se admiten inscripciones ni bajas porque el partido semanal se encuentra actualmente **suspendido**.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Escribe tu nombre y apellido..."
                      className="flex-1 px-4 py-3 text-sm bg-slate-900 border border-slate-700/60 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSignUp(signupName);
                      }}
                    />
                    <button
                      onClick={() => handleSignUp(signupName)}
                      disabled={loading || !signupName.trim()}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-slate-950 font-extrabold rounded-xl text-sm transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                    >
                      <span>Inscribirse</span>
                    </button>
                  </div>

                  {/* Quick saved player button */}
                  {savedName && (
                    <div className="flex items-center justify-between mt-1 bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-800">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <UserCheck size={12} className="text-emerald-400" />
                        Inscripción rápida como:
                      </span>
                      <button
                        onClick={() => handleSignUp(savedName)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all ml-1 underline underline-offset-2 hover:no-underline cursor-pointer"
                      >
                        {savedName}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MATCH SOCCER FIELD VISUALIZATION */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 shadow-xl flex flex-col gap-3" id="soccer-pitch-card">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-2.5">
                <h4 className="font-bold text-sm text-slate-200">
                  Visualización de Equipos
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Claras vs. Oscuras</span>
              </div>

              {/* Graphic Green Soccer Field Container */}
              <div className="relative aspect-[1/1.45] w-full max-w-[440px] mx-auto min-h-[520px] sm:min-h-[580px] bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-2xl border-2 border-emerald-500 shadow-inner overflow-hidden p-2 sm:p-4 flex flex-col justify-between" id="soccer-pitch-field">
                
                {/* Grass stripes effect */}
                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-10">
                  {Array(8).fill(null).map((_, i) => (
                    <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-black" : "bg-transparent"}`} />
                  ))}
                </div>

                {/* Field markings */}
                <div className="absolute inset-x-0 inset-y-0 border border-white/40 pointer-events-none rounded-xl m-1" />
                
                {/* Center line (horizontal divide) */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/40 pointer-events-none" />
                
                {/* Center circle & center spot */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 sm:w-16 h-14 sm:h-16 rounded-full border border-white/40 pointer-events-none" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white/50 pointer-events-none" />
                
                {/* Penalty areas */}
                {/* Top Penalty Area */}
                <div className="absolute top-1 inset-x-[18%] h-10 sm:h-12 border-b border-x border-white/40 pointer-events-none" />
                {/* Bottom Penalty Area */}
                <div className="absolute bottom-1 inset-x-[18%] h-10 sm:h-12 border-t border-x border-white/40 pointer-events-none" />

                {/* Goals */}
                {/* Top Goal Net */}
                <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-16 h-2 border-b border-x border-white/60 bg-emerald-900/50 pointer-events-none rounded-b" />
                {/* Bottom Goal Net */}
                <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-16 h-2 border-t border-x border-white/60 bg-emerald-900/50 pointer-events-none rounded-t" />

                <div className="relative w-full h-full flex flex-col justify-between z-10 py-1 sm:py-2">
                  
                  {/* TOP SIDE: Team Blue (Claros) */}
                  <div className="flex-1 flex flex-col justify-around py-1">
                    {/* Row 1: GK & Defenders (near top goal) */}
                    <div className="flex flex-row justify-around items-center w-full px-1">
                      <PlayerBubble 
                        player={teamBlue[1]} 
                        slotNum={3} 
                        teamColor="blue" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      <PlayerBubble 
                        player={teamBlue[0]} 
                        slotNum={1} 
                        teamColor="blue" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      <PlayerBubble 
                        player={teamBlue[2]} 
                        slotNum={5} 
                        teamColor="blue" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                    </div>

                    {/* Row 2: Midfielders / Forwards */}
                    <div className="flex flex-row justify-around items-center w-full px-4">
                      <PlayerBubble 
                        player={teamBlue[3]} 
                        slotNum={7} 
                        teamColor="blue" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      {is6v6 ? (
                        <>
                          <PlayerBubble 
                            player={teamBlue[4]} 
                            slotNum={9} 
                            teamColor="blue" 
                            onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                            onLeave={handleSignOut} 
                          />
                          <PlayerBubble 
                            player={teamBlue[5]} 
                            slotNum={11} 
                            teamColor="blue" 
                            onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                            onLeave={handleSignOut} 
                          />
                        </>
                      ) : (
                        <PlayerBubble 
                          player={teamBlue[4]} 
                          slotNum={9} 
                          teamColor="blue" 
                          onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                          onLeave={handleSignOut} 
                        />
                      )}
                    </div>
                  </div>

                  {/* BOTTOM SIDE: Team Red (Oscuros) */}
                  <div className="flex-1 flex flex-col justify-around py-1">
                    {/* Row 3: Midfielders / Forwards */}
                    <div className="flex flex-row justify-around items-center w-full px-4">
                      <PlayerBubble 
                        player={teamRed[3]} 
                        slotNum={8} 
                        teamColor="red" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      {is6v6 ? (
                        <>
                          <PlayerBubble 
                            player={teamRed[4]} 
                            slotNum={10} 
                            teamColor="red" 
                            onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                            onLeave={handleSignOut} 
                          />
                          <PlayerBubble 
                            player={teamRed[5]} 
                            slotNum={12} 
                            teamColor="red" 
                            onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                            onLeave={handleSignOut} 
                          />
                        </>
                      ) : (
                        <PlayerBubble 
                          player={teamRed[4]} 
                          slotNum={10} 
                          teamColor="red" 
                          onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                          onLeave={handleSignOut} 
                        />
                      )}
                    </div>

                    {/* Row 4: GK & Defenders (near bottom goal) */}
                    <div className="flex flex-row justify-around items-center w-full px-1">
                      <PlayerBubble 
                        player={teamRed[1]} 
                        slotNum={4} 
                        teamColor="red" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      <PlayerBubble 
                        player={teamRed[0]} 
                        slotNum={2} 
                        teamColor="red" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                      <PlayerBubble 
                        player={teamRed[2]} 
                        slotNum={6} 
                        teamColor="red" 
                        onJoin={() => handleSignUp(savedName || prompt("Ingresa tu nombre:") || "")}
                        onLeave={handleSignOut} 
                      />
                    </div>
                  </div>

                </div>

                {/* Small indicator tip */}
                <div className="absolute bottom-1 right-1.5 text-[8.5px] text-white/50 bg-slate-950/40 px-1.5 py-0.5 rounded pointer-events-none">
                  Luminosidad: Verde = Confirmado, Azul = Registrado
                </div>
              </div>
            </div>

            {/* MANUAL TEAM REORGANIZER CONTROL ROOM */}
            {isEveryoneConfirmed && (
              <div className="bg-slate-800/90 border border-emerald-500/30 rounded-3xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden" id="team-builder-card">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
                
                <div className="flex flex-col gap-1.5 border-b border-slate-700/50 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-emerald-400 animate-spin" />
                      Creador de Equipos Activado
                    </span>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={handleRandomizeTeams}
                          className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                          title="Distribuir de forma totalmente aleatoria"
                        >
                          🎲 Sortear Equipos
                        </button>
                        <button
                          onClick={handleResetTeams}
                          className="text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-700/60 hover:text-white px-2 py-1 rounded-xl transition-all cursor-pointer active:scale-95"
                          title="Restaurar al orden de inscripción automático"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <h4 className="font-extrabold text-sm text-white mt-1">
                    Distribución Manual de los Equipos
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    ¡Todos los jugadores han verificado su asistencia (Verdes)! {isAdmin ? "Arrastra y suelta los nombres entre equipos o presiona los botones para equilibrar el partido a tu gusto." : "Visualiza los equipos elegidos. Solo los Organizadores pueden iniciar sesión para editar o sortear la distribución."}
                  </p>
                </div>

                {/* Inline admin login / status banner */}
                {!isAdmin ? (
                  <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <span className="text-lg">🔒</span>
                      <div>
                        <h5 className="font-bold text-xs text-slate-200">Solo Organizadores</h5>
                        <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">Debes iniciar sesión para editar, mezclar o arrastrar los equipos.</p>
                      </div>
                    </div>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.elements.namedItem("team_admin_pass") as HTMLInputElement;
                        if (input.value === "Barceloneta") {
                          setIsAdmin(true);
                          localStorage.setItem("football_is_admin", "true");
                          alert("¡Acceso de Organizador concedido! Ya puedes editar los equipos.");
                        } else {
                          alert("Contraseña incorrecta. Inténtalo de nuevo.");
                        }
                      }} 
                      className="flex items-center gap-1.5 w-full sm:w-auto"
                    >
                      <input 
                        name="team_admin_pass"
                        type="password"
                        placeholder="Contraseña..."
                        className="flex-1 sm:w-36 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white font-mono"
                      />
                      <button 
                        type="submit"
                        className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                      >
                        Entrar
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-2xl">
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sesión de Organizador Activa — Puedes arrastrar nombres o usar botones de control
                    </span>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAdmin(false);
                        localStorage.removeItem("football_is_admin");
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer bg-transparent border-none"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                {/* Two side-by-side dropping targets */}
                <div className="grid grid-cols-2 gap-3.5">
                  
                  {/* COLUMN A: EQUIPO CLARO */}
                  <div 
                    id="team-zone-a"
                    onDragOver={(e) => {
                      if (isAdmin) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (isAdmin && draggedPlayerId) {
                        handleAssignPlayerTeam(draggedPlayerId, "A");
                        setDraggedPlayerId(null);
                      }
                    }}
                    className={`bg-slate-900/90 border border-slate-700/50 rounded-2xl p-3 flex flex-col gap-2 min-h-[220px] transition-colors duration-250 ${isAdmin ? "hover:bg-slate-900" : ""}`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
                        Equipo Claro
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                        {teamAPlayers.length}
                      </span>
                    </div>

                    {teamAPlayers.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-center p-3 text-[10px] text-slate-500 leading-normal">
                        {isAdmin ? "Arrastra un jugador aquí" : "Sin jugadores asignados"}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 flex-1 justify-start">
                        {teamAPlayers.map((p) => (
                          <div
                            key={p.id}
                            draggable={isAdmin}
                            onDragStart={() => {
                              if (isAdmin) setDraggedPlayerId(p.id);
                            }}
                            className={`bg-slate-800 border border-slate-700/60 p-2 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between shadow-sm transition-all select-none ${
                              isAdmin 
                                ? "hover:bg-slate-750 cursor-grab active:cursor-grabbing hover:border-emerald-500/20" 
                                : "cursor-default"
                            }`}
                          >
                            <span className="truncate max-w-[90px]">{p.name.split(" ")[0]} {p.name.split(" ")[1]?.charAt(0) || ""}.</span>
                            
                            {/* Tap transfer option for mobile friendliness */}
                            {isAdmin && (
                              <button
                                onClick={() => handleAssignPlayerTeam(p.id, "B")}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 p-1 bg-slate-900 rounded-lg border border-slate-700/40 cursor-pointer active:scale-95"
                                title="Mover a Equipo Oscuro"
                              >
                                ➡️
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COLUMN B: EQUIPO OSCURO */}
                  <div 
                    id="team-zone-b"
                    onDragOver={(e) => {
                      if (isAdmin) e.preventDefault();
                    }}
                    onDrop={() => {
                      if (isAdmin && draggedPlayerId) {
                        handleAssignPlayerTeam(draggedPlayerId, "B");
                        setDraggedPlayerId(null);
                      }
                    }}
                    className={`bg-slate-900/90 border border-slate-700/50 rounded-2xl p-3 flex flex-col gap-2 min-h-[220px] transition-colors duration-250 ${isAdmin ? "hover:bg-slate-900" : ""}`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-950" />
                        Equipo Oscuro
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                        {teamBPlayers.length}
                      </span>
                    </div>

                    {teamBPlayers.length === 0 ? (
                      <div className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-center p-3 text-[10px] text-slate-500 leading-normal">
                        {isAdmin ? "Arrastra un jugador aquí" : "Sin jugadores asignados"}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5 flex-1 justify-start">
                        {teamBPlayers.map((p) => (
                          <div
                            key={p.id}
                            draggable={isAdmin}
                            onDragStart={() => {
                              if (isAdmin) setDraggedPlayerId(p.id);
                            }}
                            className={`bg-slate-800 border border-slate-700/60 p-2 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-between shadow-sm transition-all select-none ${
                              isAdmin 
                                ? "hover:bg-slate-750 cursor-grab active:cursor-grabbing hover:border-emerald-500/20" 
                                : "cursor-default"
                            }`}
                          >
                            {/* Tap transfer option for mobile friendliness */}
                            {isAdmin && (
                              <button
                                onClick={() => handleAssignPlayerTeam(p.id, "A")}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 p-1 bg-slate-900 rounded-lg border border-slate-700/40 cursor-pointer active:scale-95"
                                title="Mover a Equipo Claro"
                              >
                                ⬅️
                              </button>
                            )}

                            <span className="truncate max-w-[90px] text-right">{p.name.split(" ")[0]} {p.name.split(" ")[1]?.charAt(0) || ""}.</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Touch/Drag hint */}
                <p className="text-[10px] text-center text-slate-500">
                  {isAdmin 
                    ? "💡 Consejo: Puedes arrastrar los nombres de un equipo a otro en computadora, o presionar las flechas (⬅️/➡️) en pantallas táctiles para un movimiento al instante." 
                    : "💡 Los Organizadores pueden iniciar sesión para arrastrar y soltar nombres o balancear los equipos libremente."}
                </p>
              </div>
            )}

            {/* FULL PLAYER LISTING & ORDER CARDS WITH CONFIRMATION TOGGLES */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col gap-4" id="roster-list-card">
              
              {/* Main Lineup list */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <CheckCircle size={16} className="text-emerald-400" />
                    Lista de Convocados ({mainPlayers.length} / {maxPlayers})
                  </h4>
                  <span className="text-xs text-slate-400">Grupo principal</span>
                </div>

                {mainPlayers.length === 0 ? (
                  <div className="text-center py-6 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                    Nadie inscrito todavía. ¡Sé el primero!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {mainPlayers.map((player, index) => {
                      const isBlueTeam = index % 2 === 0;
                      return (
                        <div 
                          key={player.id} 
                          className={`flex flex-col bg-slate-900 rounded-2xl p-3 border transition-all ${
                            player.isConfirmed 
                              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-slate-900" 
                              : "border-sky-500/20 bg-gradient-to-r from-sky-950/10 to-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Index & Team Jersey styling indicator */}
                              <div className={`p-2 rounded-lg font-bold text-xs select-none w-8 h-8 flex items-center justify-center border ${
                                player.isConfirmed
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                                  : "bg-sky-500/10 text-sky-400 border-sky-500/40"
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                {/* Name coloring logic: green if confirmed, blue if just registered (not confirmed) */}
                                <p className={`font-extrabold text-sm transition-colors duration-200 ${
                                  player.isConfirmed ? "text-emerald-400" : "text-sky-400"
                                }`}>
                                  {player.name}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                  {isBlueTeam ? "Equipo Claro" : "Equipo Oscuro"} • Registrado a las {new Date(player.signedUpAt).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Confirmation label banner / pill */}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                player.isConfirmed 
                                  ? "bg-emerald-500/20 text-emerald-300" 
                                  : "bg-sky-500/10 text-sky-400"
                              }`}>
                                {player.isConfirmed ? "Confirmado" : "Inscrito"}
                              </span>

                              <button
                                onClick={() => handleSignOut(player.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer active:scale-90"
                                title="Eliminar de la lista"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Attendance confirmation toggle (Only displays 48 hours prior to starting) */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            {canConfirmNow ? (
                              <label className="flex items-center gap-2 cursor-pointer w-full group select-none">
                                <input
                                  type="checkbox"
                                  checked={player.isConfirmed}
                                  onChange={() => handleToggleConfirmet(player.id, player.isConfirmed)}
                                  className="w-4.5 h-4.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/40 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                                  Confirmar mi asistencia (Confirmar)
                                </span>
                              </label>
                            ) : (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span className="text-amber-500">⏳</span> Las confirmaciones se habilitan en las últimas 48 horas del partido.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reserves / Overflow Queue */}
              <div className="border-t border-slate-700/50 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-sm text-indigo-400 flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-indigo-400 animate-pulse" />
                    Lista de Reservas ({reserves.length})
                  </h4>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Suplente
                  </span>
                </div>

                {reserves.length === 0 ? (
                  <div className="text-center py-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs">
                    No hay jugadores suplentes. Si la convocatoria principal se llena, los siguientes aparecerán aquí.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {reserves.map((player, rIdx) => {
                      return (
                        <div 
                          key={player.id}
                          className={`flex flex-col bg-slate-900 rounded-2xl p-3 border transition-all ${
                            player.isConfirmed 
                              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/10 to-slate-900" 
                              : "border-sky-500/10 bg-gradient-to-r from-sky-950/10 to-slate-900"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-950/80 border border-indigo-500/30 p-2 rounded-lg font-mono text-[10px] font-extrabold text-indigo-400 w-8 h-8 flex items-center justify-center">
                                R{rIdx + 1}
                              </div>
                              <div>
                                <p className={`font-extrabold text-sm transition-colors duration-200 ${
                                  player.isConfirmed ? "text-emerald-400" : "text-sky-400"
                                }`}>
                                  {player.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">Lista de espera</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                player.isConfirmed 
                                  ? "bg-emerald-500/20 text-emerald-300" 
                                  : "bg-sky-500/10 text-sky-400"
                              }`}>
                                {player.isConfirmed ? "Conf." : "Inscrito"}
                              </span>
                              
                              <button
                                onClick={() => handleSignOut(player.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Attendance confirmation toggle for reserve list as well */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            {canConfirmNow ? (
                              <label className="flex items-center gap-2 cursor-pointer w-full group select-none">
                                <input
                                  type="checkbox"
                                  checked={player.isConfirmed}
                                  onChange={() => handleToggleConfirmet(player.id, player.isConfirmed)}
                                  className="w-4.5 h-4.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500/40 focus:ring-2 focus:ring-offset-0 transition-all cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                                  Confirmar asistencia reserva
                                </span>
                              </label>
                            ) : (
                              <div className="text-[10px] text-slate-500">
                                ⏳ Confirmación se abre 48 horas (2 días) antes del partido.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* MODAL 1: SCHEDULE NEW MATCH & GENERAL SETTINGS */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {!isAdmin ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-4 animate-bounce text-2xl">
                    🔐
                  </div>
                  <h3 className="font-extrabold text-lg text-white">Acceso de Organizador</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-[240px] leading-relaxed">
                    Introduzca la contraseña de organizador para poder editar, suspender, reactivar o crear convocatorias.
                  </p>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const inputPass = (e.currentTarget.elements.namedItem("admin_pass") as HTMLInputElement).value;
                    if (inputPass === "Barceloneta") {
                      setIsAdmin(true);
                      localStorage.setItem("football_is_admin", "true");
                    } else {
                      alert("Contraseña incorrecta. Solo los administradores pueden realizar cambios.");
                    }
                  }} className="w-full mt-5 flex flex-col gap-3">
                    <input
                      name="admin_pass"
                      type="password"
                      placeholder="Contraseña (ej. Barceloneta)..."
                      className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-white font-mono"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                    >
                      Verificar Contraseña
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Sliders size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">
                        {adminTab === 'edit' && "Editar Partido"}
                        {adminTab === 'new' && "Programar Nuevo"}
                        {adminTab === 'cancel' && (currentMatch?.isCanceled ? "Restaurar Partido" : "Suspender Partido")}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {adminTab === 'edit' && "Modificar los detalles del partido actual"}
                        {adminTab === 'new' && "Comenzar una nueva convocatoria"}
                        {adminTab === 'cancel' && (currentMatch?.isCanceled ? "Reactivar la convocatoria suspendida" : "Suspender temporalmente el partido")}
                      </p>
                    </div>
                  </div>

                  {/* Manual match completion for administrators */}
                  {currentMatch && (
                    <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-base select-none">🏆</span>
                        <div>
                          <h4 className="font-bold text-xs text-white">¿El partido ya se ha jugado?</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                            Uložit zápas do historie a otevřít novou identickou soupisku pro příští týden (+7 dní).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCompleteMatch}
                        disabled={loading}
                        className="w-full py-2.5 mt-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        🏆 Zápas odehrán
                      </button>
                    </div>
                  )}

                  {/* Tab Selection (only visible if there is an active match to edit or suspend) */}
                  {currentMatch && (
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold mb-5">
                      <button
                        type="button"
                        onClick={() => setAdminTab('edit')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          adminTab === 'edit' ? "bg-slate-800 text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('new')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          adminTab === 'new' ? "bg-slate-800 text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Nuevo
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('cancel')}
                        className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                          adminTab === 'cancel' ? "bg-slate-800 text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Suspender
                      </button>
                    </div>
                  )}

                  {/* Tab 1: EDIT MATCH DETAILS */}
                  {adminTab === 'edit' && (
                    <form onSubmit={handleEditMatch} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Fecha del partido
                        </label>
                        <input
                          type="date"
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Hora de inicio
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. 18:00"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Formato de juego
                          </label>
                          <select
                            value={newMaxPlayers}
                            onChange={(e) => setNewMaxPlayers(Number(e.target.value))}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          >
                            <option value={10}>5 vs 5 (10 jugadores)</option>
                            <option value={12}>6 vs 6 (12 jugadores)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Completo / Recinto / Estadio
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Pg. de Salvat Papasseit, 11, Ciutat Vella, 08003 Barcelona"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          💡 La dirección se vinculará directamente a Google Maps.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nombre personalizado (Ej. Barceloneta Futbol)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Barceloneta Futbol"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nota / Comentario / Pago (Ej. 3 EUR)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 3 EUR platba"
                            value={newSubtitle}
                            onChange={(e) => setNewSubtitle(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Avatar del partido (Imagen PNG/JPG)
                        </label>
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {newAvatarUrl ? (
                              <img src={newAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">⚽</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              id="avatar-file-upload-edit"
                            />
                            <label
                              htmlFor="avatar-file-upload-edit"
                              className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-bold rounded-lg cursor-pointer transition-all select-none border border-slate-700 active:scale-95"
                            >
                              Subir imagen
                            </label>
                            {newAvatarUrl && (
                              <button
                                type="button"
                                onClick={() => setNewAvatarUrl("")}
                                className="ml-2 px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold rounded-lg cursor-pointer transition-all border border-rose-500/20"
                              >
                                Eliminar
                              </button>
                            )}
                            <p className="text-[9px] text-slate-500 mt-1">Sube un archivo pequeño (PNG/JPG)</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowConfigModal(false)}
                          className="flex-1 px-4 py-3 border border-slate-800 font-bold hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
                        >
                          Cerrar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-slate-950 rounded-xl text-sm transition-all shadow-lg cursor-pointer"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 2: CREATE NEW MATCH */}
                  {adminTab === 'new' && (
                    <form onSubmit={handleCreateNewMatch} className="flex flex-col gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Fecha del partido
                        </label>
                        <input
                          type="date"
                          required
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Hora de inicio
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. 18:00"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Formato de juego
                          </label>
                          <select
                            value={newMaxPlayers}
                            onChange={(e) => setNewMaxPlayers(Number(e.target.value))}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          >
                            <option value={10}>5 vs 5 (10 jugadores)</option>
                            <option value={12}>6 vs 6 (12 jugadores)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Completo / Recinto / Estadio
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Pg. de Salvat Papasseit, 11, Ciutat Vella, 08003 Barcelona"
                          value={newLocation}
                          onChange={(e) => setNewLocation(e.target.value)}
                          className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          💡 La dirección se vinculará directamente a Google Maps.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nombre personalizado (Ej. Barceloneta Futbol)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Barceloneta Futbol"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nota / Comentario / Pago (Ej. 3 EUR)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. 3 EUR platba"
                            value={newSubtitle}
                            onChange={(e) => setNewSubtitle(e.target.value)}
                            className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Avatar del partido (Imagen PNG/JPG)
                        </label>
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            {newAvatarUrl ? (
                              <img src={newAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">⚽</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              id="avatar-file-upload-new"
                            />
                            <label
                              htmlFor="avatar-file-upload-new"
                              className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-bold rounded-lg cursor-pointer transition-all select-none border border-slate-700 active:scale-95"
                            >
                              Subir imagen
                            </label>
                            {newAvatarUrl && (
                              <button
                                type="button"
                                onClick={() => setNewAvatarUrl("")}
                                className="ml-2 px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold rounded-lg cursor-pointer transition-all border border-rose-500/20"
                              >
                                Eliminar
                              </button>
                            )}
                            <p className="text-[9px] text-slate-500 mt-1">Sube un archivo pequeño (PNG/JPG)</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
                        ⚠️ Al programar un nuevo partido, se archivará el proceso previo (si disponías de participantes) al historial. Los jugadores iniciarán con listas vacías.
                      </div>

                      <div className="flex gap-2.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setShowConfigModal(false)}
                          className="flex-1 px-4 py-3 border border-slate-800 font-bold hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-slate-950 rounded-xl text-sm transition-all shadow-lg cursor-pointer"
                        >
                          Crear Partido
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Tab 3: SUSPEND / RESTORE MATCH */}
                  {adminTab === 'cancel' && currentMatch && (
                    <div className="flex flex-col gap-4">
                      {!currentMatch.isCanceled ? (
                        <form onSubmit={handleCancelMatch} className="flex flex-col gap-4">
                          <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-2xl text-xs text-rose-300 leading-relaxed">
                            ⚠️ Al suspender el partido, se notificará de forma visual a todos los inscritos en la pantalla principal. Se bloquearán temporalmente las nuevas inscripciones. Puedes reactivarlo en cualquier momento.
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Motivo de la suspensión
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Ej. Pronóstico de lluvia / Falta de jugadores"
                              value={cancelReason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-rose-500 text-white"
                            />
                          </div>

                          <div className="flex gap-2.5 mt-2">
                            <button
                              type="button"
                              onClick={() => setShowConfigModal(false)}
                              className="flex-1 px-4 py-3 border border-slate-800 font-bold hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
                            >
                              Cerrar
                            </button>
                            <button
                              type="submit"
                              disabled={loading}
                              className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 font-extrabold text-white rounded-xl text-sm transition-all shadow-lg cursor-pointer"
                            >
                              Suspender Partido
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-300 leading-relaxed">
                            🎉 El partido se encuentra actualmente **suspendido** por el siguiente motivo:
                            <p className="mt-2 text-white font-bold p-2 bg-slate-950/50 rounded-xl border border-slate-800">
                              "{currentMatch.cancellationReason || "No especificado"}"
                            </p>
                            ¿Deseas restaurarlo y abrir nuevamente la convocatoria?
                          </div>

                          <div className="flex gap-2.5 mt-2">
                            <button
                              type="button"
                              onClick={() => setShowConfigModal(false)}
                              className="flex-1 px-4 py-3 border border-slate-800 font-bold hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all cursor-pointer"
                            >
                              Cerrar
                            </button>
                            <button
                              type="button"
                              onClick={handleRestoreMatch}
                              disabled={loading}
                              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-slate-950 rounded-xl text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle size={16} /> Restaurar Partido
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ARCHIVED GAMES HISTORY */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm max-h-[85vh] p-6 shadow-2xl relative flex flex-col"
            >
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-5 flex-shrink-0">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Partidos Anteriores</h3>
                  <p className="text-xs text-slate-400 font-medium">Historial y alineación jugada</p>
                </div>
              </div>

              {/* Scrollable list content */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                {state.history.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    ⚠️ No hay registros históricos guardados todavía.
                  </div>
                ) : (
                  state.history.map((pastMatch) => {
                    return (
                      <div key={pastMatch.id} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col gap-2.5">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1 pr-2">
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                              ARCHIVADO
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-100 mt-1 flex items-center gap-1.5 truncate">
                              <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800">
                                {pastMatch.avatarUrl ? (
                                  <img src={pastMatch.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-xs select-none">⚽</span>
                                )}
                              </div>
                              <span className="truncate">{pastMatch.title || (pastMatch.maxPlayers === 12 ? "Fútbol 6 vs 6" : "Fútbol 5 vs 5")}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap gap-1 items-center">
                              <span>{formatSpanishDate(pastMatch.date)}</span>
                              {pastMatch.subtitle && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-amber-400 font-medium truncate max-w-[180px]">{pastMatch.subtitle}</span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full font-bold shrink-0">
                            {pastMatch.maxPlayers === 10 ? "5v5" : "6v6"}
                          </span>
                        </div>

                        <div className="text-xs text-slate-400">
                          📍{' '}
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pastMatch.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1 transition-colors"
                            title="Ver en Google Maps"
                          >
                            <span>{pastMatch.location}</span>
                            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded font-bold">Maps ↗</span>
                          </a>
                        </div>

                        <div className="mt-1 border-t border-slate-800/60 pt-2.5">
                          <p className="text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                            Alineación disputada ({pastMatch.players.length} jugadores):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {pastMatch.players.map((p, idx) => (
                              <span 
                                key={p.id} 
                                className={`text-[10px] border px-2 py-1 rounded ${
                                  p.isConfirmed 
                                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-800" 
                                    : "bg-slate-900 text-slate-300 border-slate-800"
                                }`}
                              >
                                {idx + 1}. {p.name}
                              </span>
                            ))}
                            {pastMatch.players.length === 0 && (
                              <span className="text-[10px] text-slate-600">Nadie inscrito.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex-shrink-0">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-3 bg-slate-850 hover:bg-slate-800 active:scale-95 font-bold rounded-xl text-xs transition-all text-slate-300 cursor-pointer"
                >
                  Cerrar Historial
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Reusable Football Kit component
function FootballKit({ isDark, slotNum }: { isDark: boolean; slotNum: number }) {
  const shirtFill = isDark ? "#000000" : "#ffffff"; // Pure black or pure white
  const shortsFill = isDark ? "#000000" : "#ffffff";
  const strokeColor = isDark ? "#ffffff" : "#000000"; // White outline for black jersey, black outline for white jersey
  const detailsColor = isDark ? "#ffffff" : "#cccccc"; // White sleeve stripes / details for black jersey, light gray for white
  const numberColor = isDark ? "#ffffff" : "#000000"; // White jersey number for black jersey, black/dark for white
  
  return (
    <svg 
      viewBox="0 0 64 64" 
      className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SHIRT/JERSEY */}
      {/* Left sleeve */}
      <path
        d="M 18,14 L 6,24 L 12,30 L 20,24 Z"
        fill={shirtFill}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Right sleeve */}
      <path
        d="M 46,14 L 58,24 L 52,30 L 44,24 Z"
        fill={shirtFill}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      
      {/* Shirt Torso */}
      <path
        d="M 20,14 L 26,10 A 6,6 0 0,0 38,10 L 44,14 L 44,38 L 20,38 Z"
        fill={shirtFill}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      
      {/* Sleeve stripes / details */}
      <path d="M 8,22 L 14,28" stroke={detailsColor} strokeWidth="2" />
      <path d="M 56,22 L 50,28" stroke={detailsColor} strokeWidth="2" />
      
      {/* Collar trim */}
      <path d="M 26,10 A 6,6 0 0,0 38,10" fill="none" stroke={detailsColor} strokeWidth="2" />

      {/* SHORTS */}
      {/* Shorts main body */}
      <path
        d="M 22,40 L 42,40 L 42,53 L 33,53 L 32,47 L 31,53 L 22,53 Z"
        fill={shortsFill}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Waistband line */}
      <line x1="22" y1="42" x2="42" y2="42" stroke={strokeColor} strokeWidth="2.5" />
      
      {/* Side stripes on shorts */}
      <line x1="23.5" y1="42" x2="23.5" y2="52" stroke={detailsColor} strokeWidth="1.5" />
      <line x1="40.5" y1="42" x2="40.5" y2="52" stroke={detailsColor} strokeWidth="1.5" />

      {/* Jersey Number printed on the shirt */}
      <text
        x="32"
        y="28"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={numberColor}
        fontSize="14"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        {slotNum}
      </text>
    </svg>
  );
}

// Reusable Football Kit Placeholder component
function FootballKitPlaceholder({ isDark }: { isDark: boolean }) {
  const strokeColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const plusColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  
  return (
    <svg 
      viewBox="0 0 64 64" 
      className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-all"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SHIRT/JERSEY Outline */}
      <path
        d="M 18,14 L 6,24 L 12,30 L 20,24 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeDasharray="3,3"
        strokeLinejoin="round"
      />
      <path
        d="M 46,14 L 58,24 L 52,30 L 44,24 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeDasharray="3,3"
        strokeLinejoin="round"
      />
      <path
        d="M 20,14 L 26,10 A 6,6 0 0,0 38,10 L 44,14 L 44,38 L 20,38 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeDasharray="3,3"
        strokeLinejoin="round"
      />
      
      {/* SHORTS Outline */}
      <path
        d="M 22,40 L 42,40 L 42,53 L 33,53 L 32,47 L 31,53 L 22,53 Z"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeDasharray="3,3"
        strokeLinejoin="round"
      />

      {/* Plus sign */}
      <path
        d="M 28,26 L 36,26 M 32,22 L 32,30"
        stroke={plusColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Reusable slot bubble component
interface PlayerBubbleProps {
  player: Player | null;
  slotNum: number;
  teamColor: "blue" | "red";
  onJoin: () => void;
  onLeave: (id: string) => void;
}

function PlayerBubble({ player, slotNum, teamColor, onJoin, onLeave }: PlayerBubbleProps) {
  const isDark = teamColor === "red"; // Left side (blue) is White/Claros, Right side (red) is Black/Oscuros
  
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 w-[46px] min-[360px]:w-[54px] min-[400px]:w-[64px] sm:w-[76px] md:w-[84px]">
      
      {player ? (
        // Occupied Slot
        <button
          onClick={() => onLeave(player.id)}
          className="relative group transition-all transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
          title={`Dar de baja a ${player.name}`}
        >
          {/* Football Kit component (Left side is Claros (White), Right side is Oscuros (Black)) */}
          <FootballKit isDark={isDark} slotNum={slotNum} />

          {/* Badge indicator on the kit (green dot/ring if confirmed, sky blue if registered) */}
          <div className="absolute -top-1 -right-0.5 sm:-right-1">
            <span className="flex h-3 w-3 sm:h-4 sm:w-4 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${player.isConfirmed ? "bg-emerald-400" : "bg-sky-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-slate-900 ${player.isConfirmed ? "bg-emerald-500" : "bg-sky-500"}`}></span>
            </span>
          </div>

          {/* Hover overlay text "Baja" */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-950/85 rounded-xl text-[7px] sm:text-[10px] text-rose-400 font-extrabold shadow-md border border-rose-500/30 px-1 py-0.5">
            BAJA
          </div>
        </button>
      ) : (
        // Free Slot
        <button
          onClick={onJoin}
          className="relative group transition-all transform hover:scale-115 active:scale-90 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
          title="Inscribirme en este puesto"
        >
          <FootballKitPlaceholder isDark={isDark} />
        </button>
      )}

      {/* Player display label text - larger, bold font, solid bright background for highest legibility and contrast */}
      <span 
        className={`text-[9px] min-[360px]:text-[11px] min-[400px]:text-[12px] sm:text-[13px] md:text-[14px] font-black max-w-[46px] min-[360px]:max-w-[54px] min-[400px]:max-w-[64px] sm:max-w-[76px] md:max-w-[84px] truncate text-center px-1.5 py-0.5 rounded shadow-md border uppercase tracking-wide ${
          player 
            ? (player.isConfirmed 
                ? "text-slate-950 bg-emerald-400 border-emerald-300 font-extrabold" 
                : "text-slate-950 bg-sky-300 border-sky-200 font-extrabold") 
            : "text-white/60 bg-slate-900/40 border-transparent font-medium"
        }`}
      >
        {player ? player.name.split(" ")[0] : "Vacío"}
      </span>

    </div>
  );
}
