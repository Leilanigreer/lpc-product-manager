// app/hooks/useCollectionLogic.jsx

import { useMemo } from 'react';
import { 
  needsSecondaryColor, 
  needsStitchingColor,
  needsStyle,
  needsQClassicField
} from '../lib/utils';

export const useCollectionLogic = (formState, shopifyCollections) => {
  const fullCollection = useMemo(() => {
    return shopifyCollections?.find(col => col.value === formState?.selectedCollection);
  }, [shopifyCollections, formState?.selectedCollection]);

  const memoizedNeedsSecondaryColor = useMemo(() => {
    return needsSecondaryColor(formState, shopifyCollections);
  }, [formState, shopifyCollections]);

  const memoizedNeedsStitchingColor = useMemo(() => {
    return needsStitchingColor(formState, shopifyCollections);
  }, [formState, shopifyCollections]);

  const memoizedNeedsStyle = useMemo(() => {
    return needsStyle(formState, shopifyCollections);
  }, [formState, shopifyCollections]);

  const memoizedNeedsQClassicField = useMemo(() => {
    return needsQClassicField(formState, shopifyCollections);
  }, [formState, shopifyCollections]);

  return {
    collection: fullCollection,
    needsSecondaryColor: memoizedNeedsSecondaryColor,
    needsStitchingColor: memoizedNeedsStitchingColor,
    needsStyle: memoizedNeedsStyle,
    needsQClassicField: memoizedNeedsQClassicField
  };
};