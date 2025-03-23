import { Link } from 'gatsby';
import React from 'react';

const NotFoundPage: React.FC = () => {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col gap-4 text-center uppercase">
        <h1 className="text-9xl font-bold">404</h1>
        <p className="text-4xl">Page Not Found</p>
        <Link to="/">
          <button className="btn btn-primary w-full">Back to Home</button>
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
