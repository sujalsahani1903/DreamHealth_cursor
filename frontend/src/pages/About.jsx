import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Helmet>
        <title>About — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-4xl font-bold text-brand-green dark:text-emerald-100">Our story</h1>
      <p className="mt-4 text-slate-700 dark:text-slate-200">
        Dream Health Foods celebrates traditional Indian nutrition with modern quality standards — from stone-ground atta to
        millet-forward blends and restorative sattu drinks.
      </p>
      <p className="mt-4 text-slate-700 dark:text-slate-200">
        Based in Siliguri, we source responsibly, mill carefully, and deliver grains that feel as good as they taste.
      </p>
    </div>
  );
}
