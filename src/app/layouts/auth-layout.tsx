import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-canvas">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-2xl text-ink rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white font-bold text-lg shadow-md">
            K
          </div>
          <span>KBase</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[440px] px-4">
        <div className="neu-card rounded-card p-6 sm:p-8 bg-white border border-border">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
