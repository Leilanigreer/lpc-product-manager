import { json } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { sendInternalEmail } from '../services/email.server';

export async function action() {
  try {
    await sendInternalEmail(
      'Test Email from LPC Product Manager',
      'This is a test email to verify the email service is working correctly.',
      '<h1>Test Email</h1><p>This is a test email to verify the email service is working correctly.</p>'
    );

    return json({ success: true, message: 'Test email sent successfully!' });
  } catch (error) {
    console.error('Error sending test email:', error);
    return json(
      { success: false, message: 'Failed to send test email: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

export default function TestEmail() {
  const actionData = useActionData();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Email Service Test</h1>
      <form method="post">
        <button type="submit">Send Test Email</button>
      </form>
      {actionData && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: actionData.success ? '#e6ffe6' : '#ffe6e6',
          borderRadius: '4px'
        }}>
          {actionData.message}
        </div>
      )}
    </div>
  );
} 