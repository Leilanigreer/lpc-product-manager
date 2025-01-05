// app/hooks/useFormState.js

import { useReducer, useCallback } from 'react';

// Action types for better maintainability
const ACTION_TYPES = {
  UPDATE_COLLECTION: 'UPDATE_COLLECTION',
  UPDATE_STYLE_MODE: 'UPDATE_STYLE_MODE',
  UPDATE_GLOBAL_STYLE: 'UPDATE_GLOBAL_STYLE',
  UPDATE_SHAPE_STYLES: 'UPDATE_SHAPE_STYLES',
  UPDATE_THREAD_MODE: 'UPDATE_THREAD_MODE',
  UPDATE_GLOBAL_THREADS: 'UPDATE_GLOBAL_THREADS',
  UPDATE_SHAPE_THREADS: 'UPDATE_SHAPE_THREADS',
  UPDATE_WEIGHTS: 'UPDATE_WEIGHTS',
  UPDATE_LEATHER_COLORS: 'UPDATE_LEATHER_COLORS',
  UPDATE_QCLASSIC: 'UPDATE_QCLASSIC',
  UPDATE_SIMPLE: 'UPDATE_SIMPLE'
};

const formReducer = (state, action) => {
  const { type, payload, initialState } = action;

  switch (type) {
    case ACTION_TYPES.UPDATE_COLLECTION: {
      const { collection } = payload;
      // Reset state but keep collection data
      return {
        ...initialState,
        collection: {
          ...collection,
          // Ensure all required collection fields are present
          threadType: collection.threadType || 'NONE',
          commonDescription: collection.commonDescription ?? true,
          needsSecondaryLeather: collection.needsSecondaryLeather ?? false,
          needsStitchingColor: collection.needsStitchingColor ?? false,
          needsQClassicField: collection.needsQClassicField ?? false,
          needsStyle: collection.needsStyle ?? false,
          showInDropdown: collection.showInDropdown ?? true
        }
      };
    }

    case ACTION_TYPES.UPDATE_STYLE_MODE: {
      const { mode } = payload;
      return {
        ...state,
        styleMode: mode,
        // Reset style selections when changing modes
        globalStyle: mode === 'global' ? state.globalStyle : null,
        selectedStyles: mode === 'independent' ? {} : null
      };
    }

    case ACTION_TYPES.UPDATE_GLOBAL_STYLE: {
      const { style } = payload;
      if (state.styleMode !== 'global') return state;

      // Apply global style to all shapes
      const selectedStyles = {};
      Object.keys(state.weights || {}).forEach(shapeId => {
        selectedStyles[shapeId] = style;
      });

      return {
        ...state,
        globalStyle: style,
        selectedStyles
      };
    }

    case ACTION_TYPES.UPDATE_THREAD_MODE: {
      const { threadType, mode } = payload;
      return {
        ...state,
        threadMode: {
          ...state.threadMode,
          [threadType]: mode
        },
        // Reset related thread selections
        ...(threadType === 'embroidery' && {
          globalEmbroideryThread: mode === 'global' ? null : state.globalEmbroideryThread,
          shapeEmbroideryThreads: mode === 'perShape' ? {} : state.shapeEmbroideryThreads
        })
      };
    }

    case ACTION_TYPES.UPDATE_WEIGHTS: {
      const { weights } = payload;
      const newState = { ...state, weights };

      // Handle removed shapes
      const removedShapeIds = Object.keys(state.weights || {})
        .filter(id => !weights[id]);

      if (removedShapeIds.length > 0) {
        // Clean up related state for removed shapes
        removedShapeIds.forEach(shapeId => {
          if (state.selectedStyles) delete newState.selectedStyles[shapeId];
          if (state.shapeEmbroideryThreads) delete newState.shapeEmbroideryThreads[shapeId];
          if (state.qClassicLeathers) delete newState.qClassicLeathers[shapeId];
        });
      }

      // Handle new shapes
      const newShapeIds = Object.keys(weights)
        .filter(id => !state.weights?.[id]);

      if (newShapeIds.length > 0) {
        // Initialize new shapes with global values if applicable
        if (state.styleMode === 'global' && state.globalStyle) {
          newState.selectedStyles = { ...newState.selectedStyles };
          newShapeIds.forEach(shapeId => {
            newState.selectedStyles[shapeId] = state.globalStyle;
          });
        }

        if (state.threadMode?.embroidery === 'global' && state.globalEmbroideryThread) {
          newState.shapeEmbroideryThreads = { ...newState.shapeEmbroideryThreads };
          newShapeIds.forEach(shapeId => {
            newState.shapeEmbroideryThreads[shapeId] = state.globalEmbroideryThread;
          });
        }
      }

      return newState;
    }

    case ACTION_TYPES.UPDATE_LEATHER_COLORS: {
      const { type: leatherType, color } = payload;
      return {
        ...state,
        leatherColors: {
          ...state.leatherColors,
          [leatherType]: color
        }
      };
    }

    case ACTION_TYPES.UPDATE_QCLASSIC: {
      const { shapeId, leather } = payload;
      return {
        ...state,
        qClassicLeathers: {
          ...state.qClassicLeathers,
          [shapeId]: leather
        }
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
      return state;
  }
};

export const useFormState = (initialState) => {
  const [state, dispatch] = useReducer(formReducer, initialState);

  const handleChange = useCallback((field, value) => {
    // Determine action type based on field and value
    if (field === 'collection') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_COLLECTION, 
        payload: { collection: value },
        initialState 
      });
    } else if (field === 'styleMode') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_STYLE_MODE, 
        payload: { mode: value } 
      });
    } else if (field === 'globalStyle') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_GLOBAL_STYLE, 
        payload: { style: value } 
      });
    } else if (field === 'threadMode') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_THREAD_MODE, 
        payload: value // { threadType, mode }
      });
    } else if (field === 'weights') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_WEIGHTS, 
        payload: { weights: value } 
      });
    } else if (field === 'leatherColors') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_LEATHER_COLORS, 
        payload: value // { type, color }
      });
    } else if (field === 'qClassicLeathers') {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_QCLASSIC, 
        payload: value // { shapeId, leather }
      });
    } else {
      dispatch({ 
        type: ACTION_TYPES.UPDATE_SIMPLE, 
        payload: { field, value } 
      });
    }
  }, [initialState]);

  return [state, handleChange];
};