const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const questions = require("./questions");
const { createRoom, getRoom, deleteRoom } = require("./rooms");

const PORT = process.env.PORT || 3000;
const QUESTION_DURATION_MS = 15000;
const MIN_POINTS = 500;
const MAX_POINTS = 1000;

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const httpServer = createServer(app);
const io = new Server(httpServer);

function playersList(room) {
  return Array.from(room.players.entries()).map(([id, p]) => ({ id, name: p.name, score: p.score }));
}

function startQuestion(room) {
  room.status = "question";
  room.resetAnswers();
  room.questionStartedAt = Date.now();

  const q = questions[room.currentQuestionIndex];
  io.to(room.code).emit("game:question", {
    index: room.currentQuestionIndex,
    total: questions.length,
    question: q.question,
    options: q.options,
    duration: QUESTION_DURATION_MS,
    startedAt: room.questionStartedAt
  });

  room.clearRevealTimer();
  room.revealTimer = setTimeout(() => revealAnswer(room), QUESTION_DURATION_MS + 300);
}

function revealAnswer(room) {
  if (room.status !== "question") return;
  room.status = "reveal";
  room.clearRevealTimer();

  const q = questions[room.currentQuestionIndex];
  const results = [];

  for (const [id, player] of room.players.entries()) {
    let pointsEarned = 0;
    const isCorrect = player.answerIndex === q.correct;
    if (isCorrect) {
      const answerTime = player.answerTime || room.questionStartedAt + QUESTION_DURATION_MS;
      const elapsed = answerTime - room.questionStartedAt;
      const ratio = Math.max(0, Math.min(1, 1 - elapsed / QUESTION_DURATION_MS));
      pointsEarned = Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * ratio);
    }
    player.score += pointsEarned;
    results.push({
      id,
      name: player.name,
      answerIndex: player.answerIndex,
      correct: isCorrect,
      pointsEarned,
      score: player.score
    });
  }

  io.to(room.code).emit("game:reveal", {
    correctIndex: q.correct,
    results,
    leaderboard: room.leaderboard()
  });
}

function endGame(room) {
  room.status = "ended";
  room.clearRevealTimer();
  io.to(room.code).emit("game:over", { leaderboard: room.leaderboard() });
}

function isHost(socket, roomCode) {
  return socket.data.role === "host" && socket.data.roomCode === roomCode;
}

io.on("connection", (socket) => {
  socket.on("host:create", (cb) => {
    const room = createRoom(socket.id);
    socket.join(room.code);
    socket.data.role = "host";
    socket.data.roomCode = room.code;
    cb({ roomCode: room.code });
  });

  socket.on("player:join", ({ roomCode, name }, cb) => {
    const room = getRoom(roomCode);
    if (!room) {
      cb({ success: false, error: "Partie introuvable. Verifie le code." });
      return;
    }
    if (room.status !== "lobby") {
      cb({ success: false, error: "La partie a deja commence." });
      return;
    }
    const cleanName = (name || "").trim().slice(0, 20) || "Joueur";
    room.addPlayer(socket.id, cleanName);
    socket.join(room.code);
    socket.data.role = "player";
    socket.data.roomCode = room.code;

    cb({ success: true });
    io.to(room.hostSocketId).emit("room:players", playersList(room));
  });

  socket.on("host:start", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || !isHost(socket, roomCode)) return;
    if (room.players.size === 0 || room.status !== "lobby") return;
    room.currentQuestionIndex = 0;
    startQuestion(room);
  });

  socket.on("host:next", ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || !isHost(socket, roomCode)) return;
    if (room.status !== "reveal") return;
    room.currentQuestionIndex += 1;
    if (room.currentQuestionIndex >= questions.length) {
      endGame(room);
    } else {
      startQuestion(room);
    }
  });

  socket.on("player:answer", ({ roomCode, answerIndex }) => {
    const room = getRoom(roomCode);
    if (!room || socket.data.role !== "player" || socket.data.roomCode !== roomCode) return;
    if (room.status !== "question") return;
    const player = room.players.get(socket.id);
    if (!player || player.answerIndex !== null) return;
    if (typeof answerIndex !== "number" || answerIndex < 0 || answerIndex > 3) return;

    player.answerIndex = answerIndex;
    player.answerTime = Date.now();

    io.to(room.hostSocketId).emit("game:answerCount", {
      answered: Array.from(room.players.values()).filter((p) => p.answerIndex !== null).length,
      total: room.players.size
    });

    if (room.allAnswered()) {
      revealAnswer(room);
    }
  });

  socket.on("disconnect", () => {
    const { roomCode, role } = socket.data;
    if (!roomCode) return;
    const room = getRoom(roomCode);
    if (!room) return;

    if (role === "host") {
      io.to(room.code).emit("room:closed");
      deleteRoom(room.code);
    } else if (role === "player") {
      room.removePlayer(socket.id);
      io.to(room.hostSocketId).emit("room:players", playersList(room));
      if (room.status === "question" && room.allAnswered()) {
        revealAnswer(room);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Mini-games server running on http://localhost:${PORT}`);
});
