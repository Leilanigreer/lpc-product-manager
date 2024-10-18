import { useState } from 'react';

export const useFormState = (initialState) => {
  const [state, setState] = useState(initialState);

  const handleChange = (field, value) => {
    setState(prevState => ({
      ...prevState,
      [field]: typeof value === 'function' ? value(prevState[field]) : value
    }));
  };

  return [state, handleChange];
};