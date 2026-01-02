
import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { Pokemon } from '../types';
import { getBattleInsight, BattleInsight } from '../services/gemini';

interface BattleArenaProps {
  pokemon1: Pokemon | null;
  pokemon2: Pokemon | null;
  onClose: () => void;
}

interface LogEntry {
  text: string;
  type: 'attack' | 'info' | 'victory' | 'damage';
}

const HPBar = ({ current, max }: { current: number, max: number }) => {
  const percentage = Math.max(0, (current / max) * 100);
  const color = percentage > 50 ? 'bg-emerald-400' : percentage > 20 ? 'bg-yellow-400' : 'bg-red-500';
  
  return (
    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 relative">
      <div 
        className={`h-full transition-all duration-300 ${color} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
        style={{ width: `${percentage}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black tracking-tighter text-white drop-shadow-md">
        {Math.ceil(current)} / {max}
      </div>
    </div>
  );
};

export const BattleArena: React.FC<BattleArenaProps> = ({ pokemon1, pokemon2, onClose }) => {
  const [hp1, setHp1] = useState(pokemon1?.stats.hp || 0);
  const [hp2, setHp2] = useState(pokemon2?.stats.hp || 0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFighting, setIsFighting] = useState(false);
  const [winner, setWinner] = useState<Pokemon | null>(null);
  const [insight, setInsight] = useState<BattleInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [turn, setTurn] = useState<1 | 2>(1);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pokemon1 && pokemon2) {
      setLoadingInsight(true);
      getBattleInsight(pokemon1, pokemon2)
        .then(setInsight)
        .finally(() => setLoadingInsight(false));
    }
  }, [pokemon1, pokemon2]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startBattle = async () => {
    if (!pokemon1 || !pokemon2) return;
    setIsFighting(true);
    setWinner(null);
    setHp1(pokemon1.stats.hp);
    setHp2(pokemon2.stats.hp);
    setLogs([{ text: "BATTLE START!", type: 'info' }]);

    let currentHp1 = pokemon1.stats.hp;
    let currentHp2 = pokemon2.stats.hp;
    let currentTurn = 1;

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    while (currentHp1 > 0 && currentHp2 > 0) {
      await delay(800);
      const attacker = currentTurn === 1 ? pokemon1 : pokemon2;
      const defender = currentTurn === 1 ? pokemon2 : pokemon1;
      
      const atk = attacker.stats.attack + attacker.stats.specialAttack;
      const def = defender.stats.defense + defender.stats.specialDefense;
      
      const rawDamage = Math.max(5, (atk / (def / 2)) * 10);
      const variance = 0.85 + Math.random() * 0.3;
      const damage = Math.floor(rawDamage * variance);

      if (currentTurn === 1) {
        currentHp2 -= damage;
        setHp2(Math.max(0, currentHp2));
        setLogs(prev => [...prev, { text: `${attacker.name} strikes ${defender.name} for ${damage} damage!`, type: 'damage' }]);
      } else {
        currentHp1 -= damage;
        setHp1(Math.max(0, currentHp1));
        setLogs(prev => [...prev, { text: `${attacker.name} strikes ${defender.name} for ${damage} damage!`, type: 'damage' }]);
      }

      currentTurn = currentTurn === 1 ? 2 : 1;
      setTurn(currentTurn as 1 | 2);
    }

    await delay(500);
    const win = currentHp1 > 0 ? pokemon1 : pokemon2;
    setWinner(win);
    setLogs(prev => [...prev, { text: `🏆 VICTORY: ${win.name} wins the battle!`, type: 'victory' }]);
    setIsFighting(false);
  };

  if (!pokemon1 || !pokemon2) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#001F3F] flex flex-col items-center p-4 md:p-8 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black italic tracking-tighter text-white flex items-center gap-4">
          <Lucide.Swords className="text-[#FF6B6B] w-8 h-8" /> BATTLE ARENA
        </h1>
        <button onClick={onClose} className="p-3 glass rounded-full hover:bg-white/10 transition-colors">
          <Lucide.X className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-3 gap-8 flex-1 items-start">
        
        {/* Fighter 1 */}
        <div className={`flex flex-col items-center gap-6 p-6 glass rounded-3xl border-2 transition-all duration-500 ${turn === 1 && isFighting ? 'border-[#00CED1] neon-shadow-turquoise scale-105' : 'border-white/5'}`}>
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Challenger 1</span>
            <span className="px-3 py-1 bg-[#00CED1] text-xs font-black rounded-lg">LV. 100</span>
          </div>
          <HPBar current={hp1} max={pokemon1.stats.hp} />
          <div className="relative w-48 h-48 flex items-center justify-center">
             <img src={pokemon1.sprites.other['official-artwork'].front_default} className={`w-full h-full object-contain animate-float ${turn === 2 && isFighting ? 'opacity-80 grayscale-[0.5]' : ''}`} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#00CED1]">{pokemon1.name}</h2>
        </div>

        {/* Central Hub */}
        <div className="flex flex-col items-center justify-center gap-6 h-full min-h-[400px]">
          {!isFighting && !winner ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <button 
                onClick={startBattle}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#D10000] shadow-[0_0_30px_rgba(255,107,107,0.5)] flex items-center justify-center animate-pulse hover:scale-110 active:scale-90 transition-all"
              >
                <Lucide.Zap className="w-12 h-12 text-white" fill="currentColor" />
              </button>
              <p className="font-display font-black text-xl tracking-[0.3em] text-[#FF6B6B]">FIGHT!</p>
              
              {/* AI Insight Card */}
              <div className="w-full glass-bright p-6 rounded-2xl border border-white/10">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700] mb-3 flex items-center gap-2">
                  <Lucide.BrainCircuit className="w-3 h-3" /> AI Strategic Prediction
                </h3>
                {loadingInsight ? (
                  <div className="flex justify-center p-4">
                    <Lucide.Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                  </div>
                ) : insight ? (
                  <div className="space-y-3">
                    <p className="text-xs italic text-slate-300">"{insight.prediction}"</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/40 rounded-full">
                        <div 
                          className="h-full bg-[#FFD700] rounded-full shadow-[0_0_5px_#FFD700]" 
                          style={{ width: `${insight.winProbability * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{(insight.winProbability * 100).toFixed(0)}% WIN RATE</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">No prediction available.</p>
                )}
              </div>
            </div>
          ) : winner ? (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.4)]">
                  <Lucide.Trophy className="w-12 h-12 text-[#001F3F]" />
               </div>
               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{winner.name} VICTORIOUS!</h3>
               <button 
                onClick={() => {setWinner(null); setHp1(pokemon1.stats.hp); setHp2(pokemon2.stats.hp); setLogs([]);}}
                className="px-8 py-3 glass hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
               >
                 REMATCH
               </button>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-4">
                <div className="text-6xl font-black italic text-white/5 animate-pulse">VS</div>
                <Lucide.Waves className="w-12 h-12 text-[#00CED1] animate-bounce" />
             </div>
          )}
        </div>

        {/* Fighter 2 */}
        <div className={`flex flex-col items-center gap-6 p-6 glass rounded-3xl border-2 transition-all duration-500 ${turn === 2 && isFighting ? 'border-[#FF6B6B] neon-shadow-coral scale-105' : 'border-white/5'}`}>
          <div className="w-full flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Challenger 2</span>
            <span className="px-3 py-1 bg-[#FF6B6B] text-xs font-black rounded-lg">LV. 100</span>
          </div>
          <HPBar current={hp2} max={pokemon2.stats.hp} />
          <div className="relative w-48 h-48 flex items-center justify-center">
             <img src={pokemon2.sprites.other['official-artwork'].front_default} className={`w-full h-full object-contain animate-float ${turn === 1 && isFighting ? 'opacity-80 grayscale-[0.5]' : ''}`} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#FF6B6B]">{pokemon2.name}</h2>
        </div>

      </div>

      {/* Battle Log */}
      <div className="w-full max-w-4xl mt-12 glass rounded-2xl overflow-hidden border border-white/10">
        <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Live Combat Log</span>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse delay-75" />
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse delay-150" />
          </div>
        </div>
        <div className="h-48 p-6 overflow-y-auto font-mono text-sm space-y-2 bg-black/20">
          {logs.length === 0 && <p className="text-slate-600 italic">Waiting for combat to begin...</p>}
          {logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-3 ${
              log.type === 'victory' ? 'text-yellow-400 font-bold text-lg py-2' : 
              log.type === 'damage' ? 'text-slate-300' : 
              'text-sky-400 font-bold'
            }`}>
              <span className="text-[10px] mt-1 text-slate-500">[{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
              <span>{log.text}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
