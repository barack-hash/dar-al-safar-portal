import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Settings2, 
  ChevronRight, 
  Save, 
  Eye, 
  Edit3, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  MapPin,
  Type,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WorkspaceState, BudgetLevel, Priority, EditorialCategory } from '../types';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';

export const EditorialWorkspace: React.FC = () => {
  const { isViewer } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const [form, setForm] = useState<WorkspaceState>({
    title: 'The Hidden Oases of AlUla',
    content: `# The Hidden Oases of AlUla\n\nExperience the timeless beauty of the desert. AlUla is a place of history and mystery...\n\n### Key Highlights\n- Ancient Hegra\n- Elephant Rock\n- Old Town AlUla\n\n> "A journey of a thousand miles begins with a single step."`,
    destination: 'Saudi Arabia',
    travelDates: '2026-05-12 to 2026-05-20',
    budgetLevel: 'Premium',
    priority: 'High',
    category: 'Article'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success('Draft saved successfully', {
      description: `"${form.title}" has been updated in the library.`,
    });
  };

  const handleMagicEnhance = () => {
    if (isEnhancing) return;
    
    setIsEnhancing(true);
    
    setTimeout(() => {
      const replacements: { [key: string]: string } = {
        'good': 'exquisite',
        'nice': 'unrivaled',
        'great': 'magnificent',
        'beautiful': 'ethereal',
        'pretty': 'stunning',
        'very': 'exceptionally',
        'really': 'profoundly'
      };

      let newContent = form.content;
      
      // Apply regex map for word upgrades
      Object.entries(replacements).forEach(([word, replacement]) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        newContent = newContent.replace(regex, (match) => {
          // Preserve capitalization
          if (match[0] === match[0].toUpperCase()) {
            return replacement.charAt(0).toUpperCase() + replacement.slice(1);
          }
          return replacement;
        });
      });

      // Prepend luxury Executive Summary
      const executiveSummary = `> ### DASA Executive Summary\n> *This narrative has been curated to reflect the Dar Al Safar signature style. It emphasizes the ethereal qualities of the ${form.destination} landscape, ensuring an unrivaled experience for the ultra-luxury traveler.*\n\n---\n\n`;
      
      if (!newContent.includes('DASA Executive Summary')) {
        newContent = executiveSummary + newContent;
      }

      setForm(prev => ({ ...prev, content: newContent }));
      setIsEnhancing(false);
      toast.success('Narrative enhanced with DASA Signature Style.');
    }, 2000);
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-6">
      {/* Workspace Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sand-gold/10 rounded-2xl text-sand-gold">
            <Edit3 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-light text-charcoal tracking-tight">Editorial Workspace</h2>
            <p className="text-charcoal/50 text-sm">Crafting the next great desert narrative.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-xl transition-all ${isSidebarOpen ? 'bg-sand-gold text-white' : 'bg-white border border-charcoal/10 text-charcoal/60 hover:border-sand-gold/50'}`}
          >
            <Settings2 size={20} />
          </button>
          {!isViewer && (
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-charcoal text-white rounded-xl hover:bg-charcoal/90 transition-all text-sm font-medium"
            >
              <Save size={18} />
              Save Draft
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 relative overflow-hidden">
        {/* Main Editor/Preview Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-charcoal/5 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal/5">
            <div className="flex p-1 bg-charcoal/5 rounded-xl">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'}`}
              >
                <Edit3 size={14} />
                Editor
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/40 hover:text-charcoal'}`}
              >
                <Eye size={14} />
                Traveler View
              </button>
            </div>

            {!isViewer && (
              <button 
                onClick={handleMagicEnhance}
                disabled={isEnhancing}
                className={`group relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all overflow-hidden ${isEnhancing ? 'bg-sand-gold text-white cursor-wait' : 'bg-sand-gold/10 text-sand-gold hover:bg-sand-gold hover:text-white'}`}
              >
                {isEnhancing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      AI Polishing...
                    </motion.span>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="group-hover:animate-pulse" />
                    Magic Enhance
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Editor Pane */}
            <div className={`flex-1 p-8 overflow-y-auto border-r border-charcoal/5 transition-all duration-500 ${activeTab === 'preview' ? 'hidden md:block opacity-40 grayscale' : 'block'}`}>
              <input 
                name="title"
                value={form.title}
                onChange={handleInputChange}
                disabled={isViewer}
                className="w-full text-3xl font-light text-charcoal tracking-tight bg-transparent border-none focus:ring-0 mb-6 placeholder:text-charcoal/10 disabled:cursor-not-allowed"
                placeholder="Enter title..."
              />
              <textarea 
                name="content"
                value={form.content}
                onChange={handleInputChange}
                disabled={isViewer}
                className="w-full h-full text-charcoal/80 leading-relaxed bg-transparent border-none focus:ring-0 resize-none font-mono text-sm placeholder:text-charcoal/10 disabled:cursor-not-allowed"
                placeholder="Start writing your story in markdown..."
              />
            </div>

            {/* Preview Pane */}
            <div className={`flex-1 p-8 overflow-y-auto bg-off-white/30 transition-all duration-500 ${activeTab === 'edit' ? 'hidden md:block opacity-40 grayscale' : 'block'}`}>
              <div className="max-w-2xl mx-auto prose prose-sm prose-stone">
                <div className="mb-8">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-sand-gold font-bold">{form.destination}</span>
                  <h1 className="text-4xl font-light text-charcoal tracking-tight mt-2">{form.title}</h1>
                  <div className="h-px w-16 bg-sand-gold mt-4" />
                </div>
                <div className="markdown-body">
                  <ReactMarkdown>{form.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide-out Metadata Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 glass-dark rounded-3xl p-8 flex flex-col gap-8 shadow-2xl z-30"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-off-white font-medium tracking-wide">Concierge Metadata</h3>
                <button onClick={() => setIsSidebarOpen(false)} className="text-off-white/40 hover:text-off-white">
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Destination */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-off-white/40 font-bold">
                    <MapPin size={12} />
                    Destination
                  </label>
                  <input 
                    name="destination"
                    value={form.destination}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-off-white focus:border-sand-gold/50 transition-all"
                  />
                </div>

                {/* Travel Dates */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-off-white/40 font-bold">
                    <Calendar size={12} />
                    Travel Dates
                  </label>
                  <input 
                    name="travelDates"
                    value={form.travelDates}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-off-white focus:border-sand-gold/50 transition-all"
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-off-white/40 font-bold">
                    <Type size={12} />
                    Category
                  </label>
                  <select 
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-off-white focus:border-sand-gold/50 transition-all appearance-none"
                  >
                    <option value="Article">Article</option>
                    <option value="Itinerary">Itinerary</option>
                    <option value="Media">Media</option>
                  </select>
                </div>

                {/* Budget Level */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-off-white/40 font-bold">
                    <DollarSign size={12} />
                    Budget Level
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['Standard', 'Premium', 'Ultra-Luxury'] as BudgetLevel[]).map(level => (
                      <button
                        key={level}
                        onClick={() => setForm(prev => ({ ...prev, budgetLevel: level }))}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all text-left ${form.budgetLevel === level ? 'bg-sand-gold text-charcoal' : 'bg-white/5 text-off-white/60 hover:bg-white/10'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-off-white/40 font-bold">
                    <AlertCircle size={12} />
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${form.priority === p ? 'bg-off-white text-charcoal' : 'bg-white/5 text-off-white/40 hover:bg-white/10'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto p-4 bg-sand-gold/10 rounded-2xl border border-sand-gold/20">
                <p className="text-[10px] text-sand-gold font-bold uppercase tracking-widest mb-1">Efficiency Tip</p>
                <p className="text-[10px] text-off-white/40 leading-relaxed">Changes are synced in real-time across the editorial grid.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
