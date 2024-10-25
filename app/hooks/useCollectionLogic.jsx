// app/hooks/useCollectionLogic.jsx

import { useCallback, useMemo } from 'react';
import { 
  getShopifyCollectionType, 
  needsSecondaryColor, 
  needsStitchingColor,
  isCollectionAnimalClassicQclassic
} from '../lib/collectionUtils';

export const useCollectionLogic = (shopifyCollections, selectedCollection) => {
  // console.log('shopifyCollections:', shopifyCollections);
  // console.log('selectedCollection:', selectedCollection);

  // Find the full collection object
  const fullCollection = useMemo(() => {
    return shopifyCollections?.find(col => col.value === selectedCollection);
  }, [shopifyCollections, selectedCollection]);

  // console.log('fullCollection:', fullCollection);

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

  return {
    collectionType,
    isCollectionAnimalClassicQclassic: memoizedIsCollectionAnimalClassicQclassic,
    needsSecondaryColor: memoizedNeedsSecondaryColor,
    needsStitchingColor: memoizedNeedsStitchingColor,
  };
};