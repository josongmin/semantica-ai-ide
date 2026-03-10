import React from "react";

import { Collapsible } from "../../shared/ui";
import { ReviewCommentCard } from "./ReviewCommentCard";

interface ReviewFileSectionProps {
  filePath: string;
  commentIds: readonly string[];
}

export const ReviewFileSection = React.memo(function ReviewFileSection({
  filePath,
  commentIds,
}: ReviewFileSectionProps) {
  return (
    <Collapsible title={filePath} icon="file" badge={commentIds.length} defaultCollapsed={false}>
      {commentIds.length === 0 ? null : (
        <div role="list">
          {commentIds.map((id) => (
            <ReviewCommentCard key={id} id={id} />
          ))}
        </div>
      )}
    </Collapsible>
  );
});
