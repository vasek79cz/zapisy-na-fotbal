import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Match, Player, SoccerAppState } from "./src/types";

const app = express();
const PORT = 3000;
const STATE_FILE_PATH = path.join(process.cwd(), "football_state.json");

app.use(express.json());

// In-memory fallback and initial state
let state: SoccerAppState = {
  currentMatch: null,
  history: []
};

// Help helper for Prague/local football defaults
function getNextDayOfWeek(dayIndex: number, hours: number, minutes: number): Date {
  const today = new Date();
  const resultDate = new Date(today.getTime());
  resultDate.setDate(today.getDate() + (dayIndex + 7 - today.getDay()) % 7);
  resultDate.setHours(hours, minutes, 0, 0);
  // If it's already past this time today, schedule for next week
  if (resultDate < today) {
    resultDate.setDate(resultDate.getDate() + 7);
  }
  return resultDate;
}

// Seed a default match if state is empty
function seedDefaultMatch(): Match {
  // Next Wednesday at 18:00
  const nextGameDate = getNextDayOfWeek(3, 18, 0);
  
  const y = nextGameDate.getFullYear();
  const m = String(nextGameDate.getMonth() + 1).padStart(2, "0");
  const d = String(nextGameDate.getDate()).padStart(2, "0");
  
  return {
    id: "match_" + Math.random().toString(36).substring(2, 9),
    date: `${y}-${m}-${d}`,
    time: "18:00",
    location: "Pg. de Salvat Papasseit, 11, Ciutat Vella, 08003 Barcelona",
    maxPlayers: 10, // Default 5v5
    players: [],
    isCompleted: false,
    createdAt: new Date().toISOString()
  };
}

// Read state from disk
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const rawData = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      const parsed = JSON.parse(rawData);
      state = {
        currentMatch: parsed.currentMatch || seedDefaultMatch(),
        history: parsed.history || []
      };
      console.log("[State] Successfully loaded football state from disk.");
    } else {
      state = {
        currentMatch: seedDefaultMatch(),
        history: []
      };
      saveState();
      console.log("[State] Seeded and saved initial football state.");
    }
  } catch (err) {
    console.error("[State] Error loading state:", err);
    state = {
      currentMatch: seedDefaultMatch(),
      history: []
    };
  }
}

// Write state to disk
function saveState() {
  try {
    fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[State] Error saving state:", err);
  }
}

// Helper to determine when soccer match ends
function getMatchEndDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const start = new Date(year, month - 1, day, hours, minutes);
  // Matches last 2 hours (120 minutes)
  return new Date(start.getTime() + 2 * 60 * 60 * 1000);
}

// Calculate the match date for the following week
function getNextWeekDateStr(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + 7);
  
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Check if current match has past and we can transition to a new one weekly
function checkAndApplyWeeklyRollover() {
  // Automatic rollover disabled by request. Rollover now happens manually via /api/football/match/complete
}

// Initialize state
loadState();

// Express API endpoints

// Get active match and history. (Triggers check of auto weekly rollover)
app.get("/api/football/match", (req, res) => {
  checkAndApplyWeeklyRollover();
  res.json(state);
});

// Configure existing match size (5v5=10 vs 6v6=12)
app.post("/api/football/match/config", (req, res) => {
  checkAndApplyWeeklyRollover();
  const { maxPlayers } = req.body;
  
  if (state.currentMatch) {
    if (maxPlayers === 10 || maxPlayers === 12) {
      state.currentMatch.maxPlayers = maxPlayers;
      
      // Clean up team assignments for players who are pushed to reserves
      if (state.currentMatch.players.length > maxPlayers) {
        state.currentMatch.players.forEach((p, idx) => {
          if (idx >= maxPlayers) {
            delete p.team;
          }
        });
      }

      saveState();
      res.json({ success: true, match: state.currentMatch });
    } else {
      res.status(400).json({ error: "El límite de jugadores debe ser 10 (5v5) o 12 (6v6)" });
    }
  } else {
    res.status(404).json({ error: "El partido no existe" });
  }
});

