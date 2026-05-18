import { waLink, waPrefill } from "../config/contact";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-green text-emerald-50 dark:border-slate-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="font-display text-xl font-bold text-brand-gold">Dream Health Foods</div>
          <p className="mt-2 text-sm text-emerald-100">Grains, atta, millets, sattu — Siliguri.</p>
        </div>
        <div>
          <div className="font-semibold text-brand-gold">Address</div>
          <p className="mt-2 text-sm">
            Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001
          </p>
        </div>
        <div>
          <div className="font-semibold text-brand-gold">Phone</div>
          <p className="mt-2 text-sm">+91 7719180111 · 9907278300</p>
          <p className="mt-3 flex gap-3 text-sm">
            <a className="underline hover:text-brand-gold" href={waLink(waPrefill.order)} target="_blank" rel="noopener noreferrer">
              WA order
            </a>
            <a className="underline hover:text-brand-gold" href={waLink(waPrefill.enquiry)} target="_blank" rel="noopener noreferrer">
              WA enquiry
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-emerald-900/40 py-4 text-center text-xs text-emerald-200">
        © {new Date().getFullYear()} Dream Health Foods
      </div>
    </footer>
  );
}
