import { PropsWithChildren } from 'react';
import Footer from './Footer';

const PublicLayout: React.FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <div className="w-full flex flex-col h-full">
      <div className="max-w-5xl w-full mx-auto mb-12 lg:px-12 md:px-8 px-4 grid grid-cols-1 gap-2 grow">
        <div className="flex h-32 shrink-0 items-center justify-center">
          <img
            className="h-20 w-auto"
            src="/TZ_logo.png"
            alt="ThreatZero Logo"
          />
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default PublicLayout;
