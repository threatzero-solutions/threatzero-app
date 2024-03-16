const SplashScreen: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div className="h-48 w-48 relative">
        <div className="animate-pulse w-full h-full bg-slate-200 rounded-full"></div>
        <img
          src={'/logo150.png'}
          alt="ThreatZero Logo"
          className="w-3/4 h-3/4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
