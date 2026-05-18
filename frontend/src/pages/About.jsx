import { Helmet } from "react-helmet-async";

export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Helmet>
        <title>About — Dream Health Foods</title>
      </Helmet>
      <h1 className="font-display text-4xl font-bold text-brand-green dark:text-emerald-100">Our story</h1>
      <p className="mt-4 text-slate-700 dark:text-slate-200">
        Dream Health Foods sells atta, millets, sattu and custom mixes. We mill in Siliguri and ship across the region.
      </p>
      <p className="mt-4 text-slate-700 dark:text-slate-200">
        Started as a college project tied to a real family business — the catalog and admin panel are what I built for practice.
      </p>
    </div>
  );
}
