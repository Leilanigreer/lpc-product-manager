// app/lib/utils/dataFetchers.js
import prisma from "../../db.server.js";

const LEATHER_COLOR_METAOBJECT_QUERY = `#graphql
  query GetLeatherColorMetaobjects($first: Int!) {
    metaobjects(type: "leather_color", first: $first) {
      nodes {
        id
        handle
        displayName
        capabilities {
          publishable { status }
        }
        nameField: field(key: "name") { value }
        abbreviationField: field(key: "abbreviation") { value }
        collectionNameField: field(key: "collection_name") { value }
        blendedCollectionNameField: field(key: "blended_collection_name") { value }
        previewImageField: field(key: "preview_image") {
          thumbnail {
            file {
              ... on MediaImage {
                image { url }
              }
              ... on GenericFile {
                url
              }
            }
          }
        }
        isLimitedEditionField: field(key: "is_limited_edition") { value }
        colorsField: field(key: "colors") {
          references(first: 50) {
            nodes {
              __typename
              ... on Metaobject {
                id
              }
            }
          }
        }
      }
    }
  }
`;

const LEATHER_COLOR_COLLECTION_OPTIONS_QUERY = `#graphql
  query GetLeatherColorCollectionOptions {
    metaobjectDefinitionByType(type: "leather_color") {
      fieldDefinitions {
        key
        validations {
          name
          value
        }
      }
    }
  }
`;

/**
 * Fetches leather colors from Shopify leather_color metaobjects.
 * Includes both ACTIVE and DRAFT; isActive is true only when status is ACTIVE (draft list = reactivate list).
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<{ leatherColors: Array<...>, loadError?: string }>}
 */
export const getLeatherColorsFromShopify = async (admin) => {
  if (!admin?.graphql) {
    return { leatherColors: [], loadError: "No Shopify admin client available." };
  }
  try {
    const response = await admin.graphql(LEATHER_COLOR_METAOBJECT_QUERY, {
      variables: { first: 250 },
    });
    const json = await response.json();

    const gqlErrors = json?.errors ?? [];
    if (gqlErrors.length) {
      const msg = gqlErrors.map((e) => e.message).join("; ");
      console.error("Shopify GraphQL errors (leather_color):", msg);
      return { leatherColors: [], loadError: msg };
    }

    const nodes = json?.data?.metaobjects?.nodes ?? [];
    const leatherColors = nodes
      .map((node) => {
        const status = node.capabilities?.publishable?.status;
        const isActive = status === "ACTIVE";
        const name = node.nameField?.value ?? node.displayName ?? node.handle ?? "";
        const abbreviation = node.abbreviationField?.value ?? "";
        const collectionName = node.collectionNameField?.value ?? null;
        const blendedCollectionName = node.blendedCollectionNameField?.value ?? null;
        const file = node.previewImageField?.thumbnail?.file;
        const url_id = file?.image?.url ?? file?.url ?? null;
        const isLimitedEditionLeather = parseMetaobjectBoolean(node.isLimitedEditionField);
        const colorMetaobjectIds = (node.colorsField?.references?.nodes ?? []).map((n) => n.id).filter(Boolean);
        return {
          value: node.id,
          label: name,
          abbreviation,
          collectionName,
          blendedCollectionName,
          url_id,
          isLimitedEditionLeather,
          isActive,
          colorMetaobjectIds,
        };
      })
      .filter((lc) => lc.label)
      .sort((a, b) => a.label.localeCompare(b.label));
    return { leatherColors };
  } catch (error) {
    const msg = error?.message ?? String(error);
    console.error("Error fetching leather colors from Shopify:", error);
    return { leatherColors: [], loadError: msg };
  }
};

export const getLeatherCollectionNamesFromShopify = async (admin) => {
  if (!admin?.graphql) {
    return [];
  }
  try {
    const response = await admin.graphql(LEATHER_COLOR_COLLECTION_OPTIONS_QUERY);
    const json = await response.json();
    const fieldDefs = json?.data?.metaobjectDefinitionByType?.fieldDefinitions ?? [];
    const collectionField = fieldDefs.find((f) => f.key === "collection_name");
    if (!collectionField) return [];
    const validations = collectionField.validations ?? [];
    const choicesValidation = validations.find((v) => v.name === "choices");
    if (!choicesValidation?.value) return [];
    let parsed;
    try {
      parsed = JSON.parse(choicesValidation.value);
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ label, value: label }));
  } catch (error) {
    console.error("Error fetching leather collection_name options from Shopify:", error);
    return [];
  }
};

