// app/lib/generators/variants/regular/threadData.js

/**
 * Creates thread-related properties for a variant
 * @param {Object} formState - Current form state containing thread data
 * @param {Object} formState.threadData - Thread-specific data
 * @param {string} formState.threadData.threadType - Type of thread data ('global' or 'shape-specific')
 * @param {Object} formState.threadData.globalThreads - Global thread settings
 * @param {Object} formState.threadData.shapeThreads - Shape-specific thread settings
 * @param {string} shapeId - ID of the shape to get thread data for
 * @returns {Object} Thread properties for the variant
 * @example
 * const threadData = createThreadData(formState, 'shape-123');
 * // Returns: { 
 *   stitchingThreadId: 'thread-1', 
 *   amannNumberId: 'amann-1',
 *   embroideryThreadId: 'thread-2',
 *   isacordNumberId: 'isacord-1'
 * }
 */
export const createThreadData = (formState, shapeId) => {
  if (!formState || !shapeId) {
    console.warn('Missing required parameters in createThreadData');
    return {};
  }

  const threadData = {};
  
  if (!['global', 'shape-specific'].includes(formState.threadData?.threadType)) {
    console.warn(`Invalid thread type: ${formState.threadData?.threadType}`);
    return threadData;
  }
  
  // Handle global thread settings
  if (formState.threadData?.threadType === 'global') {
    const { stitching, embroidery } = formState.threadData.globalThreads || {};

    if (stitching) {
      threadData.stitchingThreadId = stitching.threadId;
      threadData.amannNumberId = stitching.numberId;
    }

    if (embroidery) {
      threadData.embroideryThreadId = embroidery.threadId;
      threadData.isacordNumberId = embroidery.numberId;
    }
  } 
  // Handle shape-specific thread settings
  else {
    const shapeThreadData = formState.threadData?.shapeThreads?.[shapeId];
    if (shapeThreadData?.embroideryThread) {
      threadData.embroideryThreadId = shapeThreadData.embroideryThread.threadId;
      threadData.isacordNumberId = shapeThreadData.embroideryThread.numberId;
    }
  }
  
  return threadData;
};