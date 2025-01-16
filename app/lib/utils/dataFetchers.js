// app/lib/dataFetchers.js
import prisma from "../../db.server.js";

export const getLeatherColors = async () => {
  try {
    const leatherColors = await prisma.LeatherColor.findMany({
      include: {
        colorTags: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return leatherColors.map(({ id, name, abbreviation, url_id, colorTags }) => ({
      value: id,
      label: name,
      abbreviation,
      url_id,
      colorTags: colorTags.map(tag => ({
        value: tag.id,
        label: tag.name
      }))
    }));
  } catch (error) {
    console.error("Error fetching leather colors:", error);
    throw error;
  }
};

export const getStitchingThreadColors = async () => {
  try {
    const stitchingThreadColors = await prisma.stitchingThread.findMany({
      include: {
        colorTags: {
          select: {
            id: true,
            name: true
          }
        },
        amannNumbers: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });
    return stitchingThreadColors.map(({ id, name, abbreviation, colorTags, amannNumbers }) => ({
      value: id,
      label: name,
      abbreviation,
      colorTags: colorTags.map(tag => ({
        value: tag.id,
        label: tag.name
      })),
      amannNumbers: amannNumbers.map(number => ({
        value: number.id,
        label: number.number
      }))
    }));
  } catch (error) {
   console.error("Error fetching stitching thread colors:", error);
    throw error;
  }
};

export const getEmbroideryThreadColors = async () => {
  try {
    const embroideryThreadColors = await prisma.embroideryThread.findMany({
      include: {
        colorTags: {
          select: {
            id: true,
            name: true
          }
        },
        isacordNumbers: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });
    return embroideryThreadColors.map(({ id, name, abbreviation, colorTags, isacordNumbers }) => ({
      value: id,
      label: name,
      abbreviation,
      colorTags: colorTags.map(tag => ({
        value: tag.id,
        label: tag.name
      })),
      isacordNumbers: isacordNumbers.map(number => ({
        value: number.id,
        label: number.number
      }))
    }));
  } catch (error) {
    console.error("Error fetching embroidery thread colors:", error);
    throw error;
  }
};

export const getFonts = async () => {
  try {
    const fonts = await prisma.Font.findMany();
    return fonts.map(({ id, name, url_id }) => ({
      value: id, 
      label: name,
      url_id 
    }));
  } catch (error) {
    console.error("Error fetching fonts:", error);
    throw error;
  }
}

export const getShapes = async () => {
  try {
    const shapes = await prisma.Shape.findMany();
    return shapes.map(({ id, name, displayOrder, abbreviation, shapeType}) =>({
      value: id, 
      label: name,
      displayOrder,
      abbreviation,
      shapeType,
    }));
  } catch (error) {
    console.error("Error fetching shapes:", error);
    throw error;
  }
}

export const getShopifyCollections = async () => {
  try {
    const shopifyCollections = await prisma.ShopifyCollection.findMany({
      include: {
        styles: {
          select: {
            styleId: true,
            overrideSecondaryLeather: true,
            overrideStitchingColor: true,
            overrideColorDesignation: true,
            skuPattern: true,
            titleTemplate: true,
            seoTemplate: true,
            handleTemplate: true,
            validation: true,
            overrideNamePattern: true,
            overrideCustomNamePattern: true,
            style: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                url_id: true,
                stylePerShape: true,
                useOppositeLeather: true,
                leatherPhrase: true,
                namePattern: true,
                customNamePattern: true
              }
            }
          }
        },
        titleFormat: {
          select: {
            titleTemplate: true,
            seoTemplate: true,
            handleTemplate: true,
            validation: true
          }
        },
        productPrices: {
          select: {
            id: true,
            shopifyPrice: true,
            higherPrice: true, 
            shapeId: true
          }
        }
      }
    });
    
    return shopifyCollections.map(({ 
      id, 
      shopifyId, 
      admin_graphql_api_id, 
      title,
      handle,
      skuPattern,
      threadType,
      description,
      commonDescription,
      needsSecondaryLeather,
      needsStitchingColor,
      needsColorDesignation,
      needsStyle,
      defaultStyleNamePattern,
      stylePerCollection,
      showInDropdown,
      styles,
      titleFormat,
      productPrices
    }) => ({
      value: id,
      shopifyId,
      admin_graphql_api_id,
      label: title,
      handle,
      skuPattern,
      threadType,
      description,
      commonDescription,
      needsSecondaryLeather,
      needsStitchingColor,
      needsColorDesignation,
      needsStyle,
      defaultStyleNamePattern,
      stylePerCollection,
      showInDropdown,
      styles: styles.map(sc => ({
        value: sc.style.id,
        id: sc.style.id,
        label: sc.style.name,
        abbreviation: sc.style.abbreviation,
        url_id: sc.style.url_id,
        stylePerShape: sc.style.stylePerShape,
        useOppositeLeather: sc.style.useOppositeLeather,
        leatherPhrase: sc.style.leatherPhrase,
        namePattern: sc.style.namePattern,
        customNamePattern: sc.style.customNamePattern,
        overrideSecondaryLeather: sc.overrideSecondaryLeather,
        overrideStitchingColor: sc.overrideStitchingColor,
        overrideColorDesignation: sc.overrideColorDesignation,
        skuPattern: sc.skuPattern,
        titleTemplate: sc.titleTemplate,
        seoTemplate: sc.seoTemplate,
        handleTemplate: sc.handleTemplate,
        validation: sc.validation,
        overrideNamePattern: sc.overrideNamePattern,
        overrideCustomNamePattern: sc.overrideCustomNamePattern
      })),
      titleFormat: titleFormat ? {
        titleTemplate: titleFormat.titleTemplate,
        seoTemplate: titleFormat.seoTemplate,
        handleTemplate: titleFormat.handleTemplate,
        validation: titleFormat.validation
      }: null,
      prices: productPrices.map(price => ({
        value: price.id,
        shopifyPrice: parseFloat(price.shopifyPrice),
        higherPrice: parseFloat(price.higherPrice),
        shapeId: price.shapeId
      })) 
    }));
  } catch (error) {
    console.error("Error Fetching Shopify Collections from Prisma", error);
    throw error;
  }
};

export const getCommonDescription = async () => {
  try {
    const commonDescription = await prisma.CommonDescription.findMany({
      select: {
        id: true,
        name: true,
        content: true,
        isActive: true
      }
    });
    return commonDescription.map(({ id, name, content, isActive, updatedAt}) => 
      ({
        value: id,
        name, 
      content,
      isActive,
      updatedAt
    }));
  } catch (error) {
    console.error("Error fetching Common Description:", error);
    throw error;
  }
};

export const getProductDataLPC = async () => {
  try {
    const productDataLPC = await prisma.productDataLPC.findMany({
      include: {
        collection: {
          select: {
            id: true,
            title: true,
            handle: true,
            shopifyId: true
          }
        },
        font: {
          select: {
            id: true,
            name: true,
            url_id: true
          }
        },
        shape: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
        leatherColor1: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            url_id: true
          }
        },
        leatherColor2: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            url_id: true
          }
        },
        amann: {
          select: {
            id: true,
            number: true,
            thread: {
              select: {
                name: true,
                abbreviation: true
              }
            }
          }
        },
        isacord: {
          select: {
            id: true,
            number: true,
            thread: {
              select: {
                name: true,
                abbreviation: true
              }
            }
          }
        },
        style: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            url_id: true
          }
        },
        quiltedLeatherColor: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            url_id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return productDataLPC.map(({
      id,
      shopifyProductId,
      shopifyVariantId,
      shopifyInventoryId,
      SKU,
      baseSKU,
      collection,
      offeringType,
      font,
      shape,
      weight,
      leatherColor1,
      leatherColor2,
      amann,
      isacord,
      style,
      quiltedLeatherColor,
      mainHandle,
      createdAt,
      updatedAt
    }) => {
      // Validate required fields
      if (!collection || !font || !shape || !leatherColor1 || !isacord) {
        console.warn(`Missing required fields for ProductDataLPC ID: ${id}`);
        return null;
      }

      return {
        value: id,
        shopifyProductId,
        shopifyVariantId,
        shopifyInventoryId,
        SKU,
        baseSKU,
        collection: {
          value: collection.id,
          label: collection.title,
          handle: collection.handle || '',  
          shopifyId: collection.shopifyId
        },
        offeringType,
        font: {
          value: font.id,
          label: font.name,
          url_id: font.url_id
        },
        shape: {
          value: shape.id,
          label: shape.name,
          abbreviation: shape.abbreviation
        },
        weight: weight ? parseFloat(weight) : null,
        leatherColor1: {
          value: leatherColor1.id,
          label: leatherColor1.name,
          abbreviation: leatherColor1.abbreviation,
          url_id: leatherColor1.url_id
        },
        leatherColor2: leatherColor2 ? {
          value: leatherColor2.id,
          label: leatherColor2.name,
          abbreviation: leatherColor2.abbreviation,
          url_id: leatherColor2.url_id
        } : null,
        amann: amann ? {
          value: amann.id,
          label: amann.number,
          thread: {
            label: amann.thread.name,
            abbreviation: amann.thread.abbreviation
          }
        } : null,
        isacord: {
          value: isacord.id,
          label: isacord.number,
          thread: {
            label: isacord.thread?.name,
            abbreviation: isacord.thread?.abbreviation
          }
        },
        style: style ? {
          value: style.id,
          label: style.name,
          abbreviation: style.abbreviation,
          url_id: style.url_id
        } : null,
        quiltedLeatherColor: quiltedLeatherColor ? {
          value: quiltedLeatherColor.id,
          label: quiltedLeatherColor.name,
          abbreviation: quiltedLeatherColor.abbreviation,
          url_id: quiltedLeatherColor.url_id
        } : null,
        mainHandle,
        createdAt,
        updatedAt
      };
    }).filter(Boolean); // Remove any null entries from the mapping
  } catch (error) {
    console.error("Error fetching ProductDataLPC:", error);
    throw error;
  }
};

