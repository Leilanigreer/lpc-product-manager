import { useReducer, useCallback } from 'react';
import { calculateFinalRequirements, isPutter, isWoodType, findMatchingWoodStyles, extractExistingProducts, filterProductsByCollection, getShapeGroup } from '../lib/utils';
import { createInitialShapeState } from '../lib/forms/formState';

const ACTION_TYPES = {
  UPDATE_COLLECTION: 'UPDATE_COLLECTION',
  UPDATE_THREAD_MODE: 'UPDATE_THREAD_MODE',
  UPDATE_GLOBAL_EMBROIDERY: 'UPDATE_GLOBAL_EMBROIDERY',
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
      const { collection, productSets } = payload;
    
      // Initialize all shapes with base state only
      const allShapes = initialState.shapes.reduce((acc, shape) => ({
        ...acc,
        [shape.value]: createInitialShapeState(shape)
      }), {});

      // Process existing products during collection selection
      const existingProducts = extractExistingProducts(productSets);
      const filteredProducts = filterProductsByCollection(existingProducts, collection.value);

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
            needsColorDesignation:
              !isPutter(shapeDef) && assigned.needsColorDesignation === true,
          };
        }
      }

      const newState = {
        ...initialState,
        collection,
        threadMode: { embroidery: '' },
        globalEmbroideryThread: null,
        stitchingThreads: {},
        allShapes: shapesWithAutoStyles,
        existingProducts: filteredProducts // Store processed products in state
      };

      // Calculate final requirements and reset preview
      return resetPreviewIfExists({
        ...newState,
        finalRequirements: calculateFinalRequirements(newState)
      });
    }

    case ACTION_TYPES.UPDATE_THREAD_MODE: {
      const { threadType, mode } = payload;
      if (threadType !== 'embroidery') return state;

      const newAllShapes = { ...state.allShapes };

      if (mode === 'global') {
        // Clear thread data from shapes when switching to global
        Object.keys(newAllShapes).forEach(shapeValue => {
          if (newAllShapes[shapeValue].isSelected) {
            newAllShapes[shapeValue] = {
              ...newAllShapes[shapeValue],
              embroideryThread: null
            };
          }
        });
      }

      const newState = {
        ...state,
        threadMode: {
          ...state.threadMode,
          [threadType]: mode
        },
        globalEmbroideryThread: mode === 'perShape' ? null : state.globalEmbroideryThread,
        allShapes: newAllShapes
      };

      return resetPreviewIfExists(newState);
    }

    case ACTION_TYPES.UPDATE_GLOBAL_EMBROIDERY: {
      if (state.threadMode?.embroidery !== 'global') return state;

      return resetPreviewIfExists({
        ...state,
        globalEmbroideryThread: payload
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
        // Initialize selected shape with current mode settings
        newAllShapes[shape.value] = {
          ...newAllShapes[shape.value],
          isSelected: true,
          // weight: weight || '',
          needsColorDesignation: !isPutter(shape) && (
            state.allShapes[shape.value]?.style?.needsColorDesignation === true ||
            state.finalRequirements?.needsColorDesignation ||
            (isWoodType(shape) &&
              findMatchingWoodStyles(state.shapes, newAllShapes)[shape.value])
          )
        };
      } else {
        // Reset shape to initial state when unchecked
        newAllShapes[shape.value] = createInitialShapeState(shape);
      }

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

      // Recalculate color designation when styles change
      if (field === 'style') {
        Object.entries(newAllShapes).forEach(([currentShapeValue, currentShape]) => {
          if (!currentShape.isSelected || isPutter(currentShape)) return;

          const matchingWoodStyles = findMatchingWoodStyles(
            state.shapes,
            Object.fromEntries(
              Object.entries(newAllShapes)
                .filter(([_, s]) => s.isSelected)
            )
          );

          newAllShapes[currentShapeValue] = {
            ...currentShape,
            needsColorDesignation:
              currentShape.style?.needsColorDesignation === true ||
              state.finalRequirements?.needsColorDesignation ||
              (isWoodType(currentShape) &&
                Object.values(matchingWoodStyles).some((group) =>
                  group.includes(currentShapeValue)
                )),
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
      threadMode: () => ({
        type: ACTION_TYPES.UPDATE_THREAD_MODE,
        payload: value // { threadType, mode }
      }),
      globalEmbroideryThread: () => ({
        type: ACTION_TYPES.UPDATE_GLOBAL_EMBROIDERY,
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
  }, [initialState]);

  return [state, handleChange];
};