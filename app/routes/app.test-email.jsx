import { json } from '@remix-run/node';
import { useActionData, useSubmit } from '@remix-run/react';
import { sendEmail } from '../services/email.server';

export const action = async ({ request }) => {
  try {
    const formData = await request.formData();
    const to = formData.get('to');
    const subject = formData.get('subject');
    const text = formData.get('text');

    if (!to || !subject || !text) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendEmail({
      to,
      subject,
      text,
    });

    return json({ success: true });
  } catch (error) {
    console.error('Error sending test email:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function TestEmail() {
  const actionData = useActionData();
  const submit = useSubmit();

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    submit(formData, { method: 'post' });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Email</h1>
      
      {actionData?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {actionData.error}
        </div>
      )}

      {actionData?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Email sent successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">To:</label>
          <input
            type="email"
            name="to"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subject:</label>
          <input
            type="text"
            name="subject"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Message:</label>
          <textarea
            name="text"
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Send Test Email
        </button>
      </form>
    </div>
  );
} 