
import React from "react";
import SimpleVideoPreview from "./SimpleVideoPreview";

interface ReviewVideoPlayerProps {
  blob: Blob;
  onReplace: () => void;
}

const ReviewVideoPlayer: React.FC<ReviewVideoPlayerProps> = ({ blob, onReplace }) => {
  return <SimpleVideoPreview videoBlob={blob} onReRecord={onReplace} />;
};

export default ReviewVideoPlayer;
