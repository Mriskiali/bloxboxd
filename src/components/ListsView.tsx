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
  Trash2,
  Pencil
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
    updateList,
    deleteList,
    clearAllLists,
    showConfirm,
    user,
    backToCatalog,
    setLoginModalOpen,
    viewUserProfile,
    language,
    t
  } = useApp();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isRanked, setIsRanked] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [gameSearch, setGameSearch] = useState('');

  const currentList = selectedListId ? customLists.find(l => l.id === selectedListId) : null;

  const handleOpenCreate = () => {
    setEditingListId(null);
    setNewTitle('');
    setNewDesc('');
    setIsRanked(true);
    setSelectedGameIds([]);
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (list: CustomList) => {
    setEditingListId(list.id);
    setNewTitle(list.title);
    setNewDesc(list.description || '');
    setIsRanked(Boolean(list.isRanked));
    setSelectedGameIds(list.items.map(it => it.gameId));
    setCreateModalOpen(true);
  };

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || selectedGameIds.length === 0) return;

    if (editingListId) {
      updateList(editingListId, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        isRanked,
        isPublic: true,
        gameIds: selectedGameIds
      });
    } else {
      createList({
        title: newTitle.trim(),
        description: newDesc.trim(),
        isRanked,
        isPublic: true,
        gameIds: selectedGameIds
      });
    }

    setNewTitle('');
    setNewDesc('');
    setSelectedGameIds([]);
    setEditingListId(null);
    setCreateModalOpen(false);
  };

  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const renderListModal = () => {
    if (!createModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-panel border border-line rounded-[3px] p-5 sm:p-6 shadow-[0_16px_40px_rgba(0,0,0,0.65)] space-y-4 my-8 max-h-[92vh] flex flex-col"
        >
          <div className="flex items-center justify-between border-b border-line pb-3 flex-shrink-0">
            <h3 className="bb-label">{editingListId ? t('modal_edit_list_title') : t('modal_create_list_title')}</h3>
            <button 
              onClick={() => setCreateModalOpen(false)}
              className="text-muted hover:text-white p-1 rounded-[2px] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveList} className="space-y-4 overflow-y-auto pr-1 flex-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1">
                {t('modal_create_list_name')}
              </label>
              <input
                type="text"
                required
                placeholder={t('modal_create_list_name_ph')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-bg border border-line rounded-[2px] px-3.5 py-2 text-xs text-white focus:border-green outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1">
                {t('modal_create_list_desc')}
              </label>
              <textarea
                rows={3}
                placeholder={t('modal_create_list_desc_ph')}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-bg border border-line rounded-[2px] px-3.5 py-2 text-xs text-white focus:border-green outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rankedCheck"
                checked={isRanked}
                onChange={(e) => setIsRanked(e.target.checked)}
                className="rounded border-line bg-panel text-green focus:ring-0 cursor-pointer"
              />
              <label htmlFor="rankedCheck" className="text-xs font-medium text-ink cursor-pointer">
                {t('modal_create_list_ranked')}
              </label>
            </div>

            {/* Select experiences */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.08em] text-ink mb-1.5">
                {language === 'id' ? `Pilih Game (${selectedGameIds.length} dipilih)` : `Select Experiences (${selectedGameIds.length} chosen)`}
              </label>
              <input
                type="text"
                placeholder={t('modal_create_list_search_ph')}
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                className="w-full bg-bg border border-line rounded-[2px] px-3 py-1.5 text-xs text-white mb-2"
              />

              <div className="max-h-48 overflow-y-auto space-y-1 bg-bg p-2 rounded-[3px] border border-line">
                {games
                  .filter(g => g.name.toLowerCase().includes(gameSearch.toLowerCase()))
                  .map(g => {
                    const isSelected = selectedGameIds.includes(g.id);
                    return (
                      <div
                        key={g.id}
                        onClick={() => toggleGameSelection(g.id)}
                        className={`flex items-center justify-between p-2 rounded-[2px] cursor-pointer text-xs transition-colors ${
                          isSelected ? 'bg-green/15 text-white border border-green/30' : 'hover:bg-panel-2 text-ink'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={safeImgSrc(g.iconUrl)} alt={g.name} className="w-7 h-7 rounded object-cover flex-shrink-0" />
                          <span className="font-semibold truncate">{g.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-green flex-shrink-0 ml-2" />}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-line flex-shrink-0">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:text-white cursor-pointer"
              >
                {t('modal_create_list_cancel')}
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim() || selectedGameIds.length === 0}
                className="bb-btn bb-btn-primary min-h-[36px]"
              >
                <Check className="w-4 h-4" />
                <span>{editingListId ? t('modal_edit_list_save') : t('modal_create_list_save')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // If in list detail mode
  if (activeTab === 'list-detail' && currentList) {
    return (
    <>
      <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Back navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 border border-line hover:border-green text-xs font-semibold text-ink hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-green" />
            <span>{t('lists_back_catalog')}</span>
          </button>
          <button
            onClick={() => setActiveTab('lists')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 border border-line text-xs font-semibold text-ink hover:text-white transition-colors cursor-pointer"
          >
            <span>{t('lists_back_all')}</span>
          </button>
        </div>

        {/* List Header */}
        <div className="bg-panel border border-line rounded-[3px] p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.08em] ${
                currentList.isRanked ? 'bg-green/15 text-green' : 'bg-blue/15 text-blue'
              }`}>
                {currentList.isRanked ? t('lists_ranked_label') : t('lists_unranked_label')}
              </span>
              <span className="text-xs text-muted">
                {currentList.items.length} {t('lists_games_count')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => likeList(currentList.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] border text-xs font-semibold transition-colors cursor-pointer ${
                  currentList.isLiked
                    ? 'bg-orange/15 text-orange border-orange/30'
                    : 'bg-panel hover:bg-orange/15 text-ink hover:text-orange border-line'
                }`}
                title={currentList.isLiked ? (language === 'id' ? 'Batal Suka' : 'Unlike') : (language === 'id' ? 'Suka List' : 'Like')}
              >
                <Heart className={`w-3.5 h-3.5 ${currentList.isLiked ? 'fill-orange text-orange' : 'fill-current'}`} />
                <span>{currentList.likesCount} {t('lists_like')}</span>
              </button>

              {user && currentList.userId === user.id && (
                <>
                  <button
                    onClick={() => handleOpenEdit(currentList)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-panel hover:bg-panel-2 text-ink hover:text-white border border-line text-xs font-semibold transition-colors cursor-pointer"
                    title={t('lists_edit_btn')}
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue" />
                    <span>{t('lists_edit_btn')}</span>
                  </button>

                  <button
                    onClick={() => {
                      showConfirm({
                        title: language === 'id' ? 'Hapus Daftar Game' : 'Delete Game List',
                        message: t('lists_delete_confirm'),
                        confirmText: language === 'id' ? 'Ya, Hapus' : 'Yes, Delete',
                        isDestructive: true,
                        onConfirm: () => deleteList(currentList.id)
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    title={t('lists_delete_btn')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('lists_delete_btn')}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <h1 className="bb-display text-[26px] sm:text-[30px]">
            {currentList.title}
          </h1>

          <p className="text-sm text-ink leading-relaxed max-w-3xl">
            {currentList.description}
          </p>

          <div 
            onClick={() => currentList.userId && viewUserProfile(currentList.userId)}
            className="flex items-center gap-2.5 pt-3 border-t border-line cursor-pointer group w-fit"
          >
            <img
              src={safeAvatarSrc(currentList.userAvatar)}
              alt={currentList.userName}
              className="h-7 w-7 rounded-full border border-line object-cover"
            />
            <span className="text-xs text-muted group-hover:text-white transition-colors">
              {t('lists_curated_by')} <strong className="text-white group-hover:text-green transition-colors">{currentList.userName}</strong>
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
                className="bg-panel border border-line hover:border-green/40 rounded-[3px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors group"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  {/* Position number */}
                  <span className="text-xl sm:text-2xl font-semibold text-muted group-hover:text-green w-8 text-center flex-shrink-0 transition-colors">
                    {currentList.isRanked ? `#${item.position}` : '•'}
                  </span>

                  {/* Game Poster */}
                  <img
                    src={safeImgSrc(game.iconUrl)}
                    alt={game.name}
                    onClick={() => viewGame(game.id)}
                    className="w-16 h-16 rounded-[3px] object-cover cursor-pointer flex-shrink-0 border border-white/10  transition-transform"
                  />

                  {/* Title & Notes */}
                  <div className="min-w-0">
                    <h3
                      onClick={() => viewGame(game.id)}
                      className="text-base font-bold text-white hover:text-green cursor-pointer transition-colors truncate"
                    >
                      {game.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {game.creatorName} • {game.genre} • <span className="text-green">{game.ratingAverage.toFixed(1)} ★</span>
                    </p>
                    {item.notes && (
                      <p className="text-xs text-ink mt-2 italic bg-bg p-2.5 rounded-[2px] border border-line">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => viewGame(game.id)}
                    className="px-3 py-1.5 rounded-[2px] bg-green/10 hover:bg-green text-green hover:text-black text-xs font-bold transition-colors"
                  >
                    {language === 'id' ? 'Lihat Detail' : 'View Details'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {renderListModal()}
    </>
    );
  }

  // All Lists Browser View
  return (
    <div className="min-h-screen pb-20 max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue" />
            <h1 className="bb-display text-[26px] sm:text-[30px]">
              {t('lists_title')}
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            {t('lists_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={backToCatalog}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[3px] bg-panel hover:bg-panel-2 border border-line hover:border-green text-xs font-semibold text-ink hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-green" />
            <span>{t('lists_back_catalog')}</span>
          </button>

          {customLists.length > 0 && (
            <button
              onClick={() => {
                showConfirm({
                  title: language === 'id' ? 'Bersihkan Semua List' : 'Clear All Lists',
                  message: t('lists_clear_confirm'),
                  confirmText: language === 'id' ? 'Ya, Bersihkan' : 'Yes, Clear All',
                  isDestructive: true,
                  onConfirm: () => clearAllLists()
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-[3px] bg-panel hover:bg-red-500/20 border border-line hover:border-red-500/40 text-xs font-semibold text-ink hover:text-red-400 transition-colors cursor-pointer"
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
                handleOpenCreate();
              }
            }}
            className="bb-btn bb-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>{t('lists_create_btn')}</span>
          </button>
        </div>
      </div>

      {/* Grid of Lists or Empty State */}
      {customLists.length === 0 ? (
        <div className="border-y border-line py-16 text-center">
          <h3 className="bb-display text-[24px]">{t('lists_empty_title')}</h3>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-muted">
            {t('lists_empty_desc')}
          </p>
          <button
            onClick={() => {
              if (!user) {
                setLoginModalOpen(true);
              } else {
                setCreateModalOpen(true);
              }
            }}
            className="bb-btn bb-btn-primary"
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
              className="bg-panel border border-line hover:border-blue/50 rounded-[3px] p-5 cursor-pointer transition-colors duration-300 hover:shadow-xl group flex flex-col justify-between"
            >
              <div>
                {/* 3-Poster Overlapping Preview */}
                <div className="flex items-center -space-x-3 mb-4 overflow-hidden py-1">
                  {previewGames.map((game, i) => (
                    <img
                      key={game.id}
                      src={safeImgSrc(game.iconUrl)}
                      alt={game.name}
                      className="w-16 h-16 rounded-[3px] object-cover border-2 border-panel group- transition-transform"
                      style={{ zIndex: 3 - i }}
                    />
                  ))}
                  <div className="w-16 h-16 rounded-[3px] bg-panel-2 border-2 border-panel flex items-center justify-center text-xs font-bold text-muted">
                    +{list.items.length}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-[0.08em] ${
                    list.isRanked ? 'bg-green/15 text-green' : 'bg-blue/15 text-blue'
                  }`}>
                    {list.isRanked ? t('lists_ranked_label') : t('lists_unranked_label')}
                  </span>
                  <span className="text-xs text-muted">
                    {list.items.length} {t('lists_games_count')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue transition-colors line-clamp-1">
                  {list.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">
                  {list.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-line text-xs">
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
                    className="w-5 h-5 rounded-full object-cover group-hover/creator:ring-1 group-hover/creator:ring-green"
                  />
                  <span className="text-muted font-medium truncate max-w-[150px] group-hover/creator:text-green transition-colors">
                    {list.userName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      likeList(list.id);
                    }}
                    className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer text-xs ${
                      list.isLiked ? 'text-orange' : 'text-muted hover:text-orange'
                    }`}
                    title={list.isLiked ? (language === 'id' ? 'Batal Suka' : 'Unlike') : (language === 'id' ? 'Suka List' : 'Like')}
                  >
                    <Heart className={`w-3.5 h-3.5 ${list.isLiked ? 'fill-orange text-orange' : ''}`} />
                    <span>{list.likesCount}</span>
                  </button>
                  {user && list.userId === user.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(list);
                        }}
                        className="p-1 rounded-[2px] text-faint hover:text-blue hover:bg-blue/10 transition-colors cursor-pointer"
                        title={t('lists_edit_btn')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showConfirm({
                            title: language === 'id' ? 'Hapus Daftar Game' : 'Delete Game List',
                            message: t('lists_delete_confirm'),
                            confirmText: language === 'id' ? 'Ya, Hapus' : 'Yes, Delete',
                            isDestructive: true,
                            onConfirm: () => deleteList(list.id)
                          });
                        }}
                        className="p-1 rounded-[2px] text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title={t('lists_delete_btn')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

{renderListModal()}
    </div>
  );
};