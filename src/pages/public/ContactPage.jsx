import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send } from 'lucide-react';
import Footer from '../../components/core/Footer';
import Navbar from '../../components/core/Navbar';
import contactApi from '../../api/contactApi';
import { parseApiError } from '../../utils/parseApiError';

const emptyForm = { name: '', email: '', message: '' };

const ContactPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { message } once sent

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.message.trim()) {
      nextErrors.message = 'Message is required.';
    } else if (form.message.length > 5000) {
      nextErrors.message = 'Message must be 5000 characters or fewer.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await contactApi.submitEnquiry({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setSubmitted(response);
      setForm(emptyForm);
      toast.success('Your enquiry has been sent.');
    } catch (err) {
      toast.error(parseApiError(err, 'Unable to send your message right now.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A2E]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Get in touch</p>
          <h1 className="mt-2 font-[Playfair_Display] text-3xl font-semibold text-[#1A1A2E] sm:text-4xl">Contact us</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#6B7280]">
            Questions about a stay, a booking, or anything else — send us a message and our support team will get back to you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]"><Mail className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Email</p>
                <p className="text-sm text-[#6B7280]">hello@bookmyhotel.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]"><Phone className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Phone</p>
                <p className="text-sm text-[#6B7280]">+971 4 000 0000</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-[24px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E6F5F3] text-[#0A7C6E]"><MapPin className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">Headquarters</p>
                <p className="text-sm text-[#6B7280]">Dubai, United Arab Emirates</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E2F0E8] text-[#1D6A2D]">
                  <CheckCircle2 className="h-7 w-7" />
                </span>
                <h2 className="mt-4 font-[Playfair_Display] text-xl font-semibold text-[#1A1A2E]">Message sent</h2>
                <p className="mt-2 max-w-sm text-sm text-[#6B7280]">{submitted.message}</p>
                <button
                  type="button"
                  onClick={() => setSubmitted(null)}
                  className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#0A7C6E] px-5 py-3 text-sm font-semibold text-[#0A7C6E] transition hover:bg-[#E6F5F3]"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="contactName" className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                  <input
                    id="contactName"
                    type="text"
                    value={form.name}
                    onChange={updateField('name')}
                    placeholder="Jane Doe"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  {errors.name ? <p className="mt-2 text-sm text-rose-600">{errors.name}</p> : null}
                </div>

                <div>
                  <label htmlFor="contactEmail" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={form.email}
                    onChange={updateField('email')}
                    placeholder="jane@example.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="contactMessage" className="block text-sm font-medium text-slate-700">Message</label>
                    <span className="text-xs text-slate-400">{form.message.length}/5000</span>
                  </div>
                  <textarea
                    id="contactMessage"
                    rows={6}
                    value={form.message}
                    onChange={updateField('message')}
                    placeholder="Do you have rooms available in July?"
                    maxLength={5000}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0A7C6E] focus:bg-white focus:ring-2 focus:ring-[#0A7C6E]/20"
                  />
                  {errors.message ? <p className="mt-2 text-sm text-rose-600">{errors.message}</p> : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0A7C6E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#065E52] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
