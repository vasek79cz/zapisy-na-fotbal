import React from "react";
import { Sparkles } from "lucide-react";
import { Player, Match } from "../../types";

interface TeamGeneratorProps {
  currentMatch: Match | null;
  savedName: string;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
  handleAssignPlayerTeam: (playerId: string, team: "A" | "B" | null) => void;
  handleRandomizeTeams: () => void;
  handleResetTeams: () => void;
  handleSignUp: (name: string) => void;
  handleSignOut: (id: string) => void;
  draggedPlayerId: string | null;
  setDraggedPlayerId: (id: string | null) => void;
}

export default function TeamGenerator({
  currentMatch,
  savedName,
  isAdmin,
  setIsAdmin,
  handleAssignPlayerTeam,
  handleRandomizeTeams,
  handleResetTeams,
  handleSignUp,
  handleSignOut,
  draggedPlayerId,
  setDraggedPlayerId
}: TeamGeneratorProps) {
  if (!currentMatch) return null;

  const maxPlayers = currentMatch.maxPlayers;
  const is6v6 = maxPlayers === 12;
  const allRegistered = currentMatch.players || [];
  const mainPlayers = allRegistered.slice(0, maxPlayers);

  const assignedTeamA = mainPlayers.filter(p => p.team === "A");
  const assignedTeamB = mainPlayers.filter(p => p.team === "B");
  const unassigned = mainPlayers.filter(p => !p.team);

  const teamAPlayers: Player[] = [...assignedTeamA];
  const teamBPlayers: Player[] = [...assignedTeamB];

  const maxTeamSize = Math.floor(maxPlayers / 2);
  unassigned.forEach((p, idx) => {
    if (teamAPlayers.length < maxTeamSize && teamBPlayers.length < maxTeamSize) {
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

  const isEveryoneConfirmed = mainPlayers.length === maxPlayers && mainPlayers.length > 0 && mainPlayers.every(p => p.isConfirmed);

  const handleJoinSlot = () => {
    handleSignUp(savedName || prompt("Ingresa tu nombre:") || "");
  };

  return (
    <>
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-4 shadow-xl flex flex-col gap-3" id="soccer-pitch-card">
        <div className="flex justify-between items-center border-b border-slate-700/50 pb-2.5">
          <h4 className="font-bold text-sm text-slate-200">
            Visualización de Equipos
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">Claras vs. Oscuras</span>
        </div>

        <div className="relative aspect-[1/1.45] w-full max-w-[440px] mx-auto min-h-[520px] sm:min-h-[580px] bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-2xl border-2 border-emerald-500 shadow-inner overflow-hidden p-2 sm:p-4 flex flex-col justify-between" id="soccer-pitch-field">
          <div className="absolute inset-0 flex flex-col pointer-events-none opacity-10">
            {Array(8).fill(null).map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? "bg-black" : "bg-transparent"}`} />
            ))}
          </div>

          <div className="absolute inset-x-0 inset-y-0 border border-white/40 pointer-events-none rounded-xl m-1" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/40 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 sm:w-16 h-14 sm:h-16 rounded-full border border-white/40 pointer-events-none" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white/50 pointer-events-none" />

          <div className="absolute top-1 inset-x-[18%] h-10 sm:h-12 border-b border-x border-white/40 pointer-events-none" />
          <div className="absolute bottom-1 inset-x-[18%] h-10 sm:h-12 border-t border-x border-white/40 pointer-events-none" />

          <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-16 h-2 border-b border-x border-white/60 bg-emerald-900/50 pointer-events-none rounded-b" />
          <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-16 h-2 border-t border-x border-white/60 bg-emerald-900/50 pointer-events-none rounded-t" />

          <div className="relative w-full h-full flex flex-col justify-between z-10 py-1 sm:py-2">
            <div className="flex-1 flex flex-col justify-around py-1">
              <div className="flex flex-row justify-around items-center w-full px-1">
                <PlayerBubble
                  player={teamBlue[1]}
                  slotNum={3}
                  teamColor="blue"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                <PlayerBubble
                  player={teamBlue[0]}
                  slotNum={1}
                  teamColor="blue"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                <PlayerBubble
                  player={teamBlue[2]}
                  slotNum={5}
                  teamColor="blue"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
              </div>

              <div className="flex flex-row justify-around items-center w-full px-4">
                <PlayerBubble
                  player={teamBlue[3]}
                  slotNum={7}
                  teamColor="blue"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                {is6v6 ? (
                  <>
                    <PlayerBubble
                      player={teamBlue[4]}
                      slotNum={9}
                      teamColor="blue"
                      onJoin={handleJoinSlot}
                      onLeave={handleSignOut}
                    />
                    <PlayerBubble
                      player={teamBlue[5]}
                      slotNum={11}
                      teamColor="blue"
                      onJoin={handleJoinSlot}
                      onLeave={handleSignOut}
                    />
                  </>
                ) : (
                  <PlayerBubble
                    player={teamBlue[4]}
                    slotNum={9}
                    teamColor="blue"
                    onJoin={handleJoinSlot}
                    onLeave={handleSignOut}
                  />
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-around py-1">
              <div className="flex flex-row justify-around items-center w-full px-4">
                <PlayerBubble
                  player={teamRed[3]}
                  slotNum={8}
                  teamColor="red"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                {is6v6 ? (
                  <>
                    <PlayerBubble
                      player={teamRed[4]}
                      slotNum={10}
                      teamColor="red"
                      onJoin={handleJoinSlot}
                      onLeave={handleSignOut}
                    />
                    <PlayerBubble
                      player={teamRed[5]}
                      slotNum={12}
                      teamColor="red"
                      onJoin={handleJoinSlot}
                      onLeave={handleSignOut}
                    />
                  </>
                ) : (
                  <PlayerBubble
                    player={teamRed[4]}
                    slotNum={10}
                    teamColor="red"
                    onJoin={handleJoinSlot}
                    onLeave={handleSignOut}
                  />
                )}
              </div>

              <div className="flex flex-row justify-around items-center w-full px-1">
                <PlayerBubble
                  player={teamRed[1]}
                  slotNum={4}
                  teamColor="red"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                <PlayerBubble
                  player={teamRed[0]}
                  slotNum={2}
                  teamColor="red"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
                <PlayerBubble
                  player={teamRed[2]}
                  slotNum={6}
                  teamColor="red"
                  onJoin={handleJoinSlot}
                  onLeave={handleSignOut}
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-1 right-1.5 text-[8.5px] text-white/50 bg-slate-950/40 px-1.5 py-0.5 rounded pointer-events-none">
            Luminosidad: Verde = Confirmado, Azul = Registrado
          </div>
        </div>
      </div>

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

          <div className="grid grid-cols-2 gap-3.5">
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

          <p className="text-[10px] text-center text-slate-500">
            {isAdmin
              ? "💡 Consejo: Puedes arrastrar los nombres de un equipo a otro en computadora, o presionar las flechas (⬅️/➡️) en pantallas táctiles para un movement al instante."
              : "💡 Los Organizadores pueden iniciar sesión para arrastrar y soltar nombres o balancear los equipos libremente."}
          </p>
        </div>
      )}
    </>
  );
}

function FootballKit({ isDark, slotNum }: { isDark: boolean; slotNum: number }) {
  const shirtFill = isDark ? "#000000" : "#ffffff";
  const shortsFill = isDark ? "#000000" : "#ffffff";
  const strokeColor = isDark ? "#ffffff" : "#000000";
  const detailsColor = isDark ? "#ffffff" : "#cccccc";
  const numberColor = isDark ? "#ffffff" : "#000000";

  return (
    <svg
      viewBox="0 0 64 64"
      className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 18,14 L 6,24 L 12,30 L 20,24 Z" fill={shirtFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 46,14 L 58,24 L 52,30 L 44,24 Z" fill={shirtFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 20,14 L 26,10 A 6,6 0 0,0 38,10 L 44,14 L 44,38 L 20,38 Z" fill={shirtFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 8,22 L 14,28" stroke={detailsColor} strokeWidth="2" />
      <path d="M 56,22 L 50,28" stroke={detailsColor} strokeWidth="2" />
      <path d="M 26,10 A 6,6 0 0,0 38,10" fill="none" stroke={detailsColor} strokeWidth="2" />
      <path d="M 22,40 L 42,40 L 42,53 L 33,53 L 32,47 L 31,53 L 22,53 Z" fill={shortsFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
      <line x1="22" y1="42" x2="42" y2="42" stroke={strokeColor} strokeWidth="2.5" />
      <line x1="23.5" y1="42" x2="23.5" y2="52" stroke={detailsColor} strokeWidth="1.5" />
      <line x1="40.5" y1="42" x2="40.5" y2="52" stroke={detailsColor} strokeWidth="1.5" />
      <text x="32" y="28" textAnchor="middle" dominantBaseline="middle" fill={numberColor} fontSize="14" fontWeight="900" fontFamily="sans-serif">
        {slotNum}
      </text>
    </svg>
  );
}

function FootballKitPlaceholder({ isDark }: { isDark: boolean }) {
  const strokeColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const plusColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";

  return (
    <svg
      viewBox="0 0 64 64"
      className="w-8 h-8 min-[360px]:w-10 min-[360px]:h-10 min-[400px]:w-11 min-[400px]:h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-all"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 18,14 L 6,24 L 12,30 L 20,24 Z" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3,3" strokeLinejoin="round" />
      <path d="M 46,14 L 58,24 L 52,30 L 44,24 Z" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3,3" strokeLinejoin="round" />
      <path d="M 20,14 L 26,10 A 6,6 0 0,0 38,10 L 44,14 L 44,38 L 20,38 Z" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3,3" strokeLinejoin="round" />
      <path d="M 22,40 L 42,40 L 42,53 L 33,53 L 32,47 L 31,53 L 22,53 Z" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="3,3" strokeLinejoin="round" />
      <path d="M 28,26 L 36,26 M 32,22 L 32,30" stroke={plusColor} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

interface PlayerBubbleProps {
  player: Player | null;
  slotNum: number;
  teamColor: "blue" | "red";
  onJoin: () => void;
  onLeave: (id: string) => void;
}

function PlayerBubble({ player, slotNum, teamColor, onJoin, onLeave }: PlayerBubbleProps) {
  const isDark = teamColor === "red";

  return (
    <div className="flex flex-col items-center justify-center gap-1.5 w-[46px] min-[360px]:w-[54px] min-[400px]:w-[64px] sm:w-[76px] md:w-[84px]">
      {player ? (
        <button
          onClick={() => onLeave(player.id)}
          className="relative group transition-all transform hover:scale-110 active:scale-95 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
          title={`Dar de baja a ${player.name}`}
        >
          <FootballKit isDark={isDark} slotNum={slotNum} />
          <div className="absolute -top-1 -right-0.5 sm:-right-1">
            <span className="flex h-3 w-3 sm:h-4 sm:w-4 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${player.isConfirmed ? "bg-emerald-400" : "bg-sky-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-slate-900 ${player.isConfirmed ? "bg-emerald-500" : "bg-sky-500"}`}></span>
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-950/85 rounded-xl text-[7px] sm:text-[10px] text-rose-400 font-extrabold shadow-md border border-rose-500/30 px-1 py-0.5">
            BAJA
          </div>
        </button>
      ) : (
        <button
          onClick={onJoin}
          className="relative group transition-all transform hover:scale-115 active:scale-90 cursor-pointer focus:outline-none flex flex-col items-center justify-center"
          title="Inscribirme en este puesto"
        >
          <FootballKitPlaceholder isDark={isDark} />
        </button>
      )}

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