function parseMetaobjectBoolean(field) {
  if (field == null) return false;
  const v = field.value;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return false;
}

const SHOPIFY_COLOR_PATTERN_QUERY = `#graphql
  query GetShopifyColorMetaobjects($first: Int!) {
    metaobjects(type: "shopify--color-pattern", first: $first) {
      nodes {
        id
        handle
        displayName
        capabilities { publishable { status } }
        labelField: field(key: "label") { value }
      }
    }
  }
`;

/**
 * Fetches Shopify Color metaobjects (type: shopify--color-pattern) for linking to leather_color.
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
export const getShopifyColorMetaobjects = async (admin) => {
  if (!admin?.graphql) return [];
  try {
    const response = await admin.graphql(SHOPIFY_COLOR_PATTERN_QUERY, { variables: { first: 250 } });
    const json = await response.json();
    const nodes = json?.data?.metaobjects?.nodes ?? [];
    const statusOk = (n) => n.capabilities?.publishable?.status == null || n.capabilities?.publishable?.status === "ACTIVE";
    return nodes
      .filter(statusOk)
      .map((node) => ({
        value: node.id,
        label: node.labelField?.value ?? node.displayName ?? node.handle ?? String(node.id),
      }))
      .filter((c) => c.label)
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Error fetching Shopify Color metaobjects:", error);
    return [];
  }
};

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
    return leatherColors.map(({ id, name, abbreviation, url_id, isLimitedEditionLeather, isActive, colorTags }) => ({
      value: id,
      label: name,
      abbreviation,
      url_id,
      isLimitedEditionLeather,
      isActive,
      colorTags: colorTags
        .map(tag => ({
          value: tag.id,
          label: tag.name
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    })).sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Error fetching leather colors:", error);
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
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Error fetching embroidery thread colors:", error);
    throw error;
  }
};

const FONTS_METAOBJECT_QUERY = `#graphql
  query GetFontMetaobjects($first: Int!) {
    metaobjects(type: "font", first: $first) {
      nodes {
        id
        handle
        displayName
        nameField: field(key: "name") { value }
        previewImageField: field(key: "preview_image") {
          thumbnail {
            file {
              ... on MediaImage {
                image { url }
              }
              ... on GenericFile {
                url
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetches fonts from Shopify custom.font metaobjects (name + preview_image).
 * Returns same shape as getFonts() for drop-in use: { value, label, url_id }.
 * @param {Object} admin - Shopify Admin API GraphQL client
 * @returns {Promise<Array<{ value: string, label: string, url_id: string|null }>>}
 */
export const getFontsFromShopify = async (admin) => {
  if (!admin?.graphql) {
    return [];
  }
  try {
    const response = await admin.graphql(FONTS_METAOBJECT_QUERY, {
      variables: { first: 250 },
    });
    const json = await response.json();
    const nodes = json?.data?.metaobjects?.nodes ?? [];
    const fonts = nodes
      .map((node) => {
        const name = node.nameField?.value ?? node.displayName ?? node.handle ?? "";
        const file = node.previewImageField?.thumbnail?.file;
        const url = file?.image?.url ?? file?.url ?? null;
        return {
          value: node.id,
          label: name,
          url_id: url,
        };
      })
      .filter((f) => f.label)
      .sort((a, b) => a.label.localeCompare(b.label));
    return fonts;
  } catch (error) {
    console.error("Error fetching fonts from Shopify:", error);
    return [];
  }
};

export const getFonts = async () => {
  try {
    const fonts = await prisma.Font.findMany();
    return fonts
      .map(({ id, name, url_id }) => ({
        value: id, 
        label: name,
        url_id 
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch (error) {
    console.error("Error fetching fonts:", error);
    throw error;
  }
}

export const getShapes = async () => {
  try {
    const shapes = await prisma.Shape.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });
    return shapes.map(({ id, name, displayOrder, abbreviation, shapeType, isActive }) => ({
      value: id, 
      label: name,
      displayOrder,
      abbreviation,
      shapeType: shapeType || 'OTHER',
      isActive: isActive ?? true
    }));
  } catch (error) {
    console.error("Error fetching shapes:", error);
    throw error;
  }
}

/** Prisma include for collection rows used by create-product and related loaders. */
const shopifyCollectionFormInclude = {
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
          useOppositeLeather: true,
          leatherPhrase: true,
          namePattern: true,
          customNamePattern: true,
        },
      },
    },
  },
  titleFormat: {
    select: {
      titleTemplate: true,
      seoTemplate: true,
      handleTemplate: true,
      validation: true,
    },
  },
  PriceTier: {
    include: {
      adjustments: true,
    },
  },
};

