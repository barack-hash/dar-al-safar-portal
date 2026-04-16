import React from 'react';
import { MoreVertical, Edit, Eye, Share2, Clock, FileText } from 'lucide-react';
import { EditorialItem } from '../types';
import { motion } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { toast } from 'sonner';

interface EditorialCardProps {
  item: EditorialItem;
}

export const EditorialCard: React.FC<EditorialCardProps> = React.memo(({ item }) => {
  const { isViewer } = useUser();

  const handleStatusChange = (newStatus: string) => {
    toast.info(`Status updated to ${newStatus}`, {
      description: `"${item.title}" is now marked as ${newStatus}.`,
    });
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-700';
      case 'Draft': return 'bg-sand-gold/20 text-sand-gold';
      case 'Archived': return 'bg-charcoal/5 text-charcoal/40';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white rounded-2xl border border-charcoal/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={item.thumbnail} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-bold backdrop-blur-md ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-bold bg-black/40 text-white backdrop-blur-md">
            {item.category}
          </span>
        </div>
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          {!isViewer && (
            <button className="p-2 bg-white rounded-full text-charcoal hover:bg-sand-gold hover:text-white transition-colors">
              <Edit size={18} />
            </button>
          )}
          <button className="p-2 bg-white rounded-full text-charcoal hover:bg-sand-gold hover:text-white transition-colors">
            <Eye size={18} />
          </button>
          {!isViewer && (
            <button className="p-2 bg-white rounded-full text-charcoal hover:bg-sand-gold hover:text-white transition-colors">
              <Share2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-sand-gold font-bold mb-1">{item.destination}</p>
          <h3 className="text-lg font-medium leading-tight text-charcoal group-hover:text-sand-gold transition-colors line-clamp-2 h-12">
            {item.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-charcoal/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-sand-gold/10 flex items-center justify-center text-[10px] font-bold text-sand-gold">
              {item.author[0]}
            </div>
            <span className="text-xs text-charcoal/60">{item.author}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-charcoal/30">
              <Clock size={12} />
              <span className="text-[10px]">{formatDate(item.lastModified)}</span>
            </div>
            {item.wordCount > 0 && (
              <div className="flex items-center gap-1 text-sand-gold/60">
                <FileText size={12} />
                <span className="text-[10px] font-bold">{item.wordCount}w</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
