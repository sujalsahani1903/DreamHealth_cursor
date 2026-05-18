import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { BUSINESS, WHATSAPP_MESSAGES, whatsappUrl } from "../config/contact";

function WhatsAppIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function WhatsAppButton({ href, title, subtitle, variant = "primary" }) {
  const isPrimary = variant === "primary";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 rounded-2xl p-4 transition hover:scale-[1.01] ${
        isPrimary
          ? "bg-[#25D366] text-white shadow-lg shadow-emerald-900/20 hover:bg-[#20bd5a]"
          : "border-2 border-[#25D366] bg-white text-slate-900 hover:bg-[#25D366]/10 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          isPrimary ? "bg-white/20" : "bg-[#25D366]/15 text-[#25D366]"
        }`}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </span>
      <span className="text-left">
        <span className="block font-bold">{title}</span>
        <span className={`block text-sm ${isPrimary ? "text-emerald-50" : "text-slate-600 dark:text-slate-400"}`}>
          {subtitle}
        </span>
      </span>
      <span className="ml-auto text-sm font-semibold opacity-90">Open chat →</span>
    </a>
  );
}

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Helmet>
        <title>Contact — Dream Health Foods</title>
        <meta
          name="description"
          content="Contact Dream Health Foods on WhatsApp for orders and enquiries. Siliguri, West Bengal."
        />
      </Helmet>

      <h1 className="font-display text-4xl font-bold text-brand-green dark:text-emerald-100">Contact us</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        Order healthy grains, atta, millets & sattu — or ask us anything. Fastest on WhatsApp.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-brand-green dark:text-emerald-200">
          WhatsApp
        </h2>
        <WhatsAppButton
          href={whatsappUrl(WHATSAPP_MESSAGES.order)}
          title="Order on WhatsApp"
          subtitle="Place an order · share products & pack sizes"
          variant="primary"
        />
        <WhatsAppButton
          href={whatsappUrl(WHATSAPP_MESSAGES.enquiry)}
          title="Enquiry on WhatsApp"
          subtitle="Questions about products, delivery, or custom mixes"
          variant="outline"
        />
        <p className="text-xs text-slate-500">
          Opens WhatsApp with a pre-filled message to <strong>+91 7719180111</strong>. You can edit before sending.
        </p>
      </section>

      <section className="glass mt-10 rounded-2xl p-6">
        <h2 className="font-semibold text-brand-green dark:text-emerald-200">Visit & call</h2>
        <p className="mt-3 text-slate-700 dark:text-slate-200">{BUSINESS.address}</p>
        <p className="mt-3 text-slate-700 dark:text-slate-200">
          Phone:{" "}
          <a href="tel:+917719180111" className="font-semibold text-brand-green hover:underline">
            +91 7719180111
          </a>
          {" · "}
          <a href="tel:+919907278300" className="font-semibold text-brand-green hover:underline">
            9907278300
          </a>
        </p>
        <p className="mt-2 text-slate-700 dark:text-slate-200">
          Email:{" "}
          <a href={`mailto:${BUSINESS.email}`} className="font-semibold text-brand-green hover:underline">
            {BUSINESS.email}
          </a>
        </p>
      </section>

      <p className="mt-8 text-center text-sm text-slate-500">
        Prefer ordering online?{" "}
        <Link to="/shop" className="font-semibold text-brand-green hover:underline">
          Browse shop
        </Link>
      </p>
    </div>
  );
}
