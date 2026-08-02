import { ROOM_TAG_META } from '../../utils/roomTags';

// Purpose: Small, immediately-scannable badges for a room's ECO_FRIENDLY/WORK_FRIENDLY tags —
// meant to sit right on a card, not be buried inside an amenities list or details accordion.
const RoomTagBadges = ({ tags, size = 'sm', className = '' }) => {
  const list = Array.isArray(tags) ? tags.filter((tag) => ROOM_TAG_META[tag]) : [];
  if (list.length === 0) return null;

  const padding = size === 'lg' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';
  const iconSize = size === 'lg' ? 'h-3.5 w-3.5' : 'h-3 w-3';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {list.map((tag) => {
        const { label, icon: Icon, classes } = ROOM_TAG_META[tag];
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-full font-semibold ${padding} ${classes}`}
          >
            <Icon className={iconSize} />
            {label}
          </span>
        );
      })}
    </div>
  );
};

export default RoomTagBadges;
