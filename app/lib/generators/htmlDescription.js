import { COLLECTION_TYPES } from "../constants/collectionTypes";
import { getCollectionType } from "../utils/collectionUtils";

export const generateDescriptionHTML = (formState, shopifyCollections) => {
  const collectionType = getCollectionType(formState, shopifyCollections);

  const leatherDescription = "<div><div><div>We use 100% top grain genuine cowhide from the finest tanneries in Italy, Argentina, and Austria, ensuring exceptional quality, luxurious feel, and unmatched durability. Every piece is hand cut by an artisan leather craftsman in the heart of downtown San Francisco, CA. If you don't see your ideal color combination, <a href='https://lpcgolf.com/pages/contact' target='_blank' title='Contact LPC golf' rel='noopener'>please contact us</a> about creating a custom, one-of-a-kind set.</div></div></div>";

  const wrapDescription = (description) => 
    `<div><div><span>${description}&nbsp;</span></div><div><span></span><br></div>${leatherDescription}</div>`;

  let descriptionHTML = "";

  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
      descriptionHTML = wrapDescription("Our Quilted collection embodies timeless luxury, celebrating the days when craftsmanship and style were paramount. Each diamond pattern is meticulously hand-sewn with premium thread, creating a distinctive look that sets these headcovers apart.");
      break;

    case COLLECTION_TYPES.CLASSIC:
      descriptionHTML = wrapDescription("Our Classic collection celebrates traditional golf style with a luxurious twist. Each headcover features impeccable hand-stitched French seams, bold racing stripes, or timeless diagonal striping – perfect for golfers who appreciate refined, vintage-inspired design.");
      break;

    case COLLECTION_TYPES.ARGYLE:
      descriptionHTML = wrapDescription("Our Argyle collection honors golf's Scottish heritage with a contemporary twist. Each diamond and contrasting cross-stitch is expertly hand-sewn by master craftsmen. From understated leather tones to bold animal prints, these headcovers let you showcase your personal style while maintaining classic sophistication.");
      break;

    case COLLECTION_TYPES.ANIMAL:
      descriptionHTML = wrapDescription("Our Animal Print collection elevates our classic designs with beautiful embossed cowhides. These distinctive headcovers range from subtle, sophisticated patterns to bold, eye-catching designs – perfect for golfers who want to make a statement.");
      break;

    case COLLECTION_TYPES.QCLASSIC:
      descriptionHTML = wrapDescription("Our Quilted Classic collection represents the pinnacle of our craft, combining the sophistication of our Quilted designs with the timeless appeal of our Classic styles. Each headcover is masterfully crafted by artisan leather craftsmen, featuring hand-stitched French seams and our signature diamond pattern.");
      break;
  }

  return descriptionHTML.replace(/\s+/g, " ").trim();
};