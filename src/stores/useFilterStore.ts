import { create } from 'zustand';
import { SortOption } from '../types';

interface FilterState {
  searchQuery: string;
  selectedGenre: string;
  sortBy: SortOption;
  minRating: number;
  minPlayers: number;
  setSearchQuery: (query: string) => void;
  setSelectedGenre: (genre: string) => void;
  setSortBy: (sort: SortOption) => void;
  setMinRating: (rating: number) => void;
  setMinPlayers: (players: number) => void;
  resetAllFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  selectedGenre: 'All',
  sortBy: 'popular',
  minRating: 0,
  minPlayers: 0,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedGenre: (genre) => set({ selectedGenre: genre }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setMinRating: (rating) => set({ minRating: rating }),
  setMinPlayers: (players) => set({ minPlayers: players }),
  resetAllFilters: () => set({
    searchQuery: '',
    selectedGenre: 'All',
    sortBy: 'popular',
    minRating: 0,
    minPlayers: 0
  })
}));