const mapShopifyCollectionRowToFormShape = ({
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
  PriceTier,
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
  styles: styles
    .map((sc) => ({
      value: sc.style.id,
      id: sc.style.id,
      label: sc.style.name,
      abbreviation: sc.style.abbreviation,
      url_id: sc.style.url_id,
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
      overrideCustomNamePattern: sc.overrideCustomNamePattern,
    }))
    .sort((a, b) => a.label.localeCompare(b.label)),
  titleFormat: titleFormat
    ? {
        titleTemplate: titleFormat.titleTemplate,
        seoTemplate: titleFormat.seoTemplate,
        handleTemplate: titleFormat.handleTemplate,
        validation: titleFormat.validation,
      }
    : null,
  priceTier: PriceTier
    ? {
        value: PriceTier.id,
        name: PriceTier.name,
        shopifyPrice: parseFloat(PriceTier.shopifyPrice),
        marketplacePrice: parseFloat(PriceTier.marketplacePrice),
        adjustments: (PriceTier.adjustments ?? []).map((adj) => ({
          shapeType: adj.shapeType,
          shopifyAdjustment: parseFloat(adj.shopifyAdjustment),
          marketAdjustment: parseFloat(adj.marketAdjustment),
          isBasePrice: adj.isBasePrice,
        })),
      }
    : null,
});

