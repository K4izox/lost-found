import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, User } from 'lucide-react';
import { Item, categoryLabels, locationLabels } from '@/lib/types';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  return (
    <Link to={`/item/${item.id}`}>
      <Card className="group overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {item.images[0] ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {/* Type Badge */}
          <Badge
            className={`absolute top-3 left-3 ${
              item.type === 'lost'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-success text-success-foreground'
            }`}
          >
            {item.type === 'lost' ? 'Lost' : 'Found'}
          </Badge>
          {/* Status Badge */}
          {item.status !== 'active' && (
            <Badge variant="secondary" className="absolute top-3 right-3">
              {item.status === 'claimed' ? 'Claimed' : item.status === 'resolved' ? 'Resolved' : 'Expired'}
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          <Badge variant="outline" className="mb-2 text-xs">
            {categoryLabels[item.category]}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>

          {/* Meta Info */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{locationLabels[item.location]}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDistanceToNow(item.date, { addSuffix: true })}</span>
            </div>
          </div>

          {/* User */}
          <div className="mt-3 pt-3 border-t flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-muted overflow-hidden">
              {item.userAvatar ? (
                <img src={item.userAvatar} alt={item.userName} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-1 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">{item.userName}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ItemCard;
