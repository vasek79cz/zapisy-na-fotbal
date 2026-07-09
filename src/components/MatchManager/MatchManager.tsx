import React, { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  Clock,
  Plus,
  RotateCw,
  Sliders,
  History as HistoryIcon,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Match, Player, SoccerAppState } from "../../types";
import PlayerRegistration from "./PlayerRegistration";
import PlayerList from "./PlayerList";
import TeamGenerator from "./TeamGenerator";
import MatchSettings from "./MatchSettings";

export default function MatchManager() {
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

  // Pre-fill inputs with current match details when configuration modal opens
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
  }, [showConfigModal, state.currentMatch]);

  // Confetti / Celebration Trigger
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Drag and Drop State for manual teams
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);

  // Helper for making robust API requests
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
      setError(err.message || "No se pudo conectar con el servidor.");
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
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
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
  const handleToggleConfirmed = async (playerId: string, currentStatus: boolean) => {
    const playerToToggle = state.currentMatch?.players.find(p => p.id === playerId);
    if (!playerToToggle) return;

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
          ? [{ ...prev.currentMatch, isCompleted: true }, ...prev.history]
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

  const allRegistered = currentMatch?.players || [];
  const mainPlayersLimit = maxPlayers;

  const mainPlayers = allRegistered.slice(0, mainPlayersLimit);
  const reserves = allRegistered.slice(mainPlayersLimit);

  const spotsLeft = Math.max(0, maxPlayers - mainPlayers.length);
  const percentage = Math.min(100, Math.floor((mainPlayers.length / maxPlayers) * 100));

  const canConfirmNow = currentMatch ? isWithin48HoursOfMatch(currentMatch.date, currentMatch.time) : false;

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
  }, [newDate]);

  return (
    <div id="full-app-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center pb-12 font-sans overflow-x-hidden antialiased">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-emerald-950/40 to-slate-900 pointer-events-none z-0" />

      <div className="w-full max-w-md px-4 pt-4 z-10 flex flex-col gap-4">
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
              <HistoryIcon size={18} />
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

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex gap-3 text-sm text-rose-300 animate-pulse" id="error-banner">
            <div className="font-bold">⚠️</div>
            <div>{error}</div>
          </div>
        )}

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
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl relative overflow-hidden" id="match-info-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl" />

              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${currentMatch.isCanceled
                  ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                  }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentMatch.isCanceled ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`} />
                  {currentMatch.isCanceled ? "PARTIDO SUSPENDIDO" : "Próximo Encuentro"}
                </span>

                <div className="flex items-center bg-slate-900 border border-slate-700/60 p-0.5 rounded-xl text-xs font-semibold" id="toggle-slots-container">
                  <button
                    disabled={currentMatch.isCanceled}
                    onClick={() => handleToggleConfig(10)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${!is6v6 ? "bg-emerald-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    5 vs 5
                  </button>
                  <button
                    disabled={currentMatch.isCanceled}
                    onClick={() => handleToggleConfig(12)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${is6v6 ? "bg-emerald-500 text-slate-950 font-extrabold" : "text-slate-400 hover:text-slate-200"
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

            <div className="bg-slate-800/90 border border-slate-700/85 rounded-3xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-2">
                ⚙️
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

            <PlayerRegistration
              currentMatch={currentMatch}
              signupName={signupName}
              setSignupName={setSignupName}
              handleSignUp={handleSignUp}
              savedName={savedName}
              loading={loading}
            />

            <TeamGenerator
              currentMatch={currentMatch}
              savedName={savedName}
              isAdmin={isAdmin}
              setIsAdmin={setIsAdmin}
              handleAssignPlayerTeam={handleAssignPlayerTeam}
              handleRandomizeTeams={handleRandomizeTeams}
              handleResetTeams={handleResetTeams}
              handleSignUp={handleSignUp}
              handleSignOut={handleSignOut}
              draggedPlayerId={draggedPlayerId}
              setDraggedPlayerId={setDraggedPlayerId}
            />

            <PlayerList
              mainPlayers={mainPlayers}
              reserves={reserves}
              maxPlayers={maxPlayers}
              canConfirmNow={canConfirmNow}
              handleSignOut={handleSignOut}
              handleToggleConfirmed={handleToggleConfirmed}
            />
          </div>
        )}
      </div>

      <MatchSettings
        showConfigModal={showConfigModal}
        setShowConfigModal={setShowConfigModal}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        currentMatch={currentMatch}
        loading={loading}
        history={state.history}
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        newDate={newDate}
        setNewDate={setNewDate}
        newTime={newTime}
        setNewTime={setNewTime}
        newMaxPlayers={newMaxPlayers}
        setNewMaxPlayers={setNewMaxPlayers}
        newLocation={newLocation}
        setNewLocation={setNewLocation}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newSubtitle={newSubtitle}
        setNewSubtitle={setNewSubtitle}
        newAvatarUrl={newAvatarUrl}
        setNewAvatarUrl={setNewAvatarUrl}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        handleAvatarChange={handleAvatarChange}
        handleCreateNewMatch={handleCreateNewMatch}
        handleEditMatch={handleEditMatch}
        handleCancelMatch={handleCancelMatch}
        handleRestoreMatch={handleRestoreMatch}
        handleCompleteMatch={handleCompleteMatch}
        formatSpanishDate={formatSpanishDate}
      />
    </div>
  );
}
