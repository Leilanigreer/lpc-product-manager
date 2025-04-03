import { json } from '@remix-run/node';
import { useEffect } from 'react';

export async function loader({ request }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return json({ error: 'No code provided' }, { status: 400 });
  }

  // Return the code to be handled by the client
  return json({ code });
}

export default function OAuthCallback() {
  useEffect(() => {
    // Close the window after a short delay
    setTimeout(() => {
      window.close();
    }, 1000);
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Authorization Successful!</h2>
      <p>You can close this window and return to the terminal.</p>
    </div>
  );
} 