export const getShopifyCollections = async () => {
  try {
    const shopifyCollections = await prisma.ShopifyCollection.findMany({
      include: shopifyCollectionFormInclude,
    });

    return shopifyCollections
      .map(mapShopifyCollectionRowToFormShape)
      .sort((a, b) => a.label.localeCompare(b.label));
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

export const getProductSets = async (fontsFromShopify = [], leatherColorsFromShopify = []) => {
  try {
    const productSets = await prisma.productSetDataLPC.findMany({
      include: {
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                title: true,
                handle: true,
                shopifyId: true,
                admin_graphql_api_id: true,
              }
            }
          }
        },
        font: {
          select: {
            id: true,
            name: true,
            url_id: true
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
        stitchingThreads: {
          include: {
            stitchingThread: {
              select: {
                id: true,
                name: true,
                abbreviation: true
              }
            },
            amann: {
              select: {
                id: true,
                number: true
              }
            }
          }
        },
        setImages: {
          select: {
            id: true,
            imageType: true,
            marketplace: true,
            cloudinaryUrl: true,
            cloudinaryPublicId: true
          }
        },
        variants: {
          include: {
            shape: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                isActive: true,
                shapeType: true,
                displayOrder: true
              }
            },
            embroideryThread: {
              select: {
                id: true,
                name: true,
                abbreviation: true
              }
            },
            isacord: {
              select: {
                id: true,
                number: true,
                thread: {
                  select: {
                    id: true,
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
            colorDesignation: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                url_id: true
              }
            },
            variantImages: {
              select: {
                id: true,
                imageType: true,
                marketplace: true,
                cloudinaryUrl: true,
                cloudinaryPublicId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return productSets.map(({
      id,
      shopifyProductId,
      baseSKU,
      collections,
      offeringType,
      font,
      fontShopifyId,
      leatherColor1,
      leatherColor2,
      leatherColor1ShopifyId,
      leatherColor2ShopifyId,
      stitchingThreads,
      mainHandle,
      setImages,
      variants,
      createdAt,
      updatedAt
    }) => {
      const leather1Obj = leatherColor1
        ? { value: leatherColor1.id, label: leatherColor1.name, abbreviation: leatherColor1.abbreviation, url_id: leatherColor1.url_id }
        : (leatherColor1ShopifyId && leatherColorsFromShopify?.length
            ? (leatherColorsFromShopify.find((l) => l.value === leatherColor1ShopifyId) ?? { value: leatherColor1ShopifyId, label: "Unknown leather", abbreviation: "", url_id: null })
            : null);

      if (!collections.length || !leather1Obj) {
        console.warn(`Missing required fields for ProductSetDataLPC ID: ${id}`);
        return null;
      }

      const fontObj = font
        ? { value: font.id, label: font.name, url_id: font.url_id }
        : (fontShopifyId && fontsFromShopify?.length
            ? (fontsFromShopify.find((f) => f.value === fontShopifyId) ?? { value: fontShopifyId, label: "Unknown font", url_id: null })
            : null);

      if (!fontObj) {
        console.warn(`Missing font for ProductSetDataLPC ID: ${id}`);
        return null;
      }

      const leather2Obj = leatherColor2
        ? { value: leatherColor2.id, label: leatherColor2.name, abbreviation: leatherColor2.abbreviation, url_id: leatherColor2.url_id }
        : (leatherColor2ShopifyId && leatherColorsFromShopify?.length
            ? (leatherColorsFromShopify.find((l) => l.value === leatherColor2ShopifyId) ?? null)
            : null);

      const primaryCollection = collections[0]?.collection;

      return {
        value: id,
        shopifyProductId,
        baseSKU,
        collection: {
          value: primaryCollection.id,
          label: primaryCollection.title,
          handle: primaryCollection.handle || '',
          shopifyId: primaryCollection.shopifyId,
          shopifyAdminGid: primaryCollection.admin_graphql_api_id,
        },
        collections: collections.map(({ collection }) => ({
          value: collection.id,
          label: collection.title,
          handle: collection.handle || '',
          shopifyId: collection.shopifyId,
          shopifyAdminGid: collection.admin_graphql_api_id,
        })),
        offeringType,
        font: fontObj,
        leatherColor1: leather1Obj,
        leatherColor2: leather2Obj ?? null,
        stitchingThreads: stitchingThreads.map(relation => ({
          threadValue: relation.stitchingThread.id,
          threadLabel: relation.stitchingThread.name,
          threadAbbreviation: relation.stitchingThread.abbreviation,
          amannValue: relation.amann.id,
          amannLabel: relation.amann.number
        })),
        mainHandle,
        setImages: setImages.map(image => ({
          id: image.id,
          type: image.imageType,
          marketplace: image.marketplace,
          url: image.cloudinaryUrl,
          cloudinaryPublicId: image.cloudinaryPublicId
        })),
        variants: variants.map(variant => ({
          id: variant.id,
          shopifyVariantId: variant.shopifyVariantId,
          shopifyInventoryId: variant.shopifyInventoryId,
          SKU: variant.SKU,
          weight: parseFloat(variant.weight),
          shape: {
            value: variant.shape.id,
            label: variant.shape.name,
            abbreviation: variant.shape.abbreviation,
            isActive: variant.shape.isActive,
            shapeType: variant.shape.shapeType,
            displayOrder: variant.shape.displayOrder
          },
          embroideryThread: variant.embroideryThread && variant.isacord ? {
            value: variant.embroideryThread.id,
            label: variant.embroideryThread.name,
            abbreviation: variant.embroideryThread.abbreviation,
            isacordNumber: {
              value: variant.isacord.id,
              label: variant.isacord.number
            }
          } : null,
          style: variant.style ? {
            value: variant.style.id,
            label: variant.style.name,
            abbreviation: variant.style.abbreviation,
            url_id: variant.style.url_id
          } : null,
          colorDesignation: variant.colorDesignation ? {
            value: variant.colorDesignation.id,
            label: variant.colorDesignation.name,
            abbreviation: variant.colorDesignation.abbreviation,
            url_id: variant.colorDesignation.url_id
          } : null,
          images: variant.variantImages.map(image => ({
            id: image.id,
            type: image.imageType,
            marketplace: image.marketplace,
            url: image.cloudinaryUrl,
            cloudinaryPublicId: image.cloudinaryPublicId
          }))
        })),
        createdAt,
        updatedAt
      };
    }).filter(Boolean); // Remove any null entries from the mapping
  } catch (error) {
    console.error("Error fetching ProductSets:", error);
    throw error;
  }
};

export const getUnlinkedIsacordNumbers = async () => {
  try {
    const isacordNumbers = await prisma.isacordNumber.findMany({
      where: { threadId: null }
    });
    return isacordNumbers.map(({ id, number }) => ({
      value: id,
      label: number
    }));
  } catch (error) {
    console.error("Error fetching Isacord numbers:", error);
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
    }))
    .sort((a, b) => a.label.localeCompare(b.label));;
  } catch (error) {
    console.error("Error fetching color tags:", error);
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
    
    return styles
      .map(({ id, name, abbreviation, url_id, collections }) => ({
        value: id,
        label: name,
        abbreviation,
        url_id,
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
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
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
