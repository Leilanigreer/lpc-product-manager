import { useReducer, useCallback } from 'react';
import { calculateFinalRequirements } from '../lib/utils';

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

const getDefaultStyleState = () => ({
  styleMode: '',
  globalStyle: null,
});

const formReducer = (state, action) => {
  const { type, payload, initialState } = action;
  console.log('FormReducer - Action:', { type, payload });

  let newState;
  
  switch (type) {
    case ACTION_TYPES.UPDATE_COLLECTION: {
      newState = {
        ...initialState,
        collection: payload.collection,
        ...getDefaultStyleState(),
        selectedShapes: {}
      };
      break;
    }

    case ACTION_TYPES.UPDATE_STYLE_MODE: {
      const { mode } = payload;
      newState = {
        ...state,
        styleMode: mode,
        globalStyle: mode === 'global' ? null : state.globalStyle,
        selectedShapes: mode === 'global'
          ? Object.fromEntries(
              Object.entries(state.selectedShapes).map(([key, shape]) => [
                key,
                { ...shape, style: null }
              ])
            )
          : state.selectedShapes
      };
      break;
    }

    case ACTION_TYPES.UPDATE_GLOBAL_STYLE: {
      if (state.styleMode !== 'global') return state;
      
      newState = {
        ...state,
        globalStyle: payload.style
      };
      break;
    }

    case ACTION_TYPES.UPDATE_THREAD_MODE: {
      const { threadType, mode } = payload;
      
      const newState = {
        ...state,
        threadMode: {
          ...state.threadMode,
          [threadType]: mode
        }
      };

      // Clear appropriate thread data when changing modes
      if (threadType === 'embroidery') {
        if (mode === 'perShape') {
          newState.globalEmbroideryThread = null;
        } else {
          // Clear shape-specific thread data
          newState.selectedShapes = Object.fromEntries(
            Object.entries(state.selectedShapes).map(([key, shape]) => [
              key,
              {
                ...shape,
                embroideryThread: null
              }
            ])
          );
        }
      }

      return newState;
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
      const newSelectedShapes = { ...state.selectedShapes };

      if (checked) {
        // Add or update shape
        newSelectedShapes[shape.value] = {
          ...shape,
          weight: weight || '',
          style: state.styleMode === 'global' ? null : shape.style,
          embroideryThread: state.threadMode?.embroidery === 'global' ? null : shape.embroideryThread,
          colorDesignation: shape.colorDesignation
        };
      } else {
        // Remove shape and its data
        delete newSelectedShapes[shape.value];
      }

      return {
        ...state,
        selectedShapes: newSelectedShapes
      };
    }

    case ACTION_TYPES.UPDATE_SHAPE_FIELD: {
      const { shapeId, field, value } = payload;
      const shape = state.selectedShapes[shapeId];
      
      if (!shape) return state;

      return {
        ...state,
        selectedShapes: {
          ...state.selectedShapes,
          [shapeId]: {
            ...shape,
            [field]: value
          }
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
      console.warn('Unknown action type:', type);
      return state;
  }

  const finalRequirements = calculateFinalRequirements(newState);
  return {
    ...newState,
    finalRequirements
  };
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
        payload: { mode: value }
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
      // Handle shape-specific updates
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

