import React, { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { MOCK_EDITORIAL_ITEMS, EditorialStatus, EditorialCategory } from '../types';
import { EditorialCard } from './EditorialCard';
import { motion, AnimatePresence } from 'motion/react';

export const EditorialLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EditorialStatus | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EditorialCategory | null>(null);

  const destinations = useMemo(() => 
    Array.from(new Set(MOCK_EDITORIAL_ITEMS.map(item => item.destination))),
  []);

  const filteredItems = useMemo(() => {
    return MOCK_EDITORIAL_ITEMS.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
                          item.destination.toLowerCase().includes(search.toLowerCase()) ||
                          item.author.toLowerCase().includes(search.toLowerCase());
      const matchesDestination = !selectedDestination || item.destination === selectedDestination;
      const matchesStatus = !selectedStatus || item.status === selectedStatus;
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      return matchesSearch && matchesDestination && matchesStatus && matchesCategory;
    });
  }, [search, selectedDestination, selectedStatus, selectedCategory]);

  const clearFilters = () => {
    setSearch('');
    setSelectedDestination(null);
    setSelectedStatus(null);
    setSelectedCategory(null);
  };

  const hasActiveFilters = search || selectedDestination || selectedStatus || selectedCategory;

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-light text-charcoal tracking-tight">Editorial Library</h2>
          <p className="text-charcoal/50 text-sm">Manage and curate your desert narratives.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
            <input 
              type="text" 
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-charcoal/10 rounded-xl text-sm focus:ring-1 focus:ring-sand-gold transition-all"
            />
          </div>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="flex items-center gap-2 text-xs text-sand-gold hover:text-charcoal transition-colors font-medium"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-charcoal/40 mr-2">
          <Filter size={14} />
          <span className="text-[10px] uppercase tracking-widest font-bold">Filters:</span>
        </div>

        {/* Destination Filter */}
        <div className="flex flex-wrap gap-2">
          {destinations.map(dest => (
            <button
              key={dest}
              onClick={() => setSelectedDestination(selectedDestination === dest ? null : dest)}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                selectedDestination === dest 
                  ? 'bg-sand-gold text-white shadow-md' 
                  : 'bg-white text-charcoal/60 border border-charcoal/5 hover:border-sand-gold/30'
              }`}
            >
              {dest}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-charcoal/10 mx-2" />

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['Draft', 'Published', 'Archived'] as EditorialStatus[]).map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(selectedStatus === status ? null : status)}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                selectedStatus === status 
                  ? 'bg-charcoal text-white' 
                  : 'bg-white text-charcoal/60 border border-charcoal/5 hover:border-sand-gold/30'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-charcoal/10 mx-2" />

        {/* Category Filter */}
        <div className="flex gap-2">
          {(['Article', 'Itinerary', 'Media'] as EditorialCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-sand-gold text-white' 
                  : 'bg-white text-charcoal/60 border border-charcoal/5 hover:border-sand-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <EditorialCard key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredItems.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-32 bg-white rounded-[2rem] border border-dashed border-charcoal/10 flex flex-col items-center justify-center"
        >
          <div className="w-24 h-24 bg-sand-gold/5 rounded-full flex items-center justify-center mb-6 relative">
            <Search size={40} className="text-sand-gold/20" />
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-charcoal/5"
            >
              <Filter size={16} className="text-sand-gold" />
            </motion.div>
          </div>
          <h3 className="text-xl font-light text-charcoal mb-2 tracking-tight">No Narratives Found</h3>
          <p className="text-charcoal/30 text-sm max-w-xs mx-auto leading-relaxed">
            Your current filters didn't yield any results. Try adjusting your search or clearing the filters.
          </p>
          <button 
            onClick={clearFilters}
            className="mt-8 px-8 py-3 bg-charcoal text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sand-gold transition-all shadow-lg hover:shadow-sand-gold/20"
          >
            Reset All Filters
          </button>
        </motion.div>
      )}
    </div>
  );
};
