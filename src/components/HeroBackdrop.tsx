import { useState } from 'react';

/**
 * Hero background: a real stock video plays behind the content, clearly
 * visible through most of the frame. A dark band sits only at the very top
 * (behind the navbar) so it matches the site's solid-black look there,
 * fading quickly into the visible video below. A separate light
 * bottom-weighted fade keeps the headline/buttons readable.
 */
export function HeroBackdrop() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#080b16]">
      {!videoFailed && (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://assets.mixkit.co/videos/49285/49285-thumb-720-2.jpg"
          onError={() => setVideoFailed(true)}
        >
          <source src="https://assets.mixkit.co/videos/49285/49285-720.mp4" type="video/mp4" />
        </video>
      )}

      {/* small dark band only at the very top, fading quickly into the visible video */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080b16] via-[#080b16]/60 to-transparent sm:h-56" />

      {/* light overall tint for brand-color consistency */}
      <div className="absolute inset-0 bg-navy-900/25" />

      {/* bottom-weighted fade so headline/buttons/stats stay readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />
    </div>
  );
}
