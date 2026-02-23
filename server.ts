import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("quizzes.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    time_limit INTEGER DEFAULT 20,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
  );
`);

// Seed data if empty or reset for Uzbek 15-question requirement
const quizCount = db.prepare("SELECT COUNT(*) as count FROM quizzes").get() as { count: number };
if (quizCount.count <= 2) { // Resetting if it's just the initial 2 or empty
  db.exec("DELETE FROM questions; DELETE FROM quizzes;");
  
  const insertQuiz = db.prepare("INSERT INTO quizzes (title, description, topic) VALUES (?, ?, ?)");
  const insertQuestion = db.prepare("INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)");

  const q1 = insertQuiz.run("Umumiy Bilimlar", "O'zbekiston va dunyo haqida 15 ta qiziqarli savol!", "General");
  const quizId = q1.lastInsertRowid;

  insertQuestion.run(quizId, "O'zbekiston mustaqilligi qachon e'lon qilingan?", "1990", "1991", "1992", "1993", "B");
  insertQuestion.run(quizId, "Dunyodagi eng baland tog' qaysi?", "K2", "Lhotse", "Everest", "Makalu", "C");
  insertQuestion.run(quizId, "Quyosh tizimidagi eng katta sayyora?", "Mars", "Yupiter", "Saturn", "Neptun", "B");
  insertQuestion.run(quizId, "Suvning kimyoviy formulasi qanday?", "CO2", "H2O", "O2", "NaCl", "B");
  insertQuestion.run(quizId, "Alisher Navoiy kim bo'lgan?", "Sarkarda", "Shoir va mutafakkir", "Rassom", "Sayohatchi", "B");
  insertQuestion.run(quizId, "O'zbekiston poytaxti qaysi shahar?", "Samarqand", "Buxoro", "Toshkent", "Xiva", "C");
  insertQuestion.run(quizId, "Inson tanasidagi eng katta a'zo nima?", "Yurak", "O'pka", "Teri", "Jigar", "C");
  insertQuestion.run(quizId, "Bir kunda necha soat bor?", "12", "24", "48", "60", "B");
  insertQuestion.run(quizId, "Eng tez yuguradigan quruqlik hayvoni?", "Arslon", "Gepard", "Yo'lbars", "Bo'ri", "B");
  insertQuestion.run(quizId, "Yer yuzida nechta okean bor?", "3", "4", "5", "6", "C");
  insertQuestion.run(quizId, "O'zbekiston bayrog'ida nechta yulduz bor?", "10", "12", "15", "7", "B");
  insertQuestion.run(quizId, "Kompyuterning asosiy hisoblash qismi nima deb ataladi?", "Monitor", "Klaviatura", "Protsessor", "Sichqoncha", "C");
  insertQuestion.run(quizId, "Shaxmat taxtasida jami nechta katak bor?", "32", "64", "100", "81", "B");
  insertQuestion.run(quizId, "Dunyodagi eng chuqur ko'l qaysi?", "Kaspiy", "Viktoriya", "Baykal", "Orol", "C");
  insertQuestion.run(quizId, "Amir Temur qayerda tug'ilgan?", "Toshkent", "Samarqand", "Xo'ja Ilg'or (Shahrisabz)", "Buxoro", "C");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/quizzes", (req, res) => {
    const quizzes = db.prepare("SELECT * FROM quizzes ORDER BY created_at DESC").all();
    res.json(quizzes);
  });

  app.get("/api/quizzes/:id", (req, res) => {
    const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(req.params.id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(req.params.id);
    res.json({ ...quiz, questions });
  });

  app.post("/api/quizzes", (req, res) => {
    const { title, description, topic, questions } = req.body;
    
    const transaction = db.transaction(() => {
      const info = db.prepare("INSERT INTO quizzes (title, description, topic) VALUES (?, ?, ?)").run(title, description, topic);
      const quizId = info.lastInsertRowid;

      const questionStmt = db.prepare(`
        INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, time_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const q of questions) {
        questionStmt.run(quizId, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.time_limit || 20);
      }
      return quizId;
    });

    try {
      const quizId = transaction();
      res.json({ id: quizId, message: "Quiz created successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
