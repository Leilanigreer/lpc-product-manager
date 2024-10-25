import { useState, useCallback } from 'react';

export const useFormState = (initialState) => {
  const [state, setState] = useState(initialState);

  const handleChange = useCallback((field, value) => {
    setState(prevState => ({
      ...prevState,
      [field]: value
    }));
  }, []);

  return [state, handleChange];
};