import prisma from "../../db.server.js";

/**
 * Creates a new custom option with its values
 * @param {Object} optionData - The option data to create
 * @returns {Promise<Object>} Created option with its values
 */
export const createCustomOption = async (optionData) => {
  try {
    console.log('=== CREATE CUSTOM OPTION START ===');
    console.log('Incoming optionData:', optionData);
    console.log('Stringified optionData:', JSON.stringify(optionData, null, 2));
    
    // Validate required fields
    if (!optionData.name || !optionData.layoutId) {
      console.log('Validation failed:', { name: optionData.name, layoutId: optionData.layoutId });
      throw new Error('Missing required fields: name or layoutId');
    }

    console.log('About to create option with Prisma');
    
    // Create the option
    const option = await prisma.option.create({
      data: {
        name: optionData.name,
        required: optionData.required ?? false,
        layoutId: optionData.layoutId,
        // Optional fields
        nickname: optionData.nickname || null,
        description: optionData.description || null,
        inCartName: optionData.inCartName || null,
        allowedTypes: optionData.allowedTypes || null,
        minSelection: optionData.minSelectable ? parseInt(optionData.minSelectable) : null,
        maxSelection: optionData.maxSelectable ? parseInt(optionData.maxSelectable) : null,
        allowMultiple: optionData.allowMultipleSelections || null,
        placeholderText: optionData.placeholderText || null,
        minCharacters: optionData.minCharLimit ? parseInt(optionData.minCharLimit) : null,
        maxCharacters: optionData.maxCharLimit ? parseInt(optionData.maxCharLimit) : null,
        minNumber: optionData.minNumber ? parseInt(optionData.minNumber) : null,
        maxNumber: optionData.maxNumber ? parseInt(optionData.maxNumber) : null,
        // Create option values if they exist
        OptionValue: optionData.values ? {
          create: optionData.values.map((value, index) => ({
            name: value.name,
            displayOrder: value.displayOrder ?? index,
            associatedProductId: value.associatedProductId,
            default: value.default ?? false,
            imageUrl: value.imageUrl
          }))
        } : undefined
      },
      include: {
        OptionValue: true,
        layout: true
      }
    });

    console.log('Successfully created option:', option.id);
    return option;
  } catch (error) {
    console.error('=== CREATE CUSTOM OPTION ERROR ===');
    console.error('Error creating custom option:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.meta) {
      console.error('Error metadata:', error.meta);
    }
    throw error;
  }
};

/**
 * Updates an existing custom option and its values
 * @param {string} optionId - The ID of the option to update
 * @param {Object} optionData - The updated option data
 * @returns {Promise<Object>} Updated option with its values
 */
export const updateCustomOption = async (optionId, optionData) => {
  try {
    console.log('=== UPDATE CUSTOM OPTION START ===');
    console.log('Updating option ID:', optionId);
    console.log('Incoming optionData:', optionData);
    console.log('Stringified optionData:', JSON.stringify(optionData, null, 2));
    
    // Validate required fields
    if (!optionId || !optionData.name) {
      console.log('Validation failed:', { optionId, name: optionData.name });
      throw new Error('Missing required fields: optionId or name');
    }

    console.log('About to update option with Prisma');
    
    // Update the option
    const option = await prisma.option.update({
      where: { id: optionId },
      data: {
        name: optionData.name,
        required: optionData.required ?? false,
        // Optional fields
        nickname: optionData.nickname || null,
        description: optionData.description || null,
        inCartName: optionData.inCartName || null,
        allowedTypes: optionData.allowedTypes || null,
        minSelection: optionData.minSelectable ? parseInt(optionData.minSelectable) : null,
        maxSelection: optionData.maxSelectable ? parseInt(optionData.maxSelectable) : null,
        allowMultiple: optionData.allowMultipleSelections || null,
        placeholderText: optionData.placeholderText || null,
        minCharacters: optionData.minCharLimit ? parseInt(optionData.minCharLimit) : null,
        maxCharacters: optionData.maxCharLimit ? parseInt(optionData.maxCharLimit) : null,
        minNumber: optionData.minNumber ? parseInt(optionData.minNumber) : null,
        maxNumber: optionData.maxNumber ? parseInt(optionData.maxNumber) : null,
        // Update option values
        OptionValue: {
          deleteMany: {}, // Remove all existing values
          create: optionData.values?.map((value, index) => ({
            name: value.name,
            displayOrder: value.displayOrder ?? index,
            associatedProductId: value.associatedProductId,
            default: value.default ?? false,
            imageUrl: value.imageUrl
          })) || []
        }
      },
      include: {
        OptionValue: true,
        layout: true
      }
    });

    console.log('Successfully updated option:', option.id);
    return option;
  } catch (error) {
    console.error('=== UPDATE CUSTOM OPTION ERROR ===');
    console.error('Error updating custom option:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.meta) {
      console.error('Error metadata:', error.meta);
    }
    throw error;
  }
};

/**
 * Deletes a custom option and its values
 * @param {string} optionId - The ID of the option to delete
 * @returns {Promise<Object>} Deleted option
 */
export const deleteCustomOption = async (optionId) => {
  try {
    const option = await prisma.option.delete({
      where: { id: optionId },
      include: {
        OptionValue: true
      }
    });

    return option;
  } catch (error) {
    console.error('Error deleting custom option:', error);
    throw error;
  }
};

/**
 * Gets all custom options with their values
 * @returns {Promise<Array>} Array of options with their values
 */
export const getAllCustomOptions = async () => {
  try {
    const options = await prisma.option.findMany({
      include: {
        OptionValue: true,
        layout: true
      }
    });

    return options;
  } catch (error) {
    console.error('Error fetching custom options:', error);
    throw error;
  }
};

/**
 * Gets a single custom option by ID
 * @param {string} optionId - The ID of the option to fetch
 * @returns {Promise<Object>} Option with its values
 */
export const getCustomOptionById = async (optionId) => {
  try {
    const option = await prisma.option.findUnique({
      where: { id: optionId },
      include: {
        OptionValue: true,
        layout: true
      }
    });

    if (!option) {
      throw new Error(`Option with ID ${optionId} not found`);
    }

    return option;
  } catch (error) {
    console.error('Error fetching custom option:', error);
    throw error;
  }
}; 