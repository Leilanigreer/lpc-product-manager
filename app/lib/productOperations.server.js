// /Users/leilanigreer/Documents/GitHub/Shopify/lpc-product-creation-10-16-24/app/lib/productOperations.server.js


import prisma from "../db.server";
import { getShopifyCollectionType, needsQClassicField, needsStyle, needsStitchingColor, needsSecondaryColor } from "./collectionUtils";

/**
 * Maps and saves product data to the productDataLPC table
 * @param {Object} productData - Generated product data from generateProductData
 * @param {Object} shopifyResponse - Response from Shopify API after product creation
 * @returns {Promise<Object>} Created productDataLPC record
 */
export const saveProductToDatabase = async (productData, shopifyResponse) => {
  try {
    console.log('Received variant data:', {
      productDataVariants: productData.variants.map(v => ({
        sku: v.sku,
        variantName: v.variantName
      })),
      shopifyVariants: shopifyResponse.variants.map(v => ({
        sku: v.sku,
        inventoryItemSku: v?.inventoryItem?.sku,
        title: v.title
      }))
    });

    console.log('Starting database save with product data:', {
      collectionId: productData.collectionId,
      offeringType: productData.offeringType,
      selectedFont: productData.selectedFont,
      variantsCount: productData.variants.length
    });

    // Filter out "Create my own set" variant
    const filteredVariants = productData.variants.filter(
      variant => variant.variantName !== "Create my own set"
    );

    if (filteredVariants.length === 0) {
      throw new Error('No valid variants found after filtering');
    }

    // Extract variant data from the first filtered variant as a base
    const baseVariant = filteredVariants[0];

    // Validate collection exists
    const collection = await prisma.shopifyCollection.findUnique({
      where: {
        id: productData.collectionId
      }
    });

    if (!collection) {
      throw new Error(`Collection not found for ID: ${productData.collectionId}`);
    }

    console.log('Found collection:', {
      id: collection.id,
      title: collection.title,
      handle: collection.handle
    });

    const collectionType = getShopifyCollectionType({ handle: collection.handle });

    // Map the data to match your productDataLPC schema
    const createProductRecord = async (variant, shopifyVariant) => {
      if (!shopifyVariant) {
        throw new Error(`No Shopify variant found for SKU: ${variant.sku}`);
      }
    
      // Validate all required fields
      const requiredFields = {
        shopifyProductId: shopifyResponse.product.id,
        shopifyVariantId: shopifyVariant.id,
        shopifyInventoryId: shopifyVariant.inventoryItem?.id,
        SKU: variant.sku,
        offeringType: productData.offeringType,
        weight: variant.weight,
        mainHandle: productData.mainHandle,
        collectionId: productData.collectionId,
        fontId: productData.selectedFont,
        shapeId: variant.shapeId,
        leatherColor1Id: productData.selectedLeatherColor1,
        isacordId: variant.isacordNumberId || productData.matchingIsacordNumber
      };
    
      // Validate that all required fields are present
      Object.entries(requiredFields).forEach(([key, value]) => {
        if (!value) {
          throw new Error(`Missing required field: ${key}`);
        }
      });
    
      // Build the product record
      const productRecord = {
        // Required fields
        shopifyProductId: requiredFields.shopifyProductId,
        shopifyVariantId: requiredFields.shopifyVariantId,
        shopifyInventoryId: requiredFields.shopifyInventoryId,
        SKU: requiredFields.SKU,
        offeringType: requiredFields.offeringType,
        weight: parseFloat(requiredFields.weight),
        mainHandle: requiredFields.mainHandle,
    
        // Required relations
        collection: {
          connect: {
            id: requiredFields.collectionId
          }
        },
        font: {
          connect: {
            id: requiredFields.fontId
          }
        },
        shape: {
          connect: {
            id: requiredFields.shapeId
          }
        },
        leatherColor1: {
          connect: {
            id: requiredFields.leatherColor1Id
          }
        },
        isacord: {
          connect: {
            id: requiredFields.isacordId
          }
        },
    
        // Optional relations based on collection type
        ...(needsSecondaryColor(collectionType) && productData.selectedLeatherColor2 && {
          leatherColor2: {
            connect: {
              id: productData.selectedLeatherColor2
            }
          }
        }),
    
        ...(needsStitchingColor(collectionType) && (variant.amannNumberId || productData.matchingAmannNumber) && {
          amann: {
            connect: {
              id: variant.amannNumberId || productData.matchingAmannNumber
            }
          }
        }),
    
        ...(needsStyle(collectionType) && variant.styleId && {
          style: {
            connect: {
              id: variant.styleId
            }
          }
        }),
    
        ...(needsQClassicField(collectionType) && variant.qClassicLeather && {
          quiltedLeatherColor: {
            connect: {
              id: variant.qClassicLeather
            }
          }
        })
      };
    
      console.log('Creating product record:', {
        SKU: productRecord.SKU,
        collectionType,
        shopifyVariantId: productRecord.shopifyVariantId,
        shopifyInventoryId: productRecord.shopifyInventoryId,
        required: {
          offeringType: productRecord.offeringType,
          shape: variant.shape || variant.variantName,
          isacordId: requiredFields.isacordId,
        },
        optional: {
          leatherColor2: needsSecondaryColor(collectionType) ? 
            (productData.selectedLeatherColor2 || 'not set') : 'not applicable',
          amann: needsStitchingColor(collectionType) ? 
            (variant.amannNumberId || productData.matchingAmannNumber || 'not set') : 'not applicable',
          style: needsStyle(collectionType) ? 
            (variant.styleId || 'not set') : 'not applicable',
          quiltedLeatherColor: needsQClassicField(collectionType) ? 
            (variant.qClassicLeather || 'not set') : 'not applicable',
          collectionTypeInfo: {
            type: collectionType,
            needsSecondaryColor: needsSecondaryColor(collectionType),
            needsStitchingColor: needsStitchingColor(collectionType),
            needsStyle: needsStyle(collectionType),
            needsQClassicField: needsQClassicField(collectionType),
          }
        }
      });
    
      return prisma.productDataLPC.create({
        data: productRecord,
        include: {
          collection: true,
          font: true,
          shape: true,
          leatherColor1: true,
          leatherColor2: true,
          amann: true,
          isacord: true,
          style: true,
          quiltedLeatherColor: true,
        }
      });
    };

    // Find Shopify variant data for the base variant
    const mainShopifyVariant = shopifyResponse.variants.find(variant => {
      const matches = variant.inventoryItem?.sku === baseVariant.sku;
      console.log('Matching attempt:', {
        lookingFor: baseVariant.sku,
        checking: variant.inventoryItem?.sku,
        matches
      });
      return matches;
    });

    if (!mainShopifyVariant) {
      console.error('Failed to find main variant:', {
        searchingSKU: baseVariant.sku,
        availableVariants: shopifyResponse.variants.map(v => ({
          sku: v.inventoryItem?.sku,
          title: v.title
        }))
      });
      throw new Error(`No matching Shopify variant found for SKU: ${baseVariant.sku}`);
    }

    const savedProduct = await createProductRecord(baseVariant, mainShopifyVariant);

    // Update additional variants matching
    const variantPromises = filteredVariants.slice(1).map(async (variant) => {
      const matchingShopifyVariant = shopifyResponse.variants.find(v => {
        const matches = v.inventoryItem?.sku === variant.sku;
        console.log('Additional variant matching attempt:', {
          lookingFor: variant.sku,
          checking: v.inventoryItem?.sku,
          matches
        });
        return matches;
      });
      
      if (!matchingShopifyVariant) {
        console.error('Failed to match additional variant:', {
          searchingSKU: variant.sku,
          availableVariants: shopifyResponse.variants.map(v => ({
            sku: v.inventoryItem?.sku,
            title: v.title
          }))
        });
        throw new Error(`No matching Shopify variant found for SKU: ${variant.sku}`);
      }
      
      return createProductRecord(variant, matchingShopifyVariant);
    });

    const allVariants = await Promise.all(variantPromises);

    return {
      mainProduct: savedProduct,
      variants: allVariants
    };

  } catch (error) {
    console.error('Error saving product to database:', error);
    throw error;
  }
};