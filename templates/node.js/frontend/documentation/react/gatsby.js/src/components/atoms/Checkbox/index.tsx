import React, { useState } from 'react';
import { FaCheck } from 'react-icons/fa6';

export const Checkbox: React.FC<{
  id?: string;
  name?: string;
  value?: string;
  label?: string;
}> = ({ id = '', name = '', value = '', label = '' }) => {
  const [checked, setChecked] = useState(false);

  return (
    <label htmlFor={id} className="flex items-center gap-2">
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        onChange={(event) => setChecked(event.target.checked)}
        className="hidden"
      />
      {checked ? (
        <FaCheck className="text-green-700" fontSize="small" />
      ) : (
        <div className={`h-5 w-5 rounded border border-2`} />
      )}
      <span className="text-sm text-gray-500">{label}</span>
    </label>
  );
};
