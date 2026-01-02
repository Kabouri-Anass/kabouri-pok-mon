
import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { Pokemon, TeamMember } from './types';
import { getPokemon, getRandomPokemonId } from './services/api';
import { BattleArena } from './components/BattleArena';

// --- UI Components ---

const StatBar = ({ label, value, color, max = 255, delay = 0 }: { label: string, value: number, color: string, max?: number, delay?: number }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((value / max) * 100), 100 + delay);
    return () => clearTimeout(timer);
  }, [value, max, delay]);

  return (
    <div className="mb-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <span className="text-sm font-display font-bold">{value}</span>
      </div>
      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out rounded-full ${color}`}
          style={{ width: `${width}%`, boxShadow: `0 0 10px ${color.split('-')[1]}` }}
        />
      </div>
    </div>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    fire: 'from-orange-500 to-red-600',
    water: 'from-blue-400 to-blue-600',
    grass: 'from-green-400 to-green-600',
    electric: 'from-yellow-300 to-yellow-500',
    psychic: 'from-pink-400 to-purple-600',
    ice: 'from-cyan-200 to-blue-300',
    dragon: 'from-indigo-600 to-purple-800',
    dark: 'from-slate-700 to-black',
    fairy: 'from-pink-200 to-pink-400',
    normal: 'from-slate-400 to-slate-500',
    fighting: 'from-red-700 to-orange-800',
    flying: 'from-sky-300 to-indigo-400',
    poison: 'from-purple-500 to-indigo-700',
    ground: 'from-yellow-700 to-orange-900',
    rock: 'from-stone-500 to-stone-700',
    bug: 'from-lime-400 to-green-700',
    ghost: 'from-violet-800 to-indigo-950',
    steel: 'from-zinc-400 to-slate-500',
  };

  return (
    <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${colors[type] || 'from-slate-400 to-slate-600'} shadow-lg text-white`}>
      {type}
    </span>
  );
};

// --- Main Application ---

