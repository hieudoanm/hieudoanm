import React from 'react';

export const Input: React.FC<{
  id?: string;
  type?: React.HTMLInputTypeAttribute;
  name?: string;
  placeholder?: string;
}> = ({ type = 'text', id = '', name = '', placeholder = '' }) => {
  return (
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      className="w-full rounded-md bg-[#EFF3F7] px-8 py-4 hover:border-emerald-500 focus:border-emerald-500 active:border-emerald-500"
    />
  );
};
