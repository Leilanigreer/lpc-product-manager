// app/lib/utils/threadUtils.js

export const mapStitchingThreads = (threads) => {
  if (!threads) return [];
  
  return Object.values(threads)
    .map(thread => ({
      threadValue: thread.value,
      amannNumberValue: thread.amannNumbers?.[0]?.value
    }))
    .filter(t => t.threadValue && t.amannNumberValue);
};

export const mapEmbroideryThreads = (formState) => {
  const threads = [];
  
  if (formState.threadMode?.embroidery === 'global' && formState.globalEmbroideryThread) {
    const global = formState.globalEmbroideryThread;
    if (global.value && global.isacordNumbers?.[0]?.value) {
      threads.push({
        embroideryThreadValue: global.value,
        isacordNumberValue: global.isacordNumbers[0].value
      });
    }
  } else {
    Object.values(formState.allShapes)
      .filter(shape => shape.isSelected && shape.embroideryThread)
      .forEach(shape => {
        const thread = shape.embroideryThread;
        if (thread.value && thread.isacordNumbers?.[0]?.value) {
          threads.push({
            embroideryThreadValue: thread.value,
            isacordNumberValue: thread.isacordNumbers[0].value
          });
        }
      });
  }
  
  return threads;
};