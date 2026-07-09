import React from "react";
import { X, History as HistoryIcon, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Match } from "../../types";

interface MatchSettingsProps {
  showConfigModal: boolean;
  setShowConfigModal: (show: boolean) => void;
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
  currentMatch: Match | null;
  loading: boolean;
  history: Match[];
  adminTab: 'edit' | 'new' | 'cancel';
  setAdminTab: (tab: 'edit' | 'new' | 'cancel') => void;
  newDate: string;
  setNewDate: (date: string) => void;
  newTime: string;
  setNewTime: (time: string) => void;
  newMaxPlayers: number;
  setNewMaxPlayers: (max: number) => void;
  newLocation: string;
  setNewLocation: (loc: string) => void;
  newTitle: string;
  setNewTitle: (title: string) => void;
  newSubtitle: string;
  setNewSubtitle: (sub: string) => void;
  newAvatarUrl: string;
  setNewAvatarUrl: (url: string) => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateNewMatch: (e: React.FormEvent) => void;
  handleEditMatch: (e: React.FormEvent) => void;
  handleCancelMatch: (e: React.FormEvent) => void;
  handleRestoreMatch: () => void;
  handleCompleteMatch: () => void;
  formatSpanishDate: (dateStr: string) => string;
}

export default function MatchSettings({
  showConfigModal,
  setShowConfigModal,
  showHistoryModal,
  setShowHistoryModal,
  isAdmin,
  setIsAdmin,
  currentMatch,
  loading,
  history,
  adminTab,
  setAdminTab,
  newDate,
  setNewDate,
  newTime,
  setNewTime,
  newMaxPlayers,
  setNewMaxPlayers,
  newLocation,
  setNewLocation,
  newTitle,
  setNewTitle,
  newSubtitle,
  setNewSubtitle,
  newAvatarUrl,
  setNewAvatarUrl,
  cancelReason,
  setCancelReason,
  handleAvatarChange,
  handleCreateNewMatch,
  handleEditMatch,
  handleCancelMatch,
  handleRestoreMatch,
  handleCompleteMatch,
  formatSpanishDate
}: MatchSettingsProps) {
  return (
    <>
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

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const inputPass = (e.currentTarget.elements.namedItem("admin_pass") as HTMLInputElement).value;
                      if (inputPass === "Barceloneta") {
                        setIsAdmin(true);
                        localStorage.setItem("football_is_admin", "true");
                      } else {
                        alert("Contraseña incorrecta. Solo los administradores pueden realizar cambios.");
                      }
                    }}
                    className="w-full mt-5 flex flex-col gap-3"
                  >
                    <input
                      name="admin_pass"
                      type="password"
                      placeholder="Contraseña (ej. Barceloneta)..."
                      className="w-full px-4 py-3 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 text-center text-white font-mono"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
                    >
                      Verificar Identidad
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      ⚙️
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-white">Configuración del Partido</h3>
                      <p className="text-xs text-slate-400 font-medium">Controles del Organizador</p>
                    </div>
                  </div>

                  {currentMatch && (
                    <div className="mb-4 bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 flex flex-col gap-1.5">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        🏆 Finalizar Convocatoria:
                      </div>
                      <button
                        type="button"
                        onClick={handleCompleteMatch}
                        disabled={loading}
                        className="w-full py-2.5 mt-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        🏆 Partido jugado
                      </button>
                    </div>
                  )}

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

                      <div className="grid grid-cols-1 gap-3">
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
                            placeholder="Ej. Pago de 3 EUR"
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
                              className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-200 font-bold rounded-lg cursor-pointer transition-all select-none border border-slate-700 active:scale-95"
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

                      <div className="grid grid-cols-1 gap-3">
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
                            placeholder="Ej. Pago de 3 EUR"
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
                              className="inline-block px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-[11px] text-slate-200 font-bold rounded-lg cursor-pointer transition-all select-none border border-slate-700 active:scale-95"
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
                  <HistoryIcon size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Partidos Anteriores</h3>
                  <p className="text-xs text-slate-400 font-medium">Historial y alineación jugada</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    ⚠️ No hay registros históricos guardados todavía.
                  </div>
                ) : (
                  history.map((pastMatch) => {
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
    </>
  );
}
