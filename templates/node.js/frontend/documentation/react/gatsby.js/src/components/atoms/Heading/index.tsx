import React from 'react';

export const Heading: React.FC<{
  title?: string;
  description?: string;
  align?: 'text-center' | 'text-left' | string;
  bottom?: boolean;
  enhanced?: boolean;
}> = ({
  title = '',
  description = '',
  align = 'text-center',
  bottom = true,
  enhanced = false,
}) => {
  return (
    <div className={bottom ? 'mb-8 md:mb-16' : ''}>
      <div className={`${align} mx-auto max-w-lg`}>
        <h1
          className={`${
            enhanced ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'
          } font-b162 mb-4 font-bold`}>
          {title}
        </h1>
        <h2 className="text-sm sm:text-lg">{description}</h2>
      </div>
    </div>
  );
};
