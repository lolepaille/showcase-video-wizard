
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoReplaceSectionProps {
  videoBlob?: Blob;
  onReplace: (file: File) => void;
}

const VideoReplaceSection: React.FC<VideoReplaceSectionProps> = ({
  videoBlob,
  onReplace,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplaceVideo = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please choose a video file.",
          variant: "destructive",
        });
        return;
      }
      onReplace(file);
      toast({
        title: "Video replaced",
        description: "You have replaced your video.",
      });
    }
    evt.target.value = "";
  };

  if (!videoBlob) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Video Preview</h3>
      <video
        src={URL.createObjectURL(videoBlob)}
        controls
        className="w-full max-w-md rounded border"
      />
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <RefreshCcw className="h-4 w-4 mr-1" />
          Replace Video
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleReplaceVideo}
        />
      </div>
    </div>
  );
};

export default VideoReplaceSection;
