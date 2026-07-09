import React from "react";
import { Users, UserCheck } from "lucide-react";
import { Match } from "../../types";

interface PlayerRegistrationProps {
  currentMatch: Match | null;
  signupName: string;
  setSignupName: (name: string) => void;
  handleSignUp: (name: string) => void;
  savedName: string;
  loading: boolean;
}

export default function PlayerRegistration({
  currentMatch,
  signupName,
  setSignupName,
  handleSignUp,
  savedName,
  loading
}: PlayerRegistrationProps) {
  if (!currentMatch) return null;

  return (
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
  );
}
