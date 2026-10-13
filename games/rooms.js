// Gestion en memoire des "rooms" (parties). Pas de base de donnees:
// une partie vit tant que le process tourne, ce qui suffit pour jouer entre potes.

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans lettres ambigues (I, O)
const CODE_LENGTH = 4;

const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

class Room {
  constructor(code, hostSocketId) {
    this.code = code;
    this.hostSocketId = hostSocketId;
    this.players = new Map(); // socketId -> { name, score, answerIndex, answerTime }
    this.status = "lobby"; // lobby | question | reveal | ended
    this.currentQuestionIndex = -1;
    this.questionStartedAt = null;
    this.revealTimer = null;
  }

  addPlayer(socketId, name) {
    this.players.set(socketId, { name, score: 0, answerIndex: null, answerTime: null });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  resetAnswers() {
    for (const player of this.players.values()) {
      player.answerIndex = null;
      player.answerTime = null;
    }
  }

  allAnswered() {
    if (this.players.size === 0) return false;
    for (const player of this.players.values()) {
      if (player.answerIndex === null) return false;
    }
    return true;
  }

  leaderboard() {
    return Array.from(this.players.entries())
      .map(([id, p]) => ({ id, name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);
  }

  clearRevealTimer() {
    if (this.revealTimer) {
      clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }
}

function createRoom(hostSocketId) {
  const code = generateRoomCode();
  const room = new Room(code, hostSocketId);
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get((code || "").toUpperCase());
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room) room.clearRevealTimer();
  rooms.delete(code);
}

module.exports = { rooms, createRoom, getRoom, deleteRoom };
