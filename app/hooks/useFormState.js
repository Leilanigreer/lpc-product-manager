import { useReducer, useCallback } from 'react';
import { calculateFinalRequirements, isPutter, getShapeGroup, computeShapeNeedsColorDesignation } from '../lib/utils';
import { createInitialShapeState } from '../lib/forms/formState';

const ACTION_TYPES = {
  UPDATE_COLLECTION: 'UPDATE_COLLECTION',
  UPDATE_EMBROIDERY_THREADS: 'UPDATE_EMBROIDERY_THREADS',
  UPDATE_STITCHING_THREADS: 'UPDATE_STITCHING_THREADS',
  UPDATE_LEATHER_COLORS: 'UPDATE_LEATHER_COLORS',
  UPDATE_SHAPE: 'UPDATE_SHAPE',
  UPDATE_SHAPE_FIELD: 'UPDATE_SHAPE_FIELD',
  UPDATE_SIMPLE: 'UPDATE_SIMPLE',
  RESET_FORM: 'RESET_FORM',
  RESET_PREVIEW: 'RESET_PREVIEW'
};

const formReducer = (state, action) => {
  const { type, payload, initialState } = action;

  // Helper function to reset preview data if it exists
  const resetPreviewIfExists = (newState) => {
    if (newState.productPreview) {
      return {
        ...newState,
        productPreview: {
          ...newState.productPreview,
          variants: [],
          additionalViews: []
        }
      };
    }
    return newState;
  };

  switch (type) {
    case ACTION_TYPES.UPDATE_COLLECTION: {
      const { collection, existingProducts: existingProductsFromPayload } = payload;

      // Initialize all shapes with base state only
      const allShapes = initialState.shapes.reduce((acc, shape) => ({
        ...acc,
        [shape.value]: createInitialShapeState(shape)
      }), {});

      /**
       * Resets shapes / threads for the new collection. Preserves `selectedOfferingType` and
       * `limitedEditionQuantity` (product type UI). The selected `collection` includes
       * `versioningSkus` from the create-product loader (server-side Shopify GraphQL). Passing
       * `existingProducts` in the payload overrides the initial list when hydrating from elsewhere.
       */
      const existingProducts = Array.isArray(existingProductsFromPayload)
        ? existingProductsFromPayload
        : [];

      const styles = collection.styles ?? [];

      const toGroupKey = (raw) => {
        if (raw == null) return 'UNKNOWN';
        const s = String(raw).trim();
        if (!s) return 'UNKNOWN';
        return s.toUpperCase().replace(/\s+/g, '_');
      };

      // Style selection is per shape_group within the current collection_category.
      const groupCounts = styles.reduce((acc, s) => {
        const key = toGroupKey(s.shapeGroup);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});

      const uniqueStyleByGroup = styles.reduce((acc, s) => {
        const key = toGroupKey(s.shapeGroup);
        if (groupCounts[key] === 1) acc[key] = s;
        return acc;
      }, {});

      // Create new state with collection and reset relevant fields
      // Auto-assign styles for shape_groups that have exactly one valid style option.
      const shapesWithAutoStyles = { ...allShapes };
      for (const shapeDef of initialState.shapes) {
        const group = getShapeGroup(shapeDef);
        const key = toGroupKey(group);
        if (uniqueStyleByGroup[key]) {
          const assigned = uniqueStyleByGroup[key];
          shapesWithAutoStyles[shapeDef.value] = {
            ...shapesWithAutoStyles[shapeDef.value],
            style: assigned,
            needsColorDesignation: computeShapeNeedsColorDesignation(
              shapeDef,
              { ...shapesWithAutoStyles[shapeDef.value], style: assigned },
              initialState.shapes,
              shapesWithAutoStyles
            ),
          };
        }
      }

      const newState = {
        ...initialState,
        collection,
        // Keep offering type + quantity when switching collection (same UX as font / leather).
        selectedOfferingType: state.selectedOfferingType,
        limitedEditionQuantity: state.limitedEditionQuantity,
        embroideryThreads: {},
        stitchingThreads: {},
        allShapes: shapesWithAutoStyles,
        existingProducts
      };

      // Calculate final requirements and reset preview
      return resetPreviewIfExists({
        ...newState,
        finalRequirements: calculateFinalRequirements(newState)
      });
    }

    case ACTION_TYPES.UPDATE_EMBROIDERY_THREADS: {
      return resetPreviewIfExists({
        ...state,
        embroideryThreads: payload,
      });
    }

    case ACTION_TYPES.UPDATE_STITCHING_THREADS: {
      return resetPreviewIfExists({
        ...state,
        stitchingThreads: payload
      });
    }

    case ACTION_TYPES.UPDATE_LEATHER_COLORS: {
      return resetPreviewIfExists({
        ...state,
        leatherColors: payload
      });
    }

    case ACTION_TYPES.UPDATE_SHAPE: {
      const { shape, checked } = payload;
      const newAllShapes = { ...state.allShapes };

      if (checked) {
        newAllShapes[shape.value] = {
          ...newAllShapes[shape.value],
          isSelected: true,
        };
      } else {
        newAllShapes[shape.value] = createInitialShapeState(shape);
      }

      Object.entries(newAllShapes).forEach(([shapeValue, row]) => {
        if (!row.isSelected) return;
        const shapeDef = state.shapes.find((s) => s.value === shapeValue);
        if (!shapeDef || isPutter(shapeDef)) return;
        newAllShapes[shapeValue] = {
          ...row,
          needsColorDesignation: computeShapeNeedsColorDesignation(
            shapeDef,
            row,
            state.shapes,
            newAllShapes
          ),
        };
      });

      return resetPreviewIfExists({
        ...state,
        allShapes: newAllShapes
      });
    }

    case ACTION_TYPES.UPDATE_SHAPE_FIELD: {
      const { shapeValue, field, value } = payload;
      const shape = state.allShapes[shapeValue];
      
      if (!shape?.isSelected) return state;

      const newAllShapes = {
        ...state.allShapes,
        [shapeValue]: {
          ...shape,
          [field]: value
        }
      };

      if (field === 'style') {
        Object.entries(newAllShapes).forEach(([currentShapeValue, currentShape]) => {
          if (!currentShape.isSelected) return;
          const shapeDef = state.shapes.find((s) => s.value === currentShapeValue);
          if (!shapeDef || isPutter(shapeDef)) return;

          newAllShapes[currentShapeValue] = {
            ...currentShape,
            needsColorDesignation: computeShapeNeedsColorDesignation(
              shapeDef,
              currentShape,
              state.shapes,
              newAllShapes
            ),
          };
        });
      }

      return resetPreviewIfExists({
        ...state,
        allShapes: newAllShapes
      });
    }

    case ACTION_TYPES.UPDATE_SIMPLE: {
      const { field, value } = payload;
      return resetPreviewIfExists({
        ...state,
        [field]: value
      });
    }

    case ACTION_TYPES.RESET_FORM: {
      const resetState = {
        ...initialState,
        shapes: state.shapes 
      };
      
      return resetPreviewIfExists({
        ...resetState,
        finalRequirements: calculateFinalRequirements(resetState)
      });
    }

    default:
      return state;
  }
};

