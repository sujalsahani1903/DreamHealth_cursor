import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { storeContact, waLink, waPrefill } from "../config/contact";

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Helmet>
        <title>Contact — Dream Health Foods</title>
      </Helmet>

      <h1 className="font-display text-3xl font-bold text-brand-green dark:text-emerald-100">Contact</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Call, visit, or message on WhatsApp. Online orders also work from the shop page.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href={waLink(waPrefill.order)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#20bd5a]"
        >
          WhatsApp — order
        </a>
        <a
          href={waLink(waPrefill.enquiry)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-[#25D366] px-5 py-3 text-center text-sm font-semibold text-brand-green hover:bg-emerald-50 dark:hover:bg-slate-800"
        >
          WhatsApp — enquiry
        </a>
      </div>

      <div className="glass mt-10 rounded-2xl p-6 text-sm text-slate-700 dark:text-slate-200">
        <p>{storeContact.address}</p>
        <p className="mt-3">
          <a href="tel:+917719180111" className="text-brand-green hover:underline">
            +91 7719180111
          </a>
          {" · "}
          <a href="tel:+919907278300" className="text-brand-green hover:underline">
            9907278300
          </a>
        </p>
        <p className="mt-2">
          <a href={`mailto:${storeContact.email}`} className="text-brand-green hover:underline">
            {storeContact.email}
          </a>
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/shop" className="text-brand-green hover:underline">
          Go to shop
        </Link>
      </p>
    </div>
  );
}
