// app/hooks/useCollectionLogic.jsx

import { useCallback, useMemo } from 'react';
import { 
  getShopifyCollectionType, 
  needsSecondaryColor, 
  needsStitchingColor,
  isCollectionAnimalClassicQclassic,
  needsStyle,          // Add new imports
  needsQClassicField
} from '../lib/collectionUtils';

export const useCollectionLogic = (shopifyCollections, selectedCollection) => {
  const fullCollection = useMemo(() => {
    return shopifyCollections?.find(col => col.value === selectedCollection);
  }, [shopifyCollections, selectedCollection]);

  const collectionType = useMemo(() => {
    if (!fullCollection?.handle) {
      console.warn('Selected collection is missing handle:', fullCollection);
      return 'Unknown';
    }
    return getShopifyCollectionType({ handle: fullCollection.handle });
  }, [fullCollection]);

  const memoizedIsCollectionAnimalClassicQclassic = useCallback(() => {
    return isCollectionAnimalClassicQclassic(collectionType);
  }, [collectionType]);

  const memoizedNeedsSecondaryColor = useMemo(() => {
    return needsSecondaryColor(collectionType);
  }, [collectionType]);

  const memoizedNeedsStitchingColor = useMemo(() => {
    return needsStitchingColor(collectionType);
  }, [collectionType]);

  // Add new memoized functions
  const memoizedNeedsStyle = useCallback(() => {
    return needsStyle(collectionType);
  }, [collectionType]);

  const memoizedNeedsQClassicField = useCallback(() => {
    return needsQClassicField(collectionType);
  }, [collectionType]);

  return {
    collectionType,
    isCollectionAnimalClassicQclassic: memoizedIsCollectionAnimalClassicQclassic,
    needsSecondaryColor: memoizedNeedsSecondaryColor,
    needsStitchingColor: memoizedNeedsStitchingColor,
    needsStyle: memoizedNeedsStyle,                    // Add new returns
    needsQClassicField: memoizedNeedsQClassicField
  };
};