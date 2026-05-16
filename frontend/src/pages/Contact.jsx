import { Helmet } from "react-helmet-async";

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Helmet>
        <title>Contact — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-4xl font-bold text-brand-green dark:text-emerald-100">Contact us</h1>
      <p className="mt-4 text-slate-700 dark:text-slate-200">
        Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001
      </p>
      <p className="mt-2 text-slate-700 dark:text-slate-200">Phone: +91 7719180111 · 9907278300</p>
    </div>
  );
}