export const useFormState = (initialState, onFormChange) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = useCallback((field, value) => {
    if (field === 'resetForm') {
      dispatch({
        type: ACTION_TYPES.RESET_FORM,
        initialState
      });
      // Call onFormChange to clear productData
      onFormChange?.(null);
      return;
    }

    // Call onFormChange to clear productData whenever form changes
    onFormChange?.(null);

    const actionMap = {
      updateCollection: () => ({
        type: ACTION_TYPES.UPDATE_COLLECTION,
        payload: value,
        initialState
      }),
      embroideryThreads: () => ({
        type: ACTION_TYPES.UPDATE_EMBROIDERY_THREADS,
        payload: value
      }),
      stitchingThreads: () => ({
        type: ACTION_TYPES.UPDATE_STITCHING_THREADS,
        payload: value
      }),
      leatherColors: () => ({
        type: ACTION_TYPES.UPDATE_LEATHER_COLORS,
        payload: value
      }),
      shape: () => ({
        type: ACTION_TYPES.UPDATE_SHAPE,
        payload: value // { shape, checked } — weight disabled
      }),
      shapeField: () => ({
        type: ACTION_TYPES.UPDATE_SHAPE_FIELD,
        payload: value // { shapeValue, field, value }
      })
    };

    // Dispatch appropriate action or fall back to simple update
    const action = actionMap[field]?.() || {
      type: ACTION_TYPES.UPDATE_SIMPLE,
      payload: { field, value }
    };

    dispatch(action);
  }, [initialState, onFormChange]);

  return [state, handleChange];
};
