import prisma from "../db.server";

export const getLeatherColors = async () => {
  try {
    const leatherColors = await prisma.leatherColor.findMany();
    return leatherColors.map(({ id, name, abbreviation, image_url }) => ({
      value: id,
      label: name,
      abbreviation,
      image_url
    }));
  } catch (error) {
    console.error("Error fetching leather colors:", error);
    throw error;
  }
};

export const getThreadColors = async () => {
  try {
    const threadColors = await prisma.thread.findMany();
    return threadColors.map(({ id, name, abbreviation}) => ({
      value: id, 
      label: name, 
      abbreviation
    }));
  } catch (error) {
    console.error("Error fetching thread colors", error);
    throw error;
  }
};

export const getFonts = async () => {
  try {
    const fonts = await prisma.font.findMany();
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
    const shapes = await prisma.shape.findMany();
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
    const styles = await prisma.style.findMany();
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
    const productPrices = await prisma.productPrice.findMany({
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
    const shopifyCollections = await prisma.shopifyCollection.findMany({
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
