import prisma from "../db.server";


export const getCollections = async (admin) => {
  const COLLECTION_QUERY = `
    query {
      collections(first: 20) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(COLLECTION_QUERY);
    const responseJson = await response.json();

    if (responseJson.data?.collections?.edges) {
      return responseJson.data.collections.edges.map(({ node }) => ({
        value: node.id,
        label: node.title,
        handle: node.handle
      }));
    } else {
      throw new Error('Unexpected response structure from Shopify API');
    }
  } catch (error) {
    console.error("Error fetching Shopify collections:", error);
    throw error;
  }
};

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
    return shapes.map(({ id, name}) =>({
      value: id, 
      label: name,
    }));
  } catch (error) {
    console.error("Error fetching shapes:", error);
    throw error;
  }
}

export const getStyles = async () => {
  try {
    const styles = await prisma.style.findMany();
    return styles.map(({ id, name}) => ({
      value: id, 
      label: name,
    }));
  } catch (error) {
    console.error("Error fetching styles:", error);
    throw error;
  }
}