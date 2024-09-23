"use client";
import { useRef } from "react";

interface ShortVideoCardProps {
  videoUrl: string;
  title: string;
}

const ShortVideoCard: React.FC<ShortVideoCardProps> = ({ videoUrl, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div
      className="short-video-card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        controls
        muted
        loop
        className="h-auto w-full rounded-lg"
        ref={videoRef}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <h3 className="mt-2 text-center text-lg font-semibold">{title}</h3>
    </div>
  );
};

export default ShortVideoCard;
