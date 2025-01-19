import { useReducer, useCallback } from 'react';
import { calculateFinalRequirements, isPutter, isWoodType, findMatchingWoodStyles } from '../lib/utils';
import { createInitialShapeState } from '../lib/forms/formState';

const ACTION_TYPES = {
  UPDATE_COLLECTION: 'UPDATE_COLLECTION',
  UPDATE_STYLE_MODE: 'UPDATE_STYLE_MODE',
  UPDATE_GLOBAL_STYLE: 'UPDATE_GLOBAL_STYLE',
  UPDATE_THREAD_MODE: 'UPDATE_THREAD_MODE',
  UPDATE_GLOBAL_EMBROIDERY: 'UPDATE_GLOBAL_EMBROIDERY',
  UPDATE_STITCHING_THREADS: 'UPDATE_STITCHING_THREADS',
  UPDATE_LEATHER_COLORS: 'UPDATE_LEATHER_COLORS',
  UPDATE_SHAPE: 'UPDATE_SHAPE',
  UPDATE_SHAPE_FIELD: 'UPDATE_SHAPE_FIELD',
  UPDATE_SIMPLE: 'UPDATE_SIMPLE'
};

const formReducer = (state, action) => {
  const { type, payload, initialState } = action;
  console.log('FormReducer - Action:', { type, payload });

  switch (type) {
    case ACTION_TYPES.UPDATE_COLLECTION: {
      // Initialize all shapes with base state only
      const allShapes = initialState.shapes.reduce((acc, shape) => ({
        ...acc,
        [shape.value]: createInitialShapeState(shape)
      }), {});

      // Create new state with collection and reset relevant fields
      const newState = {
        ...initialState,
        collection: payload.collection,
        styleMode: '',
        globalStyle: null,
        threadMode: { embroidery: '' },
        globalEmbroideryThread: null,
        stitchingThreads: {},
        allShapes
      };

      // Calculate final requirements based on new collection
      return {
        ...newState,
        finalRequirements: calculateFinalRequirements(newState)
      };
    }

    case ACTION_TYPES.UPDATE_STYLE_MODE: {
      const { mode } = payload;
      const newAllShapes = { ...state.allShapes };
      
      // Update shape states based on new mode
      Object.entries(newAllShapes).forEach(([shapeId, shape]) => {
        if (!shape.isSelected) return;

        // Reset style when switching modes
        const updatedShape = {
          ...shape,
          style: mode === 'global' ? null : shape.style
        };

        // Only recalculate needsColorDesignation for selected shapes
        if (mode === 'independent' && !isPutter(shape)) {
          const matchingWoodStyles = findMatchingWoodStyles(
            initialState.shapes,
            Object.fromEntries(
              Object.entries(newAllShapes)
                .filter(([_, s]) => s.isSelected)
            )
          );

          updatedShape.needsColorDesignation = 
            state.finalRequirements?.needsColorDesignation ||
            (isWoodType(shape) && 
             Object.values(matchingWoodStyles).some(group => 
               group.includes(shapeId)
             ));
        }

        newAllShapes[shapeId] = updatedShape;
      });

      // Create new state
      const newState = {
        ...state,
        styleMode: mode,
        globalStyle: mode === 'independent' ? null : state.globalStyle,
        allShapes: newAllShapes
      };

      return {
        ...newState,
        finalRequirements: calculateFinalRequirements(newState)
      };
    }

    case ACTION_TYPES.UPDATE_GLOBAL_STYLE: {
      if (state.styleMode !== 'global') return state;

      return {
        ...state,
        globalStyle: payload.style,
        finalRequirements: calculateFinalRequirements({
          ...state,
          globalStyle: payload.style
        })
      };
    }

    case ACTION_TYPES.UPDATE_THREAD_MODE: {
      const { threadType, mode } = payload;
      if (threadType !== 'embroidery') return state;

      const newAllShapes = { ...state.allShapes };

      if (mode === 'global') {
        // Clear thread data from shapes when switching to global
        Object.keys(newAllShapes).forEach(shapeId => {
          if (newAllShapes[shapeId].isSelected) {
            newAllShapes[shapeId] = {
              ...newAllShapes[shapeId],
              embroideryThread: null
            };
          }
        });
      }

      return {
        ...state,
        threadMode: {
          ...state.threadMode,
          [threadType]: mode
        },
        globalEmbroideryThread: mode === 'perShape' ? null : state.globalEmbroideryThread,
        allShapes: newAllShapes
      };
    }

    case ACTION_TYPES.UPDATE_GLOBAL_EMBROIDERY: {
      return state.threadMode?.embroidery === 'global'
        ? {
            ...state,
            globalEmbroideryThread: payload
          }
        : state;
    }

    case ACTION_TYPES.UPDATE_STITCHING_THREADS: {
      return {
        ...state,
        stitchingThreads: payload
      };
    }

    case ACTION_TYPES.UPDATE_LEATHER_COLORS: {
      return {
        ...state,
        leatherColors: payload
      };
    }

    case ACTION_TYPES.UPDATE_SHAPE: {
      const { shape, checked, weight } = payload;
      const newAllShapes = { ...state.allShapes };

      if (checked) {
        // Initialize selected shape with current mode settings
        newAllShapes[shape.value] = {
          ...newAllShapes[shape.value],
          isSelected: true,
          weight: weight || '',
          needsColorDesignation: !isPutter(shape) && (
            state.finalRequirements?.needsColorDesignation ||
            (state.styleMode === 'independent' && 
             isWoodType(shape) && 
             findMatchingWoodStyles(
               initialState.shapes,
               newAllShapes
             )[shape.value]
            )
          )
        };
      } else {
        // Reset shape to initial state when unchecked
        newAllShapes[shape.value] = createInitialShapeState(shape);
      }

      return {
        ...state,
        allShapes: newAllShapes
      };
    }

    case ACTION_TYPES.UPDATE_SHAPE_FIELD: {
      const { shapeId, field, value } = payload;
      const shape = state.allShapes[shapeId];
      
      if (!shape?.isSelected) return state;

      const newAllShapes = {
        ...state.allShapes,
        [shapeId]: {
          ...shape,
          [field]: value
        }
      };

      // Recalculate color designation when styles change
      if (field === 'style' && state.styleMode === 'independent') {
        Object.entries(newAllShapes).forEach(([currentShapeId, currentShape]) => {
          if (!currentShape.isSelected || isPutter(currentShape)) return;

          const matchingWoodStyles = findMatchingWoodStyles(
            initialState.shapes,
            Object.fromEntries(
              Object.entries(newAllShapes)
                .filter(([_, s]) => s.isSelected)
            )
          );

          newAllShapes[currentShapeId] = {
            ...currentShape,
            needsColorDesignation: 
              state.finalRequirements?.needsColorDesignation ||
              (isWoodType(currentShape) && 
               Object.values(matchingWoodStyles).some(group => 
                 group.includes(currentShapeId)
               ))
          };
        });
      }

      return {
        ...state,
        allShapes: newAllShapes
      };
    }

    case ACTION_TYPES.UPDATE_SIMPLE: {
      const { field, value } = payload;
      return {
        ...state,
        [field]: value
      };
    }

    default:
      console.warn('Unknown action type:', type);
      return state;
  }
};

export const useFormState = (initialState) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = useCallback((field, value) => {
    console.log('handleChange called with:', { field, value });

    // Map field names to appropriate actions
    const actionMap = {
      collection: () => ({
        type: ACTION_TYPES.UPDATE_COLLECTION,
        payload: { collection: value },
        initialState
      }),
      styleMode: () => ({
        type: ACTION_TYPES.UPDATE_STYLE_MODE,
        payload: { mode: value },
        initialState
      }),
      globalStyle: () => ({
        type: ACTION_TYPES.UPDATE_GLOBAL_STYLE,
        payload: { style: value }
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
        payload: value // { shape, checked, weight }
      }),
      shapeField: () => ({
        type: ACTION_TYPES.UPDATE_SHAPE_FIELD,
        payload: value // { shapeId, field, value }
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