export default function MapVideo() {
  return (
    <div className="order-1 lg:order-2 flex justify-center lg:justify-end w-full h-full">
      <div className="bg-black/10 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-2xl border border-white/10 w-full h-full">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden h-full">
          <video 
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            controls={false}
            preload="auto"
          >
            <source src="/videos/import.mp4" type="video/mp4" /> 
          </video>
        </div>
      </div>
    </div>
  );
}