import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  try {
    const { shop, session, topic } = await authenticate.webhook(request);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[App Uninstalled Webhook] Received ${topic} webhook for shop: ${shop}`);
    }

    // Webhook requests can trigger multiple times and after an app has already been uninstalled.
    // If this webhook already ran, the session may have been deleted previously.
    if (session) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[App Uninstalled Webhook] Deleting sessions for shop: ${shop}`);
      }
      await db.session.deleteMany({ where: { shop } });
    }

    return new Response();
  } catch (error) {
    console.error('[App Uninstalled Webhook] Error processing webhook:', error.message);
    return new Response(null, { status: 500 });
  }
};