// This fetcher is now optional since the data is included in getShopifyCollections
export const getStyles = async () => {
  try {
    const styles = await prisma.Style.findMany({
      include: {
        collections: {
          select: {
            overrideSecondaryLeather: true,
            overrideStitchingColor: true,
            overrideColorDesignation: true,
            collection: {
              select: {
                handle: true,
                needsSecondaryLeather: true,
                needsStitchingColor: true, 
                needsColorDesignation: true
              }
            }
          }
        }
      }
    });
    
    return styles.map(({ id, name, abbreviation, url_id, stylePerShape, collections }) => ({
      value: id,
      label: name,
      abbreviation,
      url_id,
      stylePerShape,
      collections: collections.map(sc => ({
        handle: sc.collection.handle,
        needsSecondaryLeather: sc.overrideSecondaryLeather ?? sc.collection.needsSecondaryLeather,
        needsStitchingColor: sc.overrideStitchingColor ?? sc.collection.needsStitchingColor,
        needsColorDesignation: sc.overrideColorDesignation ?? sc.collection.needsColorDesignation,
        titleTemplate: sc.titleTemplate,
        seoTemplate: sc.seoTemplate,
        handleTemplate: sc.handleTemplate,
        validation: sc.validation
      }))
    }));
  } catch (error) {
    console.error("Error fetching styles:", error);
    throw error;
  }
}

