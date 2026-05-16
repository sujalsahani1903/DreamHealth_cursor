import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-green text-emerald-50 dark:border-slate-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="font-display text-xl font-bold text-brand-gold">Dream Health Foods</div>
          <p className="mt-2 text-sm text-emerald-100">Premium grains, atta, millets, sattu and customised nutrition mixes.</p>
        </div>
        <div>
          <div className="font-semibold text-brand-gold">Visit</div>
          <p className="mt-2 text-sm">
            Eastern By Pass, Bangla Bazar, Beside Bhaktinagar P.S., Siliguri-734001
          </p>
        </div>
        <div>
          <div className="font-semibold text-brand-gold">Call</div>
          <p className="mt-2 text-sm">+91 7719180111</p>
          <p className="text-sm">9907278300</p>
          <a className="mt-3 inline-block text-sm underline" href="https://www.youtube.com" target="_blank" rel="noreferrer">
            YouTube
          </a>
        </div>
      </div>
      <div className="border-t border-emerald-900/40 py-4 text-center text-xs text-emerald-200">
        © {new Date().getFullYear()} Dream Health Foods. Crafted for healthy families.
      </div>
    </footer>
  );
}
