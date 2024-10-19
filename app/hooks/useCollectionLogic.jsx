import { useCallback } from 'react';

export const useCollectionLogic = (collections, selectedCollection) => {
  const getSelectedCollectionLabel = useCallback(() => {
    const selectedCollectionObj = collections.find(collection => collection.value === selectedCollection);
    return selectedCollectionObj ? selectedCollectionObj.label.toLowerCase() : "";
  }, [collections, selectedCollection]);

  const collectionAnimalClassicQclassic = ["animal print", "quilted classic", "classic"];
  
  const isCollectionAnimalClassicQclassic = useCallback(() => {
    const selectedCollectionLabel = getSelectedCollectionLabel();
    return collectionAnimalClassicQclassic.includes(selectedCollectionLabel);
  }, [getSelectedCollectionLabel]);

  return {
    getSelectedCollectionLabel,
    isCollectionAnimalClassicQclassic
  };
};