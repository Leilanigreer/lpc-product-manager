import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    // Implement handling of mandatory compliance topics
    // See: https://shopify.dev/docs/apps/build/privacy-law-compliance
    
    // Log only in development and without sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log(`Processing ${topic} webhook for ${shop}`);
    }

    return new Response();
  } catch (error) {
    console.error('Error processing customer redaction webhook:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return new Response(null, { status: 500 });
  }
};
