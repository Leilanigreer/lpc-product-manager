import { json } from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { sendInternalEmail, sendExternalEmail } from '../services/email.server';

export async function action() {
  try {
    // Example of sending an internal email
    await sendInternalEmail(
      'Test Internal Email',
      'This is a test email sent to Leilani@lpcgolf.com',
      '<h1>Test Email</h1><p>This is a test email sent to Leilani@lpcgolf.com</p>'
    );

    // Example of sending an external email with an attachment
    // Note: You'll need to create the spreadsheet buffer first
    const spreadsheetBuffer = Buffer.from('your spreadsheet data here');
    
    await sendExternalEmail(
      'external@example.com',
      'External Email with Spreadsheet',
      'Please find the attached spreadsheet.',
      [{
        filename: 'data.xlsx',
        content: spreadsheetBuffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }]
    );

    return json({ success: true, message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Error in email action:', error);
    return json({ success: false, message: 'Failed to send emails' }, { status: 500 });
  }
}

export default function ExampleEmail() {
  const actionData = useActionData();

  return (
    <div>
      <h1>Email Test Page</h1>
      {actionData && (
        <div style={{ color: actionData.success ? 'green' : 'red' }}>
          {actionData.message}
        </div>
      )}
    </div>
  );
} 