import React, { ReactNode } from 'react';

export const Button: React.FC<{
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
  className?: string;
}> = ({ type = 'button', children = <></>, className = '' }) => {
  return (
    <button
      type={type}
      className={`rounded-md bg-emerald-500 px-8 py-4 text-white transition duration-500 hover:bg-gray-900 ${className}`}>
      {children}
    </button>
  );
};
