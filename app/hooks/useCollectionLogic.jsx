import { useCallback, useMemo } from 'react';
import { 
  getCollectionType, 
  needsSecondaryColor, 
  needsStitchingColor,
  isCollectionAnimalClassicQclassic
} from '../lib/collectionUtils';

export const useCollectionLogic = (collections, selectedCollection) => {
  const collectionType = useMemo(() => getCollectionType(selectedCollection), [selectedCollection]);

  const memoizedIsCollectionAnimalClassicQclassic = useCallback(() => {
    return isCollectionAnimalClassicQclassic(collectionType);
  }, [collectionType]);

  const memoizedNeedsSecondaryColor = useMemo(() => {
    return needsSecondaryColor(collectionType);
  }, [collectionType]);

  const memoizedNeedsStitchingColor = useMemo(() => {
    return needsStitchingColor(collectionType);
  }, [collectionType]);

  return {
    collectionType,
    isCollectionAnimalClassicQclassic: memoizedIsCollectionAnimalClassicQclassic,
    needsSecondaryColor: memoizedNeedsSecondaryColor,
    needsStitchingColor: memoizedNeedsStitchingColor,
  };
};