const App: React.FC = () => {
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [favorites, setFavorites] = useState<Pokemon[]>([]);
  const [history, setHistory] = useState<{pokemon: Pokemon, time: number}[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showTeam, setShowTeam] = useState(false);
  const [view, setView] = useState<'pokedex' | 'battle'>('pokedex');
  
  // Battle Selection State
  const [battleP1, setBattleP1] = useState<Pokemon | null>(null);
  const [battleP2, setBattleP2] = useState<Pokemon | null>(null);

  // Load initial state
  useEffect(() => {
    const savedFavs = localStorage.getItem('poke_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
    
    const savedTeam = localStorage.getItem('poke_team');
    if (savedTeam) setTeam(JSON.parse(savedTeam));

    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const id = getRandomPokemonId();
      const poke = await getPokemon(id);
      setCurrentPokemon(poke);
      addToHistory(poke);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const poke = await getPokemon(searchTerm);
      setCurrentPokemon(poke);
      addToHistory(poke);
      setSearchTerm('');
    } catch (e) {
      alert("Pokemon not found!");
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (poke: Pokemon) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.pokemon.id !== poke.id);
      return [{ pokemon: poke, time: Date.now() }, ...filtered].slice(0, 10);
    });
  };

  const toggleFavorite = () => {
    if (!currentPokemon) return;
    const isFav = favorites.some(f => f.id === currentPokemon.id);
    let newFavs;
    if (isFav) {
      newFavs = favorites.filter(f => f.id !== currentPokemon.id);
    } else {
      newFavs = [currentPokemon, ...favorites].slice(0, 6);
    }
    setFavorites(newFavs);
    localStorage.setItem('poke_favs', JSON.stringify(newFavs));
  };

  const addToTeam = () => {
    if (!currentPokemon || team.length >= 6) return;
    if (team.some(t => t.id === currentPokemon.id)) return;
    const newTeam = [...team, { ...currentPokemon, addedAt: Date.now() }];
    setTeam(newTeam);
    localStorage.setItem('poke_team', JSON.stringify(newTeam));
    setShowTeam(true);
  };

  const removeFromTeam = (id: number) => {
    const newTeam = team.filter(t => t.id !== id);
    setTeam(newTeam);
    localStorage.setItem('poke_team', JSON.stringify(newTeam));
  };

  const handleCompare = () => {
    if (!currentPokemon) return;
    setBattleP1(currentPokemon);
    // Find a random favorite or history pokemon to compare with that isn't the current one
    const fallback = favorites.find(f => f.id !== currentPokemon.id) || 
                     history.find(h => h.pokemon.id !== currentPokemon.id)?.pokemon ||
                     null;
    setBattleP2(fallback);
    setView('battle');
  };

  const handleShare = () => {
    if (!currentPokemon) return;
    const url = window.location.href;
    navigator.clipboard.writeText(`Check out ${currentPokemon.name} on PokeAI Master! ${url}`);
    alert('Share link copied to clipboard!');
  };

  const isFavorite = useMemo(() => 
    currentPokemon ? favorites.some(f => f.id === currentPokemon.id) : false
  , [currentPokemon, favorites]);

  // Capture view flags before early return to avoid TypeScript narrowing errors in the JSX below
  const isPokedexView = view === 'pokedex';
  const isBattleView = view === 'battle';

  if (view === 'battle') {
    return <BattleArena 
      pokemon1={battleP1} 
      pokemon2={battleP2} 
      onClose={() => setView('pokedex')} 
    />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      
      {/* SIDEBAR GAUCHE (30%) */}
      <aside className="w-full md:w-[30%] glass border-r border-white/10 p-6 flex flex-col gap-8 z-10 overflow-y-auto max-h-screen">
        
        {/* Nav Toggle */}
        <div className="flex gap-2 p-1 glass-bright rounded-xl">
           <button 
            onClick={() => setView('pokedex')} 
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${isPokedexView ? 'bg-[#00CED1] text-[#001F3F]' : 'text-slate-400 hover:text-white'}`}
           >
            Pokédex
           </button>
           <button 
            onClick={() => {setBattleP1(null); setBattleP2(null); setView('battle');}} 
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${isBattleView ? 'bg-[#FF6B6B] text-white' : 'text-slate-400 hover:text-white'}`}
           >
            Battle
           </button>
        </div>

        {/* Generate Section */}
        <div className="flex flex-col items-center gap-4">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className={`group relative w-24 h-24 rounded-full bg-gradient-to-br from-[#00CED1] to-[#0066CC] flex items-center justify-center p-1 transition-all hover:scale-110 active:scale-95 neon-shadow-turquoise ${loading ? 'animate-pulse' : ''}`}
            aria-label="Generate Random Pokemon"
          >
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center relative overflow-hidden">
               <Lucide.RefreshCw className={`w-10 h-10 text-white ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            </div>
            <div className="absolute -inset-2 border-2 border-[#00CED1]/30 rounded-full animate-ping pointer-events-none" />
          </button>
          <span className="font-display font-bold text-xs uppercase tracking-[0.2em] text-[#00CED1]">Générer Aléatoire</span>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text" 
            placeholder="Nom ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pl-12 focus:outline-none focus:border-[#00CED1] focus:ring-1 focus:ring-[#00CED1] transition-all text-sm text-white placeholder:text-slate-500"
          />
          <Lucide.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00CED1] transition-colors" />
        </form>

        {/* Favorites Grid (2x3) */}
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Lucide.Star className="w-3 h-3 text-yellow-400" /> Favoris
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => {
              const fav = favorites[i];
              return (
                <div 
                  key={i} 
                  onClick={() => fav && setCurrentPokemon(fav)}
                  className={`aspect-square rounded-xl flex items-center justify-center border transition-all cursor-pointer overflow-hidden ${fav ? 'glass-bright border-white/20 hover:scale-105' : 'border-dashed border-white/5'}`}
                  title={fav ? fav.name : "Slot vide"}
                >
                  {fav ? (
                    <img src={fav.sprites.front_default} alt={fav.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Lucide.Plus className="w-4 h-4 text-white/10" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* History Timeline */}
        <section className="flex-1 min-h-0 overflow-y-auto">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-sm py-1 z-10">
            <Lucide.History className="w-3 h-3" /> Historique
          </h3>
          <div className="space-y-4 pl-2 border-l border-white/5">
            {history.map((item, idx) => (
              <div 
                key={`${item.pokemon.id}-${idx}`} 
                onClick={() => setCurrentPokemon(item.pokemon)}
                className="relative flex items-center gap-3 group cursor-pointer"
              >
                <div className="absolute -left-[9px] w-2 h-2 rounded-full bg-white/10 group-hover:bg-[#00CED1] transition-colors" />
                <div className="w-10 h-10 rounded-lg bg-white/5 p-1 flex-shrink-0">
                  <img src={item.pokemon.sprites.front_default} alt={item.pokemon.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold capitalize group-hover:text-[#00CED1] transition-colors text-white truncate">{item.pokemon.name}</span>
                  <span className="text-[10px] text-slate-500">#{item.pokemon.id.toString().padStart(3, '0')}</span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-[10px] text-slate-600 italic">Aucun historique</p>
            )}
          </div>
        </section>
      </aside>

      {/* ZONE PRINCIPALE (70%) */}
      <main className="flex-1 p-6 md:p-12 relative flex flex-col items-center justify-center min-h-screen overflow-y-auto bg-transparent">
        
        {loading ? (
          <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="w-24 h-24 rounded-full border-4 border-t-[#00CED1] border-white/10 animate-spin" />
            <p className="font-display font-bold tracking-widest text-[#00CED1]">DÉCOUVERTE...</p>
          </div>
        ) : currentPokemon ? (
          <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* Pokemon Card (Left) */}
            <div className="relative group perspective-1000">
              <div className="tilt-card relative aspect-[3/4] rounded-[2rem] glass p-8 flex flex-col items-center justify-between border-2 border-white/5 group-hover:border-[#00CED1]/30 transition-all shadow-2xl overflow-hidden">
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00CED1]/10 blur-[100px] pointer-events-none" />

                <div className="w-full flex justify-between items-start z-10">
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">{currentPokemon.name}</h2>
                   <span className="font-display text-xl font-bold text-white/20">#{currentPokemon.id.toString().padStart(3, '0')}</span>
                </div>

                <div className="relative flex-1 flex items-center justify-center w-full">
                  <img 
                    src={isShiny ? (currentPokemon.sprites.other['official-artwork'].front_shiny || currentPokemon.sprites.front_shiny) : (currentPokemon.sprites.other['official-artwork'].front_default || currentPokemon.sprites.front_default)} 
                    alt={currentPokemon.name} 
                    className="w-full h-full object-contain animate-float drop-shadow-[0_20px_50px_rgba(0,206,209,0.3)]"
                  />
                </div>

                <div className="w-full flex flex-wrap justify-center gap-3 z-10">
                  {currentPokemon.types.map(t => <TypeBadge key={t} type={t} />)}
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>

              {/* Quick Action Floating Overlay */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20">
                <button 
                  onClick={toggleFavorite}
                  className={`p-4 rounded-2xl glass-bright border border-white/10 transition-all hover:scale-110 active:scale-90 ${isFavorite ? 'text-yellow-400' : 'text-white'}`}
                  title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Lucide.Star fill={isFavorite ? "currentColor" : "none"} className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setIsShiny(!isShiny)}
                  className={`p-4 rounded-2xl glass-bright border border-white/10 transition-all hover:scale-110 active:scale-90 ${isShiny ? 'text-[#FFD700]' : 'text-white'}`}
                  title="Toggle Shiny version"
                >
                  <Lucide.Sparkles className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats & Actions (Right) */}
            <div className="flex flex-col gap-8">
              
              <div className="glass-bright rounded-3xl p-8 border border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#00CED1] mb-6 flex items-center gap-2">
                  <Lucide.BarChart3 className="w-4 h-4" /> Statistiques de Base
                </h3>
                <div className="space-y-4">
                  <StatBar label="HP" value={currentPokemon.stats.hp} color="bg-red-400" delay={0} />
                  <StatBar label="Attack" value={currentPokemon.stats.attack} color="bg-orange-400" delay={100} />
                  <StatBar label="Defense" value={currentPokemon.stats.defense} color="bg-blue-400" delay={200} />
                  <StatBar label="Sp. Atk" value={currentPokemon.stats.specialAttack} color="bg-purple-400" delay={300} />
                  <StatBar label="Sp. Def" value={currentPokemon.stats.specialDefense} color="bg-teal-400" delay={400} />
                  <StatBar label="Speed" value={currentPokemon.stats.speed} color="bg-yellow-400" delay={500} />
                </div>
              </div>

              {/* Main Actions */}
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={addToTeam}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-white"
                >
                  <Lucide.PlusCircle className="w-6 h-6 text-[#FF6B6B]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Équipe</span>
                </button>
                <button 
                  onClick={handleCompare}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-white"
                >
                  <Lucide.Swords className="w-6 h-6 text-[#FFD700]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Combat</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl glass hover:bg-white/10 transition-all border border-white/5 active:scale-95 text-white"
                >
                  <Lucide.Share2 className="w-6 h-6 text-sky-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Partager</span>
                </button>
              </div>

              {/* Extra Info */}
              <div className="flex gap-4">
                <div className="flex-1 glass p-4 rounded-2xl flex items-center gap-4">
                  <Lucide.Ruler className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Taille</p>
                    <p className="font-display font-bold text-white">{currentPokemon.height / 10} m</p>
                  </div>
                </div>
                <div className="flex-1 glass p-4 rounded-2xl flex items-center gap-4">
                  <Lucide.Weight className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-500">Poids</p>
                    <p className="font-display font-bold text-white">{currentPokemon.weight / 10} kg</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center space-y-4 opacity-30">
            <Lucide.Search className="w-16 h-16 mx-auto" />
            <p className="font-display font-bold uppercase tracking-widest">Recherchez un Pokémon pour commencer</p>
          </div>
        )}

        {/* TEAM BUILDER DRAWER */}
        <div 
          className={`fixed bottom-0 left-0 right-0 glass border-t border-white/10 transition-transform duration-500 z-50 ${showTeam ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}
        >
          {/* Handle */}
          <button 
            onClick={() => setShowTeam(!showTeam)}
            className="w-full h-12 flex items-center justify-center hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Lucide.Users className={`w-4 h-4 transition-colors ${team.length > 0 ? 'text-[#FF6B6B]' : 'text-slate-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-[#00CED1]">Team Builder ({team.length}/6)</span>
              <Lucide.ChevronUp className={`w-4 h-4 transition-transform text-white ${showTeam ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Slots */}
          <div className="max-w-7xl mx-auto px-6 pb-10 pt-4 grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => {
              const member = team[i];
              return (
                <div 
                  key={i} 
                  className={`aspect-square rounded-2xl border flex items-center justify-center relative group transition-all ${member ? 'glass-bright border-white/20' : 'border-dashed border-white/10'}`}
                >
                  {member ? (
                    <>
                      <img src={member.sprites.front_default} alt={member.name} className="w-4/5 h-4/5 object-contain" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFromTeam(member.id); }}
                        className="absolute -top-2 -right-2 p-1 bg-[#FF6B6B] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove from team"
                      >
                        <Lucide.X className="w-3 h-3 text-white" />
                      </button>
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <p className="text-[8px] font-bold uppercase text-white/40 truncate px-2">{member.name}</p>
                      </div>
                    </>
                  ) : (
                    <Lucide.Plus className="w-5 h-5 text-white/5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Mobile Sticky Generate (Only small screens) */}
      <div className="fixed bottom-16 right-6 md:hidden z-40">
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00CED1] to-[#0066CC] shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Generate Random Pokemon"
        >
          <Lucide.RefreshCw className={`w-8 h-8 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

    </div>
  );
};

export default App;
