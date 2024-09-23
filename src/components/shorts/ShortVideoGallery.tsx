import React from "react";
import ShortVideoCard from "./ShortVideoCard";

interface ShortVideoGalleryProps {
  videos: { videoUrl: string; title: string }[];
}

const ShortVideoGallery: React.FC<ShortVideoGalleryProps> = ({ videos }) => {
  return (
    <div className="short-video-gallery grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, index) => (
        <ShortVideoCard
          key={index}
          videoUrl={video.videoUrl}
          title={video.title}
        />
      ))}
    </div>
  );
};

export default ShortVideoGallery;
