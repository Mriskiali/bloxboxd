import React, { useState } from 'react';
import { 
  ListOrdered, 
  Plus, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Award, 
  Check, 
  X, 
  Sparkles,
  Search,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CustomList, safeImgSrc, safeAvatarSrc } from '../types';

export const ListsView: React.FC = () => {
  const { 
    customLists, 
    selectedListId, 
    viewList, 
    viewGame, 
    getGameById, 
    setActiveTab, 
    likeList, 
    activeTab,
    games,
    createList,
    deleteList,
    clearAllLists,
    user,
    backToCatalog,
    setLoginModalOpen,
    viewUserProfile,
    language,
    t
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRanked, setIsRanked] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [gameSearch, setGameSearch] = useState('');

  const currentList = selectedListId ? customLists.find(l => l.id === selectedListId) : null;

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || selectedGameIds.length === 0) return;

    createList({
      title: newTitle.trim(),
      description: newDesc.trim(),
      isRanked,
      isPublic: true,
      gameIds: selectedGameIds
    });

    setNewTitle('');
    setNewDesc('');
    setSelectedGameIds([]);
    setCreateModalOpen(false);
  };

  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  // If in list detail mode
  if (activeTab === 'list-detail' && currentList) {
    return (
      <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Back navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181e24] hover:bg-[#232c37] border border-[#27323e] hover:border-[#00E59B] text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00E59B]" />
            <span>{t('lists_back_catalog')}</span>
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181e24] hover:bg-[#232c37] border border-[#27323e] text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <span>{t('lists_back_all')}</span>
          </button>
        </div>

        {/* List Header */}
        <div className="bg-[#181e24] border border-[#26313d] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                currentList.isRanked ? 'bg-[#00E59B]/15 text-[#00E59B]' : 'bg-[#00A2FF]/15 text-[#00A2FF]'
              }`}>
                {currentList.isRanked ? t('lists_ranked_label') : t('lists_unranked_label')}
              </span>
              <span className="text-xs text-gray-400">
                {currentList.items.length} {t('lists_games_count')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => likeList(currentList.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#222a33] hover:bg-rose-500/15 text-gray-300 hover:text-rose-400 border border-[#2f3a47] text-xs font-semibold transition-colors"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{currentList.likesCount} {t('lists_like')}</span>
              </button>

              <button
                onClick={() => {
                  deleteList(currentList.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                title={t('lists_delete_btn')}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('lists_delete_btn')}</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {currentList.title}
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
            {currentList.description}
          </p>

          <div 
            onClick={() => currentList.userId && viewUserProfile(currentList.userId)}
            className="flex items-center gap-2.5 pt-3 border-t border-[#232b35] cursor-pointer group w-fit"
          >
            <img
              src={safeAvatarSrc(currentList.userAvatar)}
              alt={currentList.userName}
              className="w-7 h-7 rounded-full object-cover group-hover:ring-2 group-hover:ring-[#00E59B] transition-all"
            />
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
              {t('lists_curated_by')} <strong className="text-white group-hover:text-[#00E59B] transition-colors">{currentList.userName}</strong>
            </span>
          </div>
        </div>

        {/* List Items */}
        <div className="space-y-4">
          {currentList.items.map((item, index) => {
            const game = getGameById(item.gameId);
            if (!game) return null;

            return (
              <div
                key={item.id}
                className="bg-[#181e24] border border-[#26313d] hover:border-[#00E59B]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  {/* Position number */}
                  <span className="text-xl sm:text-2xl font-black text-gray-400 group-hover:text-[#00E59B] w-8 text-center flex-shrink-0 transition-colors">
                    {currentList.isRanked ? `#${item.position}` : '•'}
                  </span>

                  {/* Game Poster */}
                  <img
                    src={safeImgSrc(game.iconUrl)}
                    alt={game.name}
                    onClick={() => viewGame(game.id)}
                    className="w-16 h-16 rounded-xl object-cover cursor-pointer flex-shrink-0 border border-white/10 hover:scale-105 transition-transform"
                  />

                  {/* Title & Notes */}
                  <div className="min-w-0">
                    <h3
                      onClick={() => viewGame(game.id)}
                      className="text-base font-bold text-white hover:text-[#00E59B] cursor-pointer transition-colors truncate"
                    >
                      {game.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {game.creatorName} • {game.genre} • <span className="text-[#00E59B]">{game.ratingAverage.toFixed(1)} ★</span>
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-300 mt-2 italic bg-[#14181c] p-2.5 rounded-lg border border-[#232b35]">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => viewGame(game.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#00E59B]/10 hover:bg-[#00E59B] text-[#00E59B] hover:text-black text-xs font-bold transition-all"
                  >
                    {language === 'id' ? 'Lihat Detail' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // All Lists Browser View
  return (
    <div className="min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252f3b] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-[#00A2FF]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('lists_title')}
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {t('lists_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#181e24] hover:bg-[#232c37] border border-[#27323e] hover:border-[#00E59B] text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#00E59B]" />
            <span>{t('lists_back_catalog')}</span>
          </button>

          {customLists.length > 0 && (
            <button
              onClick={() => clearAllLists()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1f2630] hover:bg-red-500/20 border border-[#2b3542] hover:border-red-500/40 text-xs font-semibold text-gray-300 hover:text-red-400 transition-all cursor-pointer"
              title={language === 'id' ? 'Hapus semua list' : 'Clear all lists'}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>{language === 'id' ? 'Bersihkan List' : 'Clear Lists'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!user) {
                setLoginModalOpen(true);
              } else {
                setCreateModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00A2FF] hover:bg-[#0092e6] text-white text-xs font-bold transition-all shadow-[0_0_16px_rgba(0,162,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>{t('lists_create_btn')}</span>
          </button>
        </div>
      </div>

      {/* Grid of Lists or Empty State */}
      {customLists.length === 0 ? (
        <div className="bg-[#181e24] border border-[#26313d] rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00A2FF]/10 flex items-center justify-center text-[#00A2FF]">
            <ListOrdered className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{t('lists_empty_title')}</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {t('lists_empty_desc')}
            </p>
          </div>
          <button
            onClick={() => {
              if (!user) {
                setLoginModalOpen(true);
              } else {
                setCreateModalOpen(true);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-[#00A2FF] hover:bg-[#0092e6] text-white text-xs font-bold transition-all shadow-md"
          >
            {language === 'id' ? 'Buat List Pertama' : 'Create First List'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customLists.map((list) => {
          // Preview covers of the top 3 items
          const previewGames = list.items
            .slice(0, 3)
            .map(it => getGameById(it.gameId))
            .filter((g): g is NonNullable<typeof g> => Boolean(g));

          return (
            <div
              key={list.id}
              onClick={() => viewList(list.id)}
              className="bg-[#181e24] border border-[#26313d] hover:border-[#00A2FF]/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl group flex flex-col justify-between"
            >
              <div>
                {/* 3-Poster Overlapping Preview */}
                <div className="flex items-center -space-x-3 mb-4 overflow-hidden py-1">
                  {previewGames.map((game, i) => (
                    <img
                      key={game.id}
                      src={safeImgSrc(game.iconUrl)}
                      alt={game.name}
                      className="w-16 h-16 rounded-xl object-cover border-2 border-[#181e24] shadow-lg group-hover:scale-105 transition-transform"
                      style={{ zIndex: 3 - i }}
                    />
                  ))}
                  <div className="w-16 h-16 rounded-xl bg-[#202833] border-2 border-[#181e24] flex items-center justify-center text-xs font-bold text-gray-400">
                    +{list.items.length}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    list.isRanked ? 'bg-[#00E59B]/15 text-[#00E59B]' : 'bg-[#00A2FF]/15 text-[#00A2FF]'
                  }`}>
                    {list.isRanked ? t('lists_ranked_label') : t('lists_unranked_label')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {list.items.length} {t('lists_games_count')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-[#00A2FF] transition-colors line-clamp-1">
                  {list.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed">
                  {list.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#232b35] text-xs">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (list.userId) viewUserProfile(list.userId);
                  }}
                  className="flex items-center gap-2 cursor-pointer group/creator"
                >
                  <img
                    src={safeAvatarSrc(list.userAvatar)}
                    alt={list.userName}
                    className="w-5 h-5 rounded-full object-cover group-hover/creator:ring-1 group-hover/creator:ring-[#00E59B]"
                  />
                  <span className="text-gray-400 font-medium truncate max-w-[150px] group-hover/creator:text-[#00E59B] transition-colors">
                    {list.userName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-rose-400 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500" />
                    <span>{list.likesCount}</span>
                  </div>
                  {user && list.userId === user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteList(list.id);
                      }}
                      className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title={t('lists_delete_btn')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Create List Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#181e24] border border-[#2b3542] rounded-2xl p-6 shadow-2xl space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-[#232b35] pb-3">
              <h3 className="text-lg font-bold text-white">{t('modal_create_list_title')}</h3>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {t('modal_create_list_name')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('modal_create_list_name_ph')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3.5 py-2 text-xs text-white focus:border-[#00A2FF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {t('modal_create_list_desc')}
                </label>
                <textarea
                  rows={3}
                  placeholder={t('modal_create_list_desc_ph')}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#1b222a] border border-[#2b3542] rounded-lg px-3.5 py-2 text-xs text-white focus:border-[#00A2FF] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rankedCheck"
                  checked={isRanked}
                  onChange={(e) => setIsRanked(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#00A2FF]"
                />
                <label htmlFor="rankedCheck" className="text-xs font-medium text-gray-300 cursor-pointer">
                  {t('modal_create_list_ranked')}
                </label>
              </div>

              {/* Select experiences */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  {language === 'id' ? `Pilih Game (${selectedGameIds.length} dipilih)` : `Select Experiences (${selectedGameIds.length} chosen)`}
                </label>
                <input
                  type="text"
                  placeholder={t('modal_create_list_search_ph')}
                  value={gameSearch}
                  onChange={(e) => setGameSearch(e.target.value)}
                  className="w-full bg-[#14181c] border border-[#242d38] rounded-lg px-3 py-1.5 text-xs text-white mb-2"
                />

                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#14181c] p-2 rounded-xl border border-[#242d38]">
                  {games
                    .filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                    .map(g => {
                      const isSelected = selectedGameIds.includes(g.id);
                      return (
                        <div
                          key={g.id}
                          onClick={() => toggleGameSelection(g.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-[#00A2FF]/20 text-white' : 'hover:bg-[#1f2732] text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={safeImgSrc(g.iconUrl)} alt={g.name} className="w-7 h-7 rounded object-cover" />
                            <span className="font-semibold">{g.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#00A2FF]" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#232b35]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  {t('modal_create_list_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || selectedGameIds.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#00A2FF] hover:bg-[#0092e6] disabled:opacity-50 rounded-lg transition-all"
                >
                  {t('modal_create_list_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
