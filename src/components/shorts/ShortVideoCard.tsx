"use client";
import { useEffect, useRef, useState } from "react";

interface ShortVideoCardProps {
  videoUrl: string;
  title: string;
}

const ShortVideoCard: React.FC<ShortVideoCardProps> = ({ videoUrl, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      onMouseEnter={!isMobile ? handleMouseEnter : undefined}
      onMouseLeave={!isMobile ? handleMouseLeave : undefined}
    >
      <video
        controls
        muted
        loop
        autoPlay={isMobile}
        className={`h-auto w-full rounded-lg`}
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
