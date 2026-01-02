
import { Pokemon } from '../types';

const BASE_URL = 'https://pokeapi.co/api/v2';

export const getPokemon = async (idOrName: string | number): Promise<Pokemon> => {
  const response = await fetch(`${BASE_URL}/pokemon/${idOrName.toString().toLowerCase()}`);
  if (!response.ok) throw new Error('Pokemon not found');
  const data = await response.json();
  
  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t: any) => t.type.name),
    height: data.height,
    weight: data.weight,
    stats: {
      hp: data.stats[0].base_stat,
      attack: data.stats[1].base_stat,
      defense: data.stats[2].base_stat,
      specialAttack: data.stats[3].base_stat,
      specialDefense: data.stats[4].base_stat,
      speed: data.stats[5].base_stat,
    },
    sprites: data.sprites,
  };
};

export const getRandomPokemonId = () => Math.floor(Math.random() * 1010) + 1;