// This fetcher is now optional since the data is included in getShopifyCollections
export const getCollectionTitleFormats = async () => {
  try {
    const titleFormats = await prisma.CollectionTitleFormat.findMany({
      include: {
        collection: {
          select: {
            id: true,
            title: true,
            handle: true,
            styles: {
              select: {
                titleTemplate: true,
                seoTemplate: true,
                handleTemplate: true,
                validation: true,
                style: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    return titleFormats.map(({ 
      id, 
      titleTemplate, 
      seoTemplate, 
      handleTemplate, 
      validation,
      collection 
    }) => ({
      value: id,
      titleTemplate,
      seoTemplate,
      handleTemplate,
      validation,
      collection: {
        value: collection.id,
        label: collection.title,
        handle: collection.handle,
        styleOverrides: collection.styles.reduce((acc, style) => {
          if (style.titleTemplate || style.seoTemplate || style.handleTemplate || style.validation) {
            acc[style.style.id] = {
              titleTemplate: style.titleTemplate,
              seoTemplate: style.seoTemplate,
              handleTemplate: style.handleTemplate,
              validation: style.validation
            };
          }
          return acc;
        }, {})
      }
    }));
  } catch (error) {
    console.error("Error fetching collection title formats:", error);
    throw error;
  }
};

// This fetcher is now optional since the data is included in getShopifyCollections
export const getProductPrices = async () => {
  try {
    const productPrices = await prisma.ProductPrice.findMany({
      select: {
        id: true,
        shopifyPrice: true,
        higherPrice: true,
        shapeId: true,
        shopifyCollectionId: true
      }
    });
    
    return productPrices.map(({ id, shopifyPrice, higherPrice, shapeId, shopifyCollectionId }) => ({
      value: id,
      shopifyPrice: parseFloat(shopifyPrice), // Ensure price is a number
      higherPrice: parseFloat(higherPrice), // Ensure price is a number
      shapeId,
      shopifyCollectionId,
    }));
  } catch (error) {
    console.error("Error fetching product prices:", error);
    throw error;
  }
};

// This fetcher is now optional since the data is included in getEmbroideryThreadColors
export const getIsacordNumbers = async () => {
  try {
    const isacordNumbers = await prisma.isacordNumber.findMany({
      include: {
        thread: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return isacordNumbers.map(({ id, number, thread }) => ({
      value: id,
      label: number,
      thread: {
        value: thread.id,
        label: thread.name
      }
    }));
  } catch (error) {
    console.error("Error fetching Isacord numbers:", error);
    throw error;
  }
};

// This fetcher is now optional since the data is included in getStitchingThreadColors
export const getAmannNumbers = async () => {
  try {
    const amannNumbers = await prisma.amannNumber.findMany({
      include: {
        thread: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    return amannNumbers.map(({ id, number, thread }) => ({
      value: id,
      label: number,
      thread: {
        value: thread.id,
        label: thread.name
      }
    }));
  } catch (error) {
    console.error("Error fetching Amann numbers:", error);
    throw error;
  }
};

// This fetcher is now optional since the data is included in getStitchingThreadColors, getEmbroideryThreadColors and getLeatherColors
export const getColorTags = async () => {
  try {
    const colorTags = await prisma.ColorTag.findMany({
      include: {
        embroideryColors: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
        stitchingColors: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        },
        leatherColors: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            url_id: true
          }
        }
      }
    });
    return colorTags.map(({ id, name, stitchingColors, embroideryColors, leatherColors }) => ({
      value: id,
      label: name,
      stitchingColors: stitchingColors.map(stitchingThread => ({
        value: stitchingThread.id,
        label: stitchingThread.name,
        abbreviation: stitchingThread.abbreviation
      })),
      embroideryColors: embroideryColors.map(embroideryThread => ({
        value: embroideryThread.id,
        label: embroideryThread.name,
        abbreviation: embroideryThread.abbreviation
      })),
      leatherColors: leatherColors.map(leather => ({
        value: leather.id,
        label: leather.name,
        abbreviation: leather.abbreviation,
        url_id: leather.url_id
      }))
    }));
  } catch (error) {
    console.error("Error fetching color tags:", error);
    throw error;
  }
};

// export const getCollections = async (admin) => {
//   const COLLECTION_QUERY = `
//     query {
//       collections(first: 20) {
//         edges {
//           node {
//             id
//             title
//             handle
//           }
//         }
//       }
//     }
//   `;

//   try {
//     const response = await admin.graphql(COLLECTION_QUERY);
//     const responseJson = await response.json();

//     if (responseJson.data?.collections?.edges) {
//       return responseJson.data.collections.edges.map(({ node }) => ({
//         value: node.id,
//         label: node.title,
//         handle: node.handle
//       }));
//     } else {
//       throw new Error('Unexpected response structure from Shopify API');
//     }
//   } catch (error) {
//     console.error("Error fetching Shopify collections:", error);
//     throw error;
//   }
// };
