/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FormEvent, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Play, Trophy, Home as HomeIcon, BookOpen, Clock, CheckCircle2, XCircle, ArrowRight, ChevronLeft, Trash2, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Quiz, Question } from './types';
import { translations, type Language } from './translations';

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.en;
}>({
  lang: 'en',
  setLang: () => {},
  t: translations.en
});

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => {
  const { lang, setLang, t } = useContext(LanguageContext);
  
  return (
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="text-2xl font-extrabold tracking-tighter flex items-center gap-2">
        <div className="bg-kahoot-red p-1 rounded-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <span>YAU-115/25</span>
      </Link>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setLang(lang === 'en' ? 'uz' : 'en')}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors font-bold text-sm"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'UZB' : 'ENG'}
        </button>
        <Link to="/create" className="bg-white text-kahoot-purple px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.create}
        </Link>
      </div>
    </nav>
  );
};

const Home = () => {
  const { t } = useContext(LanguageContext);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quizzes')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black mb-4 tracking-tight"
        >
          {t.readyToPulse.split(' ')[0]} <span className="text-kahoot-yellow">{t.readyToPulse.split(' ').slice(1).join(' ')}</span>
        </motion.h1>
        <p className="text-xl text-white/70">{t.heroSubtitle}</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border-2 border-dashed border-white/10">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-2xl font-bold mb-2">No quizzes found</h3>
          <p className="text-white/50 mb-6">Be the first to create a quiz!</p>
          <Link to="/create" className="bg-white text-kahoot-purple px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            <Plus className="w-5 h-5" /> {t.create}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <motion.div
              key={quiz.id}
              whileHover={{ y: -5 }}
              className="kahoot-card flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-kahoot-purple/10 text-kahoot-purple px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {(t.topics as any)[quiz.topic] || quiz.topic}
                  </span>
                  <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold mb-2 group-hover:text-kahoot-blue transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 mb-6">
                  {quiz.description}
                </p>
              </div>
              <Link 
                to={`/play/${quiz.id}`}
                className="kahoot-button bg-kahoot-blue text-white w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> {t.playNow}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const QuizCreator = () => {
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('General');
  const [questions, setQuestions] = useState<Partial<Question>[]>([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', time_limit: 20 }
  ]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', time_limit: 20 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, topic, questions })
    });
    if (res.ok) {
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-4xl font-black">{t.createAQuiz}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="kahoot-card space-y-4">
          <h2 className="text-xl font-bold border-b pb-2">{t.quizDetails}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase">{t.title}</label>
              <input 
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-kahoot-purple outline-none transition-colors"
                placeholder="e.g., Ultimate Marvel Trivia"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase">{t.topic}</label>
              <select 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-kahoot-purple outline-none transition-colors"
              >
                {Object.keys(t.topics).map(key => (
                  <option key={key} value={key}>{(t.topics as any)[key]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase">{t.description}</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-kahoot-purple outline-none transition-colors h-24"
              placeholder={t.description}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black">{t.questions}</h2>
          {questions.map((q, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={idx} 
              className="kahoot-card relative"
            >
              <button 
                type="button"
                onClick={() => removeQuestion(idx)}
                className="absolute top-4 right-4 text-gray-300 hover:text-kahoot-red transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase">{t.question} {idx + 1}</label>
                  <input 
                    required
                    value={q.question_text}
                    onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                    className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-kahoot-purple outline-none"
                    placeholder={t.typeQuestion}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'A', color: 'bg-kahoot-red' },
                    { id: 'B', color: 'bg-kahoot-blue' },
                    { id: 'C', color: 'bg-kahoot-yellow' },
                    { id: 'D', color: 'bg-kahoot-green' }
                  ].map(opt => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0", opt.color)}>
                        {opt.id}
                      </div>
                      <input 
                        required
                        value={(q as any)[`option_${opt.id.toLowerCase()}`]}
                        onChange={e => updateQuestion(idx, `option_${opt.id.toLowerCase()}` as any, e.target.value)}
                        className="w-full p-2 border-2 border-gray-100 rounded-lg focus:border-kahoot-purple outline-none"
                        placeholder={`${t.option} ${opt.id}`}
                      />
                      <input 
                        type="radio"
                        name={`correct_${idx}`}
                        checked={q.correct_option === opt.id}
                        onChange={() => updateQuestion(idx, 'correct_option', opt.id)}
                        className="w-6 h-6 accent-kahoot-green cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            type="button"
            onClick={addQuestion}
            className="flex-1 bg-white/10 border-2 border-dashed border-white/30 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {t.addQuestion}
          </button>
          <button 
            type="submit"
            className="flex-1 kahoot-button bg-kahoot-green text-white py-4 rounded-2xl font-black text-xl"
          >
            {t.saveQuiz}
          </button>
        </div>
      </form>
    </div>
  );
};

const QuizPlayer = () => {
  const { t } = useContext(LanguageContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(-1); // -1 is lobby
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then(res => res.json())
      .then(data => setQuiz(data));
  }, [id]);

  useEffect(() => {
    let timer: any;
    if (currentQuestionIdx >= 0 && !showResult && !isGameOver && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentQuestionIdx >= 0 && !showResult && !isGameOver) {
      handleAnswer(null);
    }
    return () => clearInterval(timer);
  }, [timeLeft, currentQuestionIdx, showResult, isGameOver]);

  const startQuiz = () => {
    setCurrentQuestionIdx(0);
    setTimeLeft(quiz?.questions?.[0]?.time_limit || 20);
  };

  const handleAnswer = (option: string | null) => {
    if (showResult) return;
    
    setSelectedAnswer(option);
    setShowResult(true);

    const currentQuestion = quiz?.questions?.[currentQuestionIdx];
    if (option === currentQuestion?.correct_option) {
      // Calculate score based on time left
      const points = Math.round(1000 * (timeLeft / (currentQuestion?.time_limit || 20))) + 500;
      setScore(prev => prev + points);
    }
  };

  const nextQuestion = () => {
    if (!quiz?.questions) return;
    if (currentQuestionIdx < quiz.questions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      setTimeLeft(quiz.questions[nextIdx].time_limit);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsGameOver(true);
    }
  };

  if (!quiz) return <div className="flex items-center justify-center h-screen">{t.loading}</div>;

  // Lobby
  if (currentQuestionIdx === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="kahoot-card max-w-lg w-full"
        >
          <div className="bg-kahoot-purple w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Play className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-4xl font-black mb-2">{quiz.title}</h1>
          <p className="text-gray-500 mb-8">{quiz.description}</p>
          <div className="flex items-center justify-center gap-8 mb-8 text-gray-600 font-bold">
            <div className="flex flex-col items-center">
              <span className="text-2xl text-kahoot-blue">{quiz.questions?.length}</span>
              <span className="text-xs uppercase">{t.questions}</span>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="flex flex-col items-center">
              <span className="text-2xl text-kahoot-green">{(t.topics as any)[quiz.topic] || quiz.topic}</span>
              <span className="text-xs uppercase">{t.topic}</span>
            </div>
          </div>
          <button 
            onClick={startQuiz}
            className="kahoot-button bg-kahoot-purple text-white w-full py-4 rounded-2xl font-black text-2xl"
          >
            {t.startGame}
          </button>
        </motion.div>
      </div>
    );
  }

  // Game Over
  if (isGameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="kahoot-card max-w-lg w-full"
        >
          <Trophy className="w-24 h-24 text-kahoot-yellow mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-5xl font-black mb-2">{t.podiumFinish}</h1>
          <p className="text-gray-500 mb-8">{t.completedQuiz}</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t.finalScore}</span>
            <div className="text-6xl font-black text-kahoot-purple">{score.toLocaleString()}</div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
            >
              {t.home}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 kahoot-button bg-kahoot-blue text-white py-4 rounded-2xl font-bold"
            >
              {t.playAgain}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions![currentQuestionIdx];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white text-kahoot-purple px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-kahoot-purple text-white w-10 h-10 rounded-lg flex items-center justify-center font-black">
            {currentQuestionIdx + 1}
          </div>
          <div className="font-bold text-lg hidden md:block">{quiz.title}</div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-gray-400 leading-none">{t.time}</span>
            <span className={cn("text-2xl font-black leading-none", timeLeft <= 5 ? "text-kahoot-red animate-pulse" : "text-kahoot-purple")}>
              {timeLeft}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-black text-gray-400 leading-none">{t.score}</span>
            <span className="text-2xl font-black leading-none text-kahoot-blue">{score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div 
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full text-center"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight">
                {currentQuestion.question_text}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { id: 'A', text: currentQuestion.option_a, color: 'bg-kahoot-red', icon: '▲' },
                  { id: 'B', text: currentQuestion.option_b, color: 'bg-kahoot-blue', icon: '◆' },
                  { id: 'C', text: currentQuestion.option_c, color: 'bg-kahoot-yellow', icon: '●' },
                  { id: 'D', text: currentQuestion.option_d, color: 'bg-kahoot-green', icon: '■' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt.id)}
                    className={cn(
                      "kahoot-button h-24 md:h-32 rounded-xl flex items-center px-6 gap-6 text-left group",
                      opt.color
                    )}
                  >
                    <span className="text-3xl opacity-80 group-hover:scale-125 transition-transform">{opt.icon}</span>
                    <span className="text-xl md:text-2xl font-bold">{opt.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <div className={cn(
                "kahoot-card py-12 flex flex-col items-center",
                selectedAnswer === currentQuestion.correct_option ? "border-t-8 border-kahoot-green" : "border-t-8 border-kahoot-red"
              )}>
                {selectedAnswer === currentQuestion.correct_option ? (
                  <>
                    <CheckCircle2 className="w-24 h-24 text-kahoot-green mb-4" />
                    <h3 className="text-4xl font-black text-kahoot-green mb-2">{t.correct}</h3>
                    <p className="text-gray-500 font-bold">+ {Math.round(1000 * (timeLeft / (currentQuestion.time_limit || 20))) + 500} points</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-24 h-24 text-kahoot-red mb-4" />
                    <h3 className="text-4xl font-black text-kahoot-red mb-2">{t.incorrect}</h3>
                    <p className="text-gray-500 font-bold">{t.correctAnswerWas} <span className="text-kahoot-purple">{currentQuestion.correct_option}</span></p>
                  </>
                )}
                
                <button 
                  onClick={nextQuestion}
                  className="mt-12 kahoot-button bg-kahoot-purple text-white px-12 py-4 rounded-2xl font-black text-xl flex items-center gap-2"
                >
                  {currentQuestionIdx < quiz.questions!.length - 1 ? t.nextQuestion : t.showResults} <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Progress */}
      <div className="h-2 bg-white/20">
        <motion.div 
          className="h-full bg-kahoot-yellow"
          initial={{ width: `${(currentQuestionIdx / quiz.questions!.length) * 100}%` }}
          animate={{ width: `${((currentQuestionIdx + 1) / quiz.questions!.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/create" element={<><Navbar /><QuizCreator /></>} />
            <Route path="/play/:id" element={<QuizPlayer />} />
          </Routes>
        </div>
      </Router>
    </LanguageContext.Provider>
  );
}
