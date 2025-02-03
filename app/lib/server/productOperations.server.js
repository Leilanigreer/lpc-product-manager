// app/lib/server/productOperations.server.js

import prisma from "../../db.server.js";

/**
 * Maps and saves product data to the productDataLPC table
 * @param {Object} productData - Generated product data from generateProductData
 * @param {Object} shopifyResponse - Response from Shopify API after product creation
 * @returns {Promise<Object>} Created productDataLPC record
 */
export const saveProductToDatabase = async (productData, shopifyResponse) => {
  try {
    // Filter out "Create my own set" variant
    const filteredVariants = productData.variants.filter(
      variant => variant.variantName !== "Create my own set"
    );

    if (filteredVariants.length === 0) {
      throw new Error('No valid variants found after filtering');
    }

    // Extract variant data from the first filtered variant as a base
    const baseVariant = filteredVariants[0];

    const collection = productData.collection
  
    if (!collection) {
      throw new Error('Collection data missing from product data');
    }

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
        baseSKU: variant.baseSKU,
        offeringType: productData.offeringType,
        weight: variant.weight,
        mainHandle: productData.mainHandle,
        collectionId: productData.collection.value,
        fontId: productData.selectedFont,
        shapeId: variant.shapeValue,
        leatherColor1Id: productData.selectedLeatherColor1,
      };
    
      // Validate that all required fields are present
      Object.entries(requiredFields).forEach(([key, value]) => {
        if (!value) {
          throw new Error(`Missing required field: ${key} for variant with SKU: ${variant.sku}`);
        }
      });
    
      // Build the product record
      try {

        let embroideryThreadData = {};

        if (variant.embroideryThread && 
          variant.embroideryThread.value !== "NO_EMBROIDERY" && variant.embroideryThread.isacordNumbers?.[0]) {
          embroideryThreadData = {
            embroideryThread: {
              connect: { id: variant.embroideryThread.value }
            },
            isacord: {
              connect: { id: variant.embroideryThread.isacordNumbers[0].value }
            }
          };
        }

        const productRecord = {
          // Required fields
          shopifyProductId: requiredFields.shopifyProductId,
          shopifyVariantId: requiredFields.shopifyVariantId,
          shopifyInventoryId: requiredFields.shopifyInventoryId,
          SKU: requiredFields.SKU,
          baseSKU: requiredFields.baseSKU,
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
          stitchingThreads: {
            create: Object.entries(productData.stitchingThreads).map(([_, thread]) => ({
              stitchingThread: {
                connect: { id: thread.value }
              },
              amann: {
                connect: { id: thread.amannNumbers[0].value }
              }
            }))
          },
      
          // Optional relations based on collection configuration
          ...embroideryThreadData,

          ...(collection.needsSecondaryLeather && productData.selectedLeatherColor2 && {
            leatherColor2: {
              connect: { id: productData.selectedLeatherColor2 }
            }
          }),
    
          ...(collection.needsStyle && variant.styleId && {
            style: {
              connect: { id: variant.styleId }
            }
          }),
    
          ...(collection.needsColorDesignation && variant.colorDesignation && {
            colorDesignation: {
              connect: { id: variant.colorDesignation }
            }
          })
        };
      
        return prisma.productDataLPC.create({
          data: productRecord,
        });
      } catch (error) {
        throw new Error(`Failed to create product record: ${error.message}`);
      }
    };

    // Find Shopify variant data for the base variant
    const mainShopifyVariant = shopifyResponse.variants.find(variant => {
      const matches = variant.inventoryItem?.sku === baseVariant.sku;
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