// Sign up a player
app.post("/api/football/match/signup", (req, res) => {
  checkAndApplyWeeklyRollover();
  const { name } = req.body;
  
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "El nombre del jugador es requerido." });
  }
  
  if (!state.currentMatch) {
    return res.status(404).json({ error: "No hay partido activo para registrarse." });
  }

  // Prevent duplicate names in current match
  const trimmedName = name.trim();
  const alreadySignedUp = state.currentMatch.players.some(
    p => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  
  if (alreadySignedUp) {
    return res.status(400).json({ error: `El jugador con el nombre "${trimmedName}" ya está registrado.` });
  }

  const newPlayer: Player = {
    id: "player_" + Math.random().toString(36).substring(2, 9),
    name: trimmedName,
    signedUpAt: new Date().toISOString(),
    isConfirmed: false
  };

  state.currentMatch.players.push(newPlayer);
  saveState();
  
  res.json({ success: true, match: state.currentMatch });
});

// Remove/Sign out a player
app.post("/api/football/match/signout", (req, res) => {
  checkAndApplyWeeklyRollover();
  const { playerId } = req.body;
  
  if (!playerId) {
    return res.status(400).json({ error: "El ID del jugador es requerido." });
  }

  if (!state.currentMatch) {
    return res.status(404).json({ error: "El partido no existe" });
  }

  const originalLength = state.currentMatch.players.length;
  state.currentMatch.players = state.currentMatch.players.filter(p => p.id !== playerId);
  
  if (state.currentMatch.players.length === originalLength) {
    return res.status(404).json({ error: "Jugador no encontrado." });
  }
  
  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Create/schedule a brand new match manually
app.post("/api/football/match/new", (req, res) => {
  const { date, time, location, maxPlayers, title, subtitle, avatarUrl } = req.body;
  
  if (!date || !time || !location || !maxPlayers) {
    return res.status(400).json({ error: "Todos los campos (fecha, hora, lugar, configuración) son obligatorios." });
  }

  // If there is an existing match, move it to history
  if (state.currentMatch) {
    // Only archive if it has some players, otherwise just ignore to keep history clean
    if (state.currentMatch.players.length > 0) {
      state.history.unshift({ ...state.currentMatch, isCompleted: true });
    }
  }

  state.currentMatch = {
    id: "match_" + Math.random().toString(36).substring(2, 9),
    date,
    time,
    location,
    maxPlayers: Number(maxPlayers) === 12 ? 12 : 10,
    players: [],
    isCompleted: false,
    createdAt: new Date().toISOString(),
    title: title || undefined,
    subtitle: subtitle || undefined,
    avatarUrl: avatarUrl || undefined
  };

  if (state.history.length > 25) {
    state.history = state.history.slice(0, 25);
  }

  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Edit active match details
app.post("/api/football/match/edit", (req, res) => {
  const { date, time, location, maxPlayers, title, subtitle, avatarUrl } = req.body;
  
  if (!state.currentMatch) {
    return res.status(404).json({ error: "No hay partido activo para editar." });
  }

  if (!date || !time || !location || !maxPlayers) {
    return res.status(400).json({ error: "Todos los campos (fecha, hora, lugar, configuración) son requeridos." });
  }

  const parsedMaxPlayers = Number(maxPlayers) === 12 ? 12 : 10;

  state.currentMatch.date = date;
  state.currentMatch.time = time;
  state.currentMatch.location = location;
  state.currentMatch.maxPlayers = parsedMaxPlayers;
  state.currentMatch.title = title || undefined;
  state.currentMatch.subtitle = subtitle || undefined;
  state.currentMatch.avatarUrl = avatarUrl || undefined;

  // If we shrunk the maxPlayers limit (e.g. 12 -> 10), any player beyond the new limit is now a reserve.
  // Clean up team assignments for reserves to avoid inconsistencies.
  if (state.currentMatch.players.length > parsedMaxPlayers) {
    state.currentMatch.players.forEach((p, idx) => {
      if (idx >= parsedMaxPlayers) {
        delete p.team;
      }
    });
  }

  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Cancel active match
app.post("/api/football/match/cancel", (req, res) => {
  const { reason } = req.body;

  if (!state.currentMatch) {
    return res.status(404).json({ error: "No hay partido activo para cancelar." });
  }

  state.currentMatch.isCanceled = true;
  state.currentMatch.cancellationReason = reason || "Cancelado por el organizador";
  
  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Restore active match from cancel state
app.post("/api/football/match/restore", (req, res) => {
  if (!state.currentMatch) {
    return res.status(404).json({ error: "No hay partido activo para restaurar." });
  }

  state.currentMatch.isCanceled = false;
  delete state.currentMatch.cancellationReason;

  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Mark match as played, archive it, and schedule next match +7 days
app.post("/api/football/match/complete", (req, res) => {
  if (!state.currentMatch) {
    return res.status(404).json({ error: "No hay partido activo para finalizar." });
  }

  const completedMatch = { ...state.currentMatch, isCompleted: true };
  state.history.unshift(completedMatch);

  // Calculate next date (+7 days)
  const nextDate = getNextWeekDateStr(state.currentMatch.date);

  state.currentMatch = {
    id: "match_" + Math.random().toString(36).substring(2, 9),
    date: nextDate,
    time: state.currentMatch.time,
    location: state.currentMatch.location,
    maxPlayers: state.currentMatch.maxPlayers,
    players: [], // Reset registrations
    isCompleted: false,
    createdAt: new Date().toISOString(),
    title: state.currentMatch.title,
    subtitle: state.currentMatch.subtitle,
    avatarUrl: state.currentMatch.avatarUrl
  };

  // Limit history to 25
  if (state.history.length > 25) {
    state.history = state.history.slice(0, 25);
  }

  saveState();
  res.json({ success: true, match: state.currentMatch, history: state.history });
});

// Toggle player confirmation status
app.post("/api/football/match/confirm", (req, res) => {
  checkAndApplyWeeklyRollover();
  const { playerId, isConfirmed } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: "El ID del jugador es requerido." });
  }

  if (!state.currentMatch) {
    return res.status(404).json({ error: "El partido no existe." });
  }

  const player = state.currentMatch.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Jugador no encontrado." });
  }

  player.isConfirmed = Boolean(isConfirmed);
  saveState();

  res.json({ success: true, match: state.currentMatch });
});

// Assign player to manual team (A or B)
app.post("/api/football/match/team", (req, res) => {
  checkAndApplyWeeklyRollover();
  const { playerId, team } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: "El ID del jugador es requerido." });
  }

  if (!state.currentMatch) {
    return res.status(404).json({ error: "El partido no existe." });
  }

  const player = state.currentMatch.players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: "Jugador no encontrado." });
  }

  if (team === "A" || team === "B" || team === null || team === undefined) {
    if (team) {
      player.team = team;
    } else {
      delete player.team;
    }
    saveState();
    res.json({ success: true, match: state.currentMatch });
  } else {
    res.status(400).json({ error: "El equipo debe ser 'A', 'B' o null." });
  }
});

// Randomize or shuffle teams of current match (for main players)
app.post("/api/football/match/teams/randomize", (req, res) => {
  checkAndApplyWeeklyRollover();
  if (!state.currentMatch) {
    return res.status(404).json({ error: "El partido no existe." });
  }

  const mainPlayersLimit = state.currentMatch.maxPlayers;
  const mainPlayers = state.currentMatch.players.slice(0, mainPlayersLimit);

  // Shuffle indexes randomly
  const shuffled = [...mainPlayers].sort(() => Math.random() - 0.5);
  const half = Math.floor(shuffled.length / 2);

  shuffled.forEach((p, index) => {
    p.team = index < half ? "A" : "B";
  });

  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Reset manual teams to auto alternation
app.post("/api/football/match/teams/reset", (req, res) => {
  checkAndApplyWeeklyRollover();
  if (!state.currentMatch) {
    return res.status(404).json({ error: "El partido no existe." });
  }

  state.currentMatch.players.forEach(p => {
    delete p.team;
  });

  saveState();
  res.json({ success: true, match: state.currentMatch });
});

// Integration with Vite dev / Production static build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Football Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
