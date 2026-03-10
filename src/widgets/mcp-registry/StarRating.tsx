import React from "react";

import { Icon, Text } from "../../shared/ui";

interface StarRatingProps { rating: number }

export const StarRating = React.memo(function StarRating({ rating }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Rating: ${rating.toFixed(1)}`}>
      {/* Static list — index key safe */}
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name={(() => { if (i < fullStars) return "star-full"; if (i === fullStars && hasHalf) return "star-half"; return "star-empty"; })()}
          tokenSize="2xs"
          className={
            i < fullStars || (i === fullStars && hasHalf)
              ? "text-vsc-warning"
              : "text-vsc-text-tertiary"
          }
        />
      ))}
      <Text size="2xs" tone="tertiary" className="ml-0.5">
        {rating.toFixed(1)}
      </Text>
    </span>
  );
});
