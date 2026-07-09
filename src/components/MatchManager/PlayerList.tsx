import React from "react";
import { CheckCircle, HelpCircle, Trash2 } from "lucide-react";
import { Player } from "../../types";

interface PlayerListProps {
  mainPlayers: Player[];
  reserves: Player[];
  maxPlayers: number;
  canConfirmNow: boolean;
  handleSignOut: (id: string) => void;
  handleToggleConfirmed: (id: string, currentStatus: boolean) => void;
}

export default function PlayerList({
  mainPlayers,
  reserves,
  maxPlayers,
  canConfirmNow,
  handleSignOut,
  handleToggleConfirmed
}: PlayerListProps) {
  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-5 shadow-xl flex flex-col gap-4" id="roster-list-card">
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
                      <div
                        className={`p-2 rounded-lg font-bold text-xs select-none w-8 h-8 flex items-center justify-center border ${
                          player.isConfirmed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                            : "bg-sky-500/10 text-sky-400 border-sky-500/40"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
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

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    {canConfirmNow ? (
                      <label className="flex items-center gap-2 cursor-pointer w-full group select-none">
                        <input
                          type="checkbox"
                          checked={player.isConfirmed}
                          onChange={() => handleToggleConfirmed(player.id, player.isConfirmed)}
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

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    {canConfirmNow ? (
                      <label className="flex items-center gap-2 cursor-pointer w-full group select-none">
                        <input
                          type="checkbox"
                          checked={player.isConfirmed}
                          onChange={() => handleToggleConfirmed(player.id, player.isConfirmed)}
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
  );
}
