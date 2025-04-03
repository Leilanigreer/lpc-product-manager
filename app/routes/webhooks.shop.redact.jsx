import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { shop, topic } = await authenticate.webhook(request);

    // Implement handling of mandatory compliance topics
    // See: https://shopify.dev/docs/apps/build/privacy-law-compliance
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Shop Redact Webhook] Received ${topic} webhook for shop: ${shop}`);
    }

    return new Response();
  } catch (error) {
    console.error('[Shop Redact Webhook] Error processing webhook:', error.message);
    return new Response(null, { status: 500 });
  }
};
