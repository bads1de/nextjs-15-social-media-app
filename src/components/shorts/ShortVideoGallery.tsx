"use client";
"use client";
import React, { useState } from "react";
import ShortVideoCard from "./ShortVideoCard";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";

interface ShortVideoGalleryProps {
  videos: { videoUrl: string; title: string }[];
}

const ShortVideoGallery: React.FC<ShortVideoGalleryProps> = ({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : videos.length - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < videos.length - 1 ? prevIndex + 1 : 0,
    );
  };

  return (
    <div className="relative">
      {/* デスクトップサイズ*/}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
        {videos.map((video) => (
          <ShortVideoCard
            key={video.videoUrl}
            videoUrl={video.videoUrl}
            title={video.title}
          />
        ))}
      </div>

      {/* モバイルサイズ*/}
      <div className="flex items-center justify-center lg:hidden">
        <button
          onClick={handlePrev}
          className="absolute left-0 z-10 rounded-full p-2 text-white"
        >
          <ArrowBigLeft size={48} />
        </button>
        <ShortVideoCard
          key={videos[currentIndex].videoUrl}
          videoUrl={videos[currentIndex].videoUrl}
          title={videos[currentIndex].title}
        />
        <button
          onClick={handleNext}
          className="absolute right-0 z-10 rounded-full p-2 text-white"
        >
          <ArrowBigRight size={48} />
        </button>
      </div>
    </div>
  );
};

export default ShortVideoGallery;
