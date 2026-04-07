import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Item, categoryLabels, locationLabels } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const displayCategory = (cat: string) => cat?.startsWith('other:') ? cat.slice(6) : (categoryLabels[cat as keyof typeof categoryLabels] ?? cat);
const displayLocation = (loc: string, detail: string) => loc === 'other' ? detail : (locationLabels[loc as keyof typeof locationLabels] ?? loc);

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const isLost = item.type === 'lost';
  const isActive = item.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    >
      <Link to={`/item/${item.id}`} className="group block h-full">
        <div className={`h-full flex flex-col relative rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 bg-card ${!isActive ? 'opacity-75' : ''}`}>

          {/* Image area */}
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            {item.images[0] ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className={`flex h-full items-center justify-center text-5xl ${isLost ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30'}`}>
                {isLost ? '🔍' : '📦'}
              </div>
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Type badge — top left */}
            <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-md ${isLost ? 'bg-rose-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
              <span className="relative flex h-1.5 w-1.5">
                {isActive && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLost ? 'bg-rose-200' : 'bg-emerald-200'}`} />}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-white`} />
              </span>
              {isLost ? 'Lost' : 'Found'}
            </div>

            {/* Status badge — top right */}
            {!isActive && (
              <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-sm
              ${item.status === 'claimed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' :
                  item.status === 'resolved' ? 'bg-blue-100 text-blue-700 border border-blue-200/50 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' :
                    'bg-slate-100 text-slate-700 border border-slate-200/50 dark:bg-slate-800 dark:text-slate-300'}`}>
                <CheckCircle2 className="h-3 w-3" />
                {item.status === 'claimed' ? 'Claimed' : item.status === 'resolved' ? 'Resolved' : 'Expired'}
              </div>
            )}

            {/* Category — bottom left over gradient */}
            <div className="absolute bottom-3 left-3">
              <span className="text-[11px] font-medium text-white/90 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                {displayCategory(item.category)}
              </span>
            </div>

            {/* Arrow icon — bottom right hover */}
            <div className="absolute bottom-3 right-3 h-7 w-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 border border-white/30">
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="font-semibold text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors text-[15px]">
              {item.title}
            </h3>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {item.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-3 w-full">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <span className="flex items-center gap-1 flex-shrink-0">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate max-w-[70px]">{displayLocation(item.location, item.locationDetail)}</span>
                </span>
                <span className="flex items-center gap-1 overflow-hidden">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate whitespace-nowrap">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                </span>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                <div className="h-5 w-5 rounded-full bg-muted overflow-hidden ring-1 border shadow-sm">
                  {item.userAvatar ? (
                    <img src={item.userAvatar} alt={item.userName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-full w-full p-0.5 text-muted-foreground" />
                  )}
                </div>
                <span className="truncate max-w-[60px] text-[11px]">{item.userName}</span>
              </div>
            </div>
          </div>

          {/* Accent bar at bottom */}
          <div className={`h-0.5 w-full transition-all duration-300 ${isLost ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'} scale-x-0 group-hover:scale-x-100 origin-left`} />
        </div>
      </Link>
    </motion.div>
  );
};

export default ItemCard;
