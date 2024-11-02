import prisma from "../db.server";

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
    return leatherColors.map(({ id, name, abbreviation, image_url, colorTags }) => ({
      value: id,
      label: name,
      abbreviation,
      image_url,
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
            image_url: true
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
        image_url: leather.image_url
      }))
    }));
  } catch (error) {
    console.error("Error fetching color tags:", error);
    throw error;
  }
};

export const getFonts = async () => {
  try {
    const fonts = await prisma.Font.findMany();
    return fonts.map(({ id, name, image_url }) => ({
      value: id, 
      label: name,
      image_url 
    }));
  } catch (error) {
    console.error("Error fetching fonts:", error);
    throw error;
  }
}

export const getShapes = async () => {
  try {
    const shapes = await prisma.Shape.findMany();
    return shapes.map(({ id, name, abbreviation}) =>({
      value: id, 
      label: name,
      abbreviation,
    }));
  } catch (error) {
    console.error("Error fetching shapes:", error);
    throw error;
  }
}

export const getStyles = async () => {
  try {
    const styles = await prisma.Style.findMany();
    return styles.map(({ id, name, abbreviation}) => ({
      value: id, 
      label: name,
      abbreviation,
    }));
  } catch (error) {
    console.error("Error fetching styles:", error);
    throw error;
  }
}

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

export const getShopifyCollections = async () => {
  try {
    const shopifyCollections = await prisma.ShopifyCollection.findMany({
      select: {
        id: true, 
        shopifyId: true, 
        admin_graphql_api_id: true, 
        title: true, 
        handle: true, 
      }
    });
    return shopifyCollections.map(({ id, shopifyId, admin_graphql_api_id, title, handle}) => ({
      value: id, 
      shopifyId, 
      admin_graphql_api_id, 
      label: title,
      handle, 
    }));
  } catch (error) {
    console.error("Error Fetching Shopify Collections from Prisma", error);
    throw error;
  }
};

export const getProductDataLPC = async () => {
  try {
    const productData = await prisma.productDataLPC.findMany({
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
            image_url: true
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
            image_url: true
          }
        },
        leatherColor2: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            image_url: true
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
            image_url: true
          }
        },
        quiltedLeatherColor: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            image_url: true
          }
        }
      }
    });

    return productData.map(({
      id,
      shopifyProductId,
      shopifyVariantId,
      shopifyInventoryId,
      SKU,
      collection,
      productType,
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
    }) => ({
      value: id,
      shopifyProductId,
      shopifyVariantId,
      shopifyInventoryId,
      SKU,
      collection: {
        value: collection.id,
        label: collection.title,
        handle: collection.handle,
        shopifyId: collection.shopifyId
      },
      productType,
      font: {
        value: font.id,
        label: font.name,
        image_url: font.image_url
      },
      shape: {
        value: shape.id,
        label: shape.name,
        abbreviation: shape.abbreviation
      },
      weight: parseFloat(weight),
      leatherColor1: {
        value: leatherColor1.id,
        label: leatherColor1.name,
        abbreviation: leatherColor1.abbreviation,
        image_url: leatherColor1.image_url
      },
      leatherColor2: leatherColor2 ? {
        value: leatherColor2.id,
        label: leatherColor2.name,
        abbreviation: leatherColor2.abbreviation,
        image_url: leatherColor2.image_url
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
          label: isacord.thread.name,
          abbreviation: isacord.thread.abbreviation
        }
      },
      style: style ? {
        value: style.id,
        label: style.name,
        abbreviation: style.abbreviation,
        image_url: style.image_url
      } : null,
      quiltedLeatherColor: quiltedLeatherColor ? {
        value: quiltedLeatherColor.id,
        label: quiltedLeatherColor.name,
        abbreviation: quiltedLeatherColor.abbreviation,
        image_url: quiltedLeatherColor.image_url
      } : null,
      mainHandle,
      createdAt,
      updatedAt
    }));
  } catch (error) {
    console.error("Error fetching ProductDataLPC:", error);
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
