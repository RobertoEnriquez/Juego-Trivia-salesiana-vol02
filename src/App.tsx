/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  LogOut, 
  Trash2, 
  Plus,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import questionsData from './data/questions.json';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Question {
  id: number;
  case: string;
  options: string[];
  correct_index: number;
  feedback: string;
  difficulty: number;
}

interface Team {
  id: string;
  name: string;
  score: number;
}

enum GameState {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  SHOWING_FEEDBACK = 'showing_feedback',
  FINISHED = 'finished'
}

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.LOBBY);
  const [teams, setTeams] = useState<Team[]>([
    { id: '1', name: 'Equipo Don Bosco', score: 0 },
    { id: '2', name: 'Equipo María Auxiliadora', score: 0 },
    { id: '3', name: 'Equipo Domingo Savio', score: 0 },
    { id: '4', name: 'Equipo Madre Mazzarello', score: 0 },
    { id: '5', name: 'Equipo Francisco de Sales', score: 0 },
    { id: '6', name: 'Equipo Artémides Zatti', score: 0 },
  ]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  
  // Questions sorted by difficulty
  const sortedQuestions = [...questionsData].sort((a, b) => a.difficulty - b.difficulty);
  const currentQuestion: Question = sortedQuestions[currentQuestionIndex] || sortedQuestions[0];

  // Audio Triggers
  const playSound = (type: 'correct' | 'error' | 'tick' | 'timeout') => {
    const urls = {
      correct: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
      error: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      tick: 'https://assets.mixkit.co/active_storage/sfx/2070/2070-preview.mp3',
      timeout: 'https://assets.mixkit.co/active_storage/sfx/2023/2023-preview.mp3'
    };
    
    try {
      const audio = new Audio(urls[type]);
      audio.volume = type === 'tick' ? 0.3 : 0.5;
      audio.play().catch(() => {/* Ignore autoplay blocks */});
    } catch (e) {
      console.warn('Audio failed to play', e);
    }
  };

  // --- Logic ---
  
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
        playSound('tick'); 
      }, 1000);
    } else if (timer === 0 && isTimerRunning) {
      handleTimeout();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleTimeout = () => {
    setIsTimerRunning(false);
    setLastAnswerCorrect(false);
    playSound('timeout');
    setGameState(GameState.SHOWING_FEEDBACK);
  };

  const startTimer = () => {
    setShowOptions(true);
    setIsTimerRunning(true);
  };

  const handleAnswerSelection = (index: number) => {
    if (selectedOption !== null || !isTimerRunning) return;
    
    setIsTimerRunning(false);
    setSelectedOption(index);
    const correct = index === currentQuestion.correct_index;
    setLastAnswerCorrect(correct);

    if (correct) {
      playSound('correct');
      const updatedTeams = [...teams];
      updatedTeams[currentTeamIndex].score += currentQuestion.difficulty * 100;
      setTeams(updatedTeams);
    } else {
      playSound('error');
    }

    setTimeout(() => {
      setGameState(GameState.SHOWING_FEEDBACK);
    }, 1200);
  };

  const nextTurn = () => {
    setSelectedOption(null);
    setLastAnswerCorrect(null);
    setShowOptions(false);
    setTimer(30);
    
    if (currentQuestionIndex + 1 >= sortedQuestions.length) {
      finishGame();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentTeamIndex((prev) => (prev + 1) % teams.length);
      setGameState(GameState.PLAYING);
    }
  };

  const finishGame = () => {
    setGameState(GameState.FINISHED);
    confetti({
      particleCount: 200,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#003366', '#FFCC00', '#CC0000', '#FFFFFF']
    });
  };

  const resetGame = () => {
    setGameState(GameState.LOBBY);
    setCurrentQuestionIndex(0);
    setCurrentTeamIndex(0);
    setTeams(teams.map(t => ({ ...t, score: 0 })));
    setTimer(30);
    setIsTimerRunning(false);
    setShowOptions(false);
    setSelectedOption(null);
  };

  const BACKGROUND_STYLE = {
    backgroundImage: 'linear-gradient(rgba(2, 6, 23, 0.8), rgba(2, 6, 23, 0.8)), url("https://www.salesianos.org.ec/wp-content/uploads/2026/01/Imagenes-Don-Bosco.webp")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed' as const
  };

  // --- Components ---

  const Lobby = () => {
    const [newTeamName, setNewTeamName] = useState('');
    
    const addTeam = () => {
      if (!newTeamName.trim()) return;
      setTeams([...teams, { id: Date.now().toString(), name: newTeamName, score: 0 }]);
      setNewTeamName('');
    };

    const removeTeam = (id: string) => {
      setTeams(teams.filter(t => t.id !== id));
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-white" style={BACKGROUND_STYLE}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black uppercase tracking-tighter text-blue-200">
              Buen Cristiano
            </h1>
            <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-red-100">
              y Ético Ciudadano
            </h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4 text-blue-300">
                <Users className="w-5 h-5" /> DOCENTES PARTICIPANTES
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10 group hover:border-blue-500/50 transition-colors">
                    <span className="font-semibold truncate">{team.name}</span>
                    <button 
                      onClick={() => removeTeam(team.id)}
                      className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Nombre del equipo..."
                  className="flex-1 bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
                <button 
                  onClick={addTeam}
                  className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setGameState(GameState.PLAYING)}
              disabled={teams.length === 0}
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50 uppercase italic"
            >
              <Play className="w-6 h-6 fill-current" /> Iniciar Juego
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const Game = () => {
    return (
      <div className="min-h-screen flex flex-col relative" style={BACKGROUND_STYLE}>
        {/* Header */}
        <header className="p-4 bg-slate-950/60 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
             <div className="bg-red-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-white">
               Pregunta {currentQuestionIndex + 1}/30
             </div>
             <div className="bg-blue-600 px-3 py-1 rounded-lg text-xs font-black uppercase text-white">
               Nivel {currentQuestion.difficulty}
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
               <div className="text-[10px] text-slate-400 uppercase font-black tracking-tight">Turno actual</div>
               <div className="font-black text-blue-400 truncate max-w-[150px] uppercase italic">{teams[currentTeamIndex]?.name}</div>
             </div>
             <button 
               onClick={finishGame}
               className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-red-500 border border-transparent hover:border-red-500/50"
             >
               <LogOut className="w-6 h-6" />
             </button>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 z-10 max-w-5xl mx-auto w-full">
          {/* Question Box */}
          <motion.div 
            key={currentQuestion.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl mb-10"
          >
            <p className="text-2xl md:text-4xl font-semibold leading-tight text-center text-blue-50">
              "{currentQuestion.case}"
            </p>
          </motion.div>

          {/* Action Area */}
          {!showOptions ? (
            <motion.button 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={startTimer}
              className="bg-blue-600 hover:bg-blue-500 px-16 py-8 rounded-3xl text-3xl font-black flex items-center gap-4 shadow-2xl shadow-blue-600/30 transition-all active:scale-95 uppercase italic text-white"
            >
              <Clock className="w-10 h-10" /> Iniciar Tiempo
            </motion.button>
          ) : (
            <div className="w-full space-y-10">
              {/* Timer Bar */}
              <div className="w-full space-y-2">
                <div className="flex justify-between items-end px-2">
                   <span className="text-xs font-black uppercase text-slate-400">Tiempo restante</span>
                   <span className={cn("text-2xl font-black tabular-nums", timer <= 10 ? "text-red-500" : "text-blue-400")}>{timer}s</span>
                </div>
                <div className="relative w-full h-5 bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timer / 30) * 100}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-1000",
                      timer > 10 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,44,44,0.8)] pulse-timer"
                    )}
                  />
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correct_index;
                  
                  let stateClasses = "bg-slate-900/40 border-white/10 hover:border-blue-500/50 hover:bg-blue-900/20";
                  if (selectedOption !== null) {
                    if (isCorrect) stateClasses = "bg-green-600/80 border-green-400 text-white shadow-2xl shadow-green-500/30 scale-[1.02]";
                    else if (isSelected) stateClasses = "bg-red-600/80 border-red-400 text-white shadow-2xl shadow-red-500/30";
                    else stateClasses = "opacity-30 grayscale pointer-events-none";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOption !== null}
                      onClick={() => handleAnswerSelection(idx)}
                      className={cn(
                        "p-8 rounded-[2rem] border-2 backdrop-blur-md transition-all text-left flex items-start gap-5 h-full group text-white",
                        stateClasses
                      )}
                    >
                      <span className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition-colors",
                        selectedOption === null ? "bg-white/10 group-hover:bg-blue-500" : "bg-black/20"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xl font-medium leading-snug">{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Footer Scoreboard */}
        <footer className="p-4 grid grid-cols-2 lg:grid-cols-6 gap-3 bg-slate-950/80 backdrop-blur-lg border-t border-white/10 z-10">
          {teams.map((team, idx) => (
            <div 
              key={team.id} 
              className={cn(
                "p-3 rounded-2xl border transition-all",
                idx === currentTeamIndex ? "bg-blue-600/20 border-blue-500 scale-105 shadow-lg shadow-blue-500/10" : "bg-white/5 border-white/5 opacity-50"
              )}
            >
              <div className="text-[10px] uppercase font-black text-slate-400 truncate tracking-tighter">{team.name}</div>
              <div className="text-xl font-black text-white">{team.score.toLocaleString()} <span className="text-[10px] text-blue-400">PTS</span></div>
            </div>
          ))}
        </footer>

        {/* Feedback Modal */}
        <AnimatePresence>
          {gameState === GameState.SHOWING_FEEDBACK && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-slate-900 border-4 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
                style={{ borderColor: lastAnswerCorrect ? '#22c55e' : '#ef4444' }}
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl",
                    lastAnswerCorrect ? "bg-green-600 shadow-green-500/20" : "bg-red-600 shadow-red-500/20"
                  )}>
                    {lastAnswerCorrect ? <CheckCircle2 className="w-14 h-14 text-white" /> : <XCircle className="w-14 h-14 text-white" />}
                  </div>
                  
                  <h2 className="text-4xl font-black uppercase mb-3 text-white tracking-tight">
                    {lastAnswerCorrect ? '¡Decisión Ética!' : 'A Justificar...'}
                  </h2>
                  <p className="text-xl text-slate-400 mb-10 text-center font-medium italic">
                    {lastAnswerCorrect 
                      ? 'Tu criterio refleja el corazón de la educación salesiana.' 
                      : 'El Código de Ética nos llama a una conducta diferente en este caso.'}
                  </p>

                  <div className="bg-white/5 rounded-[2rem] p-8 text-left border border-white/10 w-full mb-10">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase text-blue-400 mb-4 tracking-widest">
                      <Info className="w-4 h-4" /> Argumento Institucional
                    </h3>
                    <p className="text-xl leading-relaxed text-blue-50 font-medium">
                      {currentQuestion.feedback}
                    </p>
                  </div>

                  <button 
                    onClick={nextTurn}
                    className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-4 hover:bg-blue-500 transition-all shadow-xl active:scale-95 uppercase italic"
                  >
                    Siguiente Pregunta <ArrowRight className="w-8 h-8" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const Leaderboard = () => {
    const winners = [...teams].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white" style={BACKGROUND_STYLE}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl bg-slate-900/60 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 shadow-3xl text-center"
        >
          <Trophy className="w-28 h-28 text-yellow-500 mb-8 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.6)]" />
          <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic italic">Puntajes Finales</h1>
          <p className="text-blue-400 font-bold tracking-widest uppercase mb-12">Buenos Cristianos y Éticos Ciudadanos</p>

          <div className="space-y-4 mb-14 text-left">
            {winners.map((team, idx) => (
              <motion.div 
                key={team.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "flex items-center justify-between p-6 rounded-[2rem] border transition-all",
                  idx === 0 
                   ? "bg-yellow-500/20 border-yellow-500/50 scale-105 shadow-2xl shadow-yellow-500/10" 
                   : "bg-white/5 border-white/5"
                )}
              >
                <div className="flex items-center gap-6">
                  <span className={cn(
                    "text-2xl font-black w-12 h-12 flex items-center justify-center rounded-2xl",
                    idx === 0 ? "bg-yellow-500 text-slate-950" : "bg-white/10 text-white"
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-2xl font-black uppercase truncate max-w-[300px]">{team.name}</span>
                </div>
                <div className="text-3xl font-black text-blue-400 italic tabular-nums">
                  {team.score.toLocaleString()} <span className="text-xs italic text-slate-400 not-italic">PTS</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={resetGame}
            className="w-full bg-red-600 hover:bg-red-500 py-7 rounded-[2rem] font-black text-3xl flex items-center justify-center gap-4 transition-all shadow-2xl active:scale-95 uppercase italic"
          >
            Nueva Jornada
          </button>
        </motion.div>
      </div>
    );
  };

  // --- Render ---
  switch(gameState) {
    case GameState.LOBBY: return <Lobby />;
    case GameState.PLAYING: 
    case GameState.SHOWING_FEEDBACK: return <Game />;
    case GameState.FINISHED: return <Leaderboard />;
    default: return null;
  }
}
