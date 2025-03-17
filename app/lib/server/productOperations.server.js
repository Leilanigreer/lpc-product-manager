// app/lib/server/productOperations.server.js

import prisma from "../../db.server.js";

/**
 * Maps and saves product data to the database using the new parent-child structure
 * @param {Object} productData - Generated product data from generateProductData
 * @param {Object} shopifyResponse - Response from Shopify API after product creation
 * @returns {Promise<Object>} Created product records
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

    const collection = productData.collection;
  
    if (!collection) {
      throw new Error('Collection data missing from product data');
    }

    // Create the parent product set first
    const productSet = await prisma.productSetDataLPC.create({
      data: {
        shopifyProductId: shopifyResponse.product.id,
        baseSKU: filteredVariants[0].baseSKU,
        offeringType: productData.offeringType,
        mainHandle: productData.mainHandle,
        collections: {
          create: {
            collectionId: collection.value
          }
        },
        font: {
          connect: { id: productData.selectedFont }
        },
        leatherColor1: {
          connect: { id: productData.selectedLeatherColor1 }
        },
        ...(collection.needsSecondaryLeather && productData.selectedLeatherColor2 && {
          leatherColor2: {
            connect: { id: productData.selectedLeatherColor2 }
          }
        }),
        stitchingThreads: {
          create: Object.entries(productData.stitchingThreads).map(([_, thread]) => ({
            stitchingThread: {
              connect: { id: thread.value }
            },
            amann: {
              connect: { id: thread.amannNumbers[0].value }
            }
          }))
        }
      }
    });

    // Group regular and custom variants by their base characteristics
    const variantGroups = filteredVariants.reduce((groups, variant) => {
      const key = `${variant.shapeValue}-${variant.style?.value || ''}-${variant.colorDesignation?.value || ''}`;
      if (!groups[key]) {
        groups[key] = { regular: null, custom: null };
      }
      if (variant.isCustom) {
        groups[key].custom = variant;
      } else {
        groups[key].regular = variant;
      }
      return groups;
    }, {});

    // Create variants with their custom counterparts
    const savedVariants = await Promise.all(
      Object.values(variantGroups).map(async ({ regular, custom }) => {
        if (!regular) {
          throw new Error('Found custom variant without regular counterpart');
        }

        const regularShopifyVariant = shopifyResponse.variants.find(v => 
          v.inventoryItem?.sku === regular.sku
        );

        if (!regularShopifyVariant) {
          throw new Error(`No matching Shopify variant found for SKU: ${regular.sku}`);
        }

        let embroideryThreadData = {};
        if (regular.embroideryThread && 
            regular.embroideryThread.value !== "NO_EMBROIDERY" && 
            regular.embroideryThread.isacordNumbers?.[0]) {
          embroideryThreadData = {
            embroideryThread: {
              connect: { id: regular.embroideryThread.value }
            },
            isacord: {
              connect: { id: regular.embroideryThread.isacordNumbers[0].value }
            }
          };
        }

        // Find custom Shopify variant if it exists
        const customShopifyVariant = custom ? shopifyResponse.variants.find(v => 
          v.inventoryItem?.sku === custom.sku
        ) : null;

        return prisma.productVariantDataLPC.create({
          data: {
            set: {
              connect: { id: productSet.id }
            },
            shopifyVariantId: regularShopifyVariant.id,
            shopifyInventoryId: regularShopifyVariant.inventoryItem.id,
            SKU: regular.sku,
            shape: {
              connect: { id: regular.shapeValue }
            },
            weight: parseFloat(regular.weight),
            ...embroideryThreadData,
            ...(collection.needsStyle && regular.style && {
              style: {
                connect: { id: regular.style.value }
              }
            }),
            ...(collection.needsColorDesignation && regular.colorDesignation && {
              colorDesignation: {
                connect: { id: regular.colorDesignation.value }
              }
            }),
            // Add custom variant data if it exists
            ...(customShopifyVariant && {
              customShopifyVariantId: customShopifyVariant.id,
              customShopifyInventoryId: customShopifyVariant.inventoryItem.id,
              customSKU: custom.sku
            })
          }
        });
      })
    );

    return {
      mainProduct: productSet,
      variants: savedVariants
    };

  } catch (error) {
    console.error('Error saving product to database:', error);
    throw error;
  }
};